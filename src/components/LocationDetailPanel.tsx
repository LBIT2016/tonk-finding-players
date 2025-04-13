import React, { useState, useEffect } from "react";
import { Clock, MessageSquare, Star, Users, Calendar, Award, BookOpen, Phone, Trash2 } from "lucide-react";
import { BusinessHours } from "../services/googleMapsService";

interface LocationDetailPanelProps {
  selectedLocation: string | null;
  setSelectedLocation: (locationId: string | null) => void;
  locations: Record<string, any>;
  userNames: Record<string, string>;
  activeProfileId: string | null;
  addReview: (locationId: string, rating: number, comment: string) => void;
  removeReview: (locationId: string, reviewId: string) => void;
  businessHours: BusinessHours | null;
  isLoadingHours: boolean;
  fetchAndUpdateBusinessHours: (locationId: string) => Promise<BusinessHours>;
  categories: Record<string, any>;
  appleColors: {
    blue: string;
    green: string;
    red: string;
    yellow: string;
    gray: {
      light: string;
      medium: string;
      dark: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
  };
  deleteLocation?: (locationId: string) => void;
}

const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  selectedLocation,
  setSelectedLocation,
  locations,
  userNames,
  activeProfileId,
  addReview,
  removeReview,
  businessHours,
  isLoadingHours,
  fetchAndUpdateBusinessHours,
  categories,
  appleColors,
  deleteLocation
}) => {
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if current user is admin
  useEffect(() => {
    // Simple check for admin based on name
    const activeProfile = activeProfileId 
      ? locations[selectedLocation]?.profiles?.find((p: any) => p.id === activeProfileId) 
      : null;
    const isAdminByName = activeProfile?.name?.toLowerCase() === 'admin';
    const isAdminByFlag = activeProfile?.isAdmin === true;
    
    // Alternative check when profile is directly available
    const isNameAdmin = userNames[activeProfileId || '']?.toLowerCase() === 'admin';
    
    setIsAdmin(isAdminByName || isAdminByFlag || isNameAdmin);
  }, [activeProfileId, selectedLocation, locations, userNames]);

  if (!selectedLocation) return null;
  
  const location = locations[selectedLocation];
  if (!location) return null;
  
  // Check if this location has community data
  const hasCommunityData = location.communityData || location.gameType;
  const communityData = location.communityData || {};
  
  // Get game type from either community data or location directly
  const gameType = communityData.gameType || location.gameType || "";
  const genre = communityData.genre || "";
  
  // Format schedule days into readable format
  const formatScheduleDays = (days: string[]) => {
    if (!days || days.length === 0) return "Not specified";
    
    if (days.length === 7) return "Every day";
    
    // Sort days in week order
    const dayOrder = { "sunday": 0, "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6 };
    const sortedDays = [...days].sort((a, b) => dayOrder[a.toLowerCase()] - dayOrder[b.toLowerCase()]);
    
    // Capitalize first letter
    return sortedDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");
  };

  // Display review panel
  if (showReviewPanel) {
    return (
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
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-medium mb-2">
              {location.name}
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
        </div>
      </div>
    );
  }

  const handleDeleteLocation = () => {
    if (!isAdmin || !deleteLocation) return;
    
    // Confirm before deleting
    if (window.confirm(`Are you sure you want to delete "${location.name}"? This cannot be undone.`)) {
      deleteLocation(selectedLocation);
      setSelectedLocation(null);
    }
  };

  // Display location/community details panel
  return (
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
          {hasCommunityData ? "Community Details" : "Location Details"}
        </h3>
        <div className="flex items-center gap-2">
          {isAdmin && deleteLocation && (
            <button
              onClick={handleDeleteLocation}
              className="text-sm font-medium p-2 rounded-full hover:bg-red-50"
              title="Delete location (Admin only)"
              style={{ color: appleColors.red }}
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => setShowReviewPanel(true)}
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={{ color: appleColors.blue }}
          >
            Add Review
          </button>
        </div>
      </div>

      {/* Location/Community Details */}
      <div className="p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {location.name}
            </h2>
            {location.description && (
              <p className="text-gray-700 mb-4">
                {location.description}
              </p>
            )}

            {/* Category */}
            {location.category && categories[location.category] && (
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: categories[location.category].color,
                  }}
                ></span>
                <span className="text-sm text-gray-600">
                  {categories[location.category].name}
                </span>
              </div>
            )}

            {/* Added by */}
            <div className="text-sm text-gray-600 mb-4">
              Added by:{" "}
              {activeProfileId === location.addedBy
                ? "You"
                : userNames[location.addedBy] || "Anonymous"}
            </div>

            {/* Community-specific details */}
            {hasCommunityData && (
              <div className="space-y-4 mb-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">Game Community</h3>
                
                {/* Game Type & Genre */}
                {gameType && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Game Type:</span>
                    <span className="text-sm text-gray-600">{gameType}</span>
                    {genre && (
                      <>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-sm text-gray-600">{genre}</span>
                      </>
                    )}
                  </div>
                )}
                
                {/* Players Needed */}
                {communityData.playersNeeded > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Players Needed:</span>
                    <span className="text-sm text-gray-600">{communityData.playersNeeded}</span>
                  </div>
                )}
                
                {/* Experience Level */}
                {communityData.experienceLevel && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Experience:</span>
                    <span className="text-sm text-gray-600 capitalize">
                      {communityData.experienceLevel === "all" ? "All Levels Welcome" : communityData.experienceLevel}
                    </span>
                  </div>
                )}
                
                {/* Player Roles */}
                {communityData.playerRoles && communityData.playerRoles.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span className="text-sm font-medium text-gray-700 mt-0.5">Roles Needed:</span>
                    <div className="flex flex-wrap gap-1">
                      {communityData.playerRoles.map((role: string, index: number) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Schedule */}
                {communityData.schedule && (communityData.schedule.days?.length > 0 || communityData.schedule.time) && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Schedule:</span>
                      <div className="text-sm text-gray-600">
                        {communityData.schedule.days?.length > 0 && (
                          <div>{formatScheduleDays(communityData.schedule.days)}</div>
                        )}
                        {communityData.schedule.time && (
                          <div>Time: {communityData.schedule.time}</div>
                        )}
                        {communityData.schedule.frequency && (
                          <div>Frequency: {communityData.schedule.frequency}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Contact Info */}
                {communityData.contactInfo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Contact:</span>
                    <span className="text-sm text-gray-600">{communityData.contactInfo}</span>
                  </div>
                )}
              </div>
            )}

            {/* Coordinates */}
            <div className="text-sm text-gray-600 mb-4">
              Coordinates:{" "}
              {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </div>

            {/* Reviews Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews
              </h3>

              {!location.reviews ||
              location.reviews.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  No reviews yet. Be the first to add a review!
                </div>
              ) : (
                <div className="space-y-4">
                  {location.reviews?.map(
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
      </div>
    </div>
  );
};

export default LocationDetailPanel;
