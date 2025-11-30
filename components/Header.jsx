/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { User, LogOut, LayoutDashboard, Settings, ChevronDown, Menu, X } from 'lucide-react';

export const Header = ({ onNavigate, currentUser, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (view) => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    onLogout();
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => handleNavigate('landing')}
          >
            <img src="/yoombaa-logo.png" alt="Yoombaa" className="h-8 sm:h-10 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => handleNavigate('landing')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Home</button>
            <button onClick={() => handleNavigate('properties')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Properties</button>
            <button onClick={() => handleNavigate('agents-listing')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Agents</button>
            
            {currentUser ? (
              <div className="relative ml-4" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-semibold">
                    {currentUser.avatar || (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-black">
                    {currentUser.name || 'User'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Account</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{currentUser.email}</p>
                    </div>
                    
                    <button
                      onClick={() => handleNavigate(currentUser.type === 'agent' ? 'agent-dashboard' : 'user-dashboard')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                    
                    <button
                      onClick={() => handleNavigate('profile')} // Assuming a generic profile route or handle in parent
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    
                    <button
                      onClick={() => handleNavigate('settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleNavigate('login')}
                  className="bg-[#FE9200] text-white rounded-full px-8 py-2 text-sm font-medium hover:bg-[#E58300] transition-all shadow-sm hover:shadow-md"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 shadow-lg absolute w-full left-0 top-20">
          <div className="flex flex-col space-y-2 mb-4">
             <button onClick={() => handleNavigate('landing')} className="text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#FE9200] hover:bg-orange-50 rounded-lg transition-colors">Home</button>
             <button onClick={() => handleNavigate('properties')} className="text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#FE9200] hover:bg-orange-50 rounded-lg transition-colors">Properties</button>
             <button onClick={() => handleNavigate('agents-listing')} className="text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#FE9200] hover:bg-orange-50 rounded-lg transition-colors">Agents</button>
          </div>

          {currentUser ? (
            <div className="space-y-1 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE9200] to-[#7A00AA] flex items-center justify-center text-white font-semibold">
                  {currentUser.avatar || (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{currentUser.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleNavigate(currentUser.type === 'agent' ? 'agent-dashboard' : 'user-dashboard')}
                className="w-full justify-start hover:bg-orange-50 hover:text-[#FE9200]"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigate('profile')}
                className="w-full justify-start hover:bg-orange-50 hover:text-[#FE9200]"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="w-full flex justify-center py-2 rounded-full bg-[#FE9200] text-white text-sm font-medium hover:bg-[#E58300] transition-all shadow-sm"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
