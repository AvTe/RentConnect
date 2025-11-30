import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#FE9200] text-white hover:bg-[#E58300]",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border-2 border-[#FE9200] text-[#FE9200] hover:bg-[#FFF5E6]",
    whatsapp: "bg-[#FE9200] text-white hover:bg-[#16A34A]",
    ghost: "text-gray-600 hover:bg-gray-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
