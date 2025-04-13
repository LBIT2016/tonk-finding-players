import React, { useState, useEffect } from "react";
import { useUserStore } from "../stores";
import GameCategorySelector from "./GameCategorySelector";
import { AlertCircle } from "lucide-react";

const UserProfile: React.FC = () => {
  const { profile: userProfile, setUserProfile, profiles } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [nameError, setNameError] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [playerType, setPlayerType] = useState<string | null>(null);
  
  // Check for profile completeness - useful for guiding new users
  const isProfileComplete = 
    userProfile.name && 
    (userProfile.genres?.length > 0) && 
    (userProfile.games?.length > 0) && 
    userProfile.playerType;

  useEffect(() => {
    // Initialize from profile if available
    if (userProfile.genres) setSelectedGenres(userProfile.genres);
    if (userProfile.games) setSelectedGames(userProfile.games);
    if (userProfile.playerType) setPlayerType(userProfile.playerType);
  }, [userProfile]);

  const validateName = (name: string) => {
    if (name.trim() === "") return "Name cannot be empty";
    
    // TEMPORARILY DISABLED username uniqueness check
    /*
    // Check for uniqueness among other profiles
    const isDuplicate = profiles.some(
      profile => profile.id !== userProfile.id && profile.name.toLowerCase() === name.toLowerCase()
    );
    
    if (isDuplicate) return "This name is already taken";
    */
    
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }

    // Save all profile information at once
    setUserProfile({
      name,
      genres: selectedGenres,
      games: selectedGames, 
      playerType
    });
    setIsEditing(false);
  };

  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres);
  };

  const handleGameChange = (games: string[]) => {
    setSelectedGames(games);
  };

  const handlePlayerTypeChange = (type: string) => {
    setPlayerType(type);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Player Profile</h2>

      {!isProfileComplete && !isEditing && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
          <AlertCircle className="text-yellow-500 w-5 h-5 mr-2 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Please complete your profile to help others find you and to find players with similar interests.
          </p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700">
              Your Name (must be unique)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              className={`px-3 py-2 border rounded w-full ${
                nameError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Your display name"
              required
            />
            {nameError && <p className="mt-1 text-sm text-red-500">{nameError}</p>}
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Gaming Preferences</h3>
            
            <GameCategorySelector 
              selectedCategories={selectedGenres}
              onCategoryChange={handleGenreChange}
              selectedGames={selectedGames}
              onGameChange={handleGameChange}
              selectedPlayerType={playerType}
              onPlayerTypeChange={handlePlayerTypeChange}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setName(userProfile.name);
                setSelectedGenres(userProfile.genres || []);
                setSelectedGames(userProfile.games || []);
                setPlayerType(userProfile.playerType || null);
              }}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="mb-3">
            <span className="font-medium">Name: </span>
            <span>{userProfile.name}</span>
          </div>
          
          <div className="mb-3">
            <span className="font-medium">Genres: </span>
            <span>
              {userProfile.genres?.length ? 
                userProfile.genres.join(", ") : 
                <span className="text-gray-400">Not specified</span>
              }
            </span>
          </div>
          
          <div className="mb-3">
            <span className="font-medium">Games: </span>
            <span>
              {userProfile.games?.length ? 
                userProfile.games.join(", ") : 
                <span className="text-gray-400">Not specified</span>
              }
            </span>
          </div>
          
          <div className="mb-4">
            <span className="font-medium">Player Type: </span>
            <span>
              {userProfile.playerType || 
                <span className="text-gray-400">Not specified</span>
              }
            </span>
          </div>
          
          <div className="mb-4">
            <span className="font-medium">User ID: </span>
            <span className="text-sm text-gray-600">{userProfile.id}</span>
          </div>
          
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
