import { create } from 'zustand';
import { sync } from "@tonk/keepsync";
import { useUserStore } from "./userStore";
import { Community } from '../types/community';

// Import review interface from location store or redefine it here
export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

// Enhance Community type with location properties you want to keep
export interface EnhancedCommunity extends Community {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  addedBy: string;
  createdAt: number;
  category: string;
  placeId?: string;
  // Removed isOpen property
  reviews?: Review[];
}

interface CommunityState {
  communities: Record<string, EnhancedCommunity>;
  userNames: Record<string, string>;
  filteredCommunities: string[]; // IDs of filtered communities
  filters: {
    game?: string;
    role?: string;
    radius?: number;
  };
  
  // Actions
  setFilters: (filters: Partial<CommunityState['filters']>) => void;
  addCommunity: (community: Omit<EnhancedCommunity, "id" | "addedBy" | "createdAt">) => void;
  updateCommunity: (id: string, updates: Partial<EnhancedCommunity>) => void;
  removeCommunity: (id: string) => void;
  updateUserName: (userId: string, name: string) => void;
  addReview: (communityId: string, rating: number, comment: string) => void;
  removeReview: (communityId: string, reviewId: string) => void;
}

// Generate a random ID (copied from locationStore)
const generateId = () => Math.random().toString(36).substring(2, 15);

export const useCommunityStore = create<CommunityState>(
  sync(
    (set, get) => ({
      communities: {},
      userNames: {},
      filteredCommunities: [],
      filters: {},
      
      setFilters: (newFilters) => {
        set((state) => {
          const filters = { ...state.filters, ...newFilters };
          const filtered = Object.keys(state.communities).filter(id => {
            const community = state.communities[id];
            const matchesGame = !filters.game || community.game === filters.game;
            const matchesRole = !filters.role || 
              (community.roles && community.roles.some(r => r.name === filters.role));
            // Add proximity filter logic here if needed
            return matchesGame && matchesRole;
          });
          return { filters, filteredCommunities: filtered };
        });
      },

      addCommunity: (communityData) => {
        set((state) => {
          const id = generateId();

          // Get the current active user ID from the userStore
          const userStore = useUserStore.getState();
          const activeProfileId = userStore.activeProfileId;

          if (!activeProfileId) {
            console.error("No active user profile found");
            return state;
          }

          // Find the active profile
          const activeProfile = userStore.profiles.find(
            (profile) => profile.id === activeProfileId,
          );

          if (!activeProfile) {
            console.error("Active profile not found");
            return state;
          }

          // Update the userNames map with the current user's name
          const userNames = {
            ...state.userNames,
            [activeProfileId]: activeProfile.name,
          };

          const community: EnhancedCommunity = {
            ...communityData,
            id,
            addedBy: activeProfileId,
            createdAt: Date.now(),
          };

          return {
            communities: {
              ...state.communities,
              [id]: community,
            },
            userNames, // Include updated userNames in the state update
          };
        });
      },

      updateCommunity: (id, updates) => {
        set((state) => {
          if (!state.communities[id]) return state;

          return {
            communities: {
              ...state.communities,
              [id]: {
                ...state.communities[id],
                ...updates,
              },
            },
          };
        });
      },

      removeCommunity: (id) => {
        set((state) => {
          const newCommunities = { ...state.communities };
          delete newCommunities[id];
          return { communities: newCommunities };
        });
      },

      updateUserName: (userId, name) => {
        set((state) => ({
          userNames: {
            ...state.userNames,
            [userId]: name,
          },
        }));
      },

      addReview: (communityId, rating, comment) => {
        set((state) => {
          if (!state.communities[communityId]) return state;

          // Get the current active user ID from the userStore
          const userStore = useUserStore.getState();
          const activeProfileId = userStore.activeProfileId;

          if (!activeProfileId) {
            console.error("No active user profile found");
            return state;
          }

          const reviewId = generateId();
          const review: Review = {
            id: reviewId,
            userId: activeProfileId,
            rating,
            comment,
            createdAt: Date.now(),
          };

          const community = state.communities[communityId];
          const reviews = community.reviews
            ? [...community.reviews, review]
            : [review];

          return {
            communities: {
              ...state.communities,
              [communityId]: {
                ...community,
                reviews,
              },
            },
          };
        });
      },

      removeReview: (communityId, reviewId) => {
        set((state) => {
          if (
            !state.communities[communityId] ||
            !state.communities[communityId].reviews
          )
            return state;

          const community = state.communities[communityId];
          const reviews = community.reviews?.filter(
            (review) => review.id !== reviewId,
          );

          return {
            communities: {
              ...state.communities,
              [communityId]: {
                ...community,
                reviews,
              },
            },
          };
        });
      },
    }),
    {
      docId: "my-world-communities",
      initTimeout: 30000,
      onInitError: (error) =>
        console.error("Community sync initialization error:", error),
    },
  ),
);
