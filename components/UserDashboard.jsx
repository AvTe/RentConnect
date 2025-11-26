import React, { useState } from 'react';
import { User, Clock, Heart, MessageSquare, Phone, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { UserProfile } from './UserProfile';

// Mock Data
const MOCK_HISTORY = [
  { id: 1, property: "Sunny 2BHK Apartment", agent: "Lagos Homes", date: "2 hours ago", mode: "WhatsApp", type: "inquiry" },
  { id: 2, property: "Luxury Villa in Lekki", agent: "Premium Estates", date: "Yesterday", mode: "Call", type: "call" },
  { id: 3, property: "Studio in Yaba", agent: "City Rentals", date: "24 Nov", mode: "Form", type: "submission" },
];

export const UserDashboard = ({ onNavigate, initialTab = 'dashboard', currentUser, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // dashboard, profile, saved
  
  // Use currentUser if available, otherwise fallback to default (shouldn't happen in real app)
  const user = currentUser || {
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    phone: '+234 801 234 5678',
    city: 'Lagos'
  };

  const handleSaveProfile = (updatedUser) => {
    onUpdateUser(updatedUser);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <UserProfile user={user} onSave={handleSaveProfile} onCancel={() => setActiveTab('dashboard')} />;
    }

    return (
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Saved Properties</p>
                <h3 className="text-2xl font-bold text-gray-900">12</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Messages</p>
                <h3 className="text-2xl font-bold text-gray-900">5</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Recent Activity</p>
                <h3 className="text-2xl font-bold text-gray-900">3</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Contact History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Contact History</h3>
            <Button variant="ghost" className="text-sm">View All</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_HISTORY.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    item.mode === 'WhatsApp' ? 'bg-green-100 text-green-600' :
                    item.mode === 'Call' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.mode === 'WhatsApp' ? <MessageSquare className="w-5 h-5" /> :
                     item.mode === 'Call' ? <Phone className="w-5 h-5" /> :
                     <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.property}</h4>
                    <p className="text-sm text-gray-500">Contacted {item.agent} via {item.mode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-500">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold mb-3">
                  {user.name.charAt(0)}
                </div>
                <h2 className="font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.city}</p>
              </div>
              
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Clock className="w-5 h-5" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <User className="w-5 h-5" />
                  My Profile
                </button>
                <button 
                  onClick={() => setActiveTab('saved')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'saved' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Heart className="w-5 h-5" />
                  Saved Properties
                </button>
              </nav>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <Button variant="outline" className="w-full" onClick={onLogout}>
                  Log Out
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'profile' ? 'My Profile' : 'Saved Properties'}
              </h1>
              <p className="text-gray-500">Welcome back, {user.name}</p>
            </div>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};
