import { create } from "zustand";
import { sync } from "@tonk/keepsync";
import { useLocationStore } from "./locationStore";

export interface UserProfile {
  id: string;
  name: string;
  passwordHash?: string;  // Make optional for backward compatibility
  createdAt: number;
  genres?: string[];
  games?: string[];
  playerType?: string;
}

interface UserState {
  profiles: UserProfile[];
  activeProfileId: string | null;
  viewingProfileId: string | null;
  authError: string | null;
  isLoading: boolean;
  
  // Authentication actions
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => void;
  
  // Legacy function for backward compatibility
  createProfile: (name: string) => UserProfile;
  setActiveProfile: (id: string) => void;
  setViewingProfile: (id: string | null) => void;
  
  // Profile actions
  updateProfileDetails: (id: string, details: Partial<Omit<UserProfile, "id" | "createdAt" | "passwordHash">>) => void;
  updateProfileName: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  isNameUnique: (name: string, excludeId?: string) => boolean;
  resetData: () => void;
}

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Get the active profile ID from localStorage
const getSessionData = () => {
  const sessionData = localStorage.getItem("user-session");
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const useUserStore = create<UserState>(
  sync(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      viewingProfileId: null,
      authError: null,
      isLoading: true,

      // Check for existing session on initialization
      checkSession: () => {
        const session = getSessionData();
        if (session && session.userId) {
          // Verify the user exists
          const userExists = get().profiles.some(profile => profile.id === session.userId);
          if (userExists) {
            set({ activeProfileId: session.userId });
          } else {
            localStorage.removeItem("user-session");
          }
        }
        set({ isLoading: false });
      },
      
      // Legacy createProfile function for backward compatibility
      createProfile: (name) => {
        const id = generateId();
        const newProfile: UserProfile = {
          id,
          name,
          createdAt: Date.now()
        };

        set((state) => ({
          profiles: [...state.profiles, newProfile],
          activeProfileId: id
        }));

        // Update the user name in the location store's map
        useLocationStore.getState().updateUserName(id, name);

        // Save session
        localStorage.setItem("user-session", JSON.stringify({ 
          userId: id,
          timestamp: Date.now()
        }));

        return newProfile;
      },
      
      // Legacy functions for compatibility
      setActiveProfile: (id) => {
        localStorage.setItem("user-session", JSON.stringify({ 
          userId: id,
          timestamp: Date.now()
        }));

        set({ 
          activeProfileId: id,
          viewingProfileId: null
        });
      },
      
      setViewingProfile: (id) => {
        set({ viewingProfileId: id });
      },
      
      // Login with username and password
      login: async (username, password) => {
        set({ authError: null });
        try {
          // Find the user with matching username (simple comparison for now)
          const normalizedUsername = username.trim().toLowerCase();
          const user = get().profiles.find(
            profile => profile.name.trim().toLowerCase() === normalizedUsername
          );
          
          if (!user) {
            set({ authError: "User not found" });
            return false;
          }
          
          // For now, use simple comparison instead of bcrypt
          // In production, use proper password verification
          const isMatch = user.passwordHash === password;
          if (!isMatch) {
            set({ authError: "Invalid password" });
            return false;
          }
          
          // Set active profile and save to localStorage
          set({ activeProfileId: user.id });
          localStorage.setItem("user-session", JSON.stringify({ 
            userId: user.id,
            timestamp: Date.now()
          }));
          
          return true;
        } catch (error) {
          console.error("Login error:", error);
          set({ authError: "Login failed" });
          return false;
        }
      },
      
      // Create a new user account
      signup: async (username, password) => {
        set({ authError: null });
        try {
          // Check if username already exists
          const normalizedUsername = username.trim().toLowerCase();
          const isUnique = !get().profiles.some(
            profile => profile.name.trim().toLowerCase() === normalizedUsername
          );
          
          if (!isUnique) {
            set({ authError: "Username already exists" });
            return false;
          }
          
          // For now, store password as-is
          // In production, use proper password hashing
          const passwordHash = password;
          
          // Create new user
          const id = generateId();
          const newProfile: UserProfile = {
            id,
            name: username,
            passwordHash,
            createdAt: Date.now(),
          };
          
          set(state => ({
            profiles: [...state.profiles, newProfile],
            activeProfileId: id
          }));
          
          // Save to localStorage
          localStorage.setItem("user-session", JSON.stringify({ 
            userId: id,
            timestamp: Date.now()
          }));
          
          // Update user name in location store
          useLocationStore.getState().updateUserName(id, username);
          
          return true;
        } catch (error) {
          console.error("Signup error:", error);
          set({ authError: "Signup failed" });
          return false;
        }
      },
      
      // Log out current user
      logout: () => {
        localStorage.removeItem("user-session");
        set({ 
          activeProfileId: null,
          viewingProfileId: null,
          authError: null
        });
        
        // Reset location viewing state if needed
        const locationStore = useLocationStore.getState();
        if (locationStore.resetViewingState) {
          locationStore.resetViewingState();
        }
      },
      
      // Update profile name (for compatibility)
      updateProfileName: (id, name) => {
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id ? { ...profile, name } : profile,
          ),
        }));

        // Update the user name in the location store's map
        useLocationStore.getState().updateUserName(id, name);
      },
      
      // Update profile details
      updateProfileDetails: (id, details) => {
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id ? { ...profile, ...details } : profile,
          ),
        }));
        
        // Update username in location store if name changed
        if (details.name) {
          useLocationStore.getState().updateUserName(id, details.name);
        }
      },
      
      // Delete account
      deleteProfile: (id) => {
        set((state) => {
          // Filter out the profile to delete
          const updatedProfiles = state.profiles.filter(
            (profile) => profile.id !== id,
          );

          // If we're deleting the active profile, log out
          if (state.activeProfileId === id) {
            localStorage.removeItem("user-session");
          }

          // Reset viewing profile if the viewed profile is being deleted
          const newViewingProfileId = 
            state.viewingProfileId === id ? null : state.viewingProfileId;

          return {
            profiles: updatedProfiles,
            activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
            viewingProfileId: newViewingProfileId,
          };
        });
      },
      
      isNameUnique: (name, excludeId) => {
        const normalized = name.trim().toLowerCase();
        return !get().profiles.some(
          profile => profile.id !== excludeId && profile.name.trim().toLowerCase() === normalized
        );
      },
      
      // Reset data for testing
      resetData: () => {
        localStorage.removeItem("user-session");
        set({ profiles: [], activeProfileId: null, viewingProfileId: null });
      },
    }),
    {
      docId: "player-finder-users-auth", // Changed doc ID to avoid conflict with existing data
      initTimeout: 30000,
      onInitComplete: (store) => {
        // Check for existing session after data is loaded
        store.checkSession();
      },
      onInitError: (error) => {
        console.error("User sync initialization error:", error);
      }
    },
  ),
);
