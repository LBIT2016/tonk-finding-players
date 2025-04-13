import React, { useState, useEffect } from 'react';
import { useUserStore } from "../stores";
import { Trash2, ShieldAlert } from 'lucide-react';

const ResetDataButton: React.FC = () => {
  const { resetData, isCurrentUserAdmin, profiles, activeProfileId } = useUserStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // More reliable admin check using useEffect
  useEffect(() => {
    // Direct check for admin status
    const isAdminUser = isCurrentUserAdmin();
    
    // Alternative check in case the function fails
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const isAdminByName = activeProfile?.name?.toLowerCase() === 'admin';
    const isAdminByFlag = activeProfile?.isAdmin === true;
    
    // Log for debugging
    console.log("Admin status check:", { 
      isAdminUser, 
      isAdminByName, 
      isAdminByFlag,
      activeId: activeProfileId,
      profileName: activeProfile?.name
    });
    
    setIsAdmin(isAdminUser || isAdminByName || isAdminByFlag);
  }, [activeProfileId, profiles, isCurrentUserAdmin]);
  
  // Return nothing if not admin
  if (!isAdmin) {
    return null;
  }
  
  const handleReset = () => {
    if (showConfirm) {
      resetData();
      setShowConfirm(false);
      // Force reload the page to ensure clean state
      window.location.reload();
    } else {
      setShowConfirm(true);
    }
  };
  
  return (
    <div className="mb-4 p-3 bg-red-50 rounded-md border border-red-200">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="h-4 w-4 text-red-600" />
        <span className="text-xs font-medium text-red-600">ADMIN CONTROLS</span>
      </div>
      
      {showConfirm ? (
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">
            This will delete all profiles and reset the app. Are you sure?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Confirm Reset
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleReset}
          className="w-full px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm flex items-center justify-center gap-1"
        >
          <Trash2 className="h-3 w-3" /> Reset All Data
        </button>
      )}
    </div>
  );
};

export default ResetDataButton;
