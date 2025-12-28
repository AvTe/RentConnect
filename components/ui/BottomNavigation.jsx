'use client';
import React from 'react';

/**
 * Mobile Bottom Navigation Bar
 * Minimal pill-style navigation with active label badge
 */
export const BottomNavigation = ({
  items = [],
  activeId,
  onNavigate,
  className = ''
}) => {
  if (items.length === 0) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center ${className}`}>
      {/* Centered dark pill container */}
      <div className="bg-gray-900 backdrop-blur-lg mb-4 rounded-full shadow-xl px-2 py-2 flex items-center gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center gap-1.5 rounded-full
                transition-all duration-200 ease-out
                ${isActive
                  ? 'bg-white text-gray-900 px-3 py-1.5'
                  : 'text-gray-400 hover:text-gray-300 p-2'
                }
              `}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {/* Label only visible when active */}
              {isActive && (
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Get navigation items based on user role
 */
export const getNavItemsForRole = (role, icons) => {
  const { 
    LayoutGrid, Home, Share2, Settings, User, FileText, 
    Search, Users, History 
  } = icons;

  if (role === 'agent') {
    return [
      { id: 'leads', label: 'Leads', icon: LayoutGrid },
      { id: 'properties', label: 'Properties', icon: Home },
      { id: 'referrals', label: 'Refer', icon: Share2 },
      { id: 'profile', label: 'Profile', icon: User },
    ];
  }

  if (role === 'tenant') {
    return [
      { id: 'dashboard', label: 'Home', icon: LayoutGrid },
      { id: 'requests', label: 'Requests', icon: FileText },
      { id: 'profile', label: 'Profile', icon: User },
    ];
  }

  // Default / fallback
  return [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'profile', label: 'Profile', icon: User },
  ];
};

export default BottomNavigation;

