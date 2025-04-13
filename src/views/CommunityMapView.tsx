import React, { useState, useEffect } from 'react';
import { Map } from '../components/Map'; // Assumes a Map component that supports clustering
import { useCommunityStore } from '../stores/communityStore';
import { CommunityFilters } from '../components/CommunityFilters';
import { CommunityDetails } from '../components/CommunityDetails';
import { CreateCommunityModal } from '../components/CreateCommunityModal';

export const CommunityMapView: React.FC = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'Player' | 'GM' | 'Both'>('Both');
  const [randomCommunities, setRandomCommunities] = useState([]);
  const { filteredCommunities } = useCommunityStore();

  useEffect(() => {
    // Simulate fetching random communities based on role filter
    const fetchRandomCommunities = () => {
      const allCommunities = [
        { id: '1', name: 'Player Community 1', roles: ['Player'] },
        { id: '2', name: 'GM Community 1', roles: ['GM'] },
        { id: '3', name: 'Mixed Community', roles: ['Player', 'GM'] },
      ];

      if (roleFilter === 'Both') {
        setRandomCommunities(allCommunities);
      } else {
        setRandomCommunities(
          allCommunities.filter((community) => community.roles.includes(roleFilter))
        );
      }
    };

    fetchRandomCommunities();
  }, [roleFilter]);

  useEffect(() => {
    // Simulate fetching random communities with 'Player' or 'GM' categories
    const generateRandomCommunities = () => {
      const randomCommunities = Array.from({ length: 10 }, (_, index) => {
        const isPlayer = Math.random() > 0.5;
        return {
          id: `community-${index + 1}`,
          name: `${isPlayer ? 'Player' : 'GM'} Community ${index + 1}`,
          category: isPlayer ? 'Player' : 'GM',
          location: {
            lat: Math.random() * 180 - 90, // Random latitude
            lng: Math.random() * 360 - 180, // Random longitude
          },
        };
      });
      setRandomCommunities(randomCommunities);
    };

    generateRandomCommunities();
  }, []);

  const dndOptions = ["GM", "Player", "DnD"]; // Define DnD-related tags

  const filteredPins = randomCommunities.filter((community) =>
    community.tags.some((tag) => dndOptions.includes(tag))
  );

  // If no communities match current filters, show CTA button
  const showCTA = filteredCommunities.length === 0;

  return (
    <div className="h-screen w-full relative">
      {/* Filters component (positioned at top-left for example) */}
      <CommunityFilters className="absolute top-4 left-4 z-10" />

      {/* Role filter buttons */}
      <div className="absolute top-16 left-4 z-10 flex gap-2">
        <button
          onClick={() => setRoleFilter('Player')}
          className={`px-4 py-2 rounded ${roleFilter === 'Player' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Player
        </button>
        <button
          onClick={() => setRoleFilter('GM')}
          className={`px-4 py-2 rounded ${roleFilter === 'GM' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          GM
        </button>
        <button
          onClick={() => setRoleFilter('Both')}
          className={`px-4 py-2 rounded ${roleFilter === 'Both' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Both
        </button>
      </div>

      {/* Map component that renders filtered pins */}
      <Map
        pins={filteredPins.map((community) => ({
          id: community.id,
          lat: Math.random() * 180 - 90, // Random latitude
          lng: Math.random() * 360 - 180, // Random longitude
          data: community,
        }))}
        onPinClick={(id) => setSelectedCommunityId(id)}
        clustering={true}
      />

      {/* Community details overlay, shown when a pin is clicked */}
      {selectedCommunityId && (
        <CommunityDetails
          communityId={selectedCommunityId}
          onClose={() => setSelectedCommunityId(null)}
          className="absolute bottom-4 left-4 z-10"
        />
      )}

      {/* CTA for new community when no communities exist for current filters */}
      {showCTA && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-3 rounded shadow-lg"
        >
          Create New Community
        </button>
      )}

      {/* Modal for creating community */}
      <CreateCommunityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
