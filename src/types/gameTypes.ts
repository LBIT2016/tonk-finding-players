// Common type definitions for game communities and filters

export interface CommunityData {
  gameType: string;
  genre?: string;
  playerRoles?: string[];
  experienceLevel: string;
  playersNeeded: number;
  schedule: {
    days?: string[];
    time?: string;
    frequency?: string;
  };
  contactInfo: string;
  createdAt: number;
}

export interface FilterOptions {
  genre?: string | null;
  game?: string | null;
  playerType?: string | null;
  experienceLevel?: string | null;
  playersNeeded?: number | null;
  scheduleDays?: string[] | null;
  recentlyAdded?: boolean;
  tags?: string[] | null;
}

// Game types categorized by genre
export const GAME_CATEGORIES: Record<string, string[]> = {
  'TTRPG': ['DnD', 'Pathfinder', 'Call of Cthulhu', 'LARP'],
  'FPS': ['Counter-Strike', 'Valorant', 'Call of Duty', 'Apex Legends'],
  'Strategy': ['Civilization', 'Age of Empires', 'StarCraft'],
  'MMORPG': ['World of Warcraft', 'Final Fantasy XIV', 'Elder Scrolls Online'],
  'Puzzle': ['Sudoku', 'Crossword', 'Tetris', 'Chess'],
  'Sports': ['FIFA', 'NBA 2K', 'Madden NFL', 'F1'],
  'BoardGames': ['Monopoly', 'Catan', 'Scrabble', 'Risk'],
  'CardGames': ['Magic: The Gathering', 'Poker', 'Yu-Gi-Oh!', 'Hearthstone'],
  'VideoGames': ['Various Video Games'],
  'Other': ['Custom Game']
};

// Mapping game types to genres
export const GAME_TO_GENRE: Record<string, string> = {
  'DnD': 'TTRPG',
  'Pathfinder': 'TTRPG',
  'Call of Cthulhu': 'TTRPG',
  'LARP': 'TTRPG',
  'Counter-Strike': 'FPS',
  'Valorant': 'FPS',
  'Call of Duty': 'FPS',
  'Apex Legends': 'FPS',
  'Civilization': 'Strategy',
  'Age of Empires': 'Strategy',
  'StarCraft': 'Strategy',
  'World of Warcraft': 'MMORPG',
  'Final Fantasy XIV': 'MMORPG',
  'Elder Scrolls Online': 'MMORPG',
  'Sudoku': 'Puzzle',
  'Crossword': 'Puzzle',
  'Tetris': 'Puzzle',
  'Chess': 'Puzzle',
  'FIFA': 'Sports',
  'NBA 2K': 'Sports',
  'Madden NFL': 'Sports',
  'F1': 'Sports',
  'Monopoly': 'BoardGames',
  'Catan': 'BoardGames',
  'Scrabble': 'BoardGames',
  'Risk': 'BoardGames',
  'Magic: The Gathering': 'CardGames',
  'Poker': 'CardGames',
  'Yu-Gi-Oh!': 'CardGames',
  'Hearthstone': 'CardGames',
  'BoardGames': 'BoardGames',
  'CardGames': 'CardGames',
  'VideoGames': 'VideoGames'
};

// Player types/roles by game type
export const PLAYER_TYPES: Record<string, string[]> = {
  'DnD': ['Player', 'GM', 'Both'],
  'Pathfinder': ['Player', 'GM', 'Both'],
  'Call of Cthulhu': ['Player', 'Keeper', 'Both'],
  'LARP': ['Player', 'Organizer', 'Both'],
  'default': ['Casual', 'Competitive', 'Social', 'Hardcore']
};

// Days of the week for scheduling
export const DAYS_OF_WEEK = [
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday', 
  'Saturday', 
  'Sunday'
];

// Common time periods
export const TIME_PERIODS = [
  'Morning',
  'Afternoon',
  'Evening',
  'Night',
  'Flexible'
];

// Frequency options
export const FREQUENCY_OPTIONS = [
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'One-time',
  'Irregular'
];

// Experience levels
export const EXPERIENCE_LEVELS = [
  'all',
  'beginner',
  'intermediate',
  'experienced'
];

// Formatted experience level labels
export const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  'all': 'All Experience Levels',
  'beginner': 'Beginners Welcome',
  'intermediate': 'Intermediate Players',
  'experienced': 'Experienced Players Only'
};
