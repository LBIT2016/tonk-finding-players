import React, { useEffect, useState, useRef } from "react";
import { useLocationStore, useUserStore, useCategoryStore } from "../stores";
import {
  User,
  MapPin,
  Menu,
  ChevronLeft,
  Info,
  Star,
  MessageSquare,
  Clock,
} from "lucide-react";
import {
  fetchAndUpdateBusinessHours,
  BusinessHours,
  updateAllLocationsOpenStatus,
} from "../services/googleMapsService";
import PlaceSearch from "./PlaceSearch";
import UserSelector from "./UserSelector";
import TourGuide from "./TourGuide";
import GameCategorySelector from './GameCategorySelector';
import OtherUsersList from "./OtherUsersList";
import GameFilters from "./GameFilters";
import ResetDataButton from "./ResetDataButton";
import { TabsList, TabsTrigger, TabsContent, Tabs } from "../components/ui/tabs";
import { Gamepad2 } from "lucide-react";
import AuthForm from "./AuthForm";

// Declare MapKit JS types
declare global {
  interface Window {
    mapkit: any;
    showAuthScreen?: () => void;
  }
}

const getMapKitToken = async (): Promise<string> => {
  const token =
    "eyJraWQiOiJNWUQ1MkxCUjVQIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI4V1ZLUzJGMjRDIiwiaWF0IjoxNzQ0MjkyNDQ3LCJleHAiOjE3NDQ5NTk1OTl9.ims988bUGp24ntV-cfGhK5LYZQ3-vATmoM5sbyS3ioGEc_GZJk012UcB4OE5rA9RYmFaNVYG76b0g0YR9kgEEA";

  if (!token) {
    console.error("MapKit token not found in environment variables");
    throw new Error(
      "MapKit token not configured. Please set MAPKIT_TOKEN environment variable.",
    );
  }

  return token;
};

// Component to initialize MapKit JS
interface MapKitInitializerProps {
  onMapReady: (map: any) => void;
}

const MapKitInitializer: React.FC<MapKitInitializerProps> = ({}) => {
  useEffect(() => {
    const loadMapKit = async () => {
      try {
        // Load MapKit JS script if not already loaded
        if (!window.mapkit) {
          const script = document.createElement("script");
          script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
          script.async = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
          });
        }

        // Initialize MapKit with JWT token
        const token = await getMapKitToken();
        window.mapkit.init({
          authorizationCallback: (done: (token: string) => void) => {
            done(token);
          },
        });
      } catch (error) {
        console.error("Failed to initialize MapKit JS:", error);
      }
    };

    loadMapKit();
  }, []);

  return null;
};

