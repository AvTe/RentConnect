import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-[#FFE4C4] text-[#CC7400]",
    outline: "border border-[#FFD4A3] text-[#E58300]",
    secondary: "bg-gray-100 text-gray-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
