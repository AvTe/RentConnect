import React, { useState } from 'react';
import { Search, MapPin, Home, ChevronDown } from 'lucide-react';

export const SearchFilter = ({ onSearch }) => {
  const [activeTab, setActiveTab] = useState('Rent');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const handleSearch = () => {
    onSearch({ location, type, priceRange, mode: activeTab });
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-0 ml-4">
        {['Rent', 'Buy', 'Sell'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-t-2xl text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900'
                : 'bg-white/30 text-gray-600 hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Card */}
      <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-xl shadow-emerald-900/5 border border-white/50 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Location Input */}
          <div className="flex-1 w-full relative group px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location</label>
            <div className="flex items-center">
              <input
                type="text"
                className="w-full text-gray-900 font-bold text-lg placeholder-gray-300 outline-none bg-transparent"
                placeholder="Select Your City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <MapPin className="h-5 w-5 text-gray-400 ml-2" />
            </div>
          </div>

          {/* Property Type Select */}
          <div className="flex-1 w-full relative group px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Property Type</label>
            <div className="relative flex items-center">
              <select
                className="w-full text-gray-900 font-bold text-lg placeholder-gray-300 outline-none bg-transparent appearance-none cursor-pointer z-10"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Choose Type</option>
                <option value="1 Bedroom">1 Bedroom</option>
                <option value="2 Bedroom">2 Bedroom</option>
                <option value="3 Bedroom">3 Bedroom</option>
                <option value="Self Contain">Self Contain</option>
                <option value="Mini Flat">Mini Flat</option>
              </select>
              <ChevronDown className="h-5 w-5 text-gray-400 absolute right-0" />
            </div>
          </div>

          {/* Price Range Select */}
          <div className="flex-1 w-full relative group px-4 py-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price Range</label>
            <div className="relative flex items-center">
              <select
                className="w-full text-gray-900 font-bold text-lg placeholder-gray-300 outline-none bg-transparent appearance-none cursor-pointer z-10"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="">Choose Range</option>
                <option value="0-500k">0 - 500k</option>
                <option value="500k-1M">500k - 1M</option>
                <option value="1M-5M">1M - 5M</option>
                <option value="5M+">5M+</option>
              </select>
              <ChevronDown className="h-5 w-5 text-gray-400 absolute right-0" />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="bg-black hover:bg-gray-800 text-white p-5 rounded-2xl transition-all duration-200 shadow-lg active:scale-95 flex-shrink-0"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
