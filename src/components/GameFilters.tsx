import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Clock, Users, Star, Calendar, Tag } from 'lucide-react';
import { 
  FilterOptions, 
  GAME_CATEGORIES, 
  PLAYER_TYPES, 
  DAYS_OF_WEEK,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS
} from '../types/gameTypes';

interface GameFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const GameFilters: React.FC<GameFiltersProps> = ({ onFilterChange }) => {
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<string | null>(null);
  const [playerTypeFilter, setPlayerTypeFilter] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string | null>(null);
  const [playersNeededFilter, setPlayersNeededFilter] = useState<number | null>(null);
  const [scheduleDaysFilter, setScheduleDaysFilter] = useState<string[]>([]);
  const [recentlyAddedFilter, setRecentlyAddedFilter] = useState(false);
  
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
  const availableGames = genreFilter ? GAME_CATEGORIES[genreFilter] || [] : [];
  
  // Get the available player types based on selected game
  const availablePlayerTypes = gameFilter && gameFilter in PLAYER_TYPES 
    ? PLAYER_TYPES[gameFilter as keyof typeof PLAYER_TYPES]
    : PLAYER_TYPES.default;
  
  const updateFilters = () => {
    onFilterChange({
      genre: genreFilter,
      game: gameFilter,
      playerType: playerTypeFilter,
      experienceLevel: experienceLevelFilter,
      playersNeeded: playersNeededFilter,
      scheduleDays: scheduleDaysFilter.length > 0 ? scheduleDaysFilter : null,
      recentlyAdded: recentlyAddedFilter
    });
  };
  
  // Update filters whenever any filter changes
  React.useEffect(() => {
    updateFilters();
  }, [
    genreFilter, 
    gameFilter, 
    playerTypeFilter, 
    experienceLevelFilter, 
    playersNeededFilter, 
    scheduleDaysFilter, 
    recentlyAddedFilter
  ]);
  
  const clearAllFilters = () => {
    setGenreFilter(null);
    setGameFilter(null);
    setPlayerTypeFilter(null);
    setExperienceLevelFilter(null);
    setPlayersNeededFilter(null);
    setScheduleDaysFilter([]);
    setRecentlyAddedFilter(false);
  };
  
  const toggleScheduleDay = (day: string) => {
    if (scheduleDaysFilter.includes(day)) {
      setScheduleDaysFilter(scheduleDaysFilter.filter(d => d !== day));
    } else {
      setScheduleDaysFilter([...scheduleDaysFilter, day]);
    }
  };
  
  const anyFiltersActive = 
    genreFilter !== null || 
    gameFilter !== null || 
    playerTypeFilter !== null || 
    experienceLevelFilter !== null || 
    playersNeededFilter !== null || 
    scheduleDaysFilter.length > 0 || 
    recentlyAddedFilter;
  
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
        
