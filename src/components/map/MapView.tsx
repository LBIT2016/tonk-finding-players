import React, { useEffect, useState, useRef } from "react";
import { useLocationStore, useUserStore, useCategoryStore } from "../../stores";
import {
  User,
  Menu,
  ChevronLeft,
  Info,
  MapPin,
} from "lucide-react";
import {
  fetchAndUpdateBusinessHours,
  updateAllLocationsOpenStatus,
} from "../../services/googleMapsService";

// Import extracted components
import MapKitInitializer from "./MapKitInitializer";
import LocationDetailsPanel from "./LocationDetailsPanel";
import ReviewPanel from "./ReviewPanel";
import CommunityFormPanel from "./CommunityFormPanel";
import PlaceSearch from "../PlaceSearch";
import UserSelector from "../UserSelector";
import TourGuide from "../TourGuide";
import OtherUsersList from "../OtherUsersList";
import GameFilters from "../GameFilters";
import ResetDataButton from "../ResetDataButton";
import AuthForm from "../AuthForm";

// Import map utilities
import { addTemporaryMarker, removeTemporaryMarkers, setMapRegion } from "./utils/mapUtils";

// Declare MapKit JS types
declare global {
  interface Window {
    mapkit: any;
    showAuthScreen?: () => void;
  }
}

