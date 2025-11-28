import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Search, Lock, Phone, MessageCircle, Home, Bed, Bath, DollarSign } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getAllLeads, unlockLead, getUnlockedLeads, getWalletBalance } from '@/lib/firestore';

export const PropertiesPage = ({ onNavigate, currentUser, isPremium }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unlockedLeads, setUnlockedLeads] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchLeads();
    if (currentUser?.type === 'agent') {
      fetchAgentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchLeads = async () => {
    setLoading(true);
    const result = await getAllLeads({ status: 'active' });
    if (result.success) {
      setLeads(result.data);
    }
    setLoading(false);
  };

  const fetchAgentData = async () => {
    if (!currentUser?.uid) return;
    
    const balanceResult = await getWalletBalance(currentUser.uid);
    if (balanceResult.success) setWalletBalance(balanceResult.balance);

    const unlockedResult = await getUnlockedLeads(currentUser.uid);
    if (unlockedResult.success) setUnlockedLeads(unlockedResult.data);
  };

  const handleUnlock = async (lead) => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }

    if (currentUser.type !== 'agent') {
      alert('Only agents can view contact details.');
      return;
    }

    // Check subscription or credits
    // User requirement: "prompted to purchase a subscription"
    // We'll check if they have credits or are premium. 
    // Assuming 1 credit cost for now as per existing logic, or redirect to subscription.
    
    const LEAD_COST = 1;
    
    if (walletBalance >= LEAD_COST) {
      const result = await unlockLead(currentUser.uid, lead.id);
      if (result.success) {
        setWalletBalance(prev => prev - LEAD_COST);
        setUnlockedLeads([...unlockedLeads, lead.id]);
      } else {
        alert("Failed to unlock: " + result.error);
      }
    } else {
      if (confirm("You need credits to view contact details. Would you like to purchase a subscription?")) {
        onNavigate('subscription');
      }
    }
  };

  const isLeadUnlocked = (leadId) => unlockedLeads.includes(leadId);

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.requirements?.location?.toLowerCase().includes(searchLower) ||
      lead.requirements?.property_type?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requested Properties</h1>
            <p className="text-gray-600 mt-1">Browse property requests from verified tenants</p>
          </div>
          
          {/* Search & Filter */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search location..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{lead.requirements?.property_type || 'Property Request'}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        {lead.requirements?.location || 'Location not specified'}
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                      {lead.requirements?.budget ? `₦${parseInt(lead.requirements.budget).toLocaleString()}` : 'Budget N/A'}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-2 mb-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
                      <Bed className="w-4 h-4 text-gray-400" />
                      <span>{lead.requirements?.bedrooms || 'Any'} Bed</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
                      <Bath className="w-4 h-4 text-gray-400" />
                      <span>{lead.requirements?.bathrooms || 'Any'} Bath</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span>{lead.requirements?.furnishing || 'Any'}</span>
                    </div>
                  </div>

                  {/* Contact Section - Blurred if not unlocked */}
                  <div className="relative">
                    {currentUser?.type === 'agent' ? (
                      isLeadUnlocked(lead.id) ? (
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 animate-in fade-in">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
                              {(lead.tenant_info?.name || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{lead.tenant_info?.name || 'Tenant'}</p>
                              <p className="text-xs text-emerald-700">Verified Tenant</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <a 
                              href={`tel:${lead.tenant_info?.phone}`}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                            >
                              <Phone className="w-4 h-4" /> Call
                            </a>
                            <a 
                              href={lead.tenant_info?.whatsapp_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                            >
                              <MessageCircle className="w-4 h-4" /> WhatsApp
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative overflow-hidden group">
                          {/* Blurred Content */}
                          <div className="filter blur-sm select-none opacity-50">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-24 bg-gray-300 rounded"></div>
                                <div className="h-3 w-16 bg-gray-300 rounded"></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="h-9 bg-gray-300 rounded-lg"></div>
                              <div className="h-9 bg-gray-300 rounded-lg"></div>
                            </div>
                          </div>
                          
                          {/* Overlay Button */}
                          <div className="absolute inset-0 flex items-center justify-center bg-white/50 group-hover:bg-white/30 transition-colors">
                            <Button 
                              onClick={() => handleUnlock(lead)}
                              className="bg-gray-900 text-white hover:bg-black shadow-lg transform transition-transform group-hover:scale-105"
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              View Contact Info
                            </Button>
                          </div>
                        </div>
                      )
                    ) : (
                      // For non-agents (Tenants/Guests)
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-500">Contact details visible to verified agents only.</p>
                        {!currentUser && (
                          <Button 
                            variant="link" 
                            onClick={() => onNavigate('login')}
                            className="text-emerald-600 p-0 h-auto font-medium mt-1"
                          >
                            Agent Login
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
