import { useLocationStore } from '../stores/locationStore';
import { useCommunityStore } from '../stores/communityStore';

export const migrateLocationsToCommunities = () => {
  const locationStore = useLocationStore.getState();
  const communityStore = useCommunityStore.getState();
  
  // Copy all locations to communities
  Object.values(locationStore.locations).forEach(location => {
    // Convert location to community format
    communityStore.addCommunity({
      name: location.name,
      description: location.description,
      latitude: location.latitude,
      longitude: location.longitude,
      category: location.category,
      placeId: location.placeId,
      isOpen: location.isOpen,
      // Add required community fields with default values if needed
      game: location.gameType || '',
      roles: [],
      // Add any other fields needed by the Community type
    });
  });
  
  // Copy user names
  Object.entries(locationStore.userNames).forEach(([userId, name]) => {
    communityStore.updateUserName(userId, name);
  });
  
  console.log(`Migration complete: ${Object.keys(locationStore.locations).length} locations migrated to communities`);
};
