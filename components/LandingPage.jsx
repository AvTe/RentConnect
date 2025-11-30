/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from 'react';
import { getAllLeads, incrementLeadContacts, checkSubscriptionStatus } from '@/lib/firestore';
import {
  Phone,
  Mail,
  Home,
  MapPin,
  CheckCircle2,
  Zap,
  Users,
  Lock
} from 'lucide-react';

// Fallback leads shown only when no database leads exist
const fallbackLeads = [
  { id: 1, type: 'Mini Flat', location: 'Nairobi, Kenya', budget: '150000', contacts: 5 },
  { id: 2, type: '2 Bedroom', location: 'Mombasa, Kenya', budget: '250000', contacts: 8 },
  { id: 3, type: 'Self Contain', location: 'Kisumu, Kenya', budget: '80000', contacts: 3 },
];

// Lead Card - displays real property lead data with icons
const LeadCard = ({ lead, currentUser, onNavigate, isSubscribed }) => {
  const formatBudget = (amount) => {
    const num = parseInt(amount?.toString().replace(/[^0-9]/g, '') || '0');
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${(num / 1000).toFixed(0)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Extract data from lead - supports both flat structure and nested requirements structure
  const propertyType = lead.requirements?.property_type || lead.type || 'Property';
  const location = lead.requirements?.location || lead.location || 'Kenya';
  const budget = lead.requirements?.budget || lead.budget || '0';
  const contacts = lead.contacts || 0;
  const bedrooms = lead.requirements?.bedrooms || lead.bedrooms;
  const tenantPhone = lead.tenant_info?.phone || lead.phone || '+254XXXXXXXX';
  const tenantEmail = lead.tenant_info?.email || lead.email || 'user@email.com';
  const status = lead.status || 'active';

  // Build specifications with icons
  const specs = [
    { icon: Home, label: 'Type', value: propertyType },
    { icon: MapPin, label: 'Area', value: location.split(',')[0] || location },
    { icon: CheckCircle2, label: 'Status', value: status === 'active' ? 'Active' : status },
    { icon: Zap, label: bedrooms ? 'Beds' : 'Ready', value: bedrooms ? `${bedrooms} BR` : 'Available' },
  ];

  // Handle contact click - redirect to subscription if not subscribed
  const handleContactClick = async () => {
    if (!currentUser) {
      // Not logged in - redirect to login
      onNavigate('login');
      return;
    }

    if (isSubscribed) {
      // Subscribed - increment contacts and show full details
      await incrementLeadContacts(lead.id);
      // Could open a modal or redirect to lead details page
      alert(`Phone: ${tenantPhone}\nEmail: ${tenantEmail}`);
    } else {
      // Not subscribed - redirect to subscription page
      onNavigate('subscription');
    }
  };

  return (
    <div className="bg-[#FFF5E6] rounded-[20px] p-2 w-[280px] flex-shrink-0">
      <div className="bg-white rounded-[16px] overflow-hidden border-b-[5px] border-[#FE9200] h-full flex flex-col">
        <div className="p-3 flex flex-col flex-1">
          {/* Badges - USP: Agent Engagement Counter */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1">
              <Users className="w-3 h-3" />
              {contacts} Agents Contacted
            </span>
            <span className="bg-[#FE9200] text-white px-2.5 py-1 rounded-full text-[10px] font-semibold">
              {formatBudget(budget)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 mb-0.5">{propertyType}</h3>
          <p className="text-xs text-gray-400 mb-3">{location}</p>

          {/* 2x2 Specs Grid with Icons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {specs.map((spec, i) => {
              const IconComponent = spec.icon;
              return (
                <div key={i} className="bg-[#F8F8F8] rounded-xl px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <IconComponent className="w-3 h-3 text-gray-400" />
                    <p className="text-[9px] text-gray-400">{spec.label}</p>
                  </div>
                  <p className="text-[10px] text-[#FE9200] font-semibold truncate">{spec.value}</p>
                </div>
              );
            })}
          </div>

          {/* Contact Section - Blurred with Subscription Gate */}
          <div
            className="bg-[#FFF5E6] rounded-xl p-2.5 border-2 border-[#FE9200] mt-auto cursor-pointer relative overflow-hidden group"
            onClick={handleContactClick}
          >
            {/* Blurred Contact Details (visible but blurred if not subscribed) */}
            <div className={`flex items-center justify-between ${!isSubscribed ? 'blur-[3px]' : ''}`}>
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Phone className="w-3 h-3 text-[#FE9200]" />
                  <p className="text-[8px] text-gray-600 font-medium">Phone</p>
                </div>
                <p className="text-[9px] text-gray-700 font-medium truncate">
                  {tenantPhone}
                </p>
              </div>
              <div className="w-px h-8 bg-[#FE9200] mx-2" />
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Mail className="w-3 h-3 text-[#FE9200]" />
                  <p className="text-[8px] text-gray-600 font-medium">Email</p>
                </div>
                <p className="text-[9px] text-gray-700 font-medium truncate">
                  {tenantEmail}
                </p>
              </div>
            </div>

            {/* Subscription Overlay - Shown when not subscribed */}
            {!isSubscribed && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl transition-opacity group-hover:bg-white/90">
                <Lock className="w-4 h-4 text-[#FE9200] mb-1" />
                <p className="text-[8px] text-gray-600 text-center font-medium px-2">
                  Contact details available for
                </p>
                <p className="text-[9px] text-[#FE9200] font-bold">
                  Subscribed Agents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage = ({ onNavigate, currentUser }) => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);

  const cardWidth = 280;
  const gap = 16;

  // Fetch real leads from Firebase on mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        const result = await getAllLeads({ status: 'active', limit: 10 });

        if (result.success && result.data.length > 0) {
          // Use real leads from database
          setLeads(result.data);
        } else {
          // Use fallback leads only if no real data exists
          console.log('No leads in database, using fallback data');
          setLeads(fallbackLeads);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        setLeads(fallbackLeads);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Check subscription status for logged-in agents
  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser?.uid && currentUser?.role === 'agent') {
        try {
          const result = await checkSubscriptionStatus(currentUser.uid);
          setIsSubscribed(result.isPremium || false);
        } catch (error) {
          console.error('Error checking subscription:', error);
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    };

    checkSubscription();
  }, [currentUser]);

  const totalCards = leads.length || 1;

  // Create extended array for infinite loop (clone first few cards at end)
  const extendedLeads = leads.length > 0
    ? [...leads, ...leads.slice(0, Math.min(5, leads.length))]
    : [];

  // Auto-scroll every 3.5 seconds
  useEffect(() => {
    if (isPaused || leads.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused, leads.length]);

  // Handle infinite loop reset
  useEffect(() => {
    if (currentIndex >= totalCards && totalCards > 0) {
      // Wait for transition to complete, then instantly reset
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
        // Re-enable transition after reset
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, totalCards]);

  const translateX = -(currentIndex * (cardWidth + gap));
  const activeIndex = totalCards > 0 ? currentIndex % totalCards : 0;

  return (
    <div className="h-screen w-screen bg-[#F5F5F5] font-sans overflow-hidden flex flex-col">
      {/* Header - optimized for 1420px */}
      <div className="px-8 pt-5 pb-3">
        <div className="max-w-[1380px] mx-auto bg-white rounded-full shadow-sm border border-gray-100 px-8 py-2.5 flex justify-between items-center">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => onNavigate('landing')}>
            <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-9 w-auto" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('profile')}>
                <span className="text-gray-700 font-medium">Hi 👋 {(currentUser.name || 'User').split(' ')[0]}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FE9200] to-[#7A00AA] flex items-center justify-center text-white font-bold">
                  {(currentUser.name || 'U').charAt(0)}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('tenant-form')}
                  className="px-6 py-2.5 rounded-full bg-white border-2 border-[#FE9200] text-[#FE9200] font-semibold hover:bg-orange-50 transition-all"
                >
                  I Need a Place to Rent
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-6 py-2.5 rounded-full bg-[#FE9200] text-white font-semibold hover:bg-[#E58300] transition-all shadow-md"
                >
                  I Am An Agent
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section - optimized for 1420px */}
      <div className="flex-1 px-8 pb-5 flex flex-col min-h-0">
        <div className="flex-1 max-w-[1380px] w-full mx-auto relative rounded-[28px] overflow-hidden shadow-xl">
          {/* Hero Image */}
          <img
            src="/hero-section.jpg"
            alt="Modern homes"
            className="w-full h-full object-cover"
          />

          {/* Cards Carousel at Bottom - Same width as hero */}
          <div
            className="absolute bottom-6 left-0 right-0 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="mx-auto overflow-hidden px-4"
              style={{ maxWidth: '1380px' }}
            >
              {isLoading ? (
                // Loading skeleton
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-[#FFF5E6] rounded-[20px] p-2 w-[280px] flex-shrink-0 animate-pulse">
                      <div className="bg-white rounded-[16px] h-[200px]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  ref={trackRef}
                  className="flex"
                  style={{
                    gap: `${gap}px`,
                    transform: `translateX(${translateX}px)`,
                    transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
                  }}
                >
                  {extendedLeads.map((lead, index) => (
                    <LeadCard
                      key={`${lead.id}-${index}`}
                      lead={lead}
                      currentUser={currentUser}
                      onNavigate={onNavigate}
                      isSubscribed={isSubscribed}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2.5 py-4">
          {leads.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(index);
              }}
              className={`rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? 'bg-[#FE9200] w-3.5 h-3.5'
                  : 'bg-gray-300 w-2.5 h-2.5 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

