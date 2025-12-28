'use client';
import React from 'react';

/**
 * Mobile Bottom Navigation Bar
 * Modern rounded UI with icon-based navigation and clear active state
 */
export const BottomNavigation = ({ 
  items = [], 
  activeId,
  onNavigate,
  className = ''
}) => {
  if (items.length === 0) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${className}`}>
      {/* Background with blur and shadow */}
      <div className="bg-gray-900/95 backdrop-blur-lg mx-3 mb-3 rounded-2xl shadow-2xl border border-gray-700/50">
        <div className="flex items-center justify-around px-2 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[60px] py-2 px-3 rounded-xl
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FE9200] rounded-full" />
                )}
                
                {/* Icon container */}
                <div className={`
                  flex items-center justify-center
                  w-10 h-10 rounded-full mb-0.5
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#FE9200] text-white shadow-lg shadow-[#FE9200]/30' 
                    : 'text-gray-400'
                  }
                `}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {/* Label */}
                <span className={`
                  text-[10px] font-medium
                  transition-colors duration-200
                  ${isActive ? 'text-white' : 'text-gray-500'}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
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

