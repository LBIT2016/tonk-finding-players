# Tonk Finding Players

A location-based application for finding gaming communities, players, and venues in your area. Built with React, TypeScript, and Apple MapKit JS.

## Features

### Map & Location Features
- **Interactive Map**: Apple Maps integration using MapKit JS with custom markers and callouts
- **Location Management**: Add, view, and filter game locations and communities
- **Clustering**: Automatic grouping of nearby markers for better map readability
- **Location Details**: View information about gaming venues including business hours
- **Search Functionality**: Find locations by name, address, or points of interest

### Community Features
- **Game Communities**: Create and join gaming groups with specific details:
  - Game types (TTRPGs, board games, card games, video games)
  - Players needed
  - Experience levels
  - Meeting schedule
  - Contact information
- **Reviews System**: Rate and review locations and communities
- **Filtering**: Find communities by game type, genre, player experience, and more
- **Tags**: Categorize communities with custom tags for better discoverability

### User Features
- **User Authentication**: Sign up, login, and profile management
- **Player Profiles**: View other players in your area and their game preferences
- **Community Interaction**: Connect with other players and join their games

### UI/UX
- **Apple-Inspired Design**: Clean, modern interface following Apple design principles
- **Responsive Layout**: Works on desktop and mobile devices
- **Tour Guide**: Interactive guide for new users
- **Dark Mode Support**: Automatic theme adjustment based on system preferences

## Technical Implementation

### Architecture
- **React & TypeScript**: Frontend built with React and fully typed with TypeScript
- **Zustand**: State management with persisted stores
- **MapKit JS**: Apple Maps integration with clustering and custom annotations
- **PWA Support**: Progressive Web App capabilities for mobile installation

### Key Components
- **MapView**: Main map interface with location display and interaction
- **OtherUsersList**: Display and filter other players in the area
- **LocationDetailPanel**: View and interact with location information
- **CommunityFormPanel**: Create and edit game communities
- **MapPinManager**: Handle map markers, clustering, and interactions
- **GameFilters**: Filter locations by game type, genre, and other attributes

### Data Stores
- **locationStore**: Manage game locations and venue data
- **userStore**: Handle user profiles and authentication
- **communityStore**: Manage gaming community information
- **categoryStore**: Handle game categories and filtering options

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- NPM or Yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Serve production build
npm run serve
```

### Configuration
- Apple MapKit JS token is required for map functionality
- Configure environment variables for API keys and services

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License
