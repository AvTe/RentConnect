import React, { useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, Lock, Home, User, LayoutDashboard, Plus, Edit, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { AgentProfile } from './AgentProfile';

// Mock Properties Data
const MOCK_PROPERTIES = [
  { id: 1, name: "Luxury 3 Bedroom Apartment", price: "KSh 3,500,000/yr", status: "Active", location: "Lekki Phase 1" },
  { id: 2, name: "Cozy Studio Flat", price: "KSh 800,000/yr", status: "Pending", location: "Yaba" },
  { id: 3, name: "4 Bedroom Duplex", price: "KSh 8,000,000/yr", status: "Sold", location: "Ikoyi" },
];

export const AgentDashboard = ({ onNavigate, leads, isPremium, onUnlock, initialTab = 'leads', currentUser, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // leads, properties, profile
  
  const agent = currentUser || {
    name: 'John Doe',
    agencyName: 'Lagos Premier Homes',
    email: 'john@lagoshomes.com',
    phone: '+234 809 876 5432',
    experience: '5 Years',
    location: 'Lekki, Lagos'
  };

  const handleSaveProfile = (updatedAgent) => {
    onUpdateUser(updatedAgent);
    setActiveTab('leads');
  };

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <AgentProfile agent={agent} onSave={handleSaveProfile} onCancel={() => setActiveTab('leads')} />;
    }

    if (activeTab === 'properties') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">My Properties</h2>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Property
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_PROPERTIES.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute top-4 right-4">
                    <Badge className={
                      property.status === 'Active' ? 'bg-green-100 text-green-800' :
                      property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {property.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{property.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{property.location}</p>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-emerald-600">{property.price}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex items-center justify-center gap-2">
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                    <Button variant="ghost" className="flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Leads Tab (Default)
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{lead.type}</h3>
                  <p className="text-gray-500 text-sm">{lead.location}</p>
                </div>
                <Badge>{lead.budget}</Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                  {lead.name.charAt(0)}
                </div>
                <span className="text-gray-700 font-medium">{lead.name}</span>
              </div>

              {isPremium ? (
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`tel:${lead.whatsapp}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <a 
                    href={`https://wa.me/${lead.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </a>
                </div>
              ) : (
                <Button 
                  onClick={onUnlock}
                  variant="outline" 
                  className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-500"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Contact Info
                </Button>
              )}
            </div>
          </div>
        ))}
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
                  {agent.name.charAt(0)}
                </div>
                <h2 className="font-bold text-gray-900">{agent.name}</h2>
                <p className="text-sm text-gray-500">{agent.agencyName}</p>
                {isPremium && (
                  <Badge variant="default" className="mt-2 bg-emerald-100 text-emerald-800">
                    Premium Agent
                  </Badge>
                )}
              </div>
              
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('leads')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'leads' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Leads Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('properties')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'properties' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Home className="w-5 h-5" />
                  My Properties
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <User className="w-5 h-5" />
                  My Profile
                </button>
              </nav>

              <div className="mt-8 pt-8 border-t border-gray-100">
                {!isPremium && (
                  <Button onClick={onUnlock} className="w-full mb-4">
                    Upgrade to Premium
                  </Button>
                )}
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
                {activeTab === 'leads' ? 'Leads Dashboard' : 
                 activeTab === 'properties' ? 'My Properties' : 'Agent Profile'}
              </h1>
              <p className="text-gray-500">Manage your leads and listings</p>
            </div>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};
