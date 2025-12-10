import React from 'react';

/**
 * Reusable sidebar navigation item component for dashboards
 * Used in UserDashboard, AgentDashboard, AdminDashboard
 */
export const SidebarNavItem = ({ 
  icon: Icon, 
  label, 
  id, 
  active, 
  onClick,
  className = '',
  variant = 'default' // 'default' | 'danger'
}) => {
  const baseClasses = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all";
  
  const variantClasses = {
    default: active 
      ? 'bg-white text-gray-900 shadow-sm' 
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50',
    danger: 'text-red-600 hover:bg-red-50'
  };

  return (
    <button
      onClick={() => onClick?.(id)}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon className={`w-4 h-4 ${active ? 'text-gray-900' : variant === 'danger' ? 'text-red-600' : 'text-gray-500'}`} />}
      <span className="truncate">{label}</span>
    </button>
  );
};

/**
 * User profile snippet for sidebar footer
 */
export const SidebarUserProfile = ({ user, compact = false }) => {
  const name = String(user?.name || 'User');
  const email = user?.email || '';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`flex items-center gap-3 ${compact ? 'px-1' : 'px-2'}`}>
      <div className="w-8 h-8 rounded-full bg-[#FFE4C4] flex items-center justify-center text-[#E58300] font-bold text-xs flex-shrink-0">
        {initial}
      </div>
      {!compact && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Logo component for sidebar header
 */
export const SidebarLogo = ({ name = 'Yoombaa', initial = 'R' }) => (
  <div className="flex items-center gap-3 px-2">
    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">
      {initial}
    </div>
    <span className="font-bold text-gray-900">{name}</span>
  </div>
);

/**
 * Section header for sidebar navigation groups
 */
export const SidebarSection = ({ title, children, className = '' }) => (
  <div className={className}>
    {title && (
      <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
    )}
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

/**
 * Mobile-friendly card component for displaying stats and info
 */
export const ResponsiveCard = ({ 
  children, 
  className = '',
  padding = 'default' // 'default' | 'compact' | 'none'
}) => {
  const paddingClasses = {
    default: 'p-4 md:p-6',
    compact: 'p-3 md:p-4',
    none: ''
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive grid wrapper for dashboard stats and cards
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 'default',
  className = ''
}) => {
  const gapClasses = {
    default: 'gap-4 md:gap-6',
    compact: 'gap-3 md:gap-4',
    wide: 'gap-6 md:gap-8'
  };

  const gridCols = `grid-cols-${cols.default} sm:grid-cols-${cols.sm || cols.default} md:grid-cols-${cols.md || cols.sm || cols.default} lg:grid-cols-${cols.lg || cols.md || cols.sm || cols.default}`;

  return (
    <div className={`grid ${gridCols} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

