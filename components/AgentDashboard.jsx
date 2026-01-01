import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { useToast } from "@/context/ToastContext";
import {
  getWalletBalance,
  deductCredits,
  unlockLead,
  getUnlockedLeads,
  getAgentConnectedLeads,
  getActiveSubscription,
  createSubscription,
  getReferralStats,
  incrementLeadViews,
  getOrUpdateReferralCode,
} from "@/lib/database";
import { PersonaVerification } from "./PersonaVerification";
import { LeadDetailModal } from "./LeadDetailModal";
import { LiveActivityTicker, LiveActivityPopup } from "./LiveActivityTicker";
import { Tooltip } from "./ui/Tooltip";
import { initializePayment } from "@/lib/pesapal";
import { checkAndNotifySubscriptionExpiry } from "@/lib/notifications";

export const AgentDashboard = ({
  onNavigate,
  leads,
  onUnlockLead, // Rename from onUnlock to avoid confusion
  onOpenSubscription,
  initialTab = "leads",
  currentUser,
  onUpdateUser,
  onLogout,
  onNotificationClick,
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
  const [referralStats, setReferralStats] = useState({ count: 0, totalCredits: 0 });
  const [referredAgents, setReferredAgents] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState(leads);
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);

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

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTime = (createdAt) => {
    const expiry = new Date(createdAt).getTime() + (48 * 60 * 60 * 1000);
    const diff = expiry - currentTime.getTime();
    if (diff <= 0) return "EXPIRED";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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

  // Helper to open lead and track view
  const handleOpenLeadDetails = async (lead) => {
    setSelectedLeadForDetail(lead);
    const userId = currentUser?.uid || currentUser?.id;
    if (userId) {
      // Track the view uniquely for the agent
      incrementLeadViews(lead.id, userId);
    }
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
      if (result.success) {
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
      if (result.success && result.data) {
        setSubscription(result.data);
        // Check for expiry and notify if necessary
        if (result.data.expires_at) {
          checkAndNotifySubscriptionExpiry(userId, result.data.expires_at);
        }
      } else {
        setSubscription(null);
      }
      setSubscriptionLoading(false);
    };

    const fetchReferralStats = async () => {
      const result = await getReferralStats(userId);
      if (result.success) {
        setReferralStats(result.stats);
        setReferredAgents(result.referrals || []);
      }
    };

    // Fetch and update referral code to YOOM format if needed
    const fetchReferralCode = async () => {
      const result = await getOrUpdateReferralCode(userId);
      if (result.success && result.code) {
        setReferralCode(result.code);
      } else if (currentUser?.referralCode) {
        setReferralCode(currentUser.referralCode);
      }
    };

    if (userId) {
      fetchBalance();
      fetchUnlockedLeads();
      fetchConnectedLeads();
      fetchSubscription();
      fetchReferralStats();
      fetchReferralCode(); // Fetch proper YOOM format referral code
    }
  }, [currentUser]);

  const { toast, showConfirm } = useToast();

  const handleUnlockLead = async (lead, isExclusive = false) => {
    if (!isVerified) {
      toast.error(
        "Your account is pending verification. You cannot unlock leads yet.",
      );
      return;
    }

    const userId = currentUser?.uid || currentUser?.id;
    if (!userId) return;

    // Calculate dynamic cost locally for the confirmation dialog
    const basePrice = lead.base_price || 250;
    const multipliers = [1.0, 1.5, 2.5];
    const currentCost = isExclusive
      ? Math.round(basePrice * 5.0 * 0.85)
      : Math.round(basePrice * (multipliers[lead.claimed_slots || 0] || 2.5));

    if (walletBalance < currentCost) {
      showConfirm(
        `Insufficient credits. You need ${currentCost} credits for this ${isExclusive ? 'exclusive buyout' : 'unlock'}. Top up now?`,
        () => { if (onOpenSubscription) onOpenSubscription(); }
      );
      return;
    }

    const confirmMsg = isExclusive
      ? `Buy exclusive access to this lead for ${currentCost} credits? This will hide it from all other agents.`
      : `Unlock this lead for ${currentCost} credits? (${(lead.claimed_slots || 0) + 1}/3 slots)`;

    showConfirm(confirmMsg, async () => {
      const result = await unlockLead(userId, lead.id, isExclusive);
      if (result.success) {
        // Increment views even if they unlock directly (Unique only)
        incrementLeadViews(lead.id, userId);

        setWalletBalance((prev) => prev - (result.cost || currentCost));
        setUnlockedLeads([...unlockedLeads, lead.id]);
        if (onUnlockLead) onUnlockLead(lead);

        // Refresh balance to be sure
        const balanceResult = await getWalletBalance(userId);
        if (balanceResult.success) setWalletBalance(balanceResult.balance);

        toast.success(isExclusive ? "Exclusive access granted!" : "Lead unlocked successfully!");
      } else {
        toast.error("Failed to unlock lead: " + result.error);
      }
    });
  };

  // Memoize the unlocked leads check to prevent unnecessary re-renders
  const isLeadUnlocked = useCallback((leadId) => {
    return unlockedLeads.includes(leadId);
  }, [unlockedLeads]);

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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
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
      // Share URL - root path with ref query parameter
      const shareUrl = `${window.location.origin}/?ref=${referralCode}`;

      const handleCopy = () => {
        if (referralCode) {
          navigator.clipboard.writeText(referralCode);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
      };

      const handleShare = async () => {
        if (navigator.share && referralCode) {
          try {
            await navigator.share({
              title: 'Join Yoombaa',
              text: `Join Yoombaa and get 2 free credits! Use my referral code: ${referralCode}`,
              url: shareUrl,
            });
          } catch (err) {
            console.error('Share failed', err);
          }
        } else {
          // Fallback: copy the full referral link
          navigator.clipboard.writeText(shareUrl);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
      };

      return (
        <div className="space-y-6 max-w-5xl">
          {/* Header Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Refer & Earn</h2>
            <p className="text-gray-500 text-sm italic">Grow your business by inviting fellow agents to the platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 transition-all hover:border-[#FE9200]/30 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-[#FFF5E6] transition-colors">
                  <Users className="w-6 h-6 text-gray-400 group-hover:text-[#FE9200]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Agents Invited</p>
                  <p className="text-2xl font-black text-gray-900">{referralStats.count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 transition-all hover:border-[#FE9200]/30 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-[#FFF5E6] transition-colors">
                  <Coins className="w-6 h-6 text-gray-400 group-hover:text-[#FE9200]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Credits Earned</p>
                  <p className="text-2xl font-black text-gray-900">{referralStats.totalCredits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#FE9200]/10 rounded-2xl p-6 border-dashed relative overflow-hidden">
              <div className="flex flex-col justify-center h-full">
                <p className="text-xs font-bold text-[#E58300] uppercase tracking-wider mb-2">Bonus Status</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FE9200] fill-[#FE9200]" />
                  <span className="text-sm font-bold text-gray-700">5 Credits per Sign-up</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Referral Card */}
          <div className="bg-white border-2 border-gray-100 rounded-[32px] overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex flex-col lg:flex-row gap-10 items-center">
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 leading-tight mb-4">
                      Earn <span className="text-[#FE9200]">Free Credits</span> for Every Agent You Bring
                    </h3>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      Know another agent looking for quality leads? Share your unique code.
                      When they join, you get <span className="text-gray-900 font-bold underline decoration-[#FE9200] decoration-4">5 credits instantly</span> and they get a 2-credit welcome bonus.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Your Personal Code</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between group cursor-pointer hover:border-[#FE9200]/20 transition-all" onClick={handleCopy}>
                        <span className="font-mono text-2xl font-black tracking-widest text-gray-900 uppercase">
                          {referralCode || <span className="text-gray-400 text-lg">Loading...</span>}
                        </span>
                        {copySuccess ? (
                          <div className="flex items-center gap-1.5 text-green-600 animate-in fade-in slide-in-from-right-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-bold">Copied!</span>
                          </div>
                        ) : (
                          <Copy className="w-5 h-5 text-gray-300 group-hover:text-[#FE9200]" />
                        )}
                      </div>
                      <Button
                        onClick={handleShare}
                        variant="primary"
                        size="lg"
                        className="sm:w-auto w-full rounded-2xl"
                      >
                        <Share2 className="w-5 h-5" />
                        Share Invite
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/100?u=${i + 50}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-14 h-14 rounded-full border-4 border-white bg-[#FFF5E6] flex items-center justify-center text-[#FE9200] font-black text-sm">
                    +50
                  </div>
                </div>
              </div>
            </div>

            {/* How it Works Footer */}
            <div className="bg-gray-50/50 border-t border-gray-100 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-[#FE9200]">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Send Invite</h4>
                    <p className="text-xs text-gray-500 font-medium">Text, WhatsApp or email your code to other agents.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-[#FE9200]">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Agent Joins</h4>
                    <p className="text-xs text-gray-500 font-medium">They enter your code during their registration process.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-[#FE9200]">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Get Rewarded</h4>
                    <p className="text-xs text-gray-500 font-medium">5 credits added to your wallet instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Referrals List */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Your Referrals</h3>
              <p className="text-sm text-gray-500">Agents who signed up using your code</p>
            </div>

            {referredAgents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {referredAgents.map((agent, index) => (
                  <div key={agent.id || index} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE9200] to-[#E58300] flex items-center justify-center text-white font-bold text-sm">
                        {agent.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(agent.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${agent.status === 'completed'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-amber-50 text-amber-600'
                        }`}>
                        {agent.status === 'completed' ? (
                          <>
                            <Coins className="w-3 h-3" />
                            +{agent.creditsEarned} earned
                          </>
                        ) : (
                          'Pending'
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">No referrals yet</h4>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Share your code with other agents to start earning credits!
                </p>
              </div>
            )}
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
      // Handler for credit purchase
      const handleOpenPricing = () => {
        if (!isVerified) {
          alert("Please verify your account before purchasing credits.");
          return;
        }
        if (onOpenSubscription) onOpenSubscription();
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
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-[#E8F5E9] px-2 py-1 rounded-full">
                                <Users size={10} className="text-[#2E7D32]" />
                                <span className="text-[10px] font-semibold text-[#2E7D32]">
                                  {connection.lead?.contacts || 0}
                                </span>
                              </div>
                              {connection.lead?.status === 'paused' && (
                                <div className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                  <span className="text-[9px] font-bold text-amber-600 uppercase">Paused</span>
                                </div>
                              )}
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${subscription ? 'bg-purple-100' : 'bg-gray-100'
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
            <div className="bg-white border-2 border-[#FE9200]/20 rounded-[32px] p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#FE9200]"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative z-10">
                <div className="w-16 h-16 bg-[#FFF5E6] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Coins className="w-8 h-8 text-[#FE9200]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Need More Credits?</h3>
                  <p className="text-gray-500 text-sm md:text-base font-medium max-w-md leading-relaxed">
                    Purchase flexible credit bundles to unlock premium tenant leads and grow your agency business faster.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col gap-3 relative z-10">
                <Button
                  onClick={handleOpenPricing}
                  className="w-full md:px-12 h-16 rounded-[24px] text-lg font-black shadow-none border-0"
                >
                  View New Plans
                </Button>
                {!isVerified && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] text-center">
                    Verification Required
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Leads Tab (Default)
    // Use filteredLeads for display, which updates via AJAX filtering
    // Filter out non-active leads from the general dashboard
    const allAvailableLeads = filteredLeads.length > 0 || Object.keys(activeFilters).some(k => activeFilters[k])
      ? filteredLeads
      : leads;

    const displayLeads = allAvailableLeads.filter(l => l.status === 'active' || !l.status);

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

          {/* Live Activity Ticker - Social Proof */}
          <LiveActivityTicker className="w-full" />
        </div>

        {/* Leads Grid - 4 columns on desktop, 2-3 on tablet, 2 on mobile */}
        {displayLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayLeads.map((lead) => {
              const formatPropertyType = (type) => {
                if (!type) return 'Property';
                return type.toString()
                  .replace(/\bBed\b/gi, 'Bedroom')
                  .replace(/\bBHK\b/gi, 'Bedroom')
                  .replace(/\bApt\b/gi, 'Apartment')
                  .replace(/\bRes\b/gi, 'Residential');
              };

              const propertyType = formatPropertyType(lead.property_type || lead.requirements?.property_type || lead.type);
              const location = lead.location || lead.requirements?.location || 'Location';
              const budget = lead.budget || lead.requirements?.budget || '0';
              const contactCount = lead.claimed_slots || 0;
              const maxSlots = lead.max_slots || 3;
              const tenantName = String(lead.tenant_info?.name || lead.tenant_name || lead.name || "User");
              const isUnlocked = isLeadUnlocked(lead.id);

              const basePrice = lead.base_price || 250;
              const multipliers = [1.0, 1.5, 2.5];
              const currentCost = Math.round(basePrice * (multipliers[contactCount] || 2.5));
              const timeLeft = getRemainingTime(lead.created_at);
              const isExpired = timeLeft === "EXPIRED";

              return (
                <div
                  key={lead.id}
                  onClick={() => handleOpenLeadDetails(lead)}
                  className={`
                    relative flex flex-col bg-white rounded-xl border border-gray-100 
                    hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-pointer 
                    group
                    ${isExpired ? 'opacity-60' : ''}
                  `}
                >
                  {/* Top Row - Views count & Budget Badge */}
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    {/* Stats Indicator - Agents & Views */}
                    <div className="flex items-center gap-3 bg-gray-50/50 px-2.5 py-1.5 rounded-lg border border-gray-100/50 shadow-sm">
                      <Tooltip content="Agents who unlocked">
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500">{lead.contacts || 0}</span>
                        </div>
                      </Tooltip>
                      <div className="w-[1px] h-3 bg-gray-200/80" />
                      <Tooltip content="Total views">
                        <div className="flex items-center gap-1.5">
                          <Eye size={12} className="text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500">{lead.views || 0}</span>
                        </div>
                      </Tooltip>
                    </div>

                    {/* Budget Badge - Premium but clean */}
                    <Tooltip content="Lead Budget">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${parseFloat(budget) >= 50000
                          ? 'bg-[#FE9200]/10 text-[#FE9200] border border-[#FE9200]/20'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                        <Coins size={12} className={parseFloat(budget) >= 50000 ? 'text-[#FE9200]' : 'text-emerald-500'} />
                        {formatBudget(budget)}
                      </div>
                    </Tooltip>
                  </div>

                  {/* Main Content */}
                  <div className="px-5 pb-3">
                    {/* Title */}
                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight mb-3 group-hover:text-[#FE9200] transition-colors">
                      Looking for {propertyType}
                    </h3>

                    {/* Badges Row - Location → Property Type → Date */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      {/* Location Badge */}
                      <Tooltip content="Property Location">
                        <div className="flex items-center gap-1.5 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100">
                          <MapPin size={11} className="text-gray-400" />
                          <span className="text-[11px] font-medium text-gray-500 truncate max-w-[90px]">{formatLocation(location)}</span>
                        </div>
                      </Tooltip>

                      {/* Property Type Badge */}
                      <Tooltip content="Preferred Configuration">
                        <div className="flex items-center gap-1.5 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100">
                          <Home size={11} className="text-gray-400" />
                          <span className="text-[11px] font-medium text-gray-500">
                            {propertyType}
                          </span>
                        </div>
                      </Tooltip>

                      {/* Date Badge */}
                      <Tooltip content="Posted Date">
                        <div className="flex items-center gap-1.5 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100">
                          <Calendar size={11} className="text-gray-400" />
                          <span className="text-[11px] font-medium text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </Tooltip>

                      {isExpired && (
                        <div className="flex items-center gap-1 bg-red-50/50 border border-red-100/50 px-2 py-1 rounded-md">
                          <span className="text-[10px] font-bold text-red-400 uppercase">Expired</span>
                        </div>
                      )}
                    </div>

                    {/* Slots UI Section - Refined */}
                    <div className="flex items-center justify-between bg-gray-50/30 rounded-xl px-4 py-2.5 mb-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Slots</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map((num) => (
                            <Tooltip key={num} content={num <= contactCount ? `Slot ${num} occupied` : `Slot ${num} available`}>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold border transition-all ${num <= contactCount
                                  ? 'bg-[#FE9200] border-[#FE9200] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-300'
                                  }`}
                              >
                                {num}
                              </div>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${contactCount >= maxSlots
                          ? 'text-red-500'
                          : contactCount > 0
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                          }`}>
                          {contactCount}/{maxSlots}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${contactCount >= maxSlots
                          ? 'bg-red-50 text-red-500'
                          : contactCount > 0
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                          }`}>
                          {contactCount >= maxSlots ? 'Sold Out' : contactCount > 0 ? 'Open' : 'Available'}
                        </span>
                      </div>
                    </div>

                    {/* Tenant Info Row - Improved hierarchy */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                      <Tooltip content="Prospective Tenant">
                        <div
                          className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm flex-shrink-0"
                        >
                          {tenantName.charAt(0).toUpperCase()}
                        </div>
                      </Tooltip>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{tenantName}</p>
                        <Tooltip content="Identity verified by Yoombaa">
                          <p className="text-[11px] text-[#6B7280] font-medium cursor-help">Verified Renter</p>
                        </Tooltip>
                      </div>
                      {isUnlocked && (
                        <Tooltip content="You have unlocked this contact">
                          <div className="flex items-center gap-1 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/50">
                            <CheckCircle size={11} className="text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-500">Unlocked</span>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Modern Weight & Hover Effects */}
                  <div className="px-5 pb-5 pt-1">
                    {isUnlocked ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Tooltip content="Call tenant directly" position="bottom">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${lead.phone || lead.whatsapp || ''}`, '_self');
                            }}
                            className="w-full h-10 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Phone size={14} className="text-gray-400" />
                            Call
                          </Button>
                        </Tooltip>
                        <Tooltip content="Start WhatsApp chat" position="bottom">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${lead.phone || lead.whatsapp || ''}`, '_blank');
                            }}
                            className="w-full h-10 bg-[#FE9200] text-white rounded-xl hover:bg-[#E68200] font-medium text-sm transition-all flex items-center justify-center gap-2 border-0 shadow-sm hover:shadow-orange-200/50 hover:shadow-lg"
                          >
                            <MessageCircle size={14} />
                            Chat
                          </Button>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Tooltip content={isExpired ? "Lead has expired" : contactCount >= maxSlots ? "No slots remaining" : `Unlock for ${currentCost} credits`} position="bottom">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlockLead(lead, false);
                            }}
                            disabled={contactCount >= maxSlots || isExpired}
                            className={`
                              w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                              ${contactCount >= maxSlots || isExpired
                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100 shadow-none'
                                : 'bg-[#FE9200] text-white border-0 shadow-sm hover:shadow-orange-200/50 hover:shadow-lg translate-gpu'
                              }
                            `}
                          >
                            {isExpired ? (
                              <>
                                <Lock size={14} />
                                Expired
                              </>
                            ) : contactCount >= maxSlots ? (
                              <>
                                <XCircle size={14} />
                                Sold Out
                              </>
                            ) : (
                              <>
                                <Zap size={14} className="animate-pulse" />
                                Unlock · {currentCost} Credits
                              </>
                            )}
                          </Button>
                        </Tooltip>

                        {!isExpired && contactCount === 0 && !lead.is_exclusive && (
                          <Tooltip content="Be the only agent with this lead" position="bottom">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlockLead(lead, true);
                              }}
                              className="w-full h-10 border border-[#FE9200]/20 text-[#FE9200] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-[#FE9200] hover:text-white hover:border-[#FE9200] shadow-sm hover:shadow-md active:scale-95"
                            >
                              <Crown size={14} />
                              Buy Exclusive Access
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
        }
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
                if (onOpenSubscription) onOpenSubscription();
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
                  if (onNotificationClick) {
                    onNotificationClick(notif);
                  }
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

      {selectedLeadForDetail && (
        <LeadDetailModal
          lead={selectedLeadForDetail}
          currentUser={currentUser}
          walletBalance={walletBalance}
          isVerified={isVerified}
          onOpenSubscription={onOpenSubscription}
          onClose={() => setSelectedLeadForDetail(null)}
          onUnlock={(lead) => {
            setUnlockedLeads(prev => [...prev, lead.id]);
            // Refresh balance
            const userId = currentUser?.uid || currentUser?.id;
            getWalletBalance(userId).then(res => {
              if (res.success) setWalletBalance(res.balance);
            });
          }}
        />
      )}

      {/* Live Activity Popup - Corner FOMO Notifications */}
      <LiveActivityPopup position="bottom-left" />
    </div>
  );
};
