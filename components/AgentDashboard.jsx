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
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
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
      if (result.success) {
        setUnlockedLeads(result.data);
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

  const isLeadUnlocked = (leadId) => unlockedLeads.includes(leadId);

  const handleSaveProfile = (updatedAgent) => {
    onUpdateUser(updatedAgent);
    setActiveTab("leads");
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
      // Handler for demo subscription
      const handleDemoSubscription = async () => {
        if (!isVerified) {
          alert("Please verify your account before purchasing a subscription.");
          return;
        }

        setLoadingSubscription(true);
        try {
          // Create a demo subscription directly (for testing)
          const userId = currentUser?.uid || currentUser?.id;
          const startsAt = new Date();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7-day demo

          const result = await createSubscription({
            user_id: userId,
            plan_name: 'Demo Subscription',
            status: 'active',
            amount: 0,
            currency: 'KES',
            payment_method: 'demo',
            payment_reference: `demo_${Date.now()}`,
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
          });

          if (result.success) {
            setSubscription(result.data);
            alert("Demo subscription activated! You have 7 days of full access.");
          } else {
            alert("Failed to activate demo: " + result.error);
          }
        } catch (error) {
          alert("Error: " + error.message);
        } finally {
          setLoadingSubscription(false);
        }
      };

      // Handler for real subscription purchase
      const handleRealSubscription = async (planType) => {
        if (!isVerified) {
          alert("Please verify your account before purchasing a subscription.");
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
            description: `${plan.name} Subscription - ${plan.credits} Credits`,
            firstName: currentUser?.name?.split(' ')[0] || '',
            lastName: currentUser?.name?.split(' ').slice(1).join(' ') || '',
            metadata: {
              userId,
              type: 'subscription',
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

          {/* Subscription Purchase Section */}
          {!subscription && (
            <div className="bg-gradient-to-r from-[#FE9200] to-[#E58300] rounded-xl p-4 md:p-6 text-white">
              <h3 className="text-lg md:text-xl font-bold mb-2">Get Started with a Subscription</h3>
              <p className="text-white/80 mb-4 text-sm md:text-base">
                Unlock unlimited access to leads and grow your business
              </p>

              <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                {/* Demo Subscription */}
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Demo</span>
                  </div>
                  <p className="text-2xl font-bold mb-1">FREE</p>
                  <p className="text-xs text-white/70 mb-3">7 days trial</p>
                  <Button
                    onClick={handleDemoSubscription}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white text-[#FE9200] hover:bg-white/90 text-sm"
                  >
                    {loadingSubscription ? 'Processing...' : 'Start Demo'}
                  </Button>
                  <p className="text-[10px] text-white/60 mt-2 text-center">For testing only</p>
                </div>

                {/* Basic Plan */}
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <span className="text-xs font-medium uppercase">Basic</span>
                  <p className="text-2xl font-bold mb-1">KSh 500</p>
                  <p className="text-xs text-white/70 mb-3">10 Credits</p>
                  <Button
                    onClick={() => handleRealSubscription('basic')}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white/20 hover:bg-white/30 text-sm"
                  >
                    Buy Now
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
                    onClick={() => handleRealSubscription('premium')}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white text-[#FE9200] hover:bg-white/90 text-sm"
                  >
                    Buy Now
                  </Button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <span className="text-xs font-medium uppercase">Pro</span>
                  <p className="text-2xl font-bold mb-1">KSh 3,000</p>
                  <p className="text-xs text-white/70 mb-3">150 Credits</p>
                  <Button
                    onClick={() => handleRealSubscription('pro')}
                    disabled={loadingSubscription || !isVerified}
                    className="w-full bg-white/20 hover:bg-white/30 text-sm"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>

              {!isVerified && (
                <p className="text-xs text-white/60 mt-4 text-center">
                  ⚠️ Please verify your account to purchase a subscription
                </p>
              )}
            </div>
          )}

          {/* Connected Leads Section */}
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
              <div className="divide-y divide-gray-100">
                {connectedLeads.map((connection) => (
                  <div key={connection.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {connection.lead?.tenant_name || 'Anonymous Lead'}
                          </h4>
                          <Badge className={getConnectionStatusBadge(connection.status)}>
                            {connection.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {connection.lead?.location || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {connection.lead?.property_type || 'Any'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(connection.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {connection.lead?.budget && (
                          <p className="text-sm font-medium text-[#FE9200] mt-1">
                            Budget: KSh {connection.lead.budget.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {connection.lead?.tenant_phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => window.open(`tel:${connection.lead.tenant_phone}`)}
                          >
                            <Phone className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">Call</span>
                          </Button>
                        )}
                        {connection.lead?.tenant_email && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => window.open(`mailto:${connection.lead.tenant_email}`)}
                          >
                            <MessageCircle className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">Email</span>
                          </Button>
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
    }

    // Leads Tab (Default)
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Leads Dashboard
            </h2>
            <p className="text-gray-500 text-sm">
              Potential tenants matching your criteria
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {leads.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No leads found yet
              </h3>
              <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                Once potential tenants match your criteria, they will appear
                here.
              </p>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Update Criteria
              </Button>
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">
                        {lead.requirements?.property_type || lead.type}
                      </h3>
                      <p className="text-gray-500 text-sm truncate">
                        {lead.requirements?.location || lead.location}
                      </p>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200 flex-shrink-0 text-xs">
                      {lead.requirements?.budget || lead.budget}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-4 md:mb-6 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFE4C4] flex items-center justify-center text-[#E58300] font-bold flex-shrink-0">
                      {String(lead.tenant_info?.name || lead.name || "U").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {String(lead.tenant_info?.name || lead.name || "User")}
                      </p>
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
                        href={
                          lead.tenant_info?.whatsapp_link ||
                          `https://wa.me/${lead.tenant_info?.whatsapp || lead.whatsapp}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] font-medium transition-colors text-sm"
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

        {/* Top Header - Responsive with hamburger menu */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900 hidden sm:inline">Agent Portal</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-gray-900 font-medium sm:font-normal">
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

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="pl-9 pr-12 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-all w-64 text-gray-900 placeholder-gray-400"
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

        {/* Scrollable Content Area - Responsive padding */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
};
