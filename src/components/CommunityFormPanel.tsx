import React, { useState, useEffect } from "react";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { 
  GAME_CATEGORIES, 
  GAME_TO_GENRE, 
  DAYS_OF_WEEK,
  TIME_PERIODS,
  FREQUENCY_OPTIONS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS
} from '../types/gameTypes';

interface CommunityFormValues {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  placeId: string;
  category: string;
  tags: string[];
  gameType: string;
  genre: string;
  playerRoles: string[];
  playersNeeded: number;
  experienceLevel: string;
  schedule: {
    days: string[];
    time: string;
    frequency: string;
  };
  contactInfo: string;
}

interface CommunityFormPanelProps {
  community: CommunityFormValues;
  onCommunityChange: (updatedCommunity: CommunityFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  appleColors: any;
}

const CommunityFormPanel: React.FC<CommunityFormPanelProps> = ({
  community,
  onCommunityChange,
  onSubmit,
  onCancel,
  appleColors,
}) => {
  const [tagInput, setTagInput] = useState("");

  // Update genre when game type changes
  useEffect(() => {
    if (community.gameType && GAME_TO_GENRE[community.gameType]) {
      onCommunityChange({
        ...community,
        genre: GAME_TO_GENRE[community.gameType]
      });
    }
  }, [community.gameType]);

  const handleTagAdd = () => {
    if (tagInput.trim()) {
      onCommunityChange({
        ...community,
        tags: [...new Set([...community.tags, tagInput.trim()])],
      });
      setTagInput("");
    }
  };

  const toggleDay = (day: string) => {
    const currentDays = community.schedule.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    onCommunityChange({
      ...community,
      schedule: {
        ...community.schedule,
        days: newDays
      }
    });
  };

  const isSubmitDisabled = 
    community.latitude === 0 || 
    !community.name.trim() || 
    !community.gameType.trim();

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
              value={community.name}
              onChange={(e) =>
                onCommunityChange({
                  ...community,
                  name: e.target.value,
                })
              }
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
              value={community.gameType}
              onChange={(e) =>
                onCommunityChange({
                  ...community,
                  gameType: e.target.value,
                })
              }
              required
            >
              <option value="">Select a game type</option>
              {Object.entries(GAME_CATEGORIES).flatMap(([category, games]) => 
                games.map(game => (
                  <option key={game} value={game}>
                    {game} ({category})
                  </option>
                ))
              )}
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
              value={community.description}
              onChange={(e) =>
                onCommunityChange({
                  ...community,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium text-sm mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Player Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={community.playersNeeded}
                  onChange={(e) =>
                    onCommunityChange({
                      ...community,
                      playersNeeded: parseInt(e.target.value) || 1,
                    })
                  }
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
                  value={community.experienceLevel}
                  onChange={(e) =>
                    onCommunityChange({
                      ...community,
                      experienceLevel: e.target.value,
                    })
                  }
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {EXPERIENCE_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium text-sm mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </h4>
            
            <div className="mb-3">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: appleColors.text.secondary }}
              >
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    className="px-3 py-1.5 text-sm rounded-full border"
                    style={{
                      backgroundColor: community.schedule.days?.includes(day) 
                        ? `${appleColors.blue}15` 
                        : "white",
                      borderColor: community.schedule.days?.includes(day) 
                        ? appleColors.blue 
                        : appleColors.gray.medium,
                      color: community.schedule.days?.includes(day) 
                        ? appleColors.blue 
                        : appleColors.text.secondary,
                    }}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="community-time"
                  className="block text-sm font-medium mb-1"
                  style={{ color: appleColors.text.secondary }}
                >
                  Time of Day
                </label>
                <select
                  id="community-time"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: appleColors.gray.medium,
                    borderRadius: "10px",
                    fontSize: "16px",
                  }}
                  value={community.schedule.time}
                  onChange={(e) =>
                    onCommunityChange({
                      ...community,
                      schedule: {
                        ...community.schedule,
                        time: e.target.value
                      }
                    })
                  }
                >
                  <option value="">Select time</option>
                  {TIME_PERIODS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="community-frequency"
                  className="block text-sm font-medium mb-1"
                  style={{ color: appleColors.text.secondary }}
                >
                  Frequency
                </label>
                <select
                  id="community-frequency"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: appleColors.gray.medium,
                    borderRadius: "10px",
                    fontSize: "16px",
                  }}
                  value={community.schedule.frequency}
                  onChange={(e) =>
                    onCommunityChange({
                      ...community,
                      schedule: {
                        ...community.schedule,
                        frequency: e.target.value
                      }
                    })
                  }
                >
                  <option value="">Select frequency</option>
                  {FREQUENCY_OPTIONS.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>
            </div>
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
              value={community.contactInfo}
              onChange={(e) =>
                onCommunityChange({
                  ...community,
                  contactInfo: e.target.value,
                })
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
              {community.tags.map((tag, index) => (
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
                      ...community,
                      tags: community.tags.filter((_, i) => i !== index)
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

          {community.latitude !== 0 && (
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
