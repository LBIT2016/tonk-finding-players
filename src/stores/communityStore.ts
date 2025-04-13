import { create } from 'zustand';
import { Community } from '../types/community';

interface CommunityState {
  communities: Community[];
  filteredCommunities: Community[];
  filters: {
    game?: string;
    role?: string;
    radius?: number;
  };
  setFilters: (filters: Partial<CommunityState['filters']>) => void;
  addCommunity: (community: Community) => void;
  updateCommunity: (id: string, updates: Partial<Community>) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  filteredCommunities: [],
  filters: {},
  
  setFilters: (newFilters) => {
    set((state) => {
      const filters = { ...state.filters, ...newFilters };
      const filtered = state.communities.filter(community => {
        const matchesGame = !filters.game || community.game === filters.game;
        const matchesRole = !filters.role || community.roles.some(r => r.name === filters.role);
        // Add proximity filter logic here
        return matchesGame && matchesRole;
      });
      return { filters, filteredCommunities: filtered };
    });
  },

  addCommunity: (community) => {
    set((state) => ({
      communities: [...state.communities, community],
    }));
  },

  updateCommunity: (id, updates) => {
    set((state) => ({
      communities: state.communities.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },
}));
