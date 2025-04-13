import React, { useState } from "react";
import { useUserStore } from "../stores";
import { User, Search, Filter, X, Eye } from "lucide-react";

const OtherUsersList: React.FC = () => {
  const { profiles, activeProfileId, viewingProfileId, setViewingProfile } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<string | null>(null);

  // Apple design system colors
  const appleColors = {
    blue: "#007AFF",
    green: "#34C759",
    red: "#FF3B30",
    yellow: "#FFCC00",
    purple: "#AF52DE",
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

  // Get other users (not the current active user)
  const otherUsers = profiles.filter(profile => profile.id !== activeProfileId);

  // Apply filters to other users
  const filteredUsers = otherUsers.filter(user => {
    // Search filter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Genre filter
    const matchesGenre = !genreFilter || 
      (user.genres && user.genres.includes(genreFilter));
    
    // Game filter
    const matchesGame = !gameFilter || 
      (user.games && user.games.includes(gameFilter));
    
    return matchesSearch && matchesGenre && matchesGame;
  });

  // Get unique genres from all profiles for filter options
  const allGenres = Array.from(new Set(
    profiles.flatMap(profile => profile.genres || [])
  )).sort();

  // Get unique games from all profiles for filter options
  const allGames = Array.from(new Set(
    profiles.flatMap(profile => profile.games || [])
  )).sort();

  // Toggle viewing a user's data
  const toggleViewUser = (userId: string) => {
    if (viewingProfileId === userId) {
      setViewingProfile(null); // Toggle off
    } else {
      setViewingProfile(userId); // Toggle on
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setGenreFilter(null);
    setGameFilter(null);
  };

  if (otherUsers.length === 0) {
    return null; // Don't render anything if there are no other users
  }

  return (
    <div
      className="mb-6 rounded-xl overflow-hidden"
      style={{ backgroundColor: appleColors.gray.light }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
      >
        <h3
          className="font-semibold flex items-center gap-2"
          style={{ fontSize: "15px" }}
        >
          <User className="h-4 w-4" />
          Other Players
        </h3>
      </div>

      <div className="p-4">
        {/* Search and Filters */}
        <div className="mb-3">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg"
              style={{
                borderColor: appleColors.gray.medium,
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {/* Genre filters */}
            <div className="flex-shrink-0">
              <select
                value={genreFilter || ""}
                onChange={(e) => setGenreFilter(e.target.value || null)}
                className="text-xs px-2 py-1 rounded-full border"
                style={{
                  borderColor: genreFilter ? appleColors.blue : appleColors.gray.medium,
                  backgroundColor: genreFilter ? `${appleColors.blue}10` : "white",
                  color: genreFilter ? appleColors.blue : appleColors.text.secondary,
                }}
              >
                <option value="">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            {/* Game filters */}
            <div className="flex-shrink-0">
              <select
                value={gameFilter || ""}
                onChange={(e) => setGameFilter(e.target.value || null)}
                className="text-xs px-2 py-1 rounded-full border"
                style={{
                  borderColor: gameFilter ? appleColors.purple : appleColors.gray.medium,
                  backgroundColor: gameFilter ? `${appleColors.purple}10` : "white",
                  color: gameFilter ? appleColors.purple : appleColors.text.secondary,
                }}
              >
                <option value="">All Games</option>
                {allGames.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
            
            {/* Clear all filters */}
            {(searchTerm || genreFilter || gameFilter) && (
              <button
                onClick={clearFilters}
                className="text-xs px-2 py-1 rounded-full"
                style={{ color: appleColors.red }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center p-4 text-sm text-gray-500">
              No players match your filters
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 rounded-lg flex items-start justify-between bg-white ${
                  viewingProfileId === user.id ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div>
                  <div className="font-medium text-sm flex items-center gap-1">
                    {user.name}
                    {viewingProfileId === user.id && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Viewing
                      </span>
                    )}
                  </div>
                  
                  {/* User details */}
                  <div className="mt-1">
                    {/* Genres */}
                    {user.genres && user.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {user.genres.map(genre => (
                          <span
                            key={genre}
                            className="text-xs px-1.5 py-0.5 rounded-sm"
                            style={{
                              backgroundColor: appleColors.gray.light,
                              color: genreFilter === genre ? appleColors.blue : appleColors.text.secondary,
                              fontWeight: genreFilter === genre ? 500 : 400
                            }}
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Games */}
                    {user.games && user.games.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.games.map(game => (
                          <span
                            key={game}
                            className="text-xs px-1.5 py-0.5 rounded-sm"
                            style={{
                              backgroundColor: "#F0E6FF",
                              color: gameFilter === game ? appleColors.purple : "#8560C2",
                              fontWeight: gameFilter === game ? 500 : 400
                            }}
                          >
                            {game}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Player type */}
                    {user.playerType && (
                      <div className="text-xs text-gray-500 mt-1">
                        {user.playerType}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* View button */}
                <button
                  onClick={() => toggleViewUser(user.id)}
                  className={`p-1.5 rounded-full ${
                    viewingProfileId === user.id 
                      ? "bg-blue-100 hover:bg-blue-200" 
                      : "hover:bg-gray-100"
                  }`}
                  title={viewingProfileId === user.id ? "Stop viewing" : "View user's data"}
                >
                  <Eye 
                    className="h-4 w-4" 
                    style={{ 
                      color: viewingProfileId === user.id 
                        ? appleColors.blue
                        : appleColors.text.secondary
                    }} 
                  />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUsersList;