const MapView: React.FC = () => {
  const { locations, addReview, removeReview, addLocation } = useLocationStore();
  const { profiles, activeProfileId } = useUserStore();
  const { categories } = useCategoryStore();
  
  // State management
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
    playersNeeded: 1,
    experienceLevel: "all",
    schedule: "",
    contactInfo: ""
  });
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
  const [businessHours, setBusinessHours] = useState(null);
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  
  // Tour guide state
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

  // Tour guide steps
  const tourSteps = [
    {
      title: "Welcome to Finding Players!",
      content: "This app helps you discover gaming communities, find players, and organize game sessions near you. Let's take a quick tour!",
      position: "center",
    },
    // ...other tour steps...
  ];

  // Default map center
  const defaultCenter: [number, number] = [51.505, -0.09]; // London

  // Initialize MapKit JS map
  useEffect(() => {
    if (window.mapkit && mapRef.current && !mapInstanceRef.current) {
      // Set Apple Maps style options
      const colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? window.mapkit.Map.ColorSchemes.Dark
        : window.mapkit.Map.ColorSchemes.Light;

      // Create map instance
      const map = new window.mapkit.Map(mapRef.current, {
        showsZoomControl: true,
        showsCompass: window.mapkit.FeatureVisibility.Adaptive,
        showsScale: window.mapkit.FeatureVisibility.Adaptive,
        showsMapTypeControl: false,
        isRotationEnabled: true,
        showsPointsOfInterest: true,
        showsUserLocation: true,
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
      setMapRegion(window.mapkit, map, defaultCenter);

      // Add click event listener for adding new locations
      map.addEventListener("click", (event: any) => {
        const coordinate = event.coordinate;
        
        if (isAuthenticated) {
          handleLocationPick(coordinate.latitude, coordinate.longitude);
          setIsAddingLocation(true);
        } else {
          setShowAuthForm(true);
        }
      });

      // Listen for dark mode changes
      const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleColorSchemeChange = (e: MediaQueryListEvent) => {
        map.colorScheme = e.matches
          ? window.mapkit.Map.ColorSchemes.Dark
          : window.mapkit.Map.ColorSchemes.Light;
      };

      darkModeMediaQuery.addEventListener("change", handleColorSchemeChange);

      mapInstanceRef.current = map;
      setMapIsReady(true);

      return () => {
        darkModeMediaQuery.removeEventListener("change", handleColorSchemeChange);
      };
    }
  }, [mapRef.current, window.mapkit, isAuthenticated]);

  // Update map when center or zoom changes
  useEffect(() => {
    if (mapIsReady && mapInstanceRef.current && mapCenter) {
      setMapRegion(window.mapkit, mapInstanceRef.current, mapCenter, mapZoom || 15);
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
      category: "free"
    });

    // Center the map on the selected location
    setMapCenter([latitude, longitude]);
    setMapZoom(15);

    // Add a temporary marker
    if (mapIsReady && mapInstanceRef.current) {
      markersRef.current = addTemporaryMarker(
        window.mapkit, 
        mapInstanceRef.current, 
        markersRef.current, 
        latitude, 
        longitude, 
        name
      );
      
      // Add placeId to the marker if available
      const tempMarker = markersRef.current.find(m => m.isTemporary);
      if (tempMarker && effectivePlaceId) {
        tempMarker.placeId = effectivePlaceId;
      }
    }
  };

  // Handle manual location pick from map click
  const handleLocationPick = (lat: number, lng: number) => {
    setNewCommunity(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    // Add temporary marker
    if (mapIsReady && mapInstanceRef.current) {
      markersRef.current = addTemporaryMarker(
        window.mapkit, 
        mapInstanceRef.current, 
        markersRef.current, 
        lat, 
        lng
      );
    }
  };

  // Function to update map markers
  const updateMapMarkers = () => {
    if (!mapIsReady || !mapInstanceRef.current) return;

    // Implementation of marker update logic 
    // ...existing code for updating markers...
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

  // Handle community submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newCommunity.name.trim() === "" || newCommunity.latitude === 0 || !newCommunity.gameType.trim()) return;
    
    // Prepare community data
    const communityLocation = {
      name: newCommunity.name,
      description: newCommunity.description,
      latitude: newCommunity.latitude,
      longitude: newCommunity.longitude,
      placeId: newCommunity.placeId,
      category: newCommunity.category,
      tags: [...newCommunity.tags, "community", newCommunity.gameType],
      communityData: {
        gameType: newCommunity.gameType,
        playersNeeded: newCommunity.playersNeeded,
        experienceLevel: newCommunity.experienceLevel,
        schedule: newCommunity.schedule,
        contactInfo: newCommunity.contactInfo
      }
    };
    
    addLocation(communityLocation);
    
    // Reset state
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
      playersNeeded: 1,
      experienceLevel: "all",
      schedule: "",
      contactInfo: ""
    });

    // Remove temporary marker
    if (mapIsReady && mapInstanceRef.current) {
      markersRef.current = removeTemporaryMarkers(mapInstanceRef.current, markersRef.current);
    }

    // Update markers
    updateMapMarkers();
  };

  // Cancel adding location
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
      playersNeeded: 1,
      experienceLevel: "all",
      schedule: "",
      contactInfo: ""
    });

    // Remove temporary marker
    if (mapIsReady && mapInstanceRef.current) {
      markersRef.current = removeTemporaryMarkers(mapInstanceRef.current, markersRef.current);
    }
  };

  // Check authentication before place selection
  const handlePlaceSelectWrapper = (latitude: number, longitude: number, name: string, placeId?: string) => {
    if (isAuthenticated) {
      handlePlaceSelect(latitude, longitude, name, placeId);
      setIsAddingLocation(true);
    } else {
      setShowAuthForm(true);
    }
  };

  // Watch for logout and show auth form
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

  // Handle location selection with fetching business hours
  const handleSelectLocation = (locationId: string) => {
    setSelectedLocation(locationId);
    setShowReviewPanel(false);

    // Fetch business hours when location is selected
    const location = locations[locationId];
    if (location?.placeId) {
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

                <GameFilters 
                  onFilterChange={(filters) => {
                    console.log("Filters changed:", filters);
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-grow h-full relative">
          <MapKitInitializer onMapReady={(map) => {
            mapInstanceRef.current = map;
            setMapIsReady(true);
          }} />

          {/* MapKit JS container */}
          <div
            ref={mapRef}
            style={{ height: "100%", width: "100%" }}
            className="map-container"
          />

          {/* Search bar overlay */}
          <div className="absolute top-4 left-4 z-[900] pointer-events-none search-bar">
            <div className="w-80 pointer-events-auto">
              <PlaceSearch onPlaceSelect={handlePlaceSelectWrapper} />
            </div>
          </div>

          {/* Location Details Panel */}
          {selectedLocation && !showReviewPanel && (
            <LocationDetailsPanel
              selectedLocation={selectedLocation}
              locations={locations}
              categories={categories}
              activeProfileId={activeProfileId}
              userNames={userNames}
              businessHours={businessHours}
              isLoadingHours={isLoadingHours}
              onClose={() => {
                setSelectedLocation(null);
                setBusinessHours(null);
              }}
              onShowReviewPanel={() => setShowReviewPanel(true)}
              removeReview={removeReview}
              appleColors={appleColors}
            />
          )}

          {/* Review Form Panel */}
          {selectedLocation && showReviewPanel && (
            <ReviewPanel
              selectedLocation={selectedLocation}
              locations={locations}
              onBack={() => setShowReviewPanel(false)}
              addReview={addReview}
              appleColors={appleColors}
            />
          )}

          {/* Community Form Panel */}
          {isAddingLocation && (
            <CommunityFormPanel
              newCommunity={newCommunity}
              onCommunityChange={setNewCommunity}
              onSubmit={handleSubmit}
              onCancel={cancelAddLocation}
              appleColors={appleColors}
            />
          )}

          {/* Tour Guide */}
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
