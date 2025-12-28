'use client';
import React from 'react';

/**
 * Mobile Bottom Navigation Bar
 * Height: 56-64px (within 60-72px guideline)
 * Icons: 20px (within 18-24px guideline)
 * Touch targets: 44px min
 * Nav labels: 11px (within 10-12px guideline)
 */
export const BottomNavigation = ({
  items = [],
  activeId,
  onNavigate,
  className = ''
}) => {
  if (items.length === 0) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center pb-safe ${className}`}>
      {/* Centered dark pill container - height ~56px */}
      <div className="bg-gray-900 backdrop-blur-lg mb-3 rounded-full shadow-xl px-3 py-2 flex items-center gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center justify-center gap-2 rounded-full
                transition-all duration-200 ease-out
                min-h-[44px] min-w-[44px]
                ${isActive
                  ? 'bg-white text-gray-900 px-4 py-2'
                  : 'text-gray-400 hover:text-gray-300 px-3 py-2'
                }
              `}
            >
              {/* Icons: 20px per guidelines */}
              <Icon className="w-5 h-5" strokeWidth={2} />
              {/* Label only visible when active - 11px */}
              {isActive && (
                <span className="text-[11px] font-medium leading-none">
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

