/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLeads, useSubscription } from "@/lib/hooks";
import { trackAgentLeadContact } from "@/lib/database";
import {
  Home,
  MapPin,
  Clock,
  Zap,
  Phone,
  Mail,
  Users,
  Lock,
  CheckCircle,
  Shield,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const LeadCard = ({
  lead,
  currentUser,
  isPremium,
  onNavigate,
  onContactClick,
  isMobile,
}) => {
  const formatBudget = (amount) => {
    const num = parseInt(amount?.toString().replace(/[^0-9]/g, "") || "0");
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${(num / 1000).toFixed(0)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Get property type with smart fallback
  const rawPropertyType = lead?.requirements?.property_type || lead?.type || "";

  // Map generic/missing values to more descriptive text based on budget
  const getPropertyTypeDisplay = (type, budget) => {
    // If we have a valid property type, use it
    const validTypes = ["1 Bedroom", "2 Bedroom", "3 Bedroom", "3+ Bedroom", "Studio", "Self Contain", "Duplex", "Mini Flat", "Apartment", "House", "Bungalow"];
    if (type && validTypes.some(t => type.toLowerCase().includes(t.toLowerCase()))) {
      return type;
    }

    // Smart fallback based on budget
    const budgetNum = parseInt(budget?.toString().replace(/[^0-9]/g, "") || "0");
    if (budgetNum >= 100000) return "Premium Rental";
    if (budgetNum >= 50000) return "Family Home";
    if (budgetNum >= 25000) return "Apartment";
    if (budgetNum > 0) return "Studio/Bedsitter";
    return "Rental Property";
  };

  const propertyType = getPropertyTypeDisplay(rawPropertyType, lead?.requirements?.budget || lead?.budget);
  const location = lead?.requirements?.location || lead?.location || "Nairobi";
  const budget = lead?.requirements?.budget || lead?.budget || "0";
  const contactCount = lead?.contacts || 0;
  const tenantPhone = lead?.tenant_info?.phone || "";
  const tenantEmail = lead?.tenant_info?.email || "";
  const status = lead?.status || "active";
  const area = lead?.requirements?.area || location.split(",")[0] || "N/A";

  const handleOverlayClick = () => {
    if (!currentUser) {
      onNavigate("login", { tab: "agent" });
      return;
    }
    if (!isPremium) {
      onNavigate("subscription");
      return;
    }
  };

  const handleContactClick = async (type) => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }

    if (!isPremium) {
      onNavigate("subscription");
      return;
    }

    await trackAgentLeadContact(currentUser.uid, lead.id, type);

    if (onContactClick) {
      await onContactClick(lead.id, type, tenantPhone, tenantEmail);
    }
  };

  // Mobile compact card (optimized for exactly 2 per screen)
  // Width calculation: (100vw - container padding - inner padding - gap) / 2
  // = (100vw - 24px - 24px - 8px) / 2 = 50vw - 28px
  if (isMobile) {
    return (
      <div className="bg-[#FFF5E6] rounded-xl p-1.5 w-[calc(50vw-28px)] flex-shrink-0 select-none">
        <div className="bg-white rounded-lg overflow-hidden border-b-[3px] border-[#FE9200] h-full flex flex-col shadow-sm">
          <div className="p-2 flex flex-col flex-1">
            {/* Top badges - compact */}
            <div className="flex items-center justify-between mb-1.5 gap-1">
              <div className="flex items-center gap-0.5 bg-[#E8F5E9] px-1.5 py-0.5 rounded-full">
                <Users size={8} className="text-[#2E7D32]" />
                <span className="text-[7px] font-semibold text-[#2E7D32]">
                  {contactCount}
                </span>
              </div>
              <span className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] text-white px-1.5 py-0.5 rounded-full text-[7px] font-bold">
                {formatBudget(budget)}
              </span>
            </div>

            {/* Property info - compact */}
            <h3 className="text-xs font-bold text-gray-900 mb-0.5 truncate leading-tight">
              {propertyType}
            </h3>
            <p className="text-[9px] text-gray-500 mb-2 truncate">{location}</p>

            {/* Compact status badges - no redundancy */}
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-0.5 bg-[#E8F5E9] px-1.5 py-0.5 rounded-full">
                <CheckCircle size={8} className="text-[#2E7D32]" />
                <span className="text-[7px] text-[#2E7D32] font-medium capitalize">{status}</span>
              </div>
              <div className="flex items-center gap-0.5 bg-[#FFF5E6] px-1.5 py-0.5 rounded-full">
                <Zap size={8} className="text-[#FE9200]" />
                <span className="text-[7px] text-gray-600 font-medium">Ready</span>
              </div>
            </div>

            {/* Contact section - compact */}
            {isPremium ? (
              <div className="bg-[#E8F5E9] rounded-lg p-1.5 mt-auto">
                <div className="flex items-center justify-around">
                  <button
                    onClick={() => handleContactClick("phone")}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2E7D32] hover:bg-[#1B5E20] transition-colors"
                  >
                    <Phone size={12} className="text-white" />
                  </button>
                  <div className="w-px h-5 bg-[#2E7D32]/30" />
                  <button
                    onClick={() => handleContactClick("email")}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2E7D32] hover:bg-[#1B5E20] transition-colors"
                  >
                    <Mail size={12} className="text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleOverlayClick}
                className="bg-[#FFF5E6] rounded-lg p-2 border border-[#FE9200] mt-auto hover:bg-[#FFE8CC] transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <Lock size={10} className="text-[#FE9200]" />
                  <span className="text-[8px] text-[#FE9200] font-semibold">
                    Subscribe
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop/tablet card (original design)
  return (
    <div className="bg-[#FFF5E6] rounded-[16px] p-2 w-[240px] flex-shrink-0 select-none">
      <div className="bg-white rounded-[12px] overflow-hidden border-b-4 border-[#FE9200] h-full flex flex-col shadow-sm">
        <div className="p-3 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 bg-[#E8F5E9] px-2 py-1.5 rounded-full">
              <Users size={11} className="text-[#2E7D32]" />
              <span className="text-[9px] font-semibold text-[#2E7D32]">
                {contactCount} Agents Contacted
              </span>
            </div>
            <span className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] text-white px-2 py-1.5 rounded-full text-[9px] font-bold shadow-sm">
              {formatBudget(budget)}
            </span>
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-0.5 truncate">
            {propertyType}
          </h3>
          <p className="text-xs text-gray-500 mb-3 truncate">{location}</p>

          {/* Compact info row - no redundancy */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-[#F5F5F5] px-2 py-1.5 rounded-full">
              <CheckCircle size={10} className="text-[#2E7D32]" />
              <span className="text-[9px] text-[#2E7D32] font-medium capitalize">{status}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#F5F5F5] px-2 py-1.5 rounded-full">
              <Zap size={10} className="text-[#FE9200]" />
              <span className="text-[9px] text-gray-600 font-medium">Ready to Move</span>
            </div>
          </div>

          {isPremium ? (
            <div className="bg-[#E8F5E9] rounded-lg p-2.5 border-2 border-[#2E7D32] mt-auto">
              <div className="flex items-center justify-around">
                <button
                  onClick={() => handleContactClick("phone")}
                  className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-[#2E7D32] flex items-center justify-center">
                    <Phone size={11} className="text-white" />
                  </div>
                  <span className="text-[8px] text-[#2E7D32] font-medium">
                    Call
                  </span>
                </button>
                <div className="w-px h-8 bg-[#2E7D32]/30" />
                <button
                  onClick={() => handleContactClick("email")}
                  className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-[#2E7D32] flex items-center justify-center">
                    <Mail size={11} className="text-white" />
                  </div>
                  <span className="text-[8px] text-[#2E7D32] font-medium">
                    Email
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleOverlayClick}
              className="bg-[#FFF5E6] rounded-lg p-3 border-2 border-[#FE9200] mt-auto hover:bg-[#FFE8CC] transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center gap-0.5">
                <Lock size={16} className="text-[#FE9200]" />
                <p className="text-[10px] text-gray-600 text-center">
                  Contact details available for
                </p>
                <p className="text-[11px] text-[#FE9200] font-semibold">
                  Subscribed Agents
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCardSmall = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="bg-[#FFF5E6] rounded-xl p-1.5 w-[calc(50vw-28px)] flex-shrink-0 animate-pulse">
        <div className="bg-white rounded-lg p-2 h-[180px]">
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded-full w-8"></div>
            <div className="h-4 bg-gray-200 rounded-full w-12"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-100 rounded"></div>
            ))}
          </div>
          <div className="h-8 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF5E6] rounded-[16px] p-2 w-[240px] flex-shrink-0 animate-pulse">
      <div className="bg-white rounded-[12px] p-3 h-[280px]">
        <div className="flex justify-between mb-3">
          <div className="h-5 bg-gray-200 rounded-full w-24"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
        <div className="h-14 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );
};

export const LandingPage = ({ onNavigate, currentUser, authError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [cardWidth, setCardWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(false);
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Drag scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const { leads, loading } = useLeads({}, true);
  const { isPremium } = useSubscription(currentUser?.uid);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Measure actual card width from DOM to ensure drag calculations match rendered width
  useEffect(() => {
    if (!cardRef.current) return;

    const measureCard = () => {
      if (cardRef.current) {
        const width = cardRef.current.offsetWidth;
        if (width > 0) setCardWidth(width);
      }
    };

    // Initial measurement
    measureCard();

    // Re-measure on resize
    const observer = new ResizeObserver(measureCard);
    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [isMobile, loading]); // Re-run when mobile state or loading changes

  const displayLeads = useMemo(() => {
    return leads && leads.length > 0 ? leads : [];
  }, [leads]);

  // Responsive gap
  const gap = isMobile ? 8 : 12;
  const totalCards = displayLeads.length || 1;

  const extendedLeads =
    displayLeads.length > 0
      ? [
          ...displayLeads,
          ...displayLeads.slice(0, Math.min(5, displayLeads.length)),
        ]
      : [];

  // Check subscription status for logged-in agents
  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser?.uid && currentUser?.role === "agent") {
        try {
          const { checkSubscriptionStatus } = await import("@/lib/database");
          const result = await checkSubscriptionStatus(currentUser.uid);
          setIsSubscribed(result.isPremium || false);
        } catch (error) {
          console.error("Error checking subscription:", error);
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    };

    checkSubscription();
  }, [currentUser?.uid, currentUser?.role]);

  // Update loading state when leads hook loading changes
  useEffect(() => {
    if (!loading) {
      setIsLoading(false);
    }
  }, [loading]);

  // Auto-scroll every 3.5 seconds
  useEffect(() => {
    if (isPaused || leads.length === 0 || isDragging) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, leads.length, isDragging]);

  // Reset carousel when reaching end
  useEffect(() => {
    if (displayLeads.length === 0) return;

    if (currentIndex >= totalCards && totalCards > 0) {
      // Wait for transition to complete, then instantly reset
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
        setDragOffset(0);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        });
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, totalCards, displayLeads.length]);

  // Drag handlers for smooth scrolling
  const handleMouseDown = useCallback((e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setHasDragged(false);
    setIsPaused(true);
    setStartX(e.pageX || e.touches?.[0]?.pageX || 0);
    setIsTransitioning(false);
    setDragOffset(0);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX || e.touches?.[0]?.pageX || 0;
      const walk = startX - x;

      if (Math.abs(walk) > 5) {
        setHasDragged(true);
      }

      setDragOffset(walk);
    },
    [isDragging, startX],
  );

  const handleMouseUp = useCallback(() => {
    const wasDragging = isDraggingRef.current;

    if (!wasDragging) {
      setIsPaused(false);
      return;
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    const cardFullWidth = cardWidth + gap;
    const indexChange = Math.round(dragOffset / cardFullWidth);
    const newIndex = currentIndex + indexChange;

    const clampedIndex = Math.max(
      0,
      Math.min(newIndex, displayLeads.length - 1),
    );

    setIsTransitioning(true);
    setCurrentIndex(clampedIndex);
    setDragOffset(0);

    setTimeout(() => {
      setIsPaused(false);
      setHasDragged(false);
    }, 100);
  }, [dragOffset, cardWidth, gap, currentIndex, displayLeads.length]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setHasDragged(false);
    setIsPaused(true);
    setStartX(e.touches[0].pageX);
    setIsTransitioning(false);
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX;
      const walk = startX - x;

      if (Math.abs(walk) > 5) {
        setHasDragged(true);
      }

      setDragOffset(walk);
    },
    [isDragging, startX],
  );

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleContactClick = async (leadId, type, phone, email) => {
    if (hasDragged) return;
    console.log(`Contact clicked: Lead ${leadId}, Type: ${type}`);
    if (type === "phone" && phone) {
      window.location.href = `tel:${phone}`;
    } else if (type === "email" && email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const baseTranslateX = -(currentIndex * (cardWidth + gap));
  const translateX = baseTranslateX - dragOffset;
  const activeIndex = displayLeads.length > 0 ? currentIndex % totalCards : 0;

  return (
    <div className="h-screen w-screen bg-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-2 sm:pb-3 relative z-20">
        <div className="max-w-[1400px] mx-auto bg-white rounded-full shadow-lg border border-gray-100 px-4 sm:px-8 py-2 sm:py-3 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => onNavigate("landing")}>
            <img
              src="/yoombaa-logo.svg"
              alt="Yoombaa"
              className="h-7 sm:h-10 w-auto"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser ? (
              <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                onClick={() => onNavigate("profile")}
              >
                <span className="hidden sm:block text-gray-700 font-medium text-sm">
                  Hi {String(currentUser.name || "User").split(" ")[0]}
                </span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#FE9200] to-[#FF6B00] flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md">
                  {String(currentUser.name || "U").charAt(0)}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("login", { tab: "agent" })}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#FE9200] text-white font-medium hover:bg-[#E58300] transition-all shadow-md hover:shadow-lg text-xs whitespace-nowrap"
                >
                  I Am An Agent
                </button>
                <button
                  onClick={() => onNavigate("login", { tab: "tenant" })}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0B8A4D] text-white font-medium hover:bg-[#097a43] transition-all shadow-md hover:shadow-lg text-xs whitespace-nowrap"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {/* Hero Background Container */}
        <div className="absolute inset-0 mx-3 sm:mx-6 lg:mx-8 mb-16 sm:mb-20">
          <div className="h-[115%] w-full max-w-[1400px] mx-auto relative rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* Hero Background Image */}
            <img
              src="/hero-section.jpg"
              alt="Modern homes"
              className="w-full h-full object-cover"
            />

            {/* Dark gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40 pointer-events-none" />
          </div>
        </div>

        {/* Hero Content - Centered */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-48 sm:pb-56">
          <div className="text-center max-w-3xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-2 sm:mb-3 drop-shadow-sm">
              Find Verified Tenants
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium italic text-[#FE9200] leading-tight mb-4 sm:mb-5 drop-shadow-sm">
              Looking For Rentals
            </h2>

{/* 
            <p className="text-base text-gray-700 mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed px-4">
              Connect With Active Renters In Nairobi. Get Their Contact Details. Close Deals Faster.
            </p> */}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate("tenant-form")}
                className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white border-2 border-[#FE9200] text-[#FE9200] font-medium hover:bg-orange-50 transition-all text-sm shadow-md hover:shadow-lg"
              >
                I Need a Place to Rent
              </button>
              <button
                onClick={() => onNavigate("tenant-form")}
                className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#FE9200] text-white font-medium hover:bg-[#E58300] transition-all shadow-md hover:shadow-lg text-sm"
              >
                I&apos;m Looking For House
              </button>
            </div>
          </div>
        </div>

        {/* Cards Section - Positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Cards Carousel */}
            <div
              ref={containerRef}
              className="overflow-hidden touch-pan-y pb-4 sm:pb-6"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => {
                if (isDraggingRef.current) handleMouseUp();
                else setIsPaused(false);
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <div className="overflow-visible">
                {loading ? (
                  <div className="flex gap-2 sm:gap-3 px-1 sm:px-2">
                    {(isMobile ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6]).map((i) => (
                      <SkeletonCardSmall key={i} isMobile={isMobile} />
                    ))}
                  </div>
                ) : extendedLeads.length > 0 ? (
                  <div
                    ref={trackRef}
                    className="flex will-change-transform"
                    style={{
                      gap: `${gap}px`,
                      transform: `translateX(${translateX}px)`,
                      transition:
                        isTransitioning && !isDragging
                          ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                          : "none",
                    }}
                  >
                    {extendedLeads.map((lead, index) => (
                      <div
                        key={`${lead.id}-${index}`}
                        ref={index === 0 ? cardRef : null}
                      >
                        <LeadCard
                          lead={lead}
                          currentUser={currentUser}
                          isPremium={isPremium}
                          onNavigate={onNavigate}
                          onContactClick={handleContactClick}
                          isMobile={isMobile}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 sm:h-48 text-gray-500 bg-white/90 backdrop-blur-sm rounded-xl mx-2 sm:mx-4">
                    <p className="text-xs sm:text-base">
                      No property leads available yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      {displayLeads.length > 0 && (
        <div className="flex justify-center items-center gap-1.5 sm:gap-2 py-2 sm:py-3 bg-white/80 backdrop-blur-sm">
          {displayLeads
            .slice(0, Math.min(displayLeads.length, isMobile ? 6 : 8))
            .map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                }}
                className={`rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-[#FE9200] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5"
                    : "bg-gray-400 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 hover:bg-gray-500"
                }`}
              />
            ))}
          {displayLeads.length > (isMobile ? 6 : 8) && (
            <span className="text-[10px] sm:text-xs text-gray-500 ml-0.5 sm:ml-1">
              +{displayLeads.length - (isMobile ? 6 : 8)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
