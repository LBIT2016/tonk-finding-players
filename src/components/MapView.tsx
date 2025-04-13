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
import OtherUsersList from "./OtherUsersList";
import GameFilters from "./GameFilters";
import CommunityFormPanel from "./CommunityFormPanel";
import ResetDataButton from "./ResetDataButton";
import AuthForm from "./AuthForm";
import LocationDetailPanel from "./LocationDetailPanel"; // Import the new component
import { FilterOptions, GAME_TO_GENRE } from "../types/gameTypes";
import { createMapPinCallout } from "./map/MapPinCallout";
import { MapPinManager } from "./map/MapPinManager"; // Add this import

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
  const { 
    locations, 
    addReview, 
    removeReview, 
    addLocation,
    // Add deleteLocation import
    deleteLocation 
  } = useLocationStore();
  const { profiles, activeProfileId } = useUserStore();
  const { categories } = useCategoryStore();
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    placeId: "",
    category: "free",
    tags: [] as string[],
    gameType: "",
    genre: "",
    playerRoles: [] as string[],
    playersNeeded: 1,
    experienceLevel: "all",
    schedule: {
      days: [] as string[],
      time: "",
      frequency: ""
    },
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
      title: "Welcome to Finding Players!",
      content:
        "This app helps you discover gaming communities, find players, and organize game sessions near you. Let's take a quick tour!",
      position: "center",
    },
    {
      target: ".user-selector",
      title: "Your Gaming Profile",
      content:
        "Manage your player profile here. Add your preferred games, genres, and gaming style to help others find you.",
      position: "right",
    },
    {
      target: ".search-bar",
      title: "Find Game Locations",
      content:
        "Search for game stores, community centers, or cafes where players gather. You can also click anywhere on the map to add new gaming spots.",
      position: "right",
    },
    {
      target: ".category-manager",
      title: "Game Categories",
      content:
        "Filter locations by game type, like TTRPGs, board games, or video games to find the perfect spot for your next session.",
      position: "right",
    },
    {
      title: "Add Game Communities",
      content:
        "Create or join gaming communities by clicking on the map and selecting 'Game Community'. Share details about what you're playing, when, and how many players you need.",
      position: "center",
    },
    {
      title: "Connect with Players",
      content:
        "Browse profiles of other players in your area, view their game preferences, and connect to expand your gaming circle.",
      position: "center",
    },
    {
      title: "Ready to Play!",
      content:
        "Now you're all set to find players for your next gaming session. Create your profile, find a venue, and start connecting with fellow gamers!",
      position: "center",
      persistAfterReload: true,
    },
  ];

  // Default map center
  const defaultCenter: [number, number] = [51.505, -0.09]; // London

  // Add a reference for the pin manager
  const pinManagerRef = useRef<MapPinManager | null>(null);

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
      
      // Initialize the pin manager
      pinManagerRef.current = new MapPinManager({
        mapInstance: map,
        clusteringDistance: 40 // Cluster pins within 40px of each other
      });
      
      // Set up the cluster select callback
      if (pinManagerRef.current) {
        pinManagerRef.current.setClusterSelectCallback((markers) => {
          // If there's only one marker in the "cluster", show its details directly
          if (markers.length === 1 && markers[0].locationId) {
            setSelectedLocation(markers[0].locationId);
            setShowReviewPanel(false);
            
            // Fetch business hours if needed
            const location = locations[markers[0].locationId];
            if (location?.placeId) {
              setIsLoadingHours(true);
              setBusinessHours(null);
              fetchAndUpdateBusinessHours(markers[0].locationId)
                .then((hours) => {
                  setBusinessHours(hours);
                  setIsLoadingHours(false);
                })
                .catch((error) => {
                  console.error("Error fetching business hours:", error);
                  setIsLoadingHours(false);
                });
            }
          }
        });
      }
      
      setMapIsReady(true);

      return () => {
        darkModeMediaQuery.removeEventListener(
          "change",
          handleColorSchemeChange,
        );
        
        // Clean up pin manager when component unmounts
        if (pinManagerRef.current) {
          pinManagerRef.current.destroy();
        }
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

    setNewCommunity({
      ...newCommunity,
      name: name,
      latitude: latitude,
      longitude: longitude,
      placeId: effectivePlaceId,
      category: "free" // Always set to free by default
    });

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
    setNewCommunity((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

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
          title: "New Game Community",
          glyphText: "+",
        },
      );
      marker.isTemporary = true;

      mapInstanceRef.current.addAnnotation(marker);
      markersRef.current.push(marker);
    }
  };

  // Add filter state
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [filteredLocations, setFilteredLocations] = useState<Record<string, any>>(locations);

  // Filter locations based on active filters
  useEffect(() => {
    if (!Object.keys(activeFilters).some(key => activeFilters[key as keyof FilterOptions] !== null && 
       activeFilters[key as keyof FilterOptions] !== undefined)) {
      // If no filters are active, show all locations
      setFilteredLocations(locations);
      return;
    }
    
    // Apply filters
    const filtered = Object.entries(locations).reduce((acc, [id, location]) => {
      // Default to including the location
      let include = true;
      
      // Get community data if available
      const communityData = location.communityData || {};
      
      // Filter by genre
      if (activeFilters.genre && include) {
        const locationGenre = communityData.genre || 
          (location.gameType ? GAME_TO_GENRE[location.gameType] : null);
        include = locationGenre === activeFilters.genre;
      }
      
      // Filter by game
      if (activeFilters.game && include) {
        include = location.gameType === activeFilters.game;
      }
      
      // Filter by player type
      if (activeFilters.playerType && include) {
        include = communityData.playerRoles && 
          communityData.playerRoles.includes(activeFilters.playerType);
      }
      
      // Filter by experience level
      if (activeFilters.experienceLevel && include) {
        include = communityData.experienceLevel === activeFilters.experienceLevel;
      }
      
      // Filter by players needed
      if (activeFilters.playersNeeded && include) {
        include = (communityData.playersNeeded || 0) >= activeFilters.playersNeeded;
      }
      
      // Filter by schedule days
      if (activeFilters.scheduleDays && activeFilters.scheduleDays.length > 0 && include) {
        // Match if any day matches
        include = communityData.schedule?.days?.some((day: string) => 
          activeFilters.scheduleDays?.includes(day)
        ) || false;
      }
      
      // Filter by recently added (last 7 days)
      if (activeFilters.recentlyAdded && include) {
        const createdAt = communityData.createdAt || location.createdAt;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        include = createdAt > sevenDaysAgo;
      }
      
      // Only include if it passes all filters
      if (include) {
        acc[id] = location;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    setFilteredLocations(filtered);
  }, [locations, activeFilters]);

  // Function to update map markers
  const updateMapMarkers = () => {
    if (!mapIsReady || !mapInstanceRef.current || !pinManagerRef.current) return;

    // Save reference to temporary marker if it exists
    const tempMarker = markersRef.current.find((m) => m.isTemporary);
    
    // Create an array to hold all markers
    const newMarkers = tempMarker ? [tempMarker] : [];

    // Add markers for all FILTERED locations instead of all locations
    Object.values(filteredLocations).forEach((location) => {
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
          const location = Object.values(locations).find(
            (loc) => loc.id === annotation.locationId,
          );
          if (!location) return document.createElement("div");
          
          // Use the extracted callout creator function
          return createMapPinCallout(
            location, 
            userNames, 
            activeProfileId, 
            {
              blue: appleColors.blue,
              green: appleColors.green,
              yellow: appleColors.yellow,
              orange: "#FF9500", // Orange from Apple palette
              purple: "#AF52DE", // Purple from Apple palette
            },
            {
              onDetailsClick: (locationId) => {
                setSelectedLocation(locationId);
                setShowReviewPanel(false);

                // Fetch business hours when location is selected
                if (location.placeId) {
                  setIsLoadingHours(true);
                  setBusinessHours(null);
                  fetchAndUpdateBusinessHours(locationId)
                    .then((hours) => {
                      setBusinessHours(hours);
                      setIsLoadingHours(false);
                    })
                    .catch((error) => {
                      console.error("Error fetching business hours:", error);
                      setIsLoadingHours(false);
                    });
                }
              },
              onReviewClick: (locationId) => {
                setSelectedLocation(locationId);
                setShowReviewPanel(true);
                setReviewRating(5);
                setReviewComment("");
              }
            }
          );
        },
      };
      
      // Add event handling to ensure only one popup is shown at a time
      const originalHandleEvent = marker.handleEvent;
      marker.handleEvent = (event: any) => {
        if (event.type === 'select') {
          // Handle marker selection and ensure only one popup is visible
          if (pinManagerRef.current) {
            pinManagerRef.current.handleMarkerSelect(marker);
          }
        }
        return originalHandleEvent.call(marker, event);
      };

      newMarkers.push(marker);
    });

    // Use pin manager to add markers with clustering
    pinManagerRef.current.addMarkers(newMarkers);
    
    // Update reference to all markers
    markersRef.current = newMarkers;
  };

  // Update markers when filtered locations change
  useEffect(() => {
    updateMapMarkers();
  }, [filteredLocations, mapIsReady]);

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
    
    if (newCommunity.name.trim() === "" || newCommunity.latitude === 0 || !newCommunity.gameType.trim()) return;
    
    // Prepare community data with enhanced structure
    const communityLocation = {
      name: newCommunity.name,
      description: newCommunity.description,
      latitude: newCommunity.latitude,
      longitude: newCommunity.longitude,
      placeId: newCommunity.placeId,
      category: newCommunity.category,
      gameType: newCommunity.gameType,
      tags: [...newCommunity.tags, "community", newCommunity.gameType],
      communityData: {
        genre: newCommunity.genre,
        gameType: newCommunity.gameType,
        playerRoles: newCommunity.playerRoles,
        playersNeeded: newCommunity.playersNeeded,
        experienceLevel: newCommunity.experienceLevel,
        schedule: newCommunity.schedule,
        contactInfo: newCommunity.contactInfo,
        createdAt: Date.now()
      }
    };
    
    addLocation(communityLocation);
    
    // Reset state and form
    setIsAddingLocation(false);
    setNewCommunity({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      placeId: "",
      category: "free",
      tags: [] as string[],
      gameType: "",
      genre: "",
      playerRoles: [] as string[],
      playersNeeded: 1,
      experienceLevel: "all",
      schedule: {
        days: [] as string[],
        time: "",
        frequency: ""
      },
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

    // Update markers
    updateMapMarkers();
  };

  const cancelAddLocation = () => {
    setIsAddingLocation(false);
    setNewCommunity({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      placeId: "",
      category: "free",
      tags: [] as string[],
      gameType: "",
      genre: "",
      playerRoles: [] as string[],
      playersNeeded: 1,
      experienceLevel: "all",
      schedule: {
        days: [] as string[],
        time: "",
        frequency: ""
      },
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

  // Handle filter changes
  const handleFilterChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

  // Check if current user is admin - add this function
  const isCurrentUserAdmin = () => {
    // Simple check for admin based on user name
    if (!activeProfileId) return false;
    
    const isAdminByName = activeProfile?.name?.toLowerCase() === 'admin';
    const isAdminByFlag = activeProfile?.isAdmin === true;
    
    return isAdminByName || isAdminByFlag;
  };

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
                  onFilterChange={handleFilterChange}
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

                <GameFilters 
                  onFilterChange={handleFilterChange}
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

          {/* Location Details Panel - Replaced with new component */}
          {selectedLocation && (
            <LocationDetailPanel
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              locations={locations}
              userNames={userNames}
              activeProfileId={activeProfileId}
              addReview={addReview}
              removeReview={removeReview}
              businessHours={businessHours}
              isLoadingHours={isLoadingHours}
              fetchAndUpdateBusinessHours={(locationId) => {
                setIsLoadingHours(true);
                setBusinessHours(null);
                return fetchAndUpdateBusinessHours(locationId)
                  .then((hours) => {
                    setBusinessHours(hours);
                    setIsLoadingHours(false);
                    return hours;
                  })
                  .catch((error) => {
                    console.error("Error fetching business hours:", error);
                    setIsLoadingHours(false);
                    throw error;
                  });
              }}
              categories={categories}
              appleColors={appleColors}
              deleteLocation={deleteLocation}
            />
          )}

          {/* Community Form Panel */}
          {isAddingLocation && (
            <CommunityFormPanel
              community={newCommunity}
              onCommunityChange={setNewCommunity}
              onSubmit={handleSubmit}
              onCancel={cancelAddLocation}
              appleColors={appleColors}
            />
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
