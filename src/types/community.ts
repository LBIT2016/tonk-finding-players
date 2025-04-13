export type CommunityVisibility = 'public' | 'private' | 'invite-only';

export interface CommunityRole {
  id: string;
  name: string;
  requirements?: string;
  available: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  game: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  roles: CommunityRole[];
  visibility: CommunityVisibility;
  rating?: number;
  contactInfo: {
    email?: string;
    discord?: string;
    website?: string;
  };
  upcomingEvents?: Event[];
  createdAt: Date;
  updatedAt: Date;
}
