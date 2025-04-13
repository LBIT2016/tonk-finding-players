import React from "react";
import { Clock, MessageSquare, Star } from "lucide-react";
import { BusinessHours } from "../../services/googleMapsService";

interface LocationDetailsPanelProps {
  selectedLocation: string;
  locations: Record<string, any>;
  categories: Record<string, any>;
  activeProfileId: string | null;
  userNames: Record<string, string>;
  businessHours: BusinessHours | null;
  isLoadingHours: boolean;
  onClose: () => void;
  onShowReviewPanel: () => void;
  removeReview: (locationId: string, reviewId: string) => void;
  appleColors: any;
}

const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({
  selectedLocation,
  locations,
  categories,
  activeProfileId,
  userNames,
  businessHours,
  isLoadingHours,
  onClose,
  onShowReviewPanel,
  removeReview,
  appleColors,
}) => {
  if (!selectedLocation || !locations[selectedLocation]) {
    return null;
  }

  const location = locations[selectedLocation];

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
          onClick={onClose}
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
          onClick={onShowReviewPanel}
          className="text-sm font-medium px-3 py-1 rounded-full"
          style={{ color: appleColors.blue }}
        >
          Add Review
        </button>
      </div>

      {/* Location Details */}
      <div className="p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{location.name}</h2>
            {location.description && (
              <p className="text-gray-700 mb-4">{location.description}</p>
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

            {/* Coordinates */}
            <div className="text-sm text-gray-600 mb-4">
              Coordinates: {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </div>

            {/* Business Hours Section */}
            {location.placeId && (
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
                        className={`font-medium ${
                          businessHours.isOpen
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {businessHours.isOpen ? "Open now" : "Closed now"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {businessHours.weekdayText.map((day, index) => (
                        <div key={index} className="flex justify-between">
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

              {!location.reviews || location.reviews.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  No reviews yet. Be the first to add a review!
                </div>
              ) : (
                <div className="space-y-4">
                  {location.reviews?.map((review: any) => {
                    const reviewer = userNames[review.userId] || "Anonymous";
                    const isCurrentUser = review.userId === activeProfileId;

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
                                removeReview(selectedLocation, review.id)
                              }
                              className="text-xs text-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-gray-700">{review.comment}</p>

                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={onShowReviewPanel}
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

export default LocationDetailsPanel;
