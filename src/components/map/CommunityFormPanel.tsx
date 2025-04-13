import React, { useState } from "react";
import { MapPin } from "lucide-react";

interface CommunityFormPanelProps {
  newCommunity: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    placeId: string;
    category: string;
    tags: string[];
    gameType: string;
    playersNeeded: number;
    experienceLevel: string;
    schedule: string;
    contactInfo: string;
  };
  onCommunityChange: (updatedCommunity: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  appleColors: any;
}

const CommunityFormPanel: React.FC<CommunityFormPanelProps> = ({
  newCommunity,
  onCommunityChange,
  onSubmit,
  onCancel,
  appleColors,
}) => {
  const [tagInput, setTagInput] = useState("");

  const handleTagAdd = () => {
    if (tagInput.trim()) {
      onCommunityChange({
        ...newCommunity,
        tags: [...new Set([...newCommunity.tags, tagInput.trim()])],
      });
      setTagInput("");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    const fieldName = id.replace("community-", "");
    onCommunityChange({
      ...newCommunity,
      [fieldName]: value,
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace("players-", "");
    onCommunityChange({
      ...newCommunity,
      [fieldName]: parseInt(value) || 1,
    });
  };

  const isSubmitDisabled = 
    newCommunity.latitude === 0 || 
    !newCommunity.name.trim() || 
    !newCommunity.gameType.trim();

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
          onClick={onCancel}
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
          Add Game Community
        </h3>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="text-sm font-medium px-3 py-1 rounded-full"
          style={{
            color: isSubmitDisabled
              ? appleColors.gray.dark
              : appleColors.blue,
            opacity: isSubmitDisabled ? 0.5 : 1,
          }}
        >
          Add
        </button>
      </div>

      {/* Form - Apple style */}
      <div className="p-4 overflow-y-auto">
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="community-gameType"
              className="block text-sm font-medium mb-1"
              style={{ color: appleColors.text.secondary }}
            >
              Game Type
            </label>
            <select
              id="community-gameType"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: appleColors.gray.medium,
                borderRadius: "10px",
                fontSize: "16px",
              }}
              value={newCommunity.gameType}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleNumberChange}
            />
          </div>

          <div>
            <label
              htmlFor="community-experienceLevel"
              className="block text-sm font-medium mb-1"
              style={{ color: appleColors.text.secondary }}
            >
              Experience Level
            </label>
            <select
              id="community-experienceLevel"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: appleColors.gray.medium,
                borderRadius: "10px",
                fontSize: "16px",
              }}
              value={newCommunity.experienceLevel}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label
              htmlFor="community-contactInfo"
              className="block text-sm font-medium mb-1"
              style={{ color: appleColors.text.secondary }}
            >
              Contact Information
            </label>
            <input
              id="community-contactInfo"
              type="text"
              placeholder="How can interested players reach you?"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: appleColors.gray.medium,
                borderRadius: "10px",
                fontSize: "16px",
              }}
              value={newCommunity.contactInfo}
              onChange={handleInputChange}
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
                    onClick={() => onCommunityChange({
                      ...newCommunity,
                      tags: newCommunity.tags.filter((_, i) => i !== index)
                    })}
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
                    handleTagAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleTagAdd}
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
      </div>
    </div>
  );
};

export default CommunityFormPanel;
