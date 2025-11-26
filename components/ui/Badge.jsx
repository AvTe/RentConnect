import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-emerald-100 text-emerald-800",
    outline: "border border-emerald-200 text-emerald-700",
    secondary: "bg-gray-100 text-gray-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
