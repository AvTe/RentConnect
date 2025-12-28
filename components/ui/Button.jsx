import React from 'react';

/**
 * Button Component
 * Mobile Guidelines:
 * - Height: 44-52px (min-h-[44px] ensures touch target)
 * - Text: 14-16px (text-sm = 14px, text-base = 16px)
 * - Padding: 12-20px horizontal
 * - Border radius: 8-16px (rounded-lg = 8px, rounded-xl = 12px)
 */
export const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
  // Base styles with proper mobile touch targets
  const baseStyles = "font-medium transition-colors duration-200 flex items-center justify-center gap-2 rounded-xl";

  // Size variants following mobile guidelines
  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[36px]",           // Small buttons
    default: "px-4 py-2.5 text-sm min-h-[44px]",    // Standard - 44px touch target
    lg: "px-5 py-3 text-base min-h-[48px]",         // Large - 48px height
    xl: "px-6 py-3.5 text-base min-h-[52px]",       // Extra large - 52px height
  };

  const variants = {
    primary: "bg-[#FE9200] text-white hover:bg-[#E58300] active:bg-[#D47600]",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    outline: "border-2 border-[#FE9200] text-[#FE9200] hover:bg-[#FFF5E6] active:bg-[#FFE4C4]",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#20BD5A] active:bg-[#1DA851]",
    ghost: "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