const MapView: React.FC = () => {
  const { locations, addReview, removeReview, addLocation } =
    useLocationStore();
  const { profiles, activeProfileId } = useUserStore();
  const { categories } = useCategoryStore();
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [addingType, setAddingType] = useState<'location'|'community'>('location');
  const [newLocation, setNewLocation] = useState({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    placeId: "",
    category: "free",
    tags: [] as string[]
  });
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    placeId: "",
    category: "free",
    tags: [] as string[],
    gameType: "",
    playersNeeded: 1,
    experienceLevel: "all",
    schedule: "",
    contactInfo: ""
  });
  const [tagInput, setTagInput] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userNames = useLocationStore((state) => state.userNames);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapIsReady, setMapIsReady] = useState(false);
  // const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    null,
  );
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [showTour, setShowTour] = useState(() => {
    const hasSeenTour = localStorage.getItem("tour-main-seen");
    if (hasSeenTour === null || hasSeenTour === "false") {
      localStorage.setItem("tour-main-active", "true");
      return true;
    }
    return localStorage.getItem("tour-main-active") === "true";
  });
  const [currentTourStep, setCurrentTourStep] = useState(() => {
    const savedStep = localStorage.getItem("tour-main-step");
    return savedStep ? parseInt(savedStep, 10) : 0;
  });

  // Authentication state
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = activeProfileId !== null && profiles.some(p => p.id === activeProfileId);
  
  // Get the active user profile
  const activeProfile = isAuthenticated 
    ? profiles.find((profile) => profile.id === activeProfileId)
    : null;

  // Apple design system colors
  const appleColors = {
    blue: "#007AFF",
    green: "#34C759",
    red: "#FF3B30",
    yellow: "#FFCC00",
    gray: {
      light: "#F2F2F7",
      medium: "#E5E5EA",
      dark: "#8E8E93",
    },
    text: {
      primary: "#000000",
      secondary: "#8E8E93",
    },
  };

  const tourSteps: {
    target?: string;
    title: string;
    content: string;
    position: "center" | "right" | "left" | "top" | "bottom";
    persistAfterReload?: boolean;
  }[] = [
    {
      title: "Welcome to My World!",
      content:
        "This is a demo app made by Tonk to get you started. Let's take a quick look around. Click 'Next' to begin.",
      position: "center",
    },
    {
      target: ".user-selector",
      title: "User Profiles",
      content:
        "Create and switch between different user profiles to manage your locations.",
      position: "right",
    },
    {
      target: ".category-manager",
      title: "Categories",
      content:
        "Organise your locations by creating custom categories with colours.",
      position: "right",
    },
    {
      target: ".location-list",
      title: "Saved Locations",
      content:
        "View all your saved locations here. Click on any location to see details.",
      position: "right",
    },
    {
      target: ".search-bar",
      title: "Interactive Map",
      content:
        "Use the search bar to add a new location to the map, then continue to the next step.",
      position: "right",
    },
    {
      title: "Transparent Data",
      content:
        "Go back to the Tonk Hub and navigate to the file <code>my-world-locations.automerge</code> under <code>stores</code>. You should see your new location present in the list.",
      position: "center",
    },
    {
      title: "Add a Feature",
      content:
        "If you haven't already, open this project in your AI editor of choice and run the following prompt:\n\n\"Add a new 'Bucket List' feature that lets users star saved locations and displays them in a special list under saved locations in the sidebar.\"",
      position: "center",
      persistAfterReload: true,
    },
  ];

  // Default map center
  const defaultCenter: [number, number] = [51.505, -0.09]; // London

  // Initialize MapKit JS map
  useEffect(() => {
    if (window.mapkit && mapRef.current && !mapInstanceRef.current) {
      // Set Apple Maps style options
      const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? window.mapkit.Map.ColorSchemes.Dark
        : window.mapkit.Map.ColorSchemes.Light;

      // Create a new MapKit JS map instance with Apple-style configuration
      const map = new window.mapkit.Map(mapRef.current, {
        showsZoomControl: true,
        showsCompass: window.mapkit.FeatureVisibility.Adaptive,
        showsScale: window.mapkit.FeatureVisibility.Adaptive,
        showsMapTypeControl: false, // Hide map type control for cleaner UI
        isRotationEnabled: true, // Enable rotation for better UX
        showsPointsOfInterest: true,
        showsUserLocation: true, // Show user's location on the map
        colorScheme: colorScheme,
        padding: new window.mapkit.Padding({
          top: 50,
          right: 10,
          bottom: 50,
          left: 10,
        }),
      });

      // Apply Apple Maps styling
      map.mapType = window.mapkit.Map.MapTypes.Standard;

      // Set initial region
      map.region = new window.mapkit.CoordinateRegion(
        new window.mapkit.Coordinate(defaultCenter[0], defaultCenter[1]),
        new window.mapkit.CoordinateSpan(0.1, 0.1),
      );

      // Add click event listener for adding new locations
      map.addEventListener("click", (event: any) => {
        const coordinate = event.coordinate;
        
        // Only allow authenticated users to add locations
        if (isAuthenticated) {
          handleLocationPick(coordinate.latitude, coordinate.longitude);
          setIsAddingLocation(true);
        } else {
          // Show authentication form for non-authenticated users
          setShowAuthForm(true);
        }
      });

      // Listen for dark mode changes to update map style
      const darkModeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)",
      );
      const handleColorSchemeChange = (e: MediaQueryListEvent) => {
        map.colorScheme = e.matches
          ? window.mapkit.Map.ColorSchemes.Dark
          : window.mapkit.Map.ColorSchemes.Light;
      };

      darkModeMediaQuery.addEventListener("change", handleColorSchemeChange);

      mapInstanceRef.current = map;
      setMapIsReady(true);

      return () => {
        darkModeMediaQuery.removeEventListener(
          "change",
          handleColorSchemeChange,
        );
      };
    }
  }, [mapRef.current, window.mapkit, isAuthenticated]);

  // Update map when center or zoom changes
  useEffect(() => {
    if (mapIsReady && mapInstanceRef.current && mapCenter) {
      const map = mapInstanceRef.current;
      const zoomLevel = mapZoom || 15;
      const span = 0.01 * Math.pow(2, 15 - zoomLevel);

      map.region = new window.mapkit.CoordinateRegion(
        new window.mapkit.Coordinate(mapCenter[0], mapCenter[1]),
        new window.mapkit.CoordinateSpan(span, span),
      );
    }
  }, [mapCenter, mapZoom, mapIsReady]);

  // Handle place selection from search
  const handlePlaceSelect = (
    latitude: number,
    longitude: number,
    name: string,
    placeId?: string,
  ) => {
    const effectivePlaceId = placeId || "";

    if (addingType === 'location') {
      setNewLocation({
        ...newLocation,
        name: name,
        latitude: latitude,
        longitude: longitude,
        placeId: effectivePlaceId,
        category: "free" // Always set to free by default
      });
    } else {
      setNewCommunity({
        ...newCommunity,
        name: name,
        latitude: latitude,
        longitude: longitude,
        placeId: effectivePlaceId,
        category: "free" // Always set to free by default
      });
    }

    // Center the map on the selected location
    setMapCenter([latitude, longitude]);
    setMapZoom(15);

    // Add a simple temporary marker annotation
    if (mapIsReady && mapInstanceRef.current) {
      // Remove any existing temporary marker
      const tempMarker = markersRef.current.find((m) => m.isTemporary);
      if (tempMarker) {
        mapInstanceRef.current.removeAnnotation(tempMarker);
        markersRef.current = markersRef.current.filter((m) => !m.isTemporary);
      }

      // Create a simple marker annotation
      const coordinate = new window.mapkit.Coordinate(latitude, longitude);
      const marker = new window.mapkit.MarkerAnnotation(coordinate, {
        color: "#34C759", // Green color for new location
        title: name,
        glyphText: "+",
        // No selected property to avoid callout
      });

      // Mark it as temporary
      marker.isTemporary = true;

      // Store place ID in the marker if available
      if (effectivePlaceId) {
        marker.placeId = effectivePlaceId;
      }

      // Add to map (but don't select it)
      try {
        mapInstanceRef.current.addAnnotation(marker);
        markersRef.current.push(marker);
      } catch (error) {
        console.error("Error adding annotation:", error);
      }
    }
  };

  // Handle manual location pick from map click
  const handleLocationPick = (lat: number, lng: number) => {
    if (addingType === 'location') {
      setNewLocation((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    } else {
      setNewCommunity((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }

    // Add temporary marker for new location
    if (mapIsReady && mapInstanceRef.current) {
      // Remove any existing temporary marker
      const tempMarker = markersRef.current.find((m) => m.isTemporary);
      if (tempMarker) {
        mapInstanceRef.current.removeAnnotation(tempMarker);
        markersRef.current = markersRef.current.filter((m) => !m.isTemporary);
      }

      // Add new temporary marker
      const marker = new window.mapkit.MarkerAnnotation(
        new window.mapkit.Coordinate(lat, lng),
        {
          color: "#34C759", // Green color for new location
          title: "New Location",
          glyphText: "+",
        },
      );
      marker.isTemporary = true;

      mapInstanceRef.current.addAnnotation(marker);
      markersRef.current.push(marker);
    }
  };

  // Function to update map markers
  const updateMapMarkers = () => {
    if (!mapIsReady || !mapInstanceRef.current) return;

    // Remove all existing markers except temporary one
    const tempMarker = markersRef.current.find((m) => m.isTemporary);
    mapInstanceRef.current.removeAnnotations(
      markersRef.current.filter((m) => !m.isTemporary),
    );
    markersRef.current = tempMarker ? [tempMarker] : [];

    // Add markers for all locations
    const markers = Object.values(locations).map((location) => {
      // Determine marker color based on category and who added it
      let markerColor = appleColors.blue; // Default blue for current user's locations

      if (location.category && categories[location.category]?.color) {
        markerColor = categories[location.category].color;
      } else if (activeProfileId !== location.addedBy) {
        markerColor = appleColors.red; // Red for other users' locations
      }

      // Create Apple-style marker annotation
      const marker = new window.mapkit.MarkerAnnotation(
        new window.mapkit.Coordinate(location.latitude, location.longitude),
        {
          color: markerColor,
          title: location.name,
          subtitle: location.description || "",
          selected: false,
          animates: true,
          displayPriority: 1000,
        },
      );

      // Add custom data to marker
      marker.locationId = location.id;

      // Add callout (popup) with more information
      marker.callout = {
        calloutElementForAnnotation: (annotation: any) => {
          const calloutElement = document.createElement("div");
          calloutElement.className = "mapkit-callout";

          // Apply Apple-style CSS
          calloutElement.style.padding = "16px";
          calloutElement.style.maxWidth = "280px";
          calloutElement.style.backgroundColor = "white";
          calloutElement.style.borderRadius = "14px";
          calloutElement.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.12)";
          calloutElement.style.border = "none";
          calloutElement.style.fontFamily =
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

          const location = Object.values(locations).find(
            (loc) => loc.id === annotation.locationId,
          );
          if (!location) return calloutElement;

          // Create Apple-style callout content
          calloutElement.innerHTML = `
                <h3 style="font-weight: 600; font-size: 17px; margin-bottom: 6px; color: #000;">${location.name}</h3>
                ${location.description ? `<p style="font-size: 15px; margin-bottom: 8px; color: #333;">${location.description}</p>` : ""}
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; items-center;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${categories[location.category]?.color || appleColors.gray.dark}; margin-right: 6px;"></span>
                    <span style="font-size: 13px; color: #8E8E93;">${categories[location.category]?.name || "Uncategorized"}</span>
                  </div>
                  <p style="font-size: 13px; color: #8E8E93; margin-top: 4px;">
                    Added by: ${activeProfileId === location.addedBy ? "You" : userNames[location.addedBy] || "Anonymous"}
                  </p>
                </div>
          `;

          // Add event listeners for buttons with hover effects
          setTimeout(() => {
            const infoButton = document.getElementById(`info-${location.id}`);
            if (infoButton) {
              infoButton.addEventListener("mouseover", () => {
                infoButton.style.backgroundColor = "rgba(0, 122, 255, 0.1)";
              });
              infoButton.addEventListener("mouseout", () => {
                infoButton.style.backgroundColor = "transparent";
              });
              infoButton.addEventListener("click", () => {
                setSelectedLocation(location.id);
                setShowReviewPanel(false);

                // Fetch business hours when location is selected
                if (location.placeId) {
                  setIsLoadingHours(true);
                  setBusinessHours(null);
                  fetchAndUpdateBusinessHours(location.id)
                    .then((hours) => {
                      setBusinessHours(hours);
                      setIsLoadingHours(false);
                    })
                    .catch((error) => {
                      console.error("Error fetching business hours:", error);
                      setIsLoadingHours(false);
                    });
                }
              });
            }

            const reviewButton = document.getElementById(
              `review-${location.id}`,
            );
            if (reviewButton) {
              reviewButton.addEventListener("mouseover", () => {
                reviewButton.style.backgroundColor = "rgba(255, 149, 0, 0.1)";
              });
              reviewButton.addEventListener("mouseout", () => {
                reviewButton.style.backgroundColor = "transparent";
              });
              reviewButton.addEventListener("click", () => {
                setSelectedLocation(location.id);
                setShowReviewPanel(true);
                setReviewRating(5);
                setReviewComment("");
              });
            }

            const removeButton = document.getElementById(
              `remove-${location.id}`,
            );
            if (removeButton) {
              removeButton.addEventListener("mouseover", () => {
                removeButton.style.backgroundColor = "rgba(255, 59, 48, 0.1)";
              });
              removeButton.addEventListener("mouseout", () => {
                removeButton.style.backgroundColor = "transparent";
              });
              removeButton.addEventListener("click", () => {
                mapInstanceRef.current.removeAnnotation(annotation);
                markersRef.current = markersRef.current.filter(
                  (m) => m !== annotation,
                );
              });
            }
          }, 0);

          return calloutElement;
        },
      };

      return marker;
    });

    // Add all markers to the map
    if (markers.length > 0) {
      mapInstanceRef.current.addAnnotations(markers);
      markersRef.current = [...markersRef.current, ...markers];
    }
  };

  // Update markers when locations change
  useEffect(() => {
    updateMapMarkers();
  }, [locations, mapIsReady]);

  // Update all locations' open status when component mounts
  useEffect(() => {
    if (Object.keys(locations).length > 0) {
      updateAllLocationsOpenStatus().catch((error) => {
        console.error("Error updating locations open status:", error);
      });
    }
  }, []);

  // Save tour state when it changes
  useEffect(() => {
    if (showTour) {
      localStorage.setItem("tour-main-active", "true");
    }
  }, [showTour]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (addingType === 'location') {
      if (newLocation.name.trim() === "" || newLocation.latitude === 0) return;
      addLocation(newLocation);
    } else {
      if (newCommunity.name.trim() === "" || newCommunity.latitude === 0) return;
      // Prepare community data in the format expected by addLocation
      const communityLocation = {
        name: newCommunity.name,
        description: newCommunity.description,
        latitude: newCommunity.latitude,
        longitude: newCommunity.longitude,
        placeId: newCommunity.placeId,
        category: newCommunity.category,
        tags: [...newCommunity.tags, "community", newCommunity.gameType],
        // Add community data in metadata or description
        communityData: {
          gameType: newCommunity.gameType,
          playersNeeded: newCommunity.playersNeeded,
          experienceLevel: newCommunity.experienceLevel,
          schedule: newCommunity.schedule,
          contactInfo: newCommunity.contactInfo
        }
      };
      addLocation(communityLocation);
    }
    
    setIsAddingLocation(false);
    setNewLocation({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      placeId: "",
      category: "free",
      tags: [] as string[]
    });
    setNewCommunity({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      placeId: "",
      category: "free",
      tags: [] as string[],
      gameType: "",
      playersNeeded: 1,
      experienceLevel: "all",
      schedule: "",
      contactInfo: ""
    });

    // Remove temporary marker
    if (mapIsReady && mapInstanceRef.current) {
      const tempMarker = markersRef.current.find((m) => m.isTemporary);
      if (tempMarker) {
        mapInstanceRef.current.removeAnnotation(tempMarker);
        markersRef.current = markersRef.current.filter((m) => !m.isTemporary);
      }
    }

    // Update markers to include the new location
    updateMapMarkers();
  };

  const cancelAddLocation = () => {
    setIsAddingLocation(false);
    setNewLocation({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      placeId: "",
      category: "free",
      tags: [] as string[]
    });
    setNewCommunity({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      placeId: "",
      category: "free",
      tags: [] as string[],
      gameType: "",
      playersNeeded: 1,
      experienceLevel: "all",
      schedule: "",
      contactInfo: ""
    });

    // Remove temporary marker
    if (mapIsReady && mapInstanceRef.current) {
      const tempMarker = markersRef.current.find((m) => m.isTemporary);
      if (tempMarker) {
        mapInstanceRef.current.removeAnnotation(tempMarker);
        markersRef.current = markersRef.current.filter((m) => !m.isTemporary);
      }
    }
  };

  // Modify PlaceSearch component to check authentication
  const handlePlaceSelectWrapper = (latitude: number, longitude: number, name: string, placeId?: string) => {
    if (isAuthenticated) {
      handlePlaceSelect(latitude, longitude, name, placeId);
      setIsAddingLocation(true);
    } else {
      setShowAuthForm(true);
    }
  };

  // Use effect to watch for logout and show auth form
  useEffect(() => {
    if (!isAuthenticated && profiles.length > 0) {
      // Only show auth form when there are profiles but none is active (logged out state)
      setShowAuthForm(true);
    }
  }, [isAuthenticated, profiles]);

  // Add global hook for UserSelector to trigger auth screen
  useEffect(() => {
    window.showAuthScreen = () => setShowAuthForm(true);
    
    return () => {
      delete window.showAuthScreen;
    };
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header - Apple-style */}
      <div
        className="flex justify-between items-center p-4 bg-white shadow-sm"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
            style={{ color: appleColors.blue }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2
            className="text-xl font-semibold"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              fontWeight: 600,
            }}
          >
            Finding Players
          </h2>
          <button
            onClick={() => setShowTour(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors tour-button"
            style={{ color: appleColors.blue }}
          >
            <Info className="h-5 w-5" />
          </button>
        </div>

        {/* Show different header content based on authentication */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <User className="h-4 w-4 text-gray-600" />
            <span className="inline text-sm font-medium">
              {activeProfile?.name || "User"}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthForm(true)}
            className="px-3 py-1.5 rounded-full bg-blue-500 text-white text-sm font-medium"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[950]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="relative flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            fixed md:relative top-0 h-full z-[960] overflow-y-auto
            w-[300px] transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRight: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="p-4 flex items-center justify-between md:hidden">
            <h2
              className="font-semibold"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              My World
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: appleColors.blue }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {/* Conditional Sidebar Content */}
            {isAuthenticated ? (
              <>
                {/* Show full sidebar for authenticated users */}
                <UserSelector />
                <OtherUsersList />
                <GameFilters 
                  onFilterChange={(filters) => {
                    console.log("Filters changed:", filters);
                    // Implement filter logic here
                  }}
                />
                <ResetDataButton />
              </>
            ) : (
              <>
                {/* Show limited sidebar for non-authenticated users */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Welcome!</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Sign in to create locations and interact with other players.
                  </p>
                  <button
                    onClick={() => setShowAuthForm(true)}
                    className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Sign In / Create Account
                  </button>
                </div>

                {/* Always show game filters for all users */}
                <GameFilters 
                  onFilterChange={(filters) => {
                    console.log("Filters changed:", filters);
                    // Implement filter logic here
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-grow h-full relative">
          <MapKitInitializer
            onMapReady={(map) => {
              mapInstanceRef.current = map;
              setMapIsReady(true);
            }}
          />

          {/* MapKit JS container */}
          <div
            ref={mapRef}
            style={{ height: "100%", width: "100%" }}
            className="map-container"
          />

          {/* Search bar overlay - aligned to upper left */}
          <div className="absolute top-4 left-4 z-[900] pointer-events-none search-bar">
            <div className="w-80 pointer-events-auto">
              <PlaceSearch
                onPlaceSelect={handlePlaceSelectWrapper}
              />
            </div>
          </div>

          {/* Location Details Panel */}
          {selectedLocation && !showReviewPanel && (
            <div
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl shadow-lg z-[10000] transition-transform transform translate-y-0 max-h-[80vh] md:max-h-[60%] flex flex-col"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Apple-style header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
              >
                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setBusinessHours(null);
                  }}
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ color: appleColors.blue }}
                >
                  Close
                </button>
                <h3
                  className="font-semibold text-base md:text-lg"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  Location Details
                </h3>
                <button
                  onClick={() => setShowReviewPanel(true)}
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ color: appleColors.blue }}
                >
                  Add Review
                </button>
              </div>

              {/* Location Details */}
              <div className="p-4 overflow-y-auto">
                {locations[selectedLocation] && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        {locations[selectedLocation].name}
                      </h2>
                      {locations[selectedLocation].description && (
                        <p className="text-gray-700 mb-4">
                          {locations[selectedLocation].description}
                        </p>
                      )}

                      {/* Category */}
                      {locations[selectedLocation].category &&
                        categories[locations[selectedLocation].category] && (
                          <div className="flex items-center gap-2 mb-4">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  categories[
                                    locations[selectedLocation].category
                                  ].color,
                              }}
                            ></span>
                            <span className="text-sm text-gray-600">
                              {
                                categories[locations[selectedLocation].category]
                                  .name
                              }
                            </span>
                          </div>
                        )}

                      {/* Added by */}
                      <div className="text-sm text-gray-600 mb-4">
                        Added by:{" "}
                        {activeProfileId === locations[selectedLocation].addedBy
                          ? "You"
                          : userNames[locations[selectedLocation].addedBy] ||
                            "Anonymous"}
                      </div>

                      {/* Coordinates */}
                      <div className="text-sm text-gray-600 mb-4">
                        Coordinates:{" "}
                        {locations[selectedLocation].latitude.toFixed(6)},{" "}
                        {locations[selectedLocation].longitude.toFixed(6)}
                      </div>

                      {/* Business Hours Section */}
                      {locations[selectedLocation].placeId && (
                        <div className="mb-4">
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Business Hours
                          </h3>

                          {isLoadingHours ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                              <span>Loading hours...</span>
                            </div>
                          ) : businessHours ? (
                            <div>
                              <div className="text-sm mb-2">
                                <span
                                  className={`font-medium ${businessHours.isOpen ? "text-green-600" : "text-red-600"}`}
                                >
                                  {businessHours.isOpen
                                    ? "Open now"
                                    : "Closed now"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {businessHours.weekdayText.map((day, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between"
                                  >
                                    <span>{day.split(": ")[0]}</span>
                                    <span>{day.split(": ")[1]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              No business hours available
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reviews Section */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Reviews
                        </h3>

                        {!locations[selectedLocation].reviews ||
                        locations[selectedLocation].reviews.length === 0 ? (
                          <div className="text-gray-500 text-sm">
                            No reviews yet. Be the first to add a review!
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {locations[selectedLocation].reviews?.map(
                              (review) => {
                                const reviewer =
                                  userNames[review.userId] || "Anonymous";
                                const isCurrentUser =
                                  review.userId === activeProfileId;

                                return (
                                  <div
                                    key={review.id}
                                    className="p-4 rounded-lg"
                                    style={{
                                      backgroundColor: "rgba(0, 0, 0, 0.03)",
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className="h-4 w-4"
                                              fill={
                                                i < review.rating
                                                  ? appleColors.yellow
                                                  : "none"
                                              }
                                              stroke={
                                                i < review.rating
                                                  ? appleColors.yellow
                                                  : appleColors.gray.dark
                                              }
                                            />
                                          ))}
                                        </div>
                                        <span className="text-sm font-medium">
                                          {isCurrentUser ? "You" : reviewer}
                                        </span>
                                      </div>

                                      {isCurrentUser && (
                                        <button
                                          onClick={() =>
                                            removeReview(
                                              selectedLocation,
                                              review.id,
                                            )
                                          }
                                          className="text-xs text-red-500"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>

                                    <p className="text-sm text-gray-700">
                                      {review.comment}
                                    </p>

                                    <div className="text-xs text-gray-500 mt-2">
                                      {new Date(
                                        review.createdAt,
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setShowReviewPanel(true)}
                          className="mt-4 w-full py-2 rounded-lg font-medium text-sm"
                          style={{
                            backgroundColor: appleColors.blue,
                            color: "white",
                          }}
                        >
                          Add Your Review
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Form Panel */}
          {selectedLocation && showReviewPanel && (
            <div
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl shadow-lg z-[10000] transition-transform transform translate-y-0 max-h-[80vh] md:max-h-[60%] flex flex-col"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Apple-style header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
              >
                <button
                  onClick={() => setShowReviewPanel(false)}
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ color: appleColors.blue }}
                >
                  Back
                </button>
                <h3
                  className="font-semibold text-base md:text-lg"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  Add Review
                </h3>
                <button
                  onClick={() => {
                    if (reviewComment.trim()) {
                      addReview(selectedLocation, reviewRating, reviewComment);
                      setShowReviewPanel(false);
                    }
                  }}
                  disabled={!reviewComment.trim()}
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    color: reviewComment.trim()
                      ? appleColors.blue
                      : appleColors.gray.dark,
                    opacity: reviewComment.trim() ? 1 : 0.5,
                  }}
                >
                  Submit
                </button>
              </div>

              {/* Review Form */}
              <div className="p-4 overflow-y-auto">
                {locations[selectedLocation] && (
                  <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-medium mb-2">
                      {locations[selectedLocation].name}
                    </h2>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Your Rating
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="p-2"
                          >
                            <Star
                              className="h-8 w-8"
                              fill={
                                rating <= reviewRating
                                  ? appleColors.yellow
                                  : "none"
                              }
                              stroke={
                                rating <= reviewRating
                                  ? appleColors.yellow
                                  : appleColors.gray.dark
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Comment */}
                    <div>
                      <label
                        htmlFor="review-comment"
                        className="block text-sm font-medium mb-2 text-gray-700"
                      >
                        Your Review
                      </label>
                      <textarea
                        id="review-comment"
                        rows={5}
                        placeholder="Share your experience with this place..."
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                        style={{
                          borderColor: appleColors.gray.medium,
                          borderRadius: "10px",
                          fontSize: "16px",
                          resize: "none",
                        }}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (reviewComment.trim()) {
                          addReview(
                            selectedLocation,
                            reviewRating,
                            reviewComment,
                          );
                          setShowReviewPanel(false);
                        }
                      }}
                      disabled={!reviewComment.trim()}
                      className="mt-4 w-full py-3 rounded-lg font-medium"
                      style={{
                        backgroundColor: reviewComment.trim()
                          ? appleColors.blue
                          : appleColors.gray.light,
                        color: reviewComment.trim()
                          ? "white"
                          : appleColors.gray.dark,
                        opacity: reviewComment.trim() ? 1 : 0.7,
                      }}
                    >
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Apple-style Add Location/Community Panel */}
          {isAddingLocation && (
            <div
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl shadow-lg z-[10000] transition-transform transform translate-y-0 max-h-[80vh] md:max-h-[60%] flex flex-col"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Apple-style header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
              >
                <button
                  onClick={cancelAddLocation}
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ color: appleColors.blue }}
                >
                  Cancel
                </button>
                <h3
                  className="font-semibold text-base md:text-lg"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  {addingType === 'location' ? 'Add Location' : 'Add Game Community'}
                </h3>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    addingType === 'location' 
                      ? (newLocation.latitude === 0 || !newLocation.name.trim())
                      : (newCommunity.latitude === 0 || !newCommunity.name.trim() || !newCommunity.gameType.trim())
                  }
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    color:
                      (addingType === 'location' 
                        ? (newLocation.latitude === 0 || !newLocation.name.trim()) 
                        : (newCommunity.latitude === 0 || !newCommunity.name.trim() || !newCommunity.gameType.trim()))
                        ? appleColors.gray.dark
                        : appleColors.blue,
                    opacity:
                      (addingType === 'location' 
                        ? (newLocation.latitude === 0 || !newLocation.name.trim())
                        : (newCommunity.latitude === 0 || !newCommunity.name.trim() || !newCommunity.gameType.trim()))
                        ? 0.5
                        : 1,
                  }}
                >
                  Add
                </button>
              </div>

              {/* Form - Apple style */}
              <div className="p-4 overflow-y-auto">
                {/* Location/Community toggle */}
                <div className="mb-4">
                  <Tabs defaultValue={addingType} className="w-full" onValueChange={(value) => setAddingType(value as 'location'|'community')}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="location" className="flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Location</span>
                      </TabsTrigger>
                      <TabsTrigger value="community" className="flex items-center justify-center gap-2">
                        <Gamepad2 className="h-4 w-4" />
                        <span>Game Community</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="location">
                      <form className="flex flex-col gap-4">
                        <div>
                          <label
                            htmlFor="location-name"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Name
                          </label>
                          <input
                            id="location-name"
                            type="text"
                            placeholder="Enter a name for this location"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newLocation.name}
                            onChange={(e) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="location-description"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Description (optional)
                          </label>
                          <textarea
                            id="location-description"
                            rows={3}
                            placeholder="Description"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                              resize: "none",
                            }}
                            value={newLocation.description}
                            onChange={(e) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="location-tags"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {newLocation.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm"
                                style={{
                                  backgroundColor: "rgba(0, 122, 255, 0.1)",
                                  color: appleColors.blue
                                }}
                              >
                                {tag}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-red-500"
                                  onClick={() => setNewLocation(prev => ({
                                    ...prev,
                                    tags: prev.tags.filter((_, i) => i !== index)
                                  }))}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              id="location-tags"
                              type="text"
                              placeholder="Add tags (press Enter)"
                              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                              style={{
                                borderColor: appleColors.gray.medium,
                                borderRadius: "10px",
                                fontSize: "16px",
                              }}
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                  e.preventDefault();
                                  setNewLocation(prev => ({
                                    ...prev,
                                    tags: [...new Set([...prev.tags, tagInput.trim()])]
                                  }));
                                  setTagInput('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (tagInput.trim()) {
                                  setNewLocation(prev => ({
                                    ...prev,
                                    tags: [...new Set([...prev.tags, tagInput.trim()])]
                                  }));
                                  setTagInput('');
                                }
                              }}
                              className="px-4 py-3 rounded-lg"
                              style={{
                                backgroundColor: tagInput.trim() ? appleColors.blue : appleColors.gray.light,
                                color: tagInput.trim() ? "white" : appleColors.gray.dark,
                                opacity: tagInput.trim() ? 1 : 0.5,
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {newLocation.latitude !== 0 && (
                          <div
                            className="p-3 rounded-lg flex items-center gap-2 text-sm"
                            style={{
                              backgroundColor: "rgba(0, 122, 255, 0.1)",
                              borderRadius: "10px",
                            }}
                          >
                            <MapPin
                              className="h-4 w-4"
                              style={{ color: appleColors.blue }}
                            />
                            <span style={{ color: appleColors.text.primary }}>
                              Location selected. Tap on map to adjust.
                            </span>
                          </div>
                        )}
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="community">
                      <form className="flex flex-col gap-4">
                        <div>
                          <label
                            htmlFor="community-name"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Community Name
                          </label>
                          <input
                            id="community-name"
                            type="text"
                            placeholder="Enter a name for your game community"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newCommunity.name}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="community-game-type"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Game Type
                          </label>
                          <select
                            id="community-game-type"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newCommunity.gameType}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                gameType: e.target.value,
                              }))
                            }
                            required
                          >
                            <option value="">Select a game type</option>
                            <option value="DnD">Dungeons & Dragons</option>
                            <option value="Pathfinder">Pathfinder</option>
                            <option value="CoC">Call of Cthulhu</option>
                            <option value="LARP">LARP</option>
                            <option value="BoardGames">Board Games</option>
                            <option value="CardGames">Card Games</option>
                            <option value="VideoGames">Video Games</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="community-description"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Description
                          </label>
                          <textarea
                            id="community-description"
                            rows={3}
                            placeholder="Describe your community, game style, etc."
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                              resize: "none",
                            }}
                            value={newCommunity.description}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="players-needed"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Players Needed
                          </label>
                          <input
                            id="players-needed"
                            type="number"
                            min="1"
                            max="20"
                            placeholder="Number of players needed"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newCommunity.playersNeeded}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                playersNeeded: parseInt(e.target.value) || 1,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="experience-level"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Experience Level
                          </label>
                          <select
                            id="experience-level"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newCommunity.experienceLevel}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                experienceLevel: e.target.value,
                              }))
                            }
                          >
                            <option value="all">All Experience Levels</option>
                            <option value="beginner">Beginners Welcome</option>
                            <option value="intermediate">Intermediate Players</option>
                            <option value="experienced">Experienced Players Only</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="community-schedule"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Schedule
                          </label>
                          <input
                            id="community-schedule"
                            type="text"
                            placeholder="When do you play? (e.g., 'Fridays 7PM')"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newCommunity.schedule}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                schedule: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="contact-info"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Contact Information
                          </label>
                          <input
                            id="contact-info"
                            type="text"
                            placeholder="How can interested players reach you?"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              borderColor: appleColors.gray.medium,
                              borderRadius: "10px",
                              fontSize: "16px",
                            }}
                            value={newCommunity.contactInfo}
                            onChange={(e) =>
                              setNewCommunity((prev) => ({
                                ...prev,
                                contactInfo: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="community-tags"
                            className="block text-sm font-medium mb-1"
                            style={{ color: appleColors.text.secondary }}
                          >
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {newCommunity.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm"
                                style={{
                                  backgroundColor: "rgba(0, 122, 255, 0.1)",
                                  color: appleColors.blue
                                }}
                              >
                                {tag}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-red-500"
                                  onClick={() => setNewCommunity(prev => ({
                                    ...prev,
                                    tags: prev.tags.filter((_, i) => i !== index)
                                  }))}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              id="community-tags"
                              type="text"
                              placeholder="Add tags (press Enter)"
                              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                              style={{
                                borderColor: appleColors.gray.medium,
                                borderRadius: "10px",
                                fontSize: "16px",
                              }}
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                  e.preventDefault();
                                  setNewCommunity(prev => ({
                                    ...prev,
                                    tags: [...new Set([...prev.tags, tagInput.trim()])]
                                  }));
                                  setTagInput('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (tagInput.trim()) {
                                  setNewCommunity(prev => ({
                                    ...prev,
                                    tags: [...new Set([...prev.tags, tagInput.trim()])]
                                  }));
                                  setTagInput('');
                                }
                              }}
                              className="px-4 py-3 rounded-lg"
                              style={{
                                backgroundColor: tagInput.trim() ? appleColors.blue : appleColors.gray.light,
                                color: tagInput.trim() ? "white" : appleColors.gray.dark,
                                opacity: tagInput.trim() ? 1 : 0.5,
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {newCommunity.latitude !== 0 && (
                          <div
                            className="p-3 rounded-lg flex items-center gap-2 text-sm"
                            style={{
                              backgroundColor: "rgba(0, 122, 255, 0.1)",
                              borderRadius: "10px",
                            }}
                          >
                            <MapPin
                              className="h-4 w-4"
                              style={{ color: appleColors.blue }}
                            />
                            <span style={{ color: appleColors.text.primary }}>
                              Location selected. Tap on map to adjust.
                            </span>
                          </div>
                        )}
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}

          {showTour && (
            <TourGuide
              steps={tourSteps}
              currentStep={currentTourStep}
              onNext={() => {
                const nextStep = currentTourStep + 1;
                setCurrentTourStep(nextStep);
                localStorage.setItem("tour-main-step", nextStep.toString());
              }}
              onPrev={() => {
                const prevStep = currentTourStep - 1;
                setCurrentTourStep(prevStep);
                localStorage.setItem("tour-main-step", prevStep.toString());
              }}
              onClose={() => {
                setShowTour(false);
                setCurrentTourStep(0);
                localStorage.removeItem("tour-main-active");
                localStorage.removeItem("tour-main-step");
                localStorage.setItem("tour-main-seen", "true");
              }}
              totalSteps={tourSteps.length}
              tourId="main"
            />
          )}
        </div>
      </div>

      {/* Authentication Form */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
          <AuthForm onClose={() => setShowAuthForm(false)} />
        </div>
      )}
    </div>
  );
};

export default MapView;
