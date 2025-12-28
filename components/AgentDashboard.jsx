import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Home,
  User,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  Phone,
  MessageCircle,
  Lock,
  Edit,
  Eye,
  Filter,
  Inbox,
  Image as ImageIcon,
  Crown,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Share2,
  Copy,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  MapPin,
  Calendar,
  ExternalLink,
  Menu,
  X,
  Wallet,
  Users,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { LeadFilters } from "./ui/LeadFilters";
import { BottomNavigation } from "./ui/BottomNavigation";
import { AgentProfile } from "./AgentProfile";
import { NotificationBell } from "./NotificationBell";
import {
  getWalletBalance,
  deductCredits,
  unlockLead,
  getUnlockedLeads,
  getAgentConnectedLeads,
  getActiveSubscription,
  createSubscription,
} from "@/lib/database";
import { PersonaVerification } from "./PersonaVerification";
import { initializePayment } from "@/lib/pesapal";

export const AgentDashboard = ({
  onNavigate,
  leads,
  onUnlock,
  initialTab = "leads",
  currentUser,
  onUpdateUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // leads, properties, profile, referrals
  const [walletBalance, setWalletBalance] = useState(0);
  const [unlockedLeads, setUnlockedLeads] = useState([]);
  const [connectedLeads, setConnectedLeads] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState(leads);
  const [activeFilters, setActiveFilters] = useState({});

  // Update filtered leads when leads prop changes
  useEffect(() => {
    setFilteredLeads(leads);
  }, [leads]);

  // Handle filter change from LeadFilters component
  const handleFilterChange = (filtered, filters) => {
    setFilteredLeads(filtered);
    setActiveFilters(filters);
  };

  // Handle responsive sidebar close on navigation
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  const isVerified = currentUser?.verificationStatus === "verified";
  const isPending = currentUser?.verificationStatus === "pending";

  const agent = currentUser || {
    id: "mock-agent-id",
    name: "John Doe",
    agencyName: "Nairobi Premier Homes",
    email: "john@nairobihomes.co.ke",
    experience: "5 Years",
    location: "Westlands, Nairobi",
    referralCode: "JOH1234",
  };

  useEffect(() => {
    const userId = currentUser?.uid || currentUser?.id;

    const fetchBalance = async () => {
      const result = await getWalletBalance(userId);
      if (result.success) {
        setWalletBalance(result.balance);
      }
    };

    const fetchUnlockedLeads = async () => {
      const result = await getUnlockedLeads(userId);
      console.log('Fetched unlocked leads for agent:', userId, result);
      if (result.success) {
        console.log('Unlocked lead IDs:', result.data);
        setUnlockedLeads(result.data || []);
      } else {
        // If there's an error, ensure we start with empty array
        console.error('Failed to fetch unlocked leads:', result.error);
        setUnlockedLeads([]);
      }
    };

    const fetchConnectedLeads = async () => {
      const result = await getAgentConnectedLeads(userId);
      if (result.success) {
        setConnectedLeads(result.data);
      }
    };

    const fetchSubscription = async () => {
      setSubscriptionLoading(true);
      const result = await getActiveSubscription(userId);
      if (result.success) {
        setSubscription(result.data);
      } else {
        setSubscription(null);
      }
      setSubscriptionLoading(false);
    };

    if (userId) {
      fetchBalance();
      fetchUnlockedLeads();
      fetchConnectedLeads();
      fetchSubscription();
      if (currentUser.referralCode) {
        setReferralCode(currentUser.referralCode);
      }
    }
  }, [currentUser]);

  const handleUnlockLead = async (lead) => {
    if (!isVerified) {
      alert(
        "Your account is pending verification. You cannot unlock leads yet.",
      );
      return;
    }

    const LEAD_COST = 1; // 1 credit per lead
    const userId = currentUser?.uid || currentUser?.id;

    if (walletBalance >= LEAD_COST) {
      if (userId) {
        const result = await unlockLead(userId, lead.id);
        if (result.success) {
          setWalletBalance((prev) => prev - LEAD_COST); // Optimistic update
          setUnlockedLeads([...unlockedLeads, lead.id]);
          if (onUnlock) onUnlock(lead);

          // Refresh balance to be sure
          const balanceResult = await getWalletBalance(userId);
          if (balanceResult.success) setWalletBalance(balanceResult.balance);
        } else {
          alert("Failed to unlock lead: " + result.error);
        }
      } else {
        // Mock mode
        setWalletBalance((prev) => prev - LEAD_COST);
        setUnlockedLeads([...unlockedLeads, lead.id]);
        if (onUnlock) onUnlock(lead);
      }
    } else {
      // Redirect to buy credits
      onNavigate("subscription"); // We'll reuse this route for the Credit Bundle page
    }
  };

  const isLeadUnlocked = (leadId) => {
    const unlocked = unlockedLeads.includes(leadId);
    console.log(`isLeadUnlocked(${leadId}):`, unlocked, 'unlockedLeads:', unlockedLeads);
    return unlocked;
  };

  // Debug function to reset contact history (development only)
  const handleResetContactHistory = async () => {
    if (process.env.NODE_ENV === 'production') {
      alert('This function is only available in development');
      return;
    }

    const userId = currentUser?.uid || currentUser?.id;
    if (!userId) return;

    if (!confirm('This will reset all unlocked leads. Are you sure?')) {
      return;
    }

    try {
      const response = await fetch('/api/debug/reset-contact-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: userId })
      });
      const result = await response.json();

      if (result.success) {
        setUnlockedLeads([]);
        alert(`Reset complete! Cleared ${result.deletedCount} records.`);
      } else {
        alert('Failed to reset: ' + result.error);
      }
    } catch (error) {
      console.error('Error resetting contact history:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleSaveProfile = (updatedAgent) => {
    onUpdateUser(updatedAgent);
    setActiveTab("leads");
  };

  // Format budget with KSh and K/M suffixes
  const formatBudget = (amount) => {
    if (!amount) return 'Budget TBD';
    const str = amount?.toString() || '';

    // Handle budget ranges like "50000 - 80000" or "50,000 - 80,000"
    if (str.includes('-')) {
      const parts = str.split('-').map(p => p.trim());
      const min = parseInt(parts[0].replace(/[^0-9]/g, '') || '0');
      const max = parseInt(parts[1]?.replace(/[^0-9]/g, '') || '0');

      const formatNum = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${Math.round(num / 1000)}K`;
        return num.toLocaleString();
      };

      if (max > 0) {
        return `KSh ${formatNum(min)} - ${formatNum(max)}`;
      }
      return `KSh ${formatNum(min)}`;
    }

    // Handle single value
    const num = parseInt(str.replace(/[^0-9]/g, '') || '0');
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${Math.round(num / 1000)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Format location to show most specific first
  const formatLocation = (location) => {
    if (!location) return 'Location TBD';
    const parts = location.split(',').map(p => p.trim());
    // Return "Neighborhood, City" format
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    }
    return location;
  };

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-[#FFF5E6] text-[#E58300] shadow-sm"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
      }`}
    >
      <Icon
        className={`w-4 h-4 ${active ? "text-[#FE9200]" : "text-gray-500"}`}
      />
      <span className="truncate">{label}</span>
    </button>
  );

  const renderContent = () => {
    if (activeTab === "referrals") {
      return (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-gradient-to-r from-[#FE9200] to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">
                Invite Agents, Get Free Credits
              </h2>
              <p className="text-[#FFE4C4] text-sm md:text-lg mb-4 md:mb-8">
                Share your referral code with other agents. When they sign up,
                you both get 5 free credits!
              </p>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs md:text-sm text-[#FFD4A3] mb-1">
                    Your Referral Code
                  </p>
                  <p className="text-2xl md:text-3xl font-mono font-bold tracking-wider">
                    {referralCode || "GEN123"}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode || "GEN123");
                      alert("Code copied to clipboard!");
                    }}
                    className="bg-white text-[#FE9200] hover:bg-[#FFF5E6] border-0 flex-1 sm:flex-none"
                  >
                    <Copy className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Copy Code</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white/10 flex-1 sm:flex-none"
                  >
                    <Share2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Decorative circles - hidden on mobile for performance */}
            <div className="hidden md:block absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="hidden md:block absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-[#FE9200]/20 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-4">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="text-center flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFE4C4] rounded-full flex items-center justify-center text-[#FE9200] mb-3 md:mb-4">
                  <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h4 className="font-semibold mb-1 md:mb-2">1. Share Code</h4>
                <p className="text-sm text-gray-500">
                  Send your unique code to fellow real estate agents.
                </p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFE4C4] rounded-full flex items-center justify-center text-[#FE9200] mb-3 md:mb-4">
                  <User className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h4 className="font-semibold mb-1 md:mb-2">2. They Sign Up</h4>
                <p className="text-sm text-gray-500">
                  They enter your code during their registration process.
                </p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFE4C4] rounded-full flex items-center justify-center text-[#FE9200] mb-3 md:mb-4">
                  <Coins className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h4 className="font-semibold mb-1 md:mb-2">3. Earn Credits</h4>
                <p className="text-sm text-gray-500">
                  You get 5 credits instantly. They get a welcome bonus too!
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "profile") {
      return (
        <AgentProfile
          agent={agent}
          onSave={handleSaveProfile}
          onCancel={() => setActiveTab("leads")}
        />
      );
    }

    if (activeTab === "properties") {
      // Handler for credit purchase via Pesapal
      const handleCreditPurchase = async (planType) => {
        if (!isVerified) {
          alert("Please verify your account before purchasing credits.");
          return;
        }

        setLoadingSubscription(true);
        try {
          const userId = currentUser?.uid || currentUser?.id;
          const plans = {
            basic: { name: 'Basic', amount: 500, credits: 10 },
            premium: { name: 'Premium', amount: 1500, credits: 50 },
            pro: { name: 'Pro', amount: 3000, credits: 150 },
          };

          const plan = plans[planType];

          const result = await initializePayment({
            email: currentUser?.email,
            phone: currentUser?.phone || '',
            amount: plan.amount,
            description: `${plan.name} Credit Bundle - ${plan.credits} Credits`,
            firstName: currentUser?.name?.split(' ')[0] || '',
            lastName: currentUser?.name?.split(' ').slice(1).join(' ') || '',
            metadata: {
              agentId: userId,
              type: 'credit_purchase',
              plan: planType,
              planName: plan.name,
              credits: plan.credits,
            },
          });

          if (result.success && result.redirectUrl) {
            window.location.href = result.redirectUrl;
          } else {
            alert("Failed to initialize payment: " + (result.error || 'Unknown error'));
          }
        } catch (error) {
          alert("Error: " + error.message);
        } finally {
          setLoadingSubscription(false);
        }
      };

      const getConnectionStatusBadge = (status) => {
        const statusStyles = {
          accepted: 'bg-blue-100 text-blue-800 border-blue-200',
          contacted: 'bg-green-100 text-green-800 border-green-200',
          converted: 'bg-purple-100 text-purple-800 border-purple-200',
          lost: 'bg-red-100 text-red-800 border-red-200',
        };
        return statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
      };

      return (
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Properties</h2>
              <p className="text-gray-500 text-sm">
                Leads you&apos;ve connected with & subscription status
              </p>
            </div>
          </div>

          {/* Connected Leads Section - MOVED TO TOP */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 md:p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">My Connected Leads</h3>
              <p className="text-sm text-gray-500">
                Leads you&apos;ve paid to connect with ({connectedLeads.length} total)
              </p>
            </div>

            {connectedLeads.length === 0 ? (
              <div className="p-6 md:p-8 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No Connected Leads Yet</h4>
                <p className="text-sm text-gray-500 mb-4">
                  When you unlock leads from the dashboard, they&apos;ll appear here.
                </p>
                <Button
                  onClick={() => handleTabChange('leads')}
                  className="bg-[#FE9200] hover:bg-[#E58300]"
                >
                  Browse Leads
                </Button>
              </div>
            ) : (
              <div className="p-3 md:p-4">
                <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
                  {connectedLeads.map((connection) => {
                    const propertyType = connection.lead?.property_type || 'Property';
                    const location = connection.lead?.location || 'Location';
                    const budget = connection.lead?.budget || 0;
                    const tenantName = String(connection.lead?.tenant_name || 'User');
                    const bedrooms = connection.lead?.bedrooms;

                    return (
                      <div
                        key={connection.id}
                        className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                      >
                        <div className="p-3 flex flex-col h-full">
                          {/* Top Row: Contact Count Badge + Budget */}
                          <div className="flex items-center justify-between mb-2 gap-1">
                            <div className="flex items-center gap-1 bg-[#E8F5E9] px-2 py-1 rounded-full">
                              <Users size={10} className="text-[#2E7D32]" />
                              <span className="text-[10px] font-semibold text-[#2E7D32]">
                                {connection.lead?.contacts || 0}
                              </span>
                            </div>
                            <span className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                              {formatBudget(budget)}
                            </span>
                          </div>

                          {/* Title - Looking for [Property Type] */}
                          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                            Looking for {propertyType}
                          </h3>

                          {/* Location with icon */}
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin size={11} className="text-[#FE9200] flex-shrink-0" />
                            <p className="text-xs text-gray-600 truncate">
                              {formatLocation(location)}
                            </p>
                          </div>

                          {/* Requirement Badge */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <div className="inline-flex items-center gap-1 bg-[#FFF5E6] border border-[#FE9200]/30 rounded-md px-2 py-1">
                              <Home size={11} className="text-[#FE9200] flex-shrink-0" />
                              <span className="text-[11px] text-[#E58300] font-semibold truncate">
                                {bedrooms ? `${bedrooms} Bedroom` : propertyType}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                              <Calendar size={10} className="text-gray-500 flex-shrink-0" />
                              <span className="text-[10px] text-gray-600">
                                {new Date(connection.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Tenant Info */}
                          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                            <div className="w-7 h-7 rounded-full bg-[#FFE4C4] flex items-center justify-center text-[#E58300] font-bold text-xs flex-shrink-0">
                              {tenantName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {tenantName}
                              </p>
                              <p className="text-[10px] text-gray-500">Looking for rent</p>
                            </div>
                          </div>

                          {/* Action Buttons - Always show since leads are unlocked */}
                          <div className="grid grid-cols-2 gap-2 mt-auto">
                            {connection.lead?.tenant_phone ? (
                              <a
                                href={`tel:${connection.lead.tenant_phone}`}
                                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-xs"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                Call
                              </a>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 px-2 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs cursor-not-allowed">
                                <Phone className="w-3.5 h-3.5" />
                                N/A
                              </div>
                            )}
                            {connection.lead?.tenant_phone || connection.lead?.tenant_email ? (
                              <a
                                href={
                                  connection.lead?.tenant_phone
                                    ? `https://wa.me/${connection.lead.tenant_phone.replace(/[^0-9]/g, '')}`
                                    : `mailto:${connection.lead.tenant_email}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] font-medium transition-colors text-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat
                              </a>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 px-2 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs cursor-not-allowed">
                                <MessageCircle className="w-3.5 h-3.5" />
                                N/A
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Verification & Subscription Status Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {/* Verification Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                {isVerified ? (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                ) : isPending ? (
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">Verification Status</h3>
                  <p className="text-sm text-gray-500">
                    {isVerified ? 'Verified Agent' : isPending ? 'Verification Pending' : 'Not Verified'}
                  </p>
                </div>
              </div>
              <Badge className={
                isVerified ? 'bg-green-100 text-green-800 border-green-200' :
                isPending ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }>
                {isVerified ? '✓ Verified' : isPending ? '⏳ Pending Review' : '✗ Unverified'}
              </Badge>
            </div>

            {/* Subscription Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  subscription ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Crown className={`w-5 h-5 ${subscription ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Subscription Status</h3>
                  <p className="text-sm text-gray-500">
                    {subscriptionLoading ? 'Loading...' :
                     subscription ? `${subscription.plan_name || subscription.plan || 'Active'} Plan` :
                     'No Active Subscription'}
                  </p>
                </div>
              </div>
              {subscription ? (
                <div className="space-y-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    ✓ {subscription.plan_name || subscription.plan}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                  No Subscription
                </Badge>
              )}
            </div>
          </div>

          {/* Credit Purchase Section */}
          {!subscription && (
            <div className="bg-gradient-to-r from-[#FE9200] to-[#E58300] rounded-xl p-4 md:p-6 text-white">
              <h3 className="text-lg md:text-xl font-bold mb-2">Buy Credits to Unlock Leads</h3>
              <p className="text-white/80 mb-4 text-sm md:text-base">
                Purchase credits to unlock tenant contact details and grow your business
              </p>

              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
                {/* Basic Plan */}
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <span className="text-xs font-medium uppercase">Starter</span>
                  <p className="text-2xl font-bold mb-1">KSh 500</p>
                  <p className="text-xs text-white/70 mb-3">10 Credits</p>
                  <Button
                    onClick={() => handleCreditPurchase('basic')}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white/20 hover:bg-white/30 text-sm"
                  >
                    {loadingSubscription ? 'Processing...' : 'Buy Now'}
                  </Button>
                </div>

                {/* Premium Plan */}
                <div className="bg-white/20 rounded-lg p-4 border-2 border-white relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Badge className="bg-white text-[#FE9200] text-[10px]">POPULAR</Badge>
                  </div>
                  <span className="text-xs font-medium uppercase">Premium</span>
                  <p className="text-2xl font-bold mb-1">KSh 1,500</p>
                  <p className="text-xs text-white/70 mb-3">50 Credits</p>
                  <Button
                    onClick={() => handleCreditPurchase('premium')}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white text-[#FE9200] hover:bg-white/90 text-sm"
                  >
                    {loadingSubscription ? 'Processing...' : 'Buy Now'}
                  </Button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <span className="text-xs font-medium uppercase">Pro</span>
                  <p className="text-2xl font-bold mb-1">KSh 3,000</p>
                  <p className="text-xs text-white/70 mb-3">150 Credits</p>
                  <Button
                    onClick={() => handleCreditPurchase('pro')}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white/20 hover:bg-white/30 text-sm"
                  >
                    {loadingSubscription ? 'Processing...' : 'Buy Now'}
                  </Button>
                </div>
              </div>

              {!isVerified && (
                <p className="text-xs text-white/60 mt-4 text-center">
                  ⚠️ Please verify your account to purchase credits
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Leads Tab (Default)
    // Use filteredLeads for display, which updates via AJAX filtering
    const displayLeads = filteredLeads.length > 0 || Object.keys(activeFilters).some(k => activeFilters[k])
      ? filteredLeads
      : leads;

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Leads Dashboard
              </h2>
              <p className="text-gray-500 text-sm">
                {displayLeads.length} lead{displayLeads.length !== 1 ? 's' : ''} available
                {Object.keys(activeFilters).some(k => activeFilters[k]) && (
                  <span className="text-[#FE9200] ml-1">
                    (filtered from {leads.length})
                  </span>
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

        {/* Leads Grid - 4 columns on desktop, 2-3 on tablet, 2 on mobile */}
        <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayLeads.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {Object.keys(activeFilters).some(k => activeFilters[k])
                  ? 'No leads match your filters'
                  : 'No leads found yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                {Object.keys(activeFilters).some(k => activeFilters[k])
                  ? 'Try adjusting your filters to see more leads.'
                  : 'Once potential tenants match your criteria, they will appear here.'}
              </p>
              {Object.keys(activeFilters).some(k => activeFilters[k]) ? (
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
              ) : (
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Update Criteria
                </Button>
              )}
            </div>
          ) : (
            displayLeads.map((lead) => {
              // property_type is the main field where the type is stored (e.g., "1 Bedroom", "2 Bedroom", etc.)
              const propertyType = lead.property_type || lead.requirements?.property_type || lead.type || 'Property';
              const location = lead.location || lead.requirements?.location || 'Location';
              const budget = lead.budget || lead.requirements?.budget || '0';
              const contactCount = lead.contacts || 0;
              const tenantName = String(lead.tenant_info?.name || lead.tenant_name || lead.name || "User");

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="p-3 flex flex-col h-full">
                    {/* Top Row: Contact Count Badge + Budget */}
                    <div className="flex items-center justify-between mb-2 gap-1">
                      <div className="flex items-center gap-1 bg-[#E8F5E9] px-2 py-1 rounded-full">
                        <Users size={10} className="text-[#2E7D32]" />
                        <span className="text-[10px] font-semibold text-[#2E7D32]">
                          {contactCount}
                        </span>
                      </div>
                      <span className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                        {formatBudget(budget)}
                      </span>
                    </div>

                    {/* Title - Looking for [Property Type] */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                      Looking for {propertyType}
                    </h3>

                    {/* Location with icon */}
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin size={11} className="text-[#FE9200] flex-shrink-0" />
                      <p className="text-xs text-gray-600 truncate">
                        {formatLocation(location)}
                      </p>
                    </div>

                    {/* Requirement Badge - Shows exact property type */}
                    <div className="mb-2">
                      <div className="inline-flex items-center gap-1.5 bg-[#FFF5E6] border border-[#FE9200]/30 rounded-md px-2 py-1">
                        <Home size={11} className="text-[#FE9200] flex-shrink-0" />
                        <span className="text-[11px] text-[#E58300] font-semibold truncate">
                          {propertyType}
                        </span>
                      </div>
                    </div>

                    {/* Tenant Info */}
                    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-[#FFE4C4] flex items-center justify-center text-[#E58300] font-bold text-xs flex-shrink-0">
                        {tenantName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {tenantName}
                        </p>
                        <p className="text-[10px] text-gray-500">Looking for rent</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isLeadUnlocked(lead.id) ? (
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <a
                          href={`tel:${lead.tenant_info?.phone || lead.tenant_phone || lead.phone || lead.whatsapp}`}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                        <a
                          href={
                            lead.tenant_info?.whatsapp_link ||
                            `https://wa.me/${lead.tenant_info?.whatsapp || lead.tenant_phone || lead.whatsapp}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-2 py-2 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] font-medium transition-colors text-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat
                        </a>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleUnlockLead(lead)}
                        className="w-full mt-auto bg-gray-900 text-white hover:bg-black text-xs py-2"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Unlock (1 Credit)
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Bottom navigation items for mobile
  const bottomNavItems = [
    { id: 'leads', label: 'Leads', icon: LayoutGrid },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'referrals', label: 'Refer', icon: Share2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex md:relative inset-y-0 left-0 w-64 bg-[#F9FAFB] border-r border-gray-200 flex-col flex-shrink-0">
        <div className="p-4">

          {/* App Switcher / Logo */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-gray-900">Yoombaa</span>
            <Badge className="ml-auto bg-[#FFE4C4] text-[#E58300] border-[#FFD4A3] text-[10px] px-1.5">
              Agent
            </Badge>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Wallet Balance
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl md:text-2xl font-bold">
                {walletBalance} Credits
              </span>
            </div>
            <button
              onClick={() => {
                if (!isVerified) {
                  alert("Please wait for verification before buying credits.");
                  return;
                }
                setIsSidebarOpen(false);
                onNavigate("subscription");
              }}
              className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" /> Top Up
            </button>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            <SidebarItem
              icon={LayoutGrid}
              label="Leads Dashboard"
              id="leads"
              active={activeTab === "leads"}
            />
            <SidebarItem
              icon={Home}
              label="My Properties"
              id="properties"
              active={activeTab === "properties"}
            />
            <SidebarItem
              icon={Share2}
              label="Refer & Earn"
              id="referrals"
              active={activeTab === "referrals"}
            />
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Account
            </h3>
            <div className="space-y-1">
              <SidebarItem
                icon={Settings}
                label="Profile Settings"
                id="profile"
                active={activeTab === "profile"}
              />
              <button
                onClick={() => { onLogout(); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
              {/* Debug Reset Button - Development Only */}
              {process.env.NODE_ENV !== 'production' && (
                <button
                  onClick={handleResetContactHistory}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-all mt-2 border border-purple-200"
                >
                  🔄 Reset Leads (Dev)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Profile Snippet at Bottom */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#FFE4C4] flex items-center justify-center text-[#E58300] font-bold text-xs flex-shrink-0">
              {String(agent.name || "A").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {String(agent.name || "Agent")}
                </p>
                {isVerified && (
                  <ShieldCheck className="w-3 h-3 text-[#FE9200]" />
                )}
                {isPending && (
                  <ShieldAlert className="w-3 h-3 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {agent.agencyName}
              </p>
              {isPending && (
                <p className="text-[10px] text-yellow-600">
                  Verification Pending
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Verification Banner - Responsive */}
        {isPending && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 md:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Verification Pending
                </p>
                <p className="text-xs text-yellow-600">
                  Your account is under review. You cannot unlock leads or buy
                  credits until verified.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 w-full sm:w-auto flex-shrink-0"
              onClick={() => setShowVerification(true)}
            >
              Verify Identity
            </Button>
          </div>
        )}

        {showVerification && (
          <PersonaVerification
            userId={currentUser?.uid || currentUser?.id}
            onClose={() => setShowVerification(false)}
            onComplete={(result) => {
              if (result.success) {
                // Update verification status - pending if needs review, verified if approved
                const newStatus = result.pending ? "pending" : "verified";
                onUpdateUser({ verificationStatus: newStatus });
                setShowVerification(false);
              }
            }}
          />
        )}

        {/* Top Header - 56px mobile (h-14), 64px desktop (h-16) */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile: Show Logo - proper sizing */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="font-bold text-gray-900 text-base">Yoombaa</span>
            </div>

            {/* Desktop: Show breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">Agent Portal</span>
              <span>/</span>
              <span className="text-gray-900">
                {activeTab === "leads"
                  ? "Leads"
                  : activeTab === "properties"
                    ? "Properties"
                    : activeTab === "referrals"
                      ? "Referrals"
                      : "Profile"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile: Show wallet balance - 44px touch target */}
            <div className="md:hidden flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl min-h-[44px]">
              <Wallet className="w-4 h-4 text-[#FE9200]" />
              <span className="text-sm font-semibold text-gray-900">{walletBalance}</span>
            </div>

            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="pl-9 pr-12 py-2.5 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-all w-64 text-gray-900 placeholder-gray-400 min-h-[44px]"
              />
            </div>
            {currentUser?.id && (
              <NotificationBell
                userId={currentUser.id}
                onNotificationClick={(notif) => {
                  if (notif.type === 'new_lead') {
                    setActiveTab('leads');
                  }
                }}
              />
            )}
          </div>
        </header>

        {/* Scrollable Content Area - proper spacing per guidelines */}
        {/* Top padding: 16px, Bottom: 80px for nav safe area */}
        <div className="flex-1 overflow-auto px-4 md:px-8 pt-4 md:pt-6 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">{renderContent()}</div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        activeId={activeTab}
        onNavigate={handleTabChange}
      />
    </div>
  );
};