        {anyFiltersActive && (
          <button
            onClick={clearAllFilters}
            className="text-xs rounded-full text-red-500 hover:text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Genre Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-2 text-gray-500">
            GENRE
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(GAME_CATEGORIES).map(genre => (
              <button
                key={genre}
                className="px-3 py-1.5 text-sm rounded-full border"
                style={{
                  backgroundColor: genreFilter === genre ? `${appleColors.blue}15` : "white",
                  borderColor: genreFilter === genre ? appleColors.blue : appleColors.gray.medium,
                  color: genreFilter === genre ? appleColors.blue : appleColors.text.secondary,
                  fontWeight: genreFilter === genre ? 500 : 400,
                }}
                onClick={() => {
                  if (genreFilter === genre) {
                    setGenreFilter(null);
                    setGameFilter(null);
                    setPlayerTypeFilter(null);
                  } else {
                    setGenreFilter(genre);
                    setGameFilter(null);
                    setPlayerTypeFilter(null);
                  }
                }}
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
                  onClick={() => {
                    if (gameFilter === game) {
                      setGameFilter(null);
                      setPlayerTypeFilter(null);
                    } else {
                      setGameFilter(game);
                      setPlayerTypeFilter(null);
                    }
                  }}
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
                  onClick={() => {
                    setPlayerTypeFilter(playerTypeFilter === type ? null : type);
                  }}
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
        
        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full py-2 px-3 mt-2 mb-3 text-sm rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: showAdvancedFilters ? `${appleColors.blue}10` : "white",
            color: appleColors.blue,
            border: `1px solid ${showAdvancedFilters ? appleColors.blue : appleColors.gray.medium}`
          }}
        >
          <span className="font-medium">Advanced Filters</span>
          {showAdvancedFilters ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </button>
        
        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="space-y-4 mt-4 p-3 border border-gray-200 rounded-lg bg-white">
            {/* Experience Level Filter */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium mb-2 text-gray-500">
                <Star className="h-3.5 w-3.5" /> EXPERIENCE LEVEL
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map(level => (
                  <button
                    key={level}
                    className="px-3 py-1.5 text-sm rounded-full border"
                    style={{
                      backgroundColor: experienceLevelFilter === level ? `${appleColors.yellow}15` : "white",
                      borderColor: experienceLevelFilter === level ? appleColors.yellow : appleColors.gray.medium,
                      color: experienceLevelFilter === level ? "#B3750A" : appleColors.text.secondary,
                      fontWeight: experienceLevelFilter === level ? 500 : 400,
                    }}
                    onClick={() => {
                      setExperienceLevelFilter(experienceLevelFilter === level ? null : level);
                    }}
                  >
                    {EXPERIENCE_LEVEL_LABELS[level]}
                    {experienceLevelFilter === level && (
                      <X className="h-3 w-3 ml-1 inline-block" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Players Needed Filter */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium mb-2 text-gray-500">
                <Users className="h-3.5 w-3.5" /> PLAYERS NEEDED
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map(count => (
                  <button
                    key={count}
                    className="px-3 py-1.5 text-sm rounded-full border"
                    style={{
                      backgroundColor: playersNeededFilter === count ? `${appleColors.green}15` : "white",
                      borderColor: playersNeededFilter === count ? appleColors.green : appleColors.gray.medium,
                      color: playersNeededFilter === count ? appleColors.green : appleColors.text.secondary,
                      fontWeight: playersNeededFilter === count ? 500 : 400,
                    }}
                    onClick={() => {
                      setPlayersNeededFilter(playersNeededFilter === count ? null : count);
                    }}
                  >
                    {count === 1 ? "1 Player" : `${count}+ Players`}
                    {playersNeededFilter === count && (
                      <X className="h-3 w-3 ml-1 inline-block" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Schedule Filter */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium mb-2 text-gray-500">
                <Calendar className="h-3.5 w-3.5" /> AVAILABLE DAYS
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    className="px-3 py-1.5 text-sm rounded-full border"
                    style={{
                      backgroundColor: scheduleDaysFilter.includes(day) ? `${appleColors.blue}15` : "white",
                      borderColor: scheduleDaysFilter.includes(day) ? appleColors.blue : appleColors.gray.medium,
                      color: scheduleDaysFilter.includes(day) ? appleColors.blue : appleColors.text.secondary,
                      fontWeight: scheduleDaysFilter.includes(day) ? 500 : 400,
                    }}
                    onClick={() => toggleScheduleDay(day)}
                  >
                    {day.slice(0, 3)}
                    {scheduleDaysFilter.includes(day) && (
                      <X className="h-3 w-3 ml-1 inline-block" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recently Added Filter */}
            <div>
              <button
                className="px-3 py-1.5 text-sm rounded-full border flex items-center gap-1"
                style={{
                  backgroundColor: recentlyAddedFilter ? `${appleColors.purple}15` : "white",
                  borderColor: recentlyAddedFilter ? appleColors.purple : appleColors.gray.medium,
                  color: recentlyAddedFilter ? appleColors.purple : appleColors.text.secondary,
                  fontWeight: recentlyAddedFilter ? 500 : 400,
                }}
                onClick={() => setRecentlyAddedFilter(!recentlyAddedFilter)}
              >
                <Clock className="h-3.5 w-3.5" />
                Recently Added
                {recentlyAddedFilter && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Applied filters summary */}
        {anyFiltersActive && (
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
              {experienceLevelFilter && (
                <div>Experience: <span className="font-medium">{EXPERIENCE_LEVEL_LABELS[experienceLevelFilter]}</span></div>
              )}
              {playersNeededFilter && (
                <div>Players Needed: <span className="font-medium">
                  {playersNeededFilter === 1 ? "1 Player" : `${playersNeededFilter}+ Players`}
                </span></div>
              )}
              {scheduleDaysFilter.length > 0 && (
                <div>Available: <span className="font-medium">{scheduleDaysFilter.map(d => d.slice(0, 3)).join(', ')}</span></div>
              )}
              {recentlyAddedFilter && (
                <div><span className="font-medium">Recently Added</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameFilters;
