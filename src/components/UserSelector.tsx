import React, { useState } from "react";
import { useUserStore } from "../stores";
import { User, Edit2, Trash2, LogOut, ChevronDown, ChevronUp } from "lucide-react";

const UserSelector: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    updateProfileDetails,
    deleteProfile,
    logout
  } = useUserStore();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [nameError, setNameError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

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

  const validateAndSetName = (name: string) => {
    setNewProfileName(name);
    if (name.trim() === "") {
      setNameError("Name cannot be empty");
      return false;
    }
    
    setNameError("");
    return true;
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId || newProfileName.trim() === "") {
      setNameError("Name cannot be empty");
      return;
    }
    
    try {
      updateProfileDetails(activeProfileId, { name: newProfileName });
      setNewProfileName("");
      setIsEditingProfile(false);
      setNameError("");
    } catch (error) {
      if (error instanceof Error) {
        setNameError(error.message);
      } else {
        setNameError("Failed to update profile");
      }
    }
  };

  const handleDeleteProfile = () => {
    if (!activeProfileId) return;
    
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteProfile(activeProfileId);
    }
  };

  const startEditingProfile = (name: string) => {
    setNewProfileName(name);
    setIsEditingProfile(true);
    setNameError("");
  };
  
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      
      // Force auth screen to appear (if we have access to the parent component)
      if (window.showAuthScreen) {
        window.showAuthScreen();
      }
      
      // Close sidebar on mobile if open
      const sidebarToggle = document.querySelector('[aria-label="Toggle sidebar"]');
      if (sidebarToggle) {
        sidebarToggle.dispatchEvent(new Event('click'));
      }
    }
  };

  // Get active profile
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  
  if (!activeProfile) return null;

  return (
    <div
      className="mb-6 rounded-xl overflow-hidden user-selector"
      style={{ backgroundColor: appleColors.gray.light }}
    >
      {/* Simplified header with username and logout icon */}
      <div 
        className="px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={() => setShowSettings(!showSettings)}
        style={{ borderBottom: showSettings ? "1px solid rgba(0, 0, 0, 0.05)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: appleColors.blue }}
          >
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{activeProfile.name}</h3>
            <p className="text-xs text-gray-500">Profile</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className="p-2 rounded-full hover:bg-gray-200"
            title="Log out"
          >
            <LogOut className="h-4 w-4 text-gray-600" />
          </button>
          
          {/* Dropdown indicator */}
          {showSettings ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Collapsible account settings */}
      {showSettings && (
        <div className="p-4">
          {/* Profile Editing Form */}
          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="mb-4">
              <div className="mb-3">
                <label
                  htmlFor="edit-profile-name"
                  className="text-sm font-medium"
                  style={{ color: appleColors.text.secondary }}
                >
                  Edit Username
                </label>
                <input
                  id="edit-profile-name"
                  type="text"
                  value={newProfileName}
                  onChange={(e) => validateAndSetName(e.target.value)}
                  className={`w-full px-3 py-2 border mt-1 focus:outline-none focus:ring-2 ${
                    nameError ? "border-red-500 ring-red-200" : "border-gray-300"
                  }`}
                  style={{
                    borderColor: nameError ? appleColors.red : appleColors.gray.medium,
                    borderRadius: "8px",
                    fontSize: "15px",
                  }}
                  placeholder="Enter a unique username"
                  autoFocus
                  required
                />
                {nameError && (
                  <p className="text-xs text-red-500 mt-1">{nameError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setNewProfileName("");
                    setNameError("");
                  }}
                  className="flex-1 py-2 px-3 text-sm rounded-lg font-medium"
                  style={{
                    backgroundColor: "rgba(142, 142, 147, 0.12)",
                    color: appleColors.text.primary,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!nameError}
                  className="flex-1 py-2 px-3 text-sm rounded-lg font-medium text-white"
                  style={{ 
                    backgroundColor: nameError ? appleColors.gray.dark : appleColors.blue,
                    opacity: nameError ? 0.5 : 1
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          ) : (
            <div>
              {/* User Account Options */}
              <div className="space-y-2 text-sm">
                <button 
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex justify-between items-center"
                  onClick={() => startEditingProfile(activeProfile.name)}
                >
                  <span>Change Username</span>
                  <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button 
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex justify-between items-center"
                  onClick={handleDeleteProfile}
                >
                  <span className="text-red-600">Delete Account</span>
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
                <button 
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex justify-between items-center"
                  onClick={handleLogout}
                >
                  <span>Log Out</span>
                  <LogOut className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
              
              {/* Profile details - optional */}
              {(activeProfile.genres?.length > 0 || activeProfile.games?.length > 0 || activeProfile.playerType) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs uppercase text-gray-500 mb-2">Your Profile</h4>
                  
                  {activeProfile.genres?.length > 0 && (
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Genres:</span> {activeProfile.genres.join(", ")}
                    </div>
                  )}
                  
                  {activeProfile.games?.length > 0 && (
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Games:</span> {activeProfile.games.join(", ")}
                    </div>
                  )}
                  
                  {activeProfile.playerType && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Player Type:</span> {activeProfile.playerType}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
