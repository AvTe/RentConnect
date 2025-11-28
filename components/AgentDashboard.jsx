import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Home, User, Settings, LogOut, Plus, Search, 
  Bell, Phone, MessageCircle, Lock, Edit, Eye, Filter, Inbox, Image as ImageIcon, Crown, Coins, ShieldCheck, ShieldAlert, Share2, Copy
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { AgentProfile } from './AgentProfile';
import { getWalletBalance, deductCredits, unlockLead, getUnlockedLeads } from '@/lib/firestore';
import { SmileIDVerification } from './SmileIDVerification';

// Mock Properties Data
const MOCK_PROPERTIES = [
  { id: 1, name: "Luxury 3 Bedroom Apartment", price: "₦ 3,500,000/yr", status: "Active", location: "Lekki Phase 1" },
  { id: 2, name: "Cozy Studio Flat", price: "₦ 800,000/yr", status: "Pending", location: "Yaba" },
  { id: 3, name: "4 Bedroom Duplex", price: "₦ 8,000,000/yr", status: "Sold", location: "Ikoyi" },
];

export const AgentDashboard = ({ onNavigate, leads, onUnlock, initialTab = 'leads', currentUser, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // leads, properties, profile, referrals
  const [walletBalance, setWalletBalance] = useState(0);
  const [unlockedLeads, setUnlockedLeads] = useState([]);
  const [referralCode, setReferralCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  
  const isVerified = currentUser?.verificationStatus === 'verified';
  const isPending = currentUser?.verificationStatus === 'pending';

  const agent = currentUser || {
    id: 'mock-agent-id',
    name: 'John Doe',
    agencyName: 'Lagos Premier Homes',
    email: 'john@lagoshomes.com',
    phone: '+234 809 876 5432',
    experience: '5 Years',
    location: 'Lekki, Lagos',
    referralCode: 'JOH1234'
  };

  useEffect(() => {
    const fetchBalance = async () => {
      const result = await getWalletBalance(currentUser.id);
      if (result.success) {
        setWalletBalance(result.balance);
      }
    };

    const fetchUnlockedLeads = async () => {
      const result = await getUnlockedLeads(currentUser.id);
      if (result.success) {
        setUnlockedLeads(result.data);
      }
    };

    if (currentUser?.id) {
      fetchBalance();
      fetchUnlockedLeads();
      if (currentUser.referralCode) {
        setReferralCode(currentUser.referralCode);
      }
    }
  }, [currentUser]);

  const handleUnlockLead = async (lead) => {
    if (!isVerified) {
      alert("Your account is pending verification. You cannot unlock leads yet.");
      return;
    }

    const LEAD_COST = 1; // 1 credit per lead
    
    if (walletBalance >= LEAD_COST) {
      if (currentUser?.id) {
        const result = await unlockLead(currentUser.id, lead.id);
        if (result.success) {
          setWalletBalance(prev => prev - LEAD_COST); // Optimistic update
          setUnlockedLeads([...unlockedLeads, lead.id]);
          if (onUnlock) onUnlock(lead);
          
          // Refresh balance to be sure
          const balanceResult = await getWalletBalance(currentUser.id);
          if (balanceResult.success) setWalletBalance(balanceResult.balance);
        } else {
          alert("Failed to unlock lead: " + result.error);
        }
      } else {
        // Mock mode
        setWalletBalance(prev => prev - LEAD_COST);
        setUnlockedLeads([...unlockedLeads, lead.id]);
        if (onUnlock) onUnlock(lead);
      }
    } else {
      // Redirect to buy credits
      onNavigate('subscription'); // We'll reuse this route for the Credit Bundle page
    }
  };

  const isLeadUnlocked = (leadId) => unlockedLeads.includes(leadId);

  const handleSaveProfile = (updatedAgent) => {
    onUpdateUser(updatedAgent);
    setActiveTab('leads');
  };

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
      {label}
    </button>
  );

  const renderContent = () => {
    if (activeTab === 'referrals') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Invite Agents, Get Free Credits</h2>
              <p className="text-emerald-100 text-lg mb-8">
                Share your referral code with other agents. When they sign up, you both get 5 free credits!
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-emerald-200 mb-1">Your Referral Code</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">{referralCode || 'GEN123'}</p>
                </div>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode || 'GEN123');
                    alert('Code copied to clipboard!');
                  }}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 border-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
                <Button 
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">How it works</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <Share2 className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2">1. Share Code</h4>
                <p className="text-sm text-gray-500">Send your unique code to fellow real estate agents.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2">2. They Sign Up</h4>
                <p className="text-sm text-gray-500">They enter your code during their registration process.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2">3. Earn Credits</h4>
                <p className="text-sm text-gray-500">You get 5 credits instantly. They get a welcome bonus too!</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'profile') {
      return <AgentProfile agent={agent} onSave={handleSaveProfile} onCancel={() => setActiveTab('leads')} />;
    }

    if (activeTab === 'properties') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
              <p className="text-gray-500 text-sm">Manage your property listings</p>
            </div>
            <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
              Add New Property
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_PROPERTIES.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 bg-gray-100 relative flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                  <div className="absolute top-4 right-4">
                    <Badge className={
                      property.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                      property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {property.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{property.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{property.location}</p>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-emerald-600 text-lg">{property.price}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="flex items-center justify-center gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center gap-2 text-xs h-9">
                      <Eye className="w-3 h-3" /> View
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leads Dashboard</h2>
            <p className="text-gray-500 text-sm">Potential tenants matching your criteria</p>
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leads.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No leads found yet</h3>
              <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                Once potential tenants match your criteria, they will appear here.
              </p>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Update Criteria
              </Button>
            </div>
          ) : (
            leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{lead.requirements?.property_type || lead.type}</h3>
                    <p className="text-gray-500 text-sm">{lead.requirements?.location || lead.location}</p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">{lead.requirements?.budget || lead.budget}</Badge>
                </div>
                
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {(lead.tenant_info?.name || lead.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.tenant_info?.name || lead.name || 'User'}</p>
                    <p className="text-xs text-gray-500">Looking for rent</p>
                  </div>
                </div>

                {isLeadUnlocked(lead.id) ? (
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={`tel:${lead.tenant_info?.phone || lead.phone || lead.whatsapp}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                    <a 
                      href={lead.tenant_info?.whatsapp_link || `https://wa.me/${lead.tenant_info?.whatsapp || lead.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </a>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
                    {/* Blurred Content */}
                    <div className="filter blur-sm select-none opacity-50 mb-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-9 bg-gray-300 rounded-lg"></div>
                        <div className="h-9 bg-gray-300 rounded-lg"></div>
                      </div>
                    </div>
                    
                    {/* Overlay Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                      <Button 
                        onClick={() => handleUnlockLead(lead)}
                        className="bg-gray-900 text-white hover:bg-black shadow-lg transform transition-transform hover:scale-105"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock (1 Credit)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5">Agent</Badge>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Wallet Balance</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{walletBalance} Credits</span>
            </div>
            <button 
              onClick={() => {
                if (!isVerified) {
                  alert("Please wait for verification before buying credits.");
                  return;
                }
                onNavigate('subscription');
              }}
              className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" /> Top Up
            </button>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            <SidebarItem icon={LayoutGrid} label="Leads Dashboard" id="leads" active={activeTab === 'leads'} />
            <SidebarItem icon={Home} label="My Properties" id="properties" active={activeTab === 'properties'} />
            <SidebarItem icon={Share2} label="Refer & Earn" id="referrals" active={activeTab === 'referrals'} />
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
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
              {(agent.name || 'A').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-900 truncate">{agent.name || 'Agent'}</p>
                {isVerified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                {isPending && <ShieldAlert className="w-3 h-3 text-yellow-500" />}
              </div>
              <p className="text-xs text-gray-500 truncate">{agent.agencyName}</p>
              {isPending && <p className="text-[10px] text-yellow-600">Verification Pending</p>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Verification Banner */}
        {isPending && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Verification Pending</p>
                <p className="text-xs text-yellow-600">Your account is under review. You cannot unlock leads or buy credits until verified.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              onClick={() => setShowVerification(true)}
            >
              Verify Identity
            </Button>
          </div>
        )}

        {showVerification && (
          <SmileIDVerification 
            userId={currentUser?.id}
            onClose={() => setShowVerification(false)}
            onComplete={(result) => {
              if (result.success) {
                onUpdateUser({ verificationStatus: 'verified' });
                setShowVerification(false);
                alert('Verification submitted successfully!');
              }
            }}
          />
        )}

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">Agent Portal</span>
            <span>/</span>
            <span className="text-gray-900">
              {activeTab === 'leads' ? 'Leads' : 
               activeTab === 'properties' ? 'Properties' : 'Profile'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                className="pl-9 pr-12 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-all w-64"
              />
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

