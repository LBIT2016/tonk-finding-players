import React, { useState, useEffect } from 'react';
import { Community, CommunityVisibility } from '../types/community';
import { useCommunityStore } from '../stores/communityStore';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ isOpen, onClose }) => {
  const { addCommunity } = useCommunityStore();
  const [formData, setFormData] = useState<Partial<Community>>({
    name: '',
    description: '',
    game: '',
    roles: [],
    location: { lat: 0, lng: 0 },
    visibility: 'public' as CommunityVisibility,
    contactInfo: {}
  });
  
  // Auto-detect location on mount if the form is open
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
      });
    }
  }, [isOpen]);
  
  const handleInputChange = (field: keyof Community, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleLocationChange = (field: 'lat' | 'lng', value: number) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields, then add the new community.
    if (!formData.name || !formData.game) {
      alert('Please fill in the required fields.');
      return;
    }
    
    // Create a new community ID and timestamps as needed.
    const newCommunity: Community = {
      id: String(Date.now()),
      name: formData.name!,
      description: formData.description || '',
      game: formData.game!,
      location: formData.location!,
      roles: formData.roles || [],
      visibility: formData.visibility as CommunityVisibility,
      contactInfo: formData.contactInfo || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: 0,
      upcomingEvents: []
    };
    
    addCommunity(newCommunity);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Create New Community</h2>
        
        {/* Group Name */}
        <input
          type="text"
          placeholder="Group Name"
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        
        {/* Description */}
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        
        {/* Game Details */}
        <input
          type="text"
          placeholder="Game (e.g., League of Legends)"
          value={formData.game}
          onChange={e => handleInputChange('game', e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        
        {/* Location */}
        <div className="mb-4">
          <label className="block mb-2">Location</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Latitude"
              value={formData.location?.lat || ''}
              onChange={e => handleLocationChange('lat', parseFloat(e.target.value))}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={formData.location?.lng || ''}
              onChange={e => handleLocationChange('lng', parseFloat(e.target.value))}
              className="w-1/2 p-2 border rounded"
            />
          </div>
          {/* Optionally, add a button to re-detect location */}
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    }
                  }));
                });
              }
            }}
            className="mt-2 text-blue-500 underline text-sm"
          >
            Auto-detect Location
          </button>
        </div>
        
        {/* Role Specific Requirements */}
        <input
          type="text"
          placeholder="Role Requirements (comma-separated)"
          value={formData.roles && formData.roles.length > 0 ? formData.roles.map(r => r.name).join(', ') : ''}
          onChange={e => {
            const roles = e.target.value.split(',').map(role => ({ id: role.trim(), name: role.trim(), available: true }));
            setFormData(prev => ({ ...prev, roles }));
          }}
          className="w-full mb-4 p-2 border rounded"
        />
        
        {/* Visibility Options */}
        <div className="mb-4">
          <label className="block mb-2">Visibility</label>
          <div className="flex gap-4">
            {(['public', 'private', 'invite-only'] as CommunityVisibility[]).map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value={option}
                  checked={formData.visibility === option}
                  onChange={() => handleInputChange('visibility', option)}
                  className="mr-1"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        
        {/* Contact info and other optional fields can be added here */}
        
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Create Community
          </button>
        </div>
      </form>
    </div>
  );
};
