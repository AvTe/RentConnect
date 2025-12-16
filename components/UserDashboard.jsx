/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, FileText, History, Settings, LogOut,
  Plus, Search, Bell, Menu, X, Users
} from 'lucide-react';
import { Button } from './ui/Button';
import { UserProfile } from './UserProfile';
import { RatingPrompt } from './RatingPrompt';
import { getAllLeads } from '@/lib/database';

export const UserDashboard = ({ onNavigate, initialTab = 'dashboard', currentUser, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle responsive sidebar close
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  // Use currentUser if available, otherwise fallback
  const user = currentUser || {
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    phone: '+254 700 123 456',
    city: 'Nairobi',
    avatar: null
  };

  // Fetch requests when currentUser changes or on initial load
  useEffect(() => {
    const userId = currentUser?.uid || currentUser?.id;
    if (userId) {
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.id]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchMyRequests = async () => {
    const userId = currentUser?.uid || currentUser?.id;
    if (!userId) return;
    setLoadingRequests(true);
    try {
      // Fetch all leads for this tenant, including closed ones if needed
      const result = await getAllLeads({ tenantId: userId, status: 'all' });
      if (result.success) {
        setMyRequests(result.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSaveProfile = (updatedUser) => {
    onUpdateUser(updatedUser);
    setActiveTab('dashboard');
  };

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-gray-900' : 'text-gray-500'}`} />
      <span className="truncate">{label}</span>
    </button>
  );

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <UserProfile user={user} onSave={handleSaveProfile} onCancel={() => setActiveTab('dashboard')} />;
    }

    if (activeTab === 'requests') {
      return (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Requests</h2>
              <p className="text-gray-500 text-sm">Manage your property requests.</p>
            </div>
            <Button onClick={() => onNavigate('tenant-form')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE9200]"></div>
            </div>
          ) : myRequests.length > 0 ? (
            <div className="grid gap-3 md:gap-4">
              {myRequests.map(request => (
                <div key={request.id} className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-gray-900">{request.property_type || 'Property Request'}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                          {request.location || 'Location N/A'}
                        </span>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="text-sm text-gray-500">{request.budget ? `KSh ${parseInt(request.budget).toLocaleString()}` : 'Budget N/A'}</span>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      request.status === 'active' ? 'bg-[#FFE4C4] text-[#15803D]' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {request.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-2 text-sm text-gray-500">
                    <div className="flex gap-3 md:gap-4">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {request.views || 0} Views</span>
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {request.contacts || 0} Contacts</span>
                    </div>
                    <span className="text-xs sm:text-sm">Posted {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 px-4 bg-white rounded-xl border border-gray-200 border-dashed">
              <FileText className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900">No requests yet</h3>
              <p className="text-gray-500 mb-4 md:mb-6 text-sm">Post a request to let agents know what you&apos;re looking for.</p>
              <Button onClick={() => onNavigate('tenant-form')}>
                Post a Request
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Default Dashboard View
    return (
      <div className="space-y-6 md:space-y-8">
        {/* Rating Prompt - Show if there are agents to rate */}
        <RatingPrompt currentUser={currentUser} />
        
        {/* Stats - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{myRequests.length}</div>
            <div className="mt-1 text-xs text-gray-500">
              {myRequests.length === 0 ? 'No requests posted yet' : 'Active property requests'}
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm font-medium text-gray-500">Agent Contacts</h3>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {myRequests.reduce((sum, req) => sum + (req.contacts || 0), 0)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Agents who contacted you
            </div>
          </div>
        </div>

        {/* Recent Activity Placeholder - Mobile optimized */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
          <p className="text-gray-500 text-sm mb-4 md:mb-6">Your recent interactions and requests will appear here.</p>
          <Button onClick={() => onNavigate('tenant-form')}>
            Post a Request
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile slide-in, Desktop fixed */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 bg-[#F9FAFB] border-r border-gray-200
        flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-4">
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-end mb-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* App Switcher / Logo */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-gray-900">Yoombaa</span>
          </div>

          {/* Create Button */}
          <button
            onClick={() => { onNavigate('tenant-form'); setIsSidebarOpen(false); }}
            className="w-full bg-white border border-gray-200 shadow-sm hover:shadow text-gray-900 font-medium py-2.5 px-4 rounded-lg mb-6 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Request
          </button>

          {/* Navigation */}
          <div className="space-y-1">
            <SidebarItem icon={LayoutGrid} label="Home" id="dashboard" active={activeTab === 'dashboard'} />
            <SidebarItem icon={FileText} label="My Requests" id="requests" active={activeTab === 'requests'} />
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Account
            </h3>
            <div className="space-y-1">
              <SidebarItem icon={Settings} label="Profile Settings" id="profile" active={activeTab === 'profile'} />
              <button
                onClick={() => { onLogout(); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Snippet at Bottom */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#FFE4C4] flex items-center justify-center text-[#E58300] font-bold text-xs flex-shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                String(user.name || 'U').charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{String(user.name || 'User')}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Mobile optimized */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">Dashboard</span>
              <span className="hidden sm:inline">/</span>
              <span className="hidden sm:inline text-gray-900">
                {activeTab === 'dashboard' ? 'Overview' :
                 activeTab === 'requests' ? 'My Requests' :
                 activeTab === 'profile' ? 'Profile' : 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search or ask a question"
                className="pl-9 pr-12 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-all w-64 text-gray-900 placeholder-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-1.5 h-5 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded shadow-sm">⌘K</kbd>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area - Mobile optimized padding */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

