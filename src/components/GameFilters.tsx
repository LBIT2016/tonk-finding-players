import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface GameFiltersProps {
  onFilterChange: (filters: {
    genre?: string | null;
    game?: string | null;
    playerType?: string | null;
  }) => void;
}

const GameFilters: React.FC<GameFiltersProps> = ({ onFilterChange }) => {
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<string | null>(null);
  const [playerTypeFilter, setPlayerTypeFilter] = useState<string | null>(null);
  
  // Sample data - this would ideally come from a store
  const genres = ['TTRPG', 'FPS', 'Strategy', 'MMORPG', 'Puzzle', 'Sports'];
  
  const games = {
    'TTRPG': ['DND', 'Pathfinder', 'Call of Cthulhu', 'LARP'],
    'FPS': ['Counter-Strike', 'Valorant', 'Call of Duty', 'Apex Legends'],
    'Strategy': ['Civilization', 'Age of Empires', 'StarCraft'],
    'MMORPG': ['World of Warcraft', 'Final Fantasy XIV', 'Elder Scrolls Online'],
    'Puzzle': ['Sudoku', 'Crossword', 'Tetris', 'Chess'],
    'Sports': ['FIFA', 'NBA 2K', 'Madden NFL', 'F1']
  };
  
  const playerTypes = {
    'DND': ['Player', 'GM', 'Both'],
    'Pathfinder': ['Player', 'GM', 'Both'],
    'Call of Cthulhu': ['Player', 'Keeper', 'Both'],
    'LARP': ['Player', 'Organizer', 'Both'],
    'default': ['Casual', 'Competitive', 'Social', 'Hardcore']
  };
  
  // Apple design system colors
  const appleColors = {
    blue: "#007AFF",
    green: "#34C759",
    red: "#FF3B30",
    yellow: "#FFCC00",
    orange: "#FF9500",
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
  
  // Get the available games based on selected genre
  const availableGames = genreFilter ? games[genreFilter as keyof typeof games] || [] : [];
  
  // Get the available player types based on selected game
  const availablePlayerTypes = gameFilter && gameFilter in playerTypes 
    ? playerTypes[gameFilter as keyof typeof playerTypes]
    : playerTypes.default;
  
  const updateFilters = (
    genre: string | null = genreFilter,
    game: string | null = gameFilter,
    playerType: string | null = playerTypeFilter
  ) => {
    setGenreFilter(genre);
    setGameFilter(game);
    setPlayerTypeFilter(playerType);
    
    onFilterChange({
      genre,
      game,
      playerType
    });
  };
  
  const clearAllFilters = () => {
    setGenreFilter(null);
    setGameFilter(null);
    setPlayerTypeFilter(null);
    
    onFilterChange({
      genre: null,
      game: null,
      playerType: null
    });
  };
  
  return (
    <div
      className="mb-6 rounded-xl overflow-hidden"
      style={{ backgroundColor: appleColors.gray.light }}
    >
      <div
        className="px-4 py-3 border-b flex justify-between items-center"
        style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
      >
        <h3
          className="font-semibold flex items-center gap-2"
          style={{ fontSize: "15px" }}
        >
          <Filter className="h-4 w-4" />
          Game Filters
        </h3>
        
        {(genreFilter || gameFilter || playerTypeFilter) && (
          <button
            onClick={clearAllFilters}
            className="text-xs rounded-full text-red-500 hover:text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {/* No changes to the actual filter UI */}
      <div className="p-4">
        {/* Genre Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-2 text-gray-500">
            GENRE
          </label>
          <div className="flex flex-wrap gap-2">
            {genres.map(genre => (
              <button
                key={genre}
                className="px-3 py-1.5 text-sm rounded-full border"
                style={{
                  backgroundColor: genreFilter === genre ? `${appleColors.blue}15` : "white",
                  borderColor: genreFilter === genre ? appleColors.blue : appleColors.gray.medium,
                  color: genreFilter === genre ? appleColors.blue : appleColors.text.secondary,
                  fontWeight: genreFilter === genre ? 500 : 400,
                }}
                onClick={() => updateFilters(
                  genreFilter === genre ? null : genre, 
                  null, 
                  null
                )}
              >
                {genre}
                {genreFilter === genre && (
                  <X className="h-3 w-3 ml-1 inline-block" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Game Filter - only show if genre is selected */}
        {genreFilter && (
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 text-gray-500">
              GAME
            </label>
            <div className="flex flex-wrap gap-2">
              {availableGames.map(game => (
                <button
                  key={game}
                  className="px-3 py-1.5 text-sm rounded-full border"
                  style={{
                    backgroundColor: gameFilter === game ? `${appleColors.purple}15` : "white",
                    borderColor: gameFilter === game ? appleColors.purple : appleColors.gray.medium,
                    color: gameFilter === game ? appleColors.purple : appleColors.text.secondary,
                    fontWeight: gameFilter === game ? 500 : 400,
                  }}
                  onClick={() => updateFilters(
                    genreFilter,
                    gameFilter === game ? null : game,
                    null
                  )}
                >
                  {game}
                  {gameFilter === game && (
                    <X className="h-3 w-3 ml-1 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Player Type Filter - only show if game is selected */}
        {gameFilter && (
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 text-gray-500">
              PLAYER TYPE
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePlayerTypes.map(type => (
                <button
                  key={type}
                  className="px-3 py-1.5 text-sm rounded-full border"
                  style={{
                    backgroundColor: playerTypeFilter === type ? `${appleColors.orange}15` : "white",
                    borderColor: playerTypeFilter === type ? appleColors.orange : appleColors.gray.medium,
                    color: playerTypeFilter === type ? appleColors.orange : appleColors.text.secondary,
                    fontWeight: playerTypeFilter === type ? 500 : 400,
                  }}
                  onClick={() => updateFilters(
                    genreFilter,
                    gameFilter,
                    playerTypeFilter === type ? null : type
                  )}
                >
                  {type}
                  {playerTypeFilter === type && (
                    <X className="h-3 w-3 ml-1 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Applied filters summary */}
        {(genreFilter || gameFilter || playerTypeFilter) && (
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h4 className="text-xs font-medium text-gray-500 mb-2">ACTIVE FILTERS</h4>
            <div className="space-y-1 text-sm">
              {genreFilter && (
                <div>Genre: <span className="font-medium">{genreFilter}</span></div>
              )}
              {gameFilter && (
                <div>Game: <span className="font-medium">{gameFilter}</span></div>
              )}
              {playerTypeFilter && (
                <div>Player Type: <span className="font-medium">{playerTypeFilter}</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameFilters;
