import React, { useState } from "react";
import { Star } from "lucide-react";

interface ReviewPanelProps {
  selectedLocation: string;
  locations: Record<string, any>;
  onBack: () => void;
  addReview: (locationId: string, rating: number, comment: string) => void;
  appleColors: any;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  selectedLocation,
  locations,
  onBack,
  addReview,
  appleColors,
}) => {
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  if (!selectedLocation || !locations[selectedLocation]) {
    return null;
  }

  const location = locations[selectedLocation];

  const handleSubmitReview = () => {
    if (reviewComment.trim()) {
      addReview(selectedLocation, reviewRating, reviewComment);
      onBack();
    }
  };

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
          onClick={onBack}
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
          onClick={handleSubmitReview}
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
          <h2 className="text-lg font-medium mb-2">{location.name}</h2>

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
            onClick={handleSubmitReview}
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
};

export default ReviewPanel;
