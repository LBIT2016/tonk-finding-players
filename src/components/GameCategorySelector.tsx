import React from 'react';
import './GameCategorySelector.css';

interface GameCategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedGames: string[];
  onGameChange: (games: string[]) => void;
  selectedPlayerType: string | null;
  onPlayerTypeChange: (type: string) => void;
}

const GameCategorySelector: React.FC<GameCategorySelectorProps> = ({
  selectedCategories = [],
  onCategoryChange,
  selectedGames = [],
  onGameChange,
  selectedPlayerType,
  onPlayerTypeChange
}) => {
  // Game options organized by category
  const categoryGames = {
    'Puzzle': ['Sudoku', 'Crossword', 'Tetris', 'Chess'],
    'Sports': ['FIFA', 'NBA 2K', 'Madden NFL', 'F1'],
    'TTRPG': ['DND', 'Pathfinder', 'Call of Cthulhu', 'LARP'],
    'Strategy': ['Civilization', 'Age of Empires', 'StarCraft'],
    'FPS': ['Counter-Strike', 'Valorant', 'Call of Duty', 'Apex Legends'],
    'MMORPG': ['World of Warcraft', 'Final Fantasy XIV', 'Elder Scrolls Online'],
    'Other': ['Custom Game']
  };
  
  // Player types for different games
  const playerTypes = {
    'DND': ['Player', 'GM', 'Both'],
    'Pathfinder': ['Player', 'GM', 'Both'],
    'Call of Cthulhu': ['Player', 'Keeper', 'Both'],
    'LARP': ['Player', 'Organizer', 'Both'],
    'default': ['Casual', 'Competitive', 'Social', 'Hardcore']
  };

  const handleCategoryChange = (category: string) => {
    let newCategories;
    if (selectedCategories.includes(category)) {
      newCategories = selectedCategories.filter((c) => c !== category);
      
      // Also remove any games that belong to this category
      const gamesInCategory = categoryGames[category as keyof typeof categoryGames] || [];
      const newGames = selectedGames.filter(game => !gamesInCategory.includes(game));
      onGameChange(newGames);
    } else {
      newCategories = [...selectedCategories, category];
    }
    onCategoryChange(newCategories);
  };

  const handleGameChange = (game: string) => {
    let newGames;
    if (selectedGames.includes(game)) {
      newGames = selectedGames.filter((g) => g !== game);
      
      // If this game determined the player type, reset it
      if (game in playerTypes && selectedPlayerType) {
        if (playerTypes[game as keyof typeof playerTypes].includes(selectedPlayerType)) {
          onPlayerTypeChange('');
        }
      }
    } else {
      newGames = [...selectedGames, game];
    }
    onGameChange(newGames);
  };

  // Get appropriate player type options based on selected games
  const getPlayerTypeOptions = () => {
    // For DND, Pathfinder, etc. use specific role types
    for (const game of selectedGames) {
      if (game in playerTypes) {
        return playerTypes[game as keyof typeof playerTypes];
      }
    }
    // Otherwise use default player types
    return playerTypes.default;
  };

  return (
    <div className="game-category-selector">
      <div className="step-section">
        <h3 className="step-title">What genres do you play?</h3>
        <div className="category-options">
          {Object.keys(categoryGames).map((category) => (
            <button
              key={category}
              className={`category-button ${selectedCategories.includes(category) ? 'selected' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <div className="step-section">
          <h4 className="step-title">Select the games you play</h4>
          <div className="game-grid">
            {selectedCategories.flatMap(category => {
              const games = categoryGames[category as keyof typeof categoryGames] || [];
              return games.map(game => (
                <button
                  key={game}
                  className={`game-button ${selectedGames.includes(game) ? 'selected' : ''}`}
                  onClick={() => handleGameChange(game)}
                >
                  {game}
                </button>
              ));
            })}
          </div>
        </div>
      )}

      {selectedGames.length > 0 && (
        <div className="step-section">
          <h4 className="step-title">What type of player are you?</h4>
          <div className="player-type-grid">
            {getPlayerTypeOptions().map((option) => (
              <button
                key={option}
                className={`player-type-button ${selectedPlayerType === option ? 'selected' : ''}`}
                onClick={() => onPlayerTypeChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCategorySelector;