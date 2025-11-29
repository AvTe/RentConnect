/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

export const LandingPage = ({ onNavigate, onSearch, currentUser }) => {
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');

  const handleSearch = () => {
    onSearch({ location, pincode });
  };

  return (
    <div className="h-screen w-screen bg-white font-sans overflow-hidden relative flex flex-col">
      
      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-6">
        <div className="max-w-7xl mx-auto bg-white rounded-full shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className="text-gray-900">Rent-</span>
            <span className="text-[#8B5CF6]">Connect</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('profile')}>
                <span className="text-gray-700 font-medium">Hi 👋 {(currentUser.name || 'User').split(' ')[0]}</span>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center text-white font-bold">
                      {(currentUser.name || 'U').charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('tenant-form')}
                  className="hidden md:block px-6 py-2.5 rounded-full bg-white border border-[#8B5CF6] text-[#8B5CF6] font-medium hover:bg-purple-50 transition-all"
                >
                  I Need a place to rent
                </button>
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-6 py-2.5 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-all shadow-lg shadow-purple-200"
                >
                  I am an Agent
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        
        {/* Background Circles/Gradient */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-[500px] h-[500px] bg-emerald-50/80 rounded-full blur-3xl absolute -top-20"></div>
           <div className="w-[800px] h-[800px] border border-emerald-50 rounded-full absolute"></div>
           <div className="w-[1100px] h-[1100px] border border-emerald-50 rounded-full absolute"></div>
           <div className="w-[1400px] h-[1400px] border border-emerald-50 rounded-full absolute"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 mt-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-4 tracking-tight leading-tight">
            Find Your Perfect Home.
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-16 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6]">Without the Hassle</span>
          </h2>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-2 relative z-20">
            
            {/* Location Input */}
            <div className="flex-1 w-full flex items-center px-6 py-3 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="bg-emerald-100/50 p-2 rounded-full mr-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                id="location-input"
                type="text"
                placeholder="Search Location"
                className="w-full outline-none text-gray-900 placeholder-gray-400 bg-transparent text-lg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Pincode Input */}
            <div className="flex-1 w-full flex items-center px-6 py-3">
              <input
                type="text"
                placeholder="Search By Pincode..."
                className="w-full outline-none text-gray-900 placeholder-gray-400 bg-transparent text-lg"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>

            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="w-full md:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-10 py-4 rounded-full font-medium transition-all duration-200 shadow-lg shadow-purple-200 text-lg"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

