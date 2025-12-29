import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Search, Lock, Phone, MessageCircle, Home, Bed, Bath, DollarSign, Inbox } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { LeadFilters } from './ui/LeadFilters';
import { getAllLeads, unlockLead, getUnlockedLeads, getWalletBalance } from '@/lib/database';

export const PropertiesPage = ({ onNavigate, currentUser, isPremium, onOpenSubscription }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockedLeads, setUnlockedLeads] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});

  // Handle filter change from LeadFilters component
  const handleFilterChange = (filtered, filters) => {
    setFilteredLeads(filtered);
    setActiveFilters(filters);
  };

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
      setFilteredLeads(result.data); // Initialize filtered leads
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
      if (onOpenSubscription) {
        onOpenSubscription();
      } else {
        onNavigate('subscription');
      }
    }
  };

  const isLeadUnlocked = (leadId) => unlockedLeads.includes(leadId);

  // Determine which leads to display
  const displayLeads = filteredLeads.length > 0 || Object.keys(activeFilters).some(k => activeFilters[k])
    ? filteredLeads
    : leads;

  const hasActiveFilters = Object.keys(activeFilters).some(k => activeFilters[k]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Requested Properties</h1>
              <p className="text-gray-600 mt-1">
                {displayLeads.length} property request{displayLeads.length !== 1 ? 's' : ''} from verified tenants
                {hasActiveFilters && (
                  <span className="text-[#FE9200] ml-1">(filtered from {leads.length})</span>
                )}
              </p>
            </div>
          </div>

          {/* Lead Filters Component */}
          <LeadFilters
            leads={leads}
            onFilterChange={handleFilterChange}
            showSearch={true}
            showPropertyType={true}
            showLocation={true}
            showBudget={true}
            className="w-full"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE9200]"></div>
          </div>
        ) : displayLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {hasActiveFilters ? 'No properties match your filters' : 'No property requests yet'}
            </h3>
            <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Check back soon for new property requests from tenants.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setFilteredLeads(leads);
                  setActiveFilters({});
                }}
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayLeads.map((lead) => (
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
                    <Badge className="bg-[#FFF5E6] text-[#E58300] border-[#FFE4C4]">
                      {lead.requirements?.budget ? `KSh ${parseInt(lead.requirements.budget).toLocaleString()}` : 'Budget N/A'}
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
                        <div className="bg-[#FFF5E6] rounded-xl p-4 border border-[#FFE4C4] animate-in fade-in">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#FFD4A3] flex items-center justify-center text-[#CC7400] font-bold">
                              {(lead.tenant_info?.name || lead.tenant_name || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{lead.tenant_info?.name || lead.tenant_name || 'Tenant'}</p>
                              <p className="text-xs text-[#E58300]">Verified Tenant</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`tel:${lead.tenant_info?.phone || lead.tenant_phone}`}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#FFD4A3] text-[#E58300] rounded-lg hover:bg-[#FFE4C4] transition-colors text-sm font-medium"
                            >
                              <Phone className="w-4 h-4" /> Call
                            </a>
                            <a
                              href={lead.tenant_info?.whatsapp_link || `https://wa.me/${lead.tenant_phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] transition-colors text-sm font-medium"
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
                            className="text-[#FE9200] p-0 h-auto font-medium mt-1"
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
