/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, FileText, Heart, History, Users, Settings, LogOut, 
  Plus, Search, ChevronDown, MoreHorizontal, Filter, Bell
} from 'lucide-react';
import { Button } from './ui/Button';
import { UserProfile } from './UserProfile';
import { getAllAgents } from '@/lib/firestore';

export const UserDashboard = ({ onNavigate, initialTab = 'dashboard', currentUser, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use currentUser if available, otherwise fallback
  const user = currentUser || {
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    phone: '+234 801 234 5678',
    city: 'Lagos',
    avatar: null
  };

  useEffect(() => {
    if (activeTab === 'agents') {
      fetchAgents();
    }
  }, [activeTab]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const result = await getAllAgents();
      if (result.success) {
        setAgents(result.data);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSaveProfile = (updatedUser) => {
    onUpdateUser(updatedUser);
    setActiveTab('dashboard');
  };

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-gray-900' : 'text-gray-500'}`} />
      {label}
    </button>
  );

  const renderAgentsTable = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Agent Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Agency</th>
              <th className="px-6 py-3 font-medium text-gray-500">Location</th>
              <th className="px-6 py-3 font-medium text-gray-500">Experience</th>
              <th className="px-6 py-3 font-medium text-gray-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loadingAgents ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : agents.length > 0 ? (
              agents.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        {agent.photoURL ? (
                          <img src={agent.photoURL} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          agent.name?.charAt(0) || 'A'
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{agent.agencyName || 'Independent'}</td>
                  <td className="px-6 py-4 text-gray-600">{agent.location || 'Lagos, Nigeria'}</td>
                  <td className="px-6 py-4 text-gray-600">{agent.experience || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onNavigate('agents-listing')} // Or specific agent profile if implemented
                      className="text-gray-400 hover:text-emerald-600 font-medium text-xs border border-gray-200 hover:border-emerald-600 px-3 py-1.5 rounded-md transition-all"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No agents found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <UserProfile user={user} onSave={handleSaveProfile} onCancel={() => setActiveTab('dashboard')} />;
    }

    if (activeTab === 'agents') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Agents</h2>
              <p className="text-gray-500 text-sm">A list of all verified agents on RentConnect.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search agents..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
          {renderAgentsTable()}
        </div>
      );
    }

    // Default Dashboard View
    return (
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="mt-1 text-xs text-green-600 flex items-center">
              <span className="font-medium">+0%</span>
              <span className="text-gray-400 ml-1">from last month</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Saved Properties</h3>
              <Heart className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="mt-1 text-xs text-gray-500">
              No properties saved yet
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Contacted Agents</h3>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="mt-1 text-xs text-gray-500">
              Start connecting today
            </div>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
          <p className="text-gray-500 text-sm mb-6">Your recent interactions and requests will appear here.</p>
          <Button onClick={() => onNavigate('tenant-form')}>
            Post a Request
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F9FAFB] border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4">
          {/* App Switcher / Logo */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-gray-900">RentConnect</span>
          </div>

          {/* Create Button */}
          <button 
            onClick={() => onNavigate('tenant-form')}
            className="w-full bg-white border border-gray-200 shadow-sm hover:shadow text-gray-900 font-medium py-2 px-4 rounded-lg mb-6 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Request
          </button>

          {/* Navigation */}
          <div className="space-y-1">
            <SidebarItem icon={LayoutGrid} label="Home" id="dashboard" active={activeTab === 'dashboard'} />
            <SidebarItem icon={FileText} label="My Requests" id="requests" active={activeTab === 'requests'} />
            <SidebarItem icon={Heart} label="Saved Properties" id="saved" active={activeTab === 'saved'} />
            <SidebarItem icon={Users} label="All Agents" id="agents" active={activeTab === 'agents'} />
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Account
            </h3>
            <div className="space-y-1">
              <SidebarItem icon={Settings} label="Profile Settings" id="profile" active={activeTab === 'profile'} />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
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
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">Dashboard</span>
            <span>/</span>
            <span className="text-gray-900">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'agents' ? 'Agents' : 
               activeTab === 'profile' ? 'Profile' : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search or ask a question" 
                className="pl-9 pr-12 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-all w-64"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-1.5 h-5 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded shadow-sm">⌘K</kbd>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

