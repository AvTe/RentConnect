/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from 'react';

// Sample leads for carousel
const sampleLeads = [
  { id: 1, type: 'Mini Flat', location: 'Bengaluru, Karnataka', budget: '1500000', contactCount: 5 },
  { id: 2, type: 'Mini Flat', location: 'Bengaluru, Karnataka', budget: '2500000', contactCount: 8 },
  { id: 3, type: 'Mini Flat', location: 'Bengaluru, Karnataka', budget: '800000', contactCount: 3 },
  { id: 4, type: 'Mini Flat', location: 'Bengaluru, Karnataka', budget: '1200000', contactCount: 6 },
  { id: 5, type: 'Mini Flat', location: 'Bengaluru, Karnataka', budget: '3500000', contactCount: 2 },
];

// Lead Card matching mockup EXACTLY
const LeadCard = ({ lead }) => {
  const formatBudget = (amount) => {
    const num = parseInt(amount?.toString().replace(/[^0-9]/g, '') || '0');
    if (num >= 100000) return `₦${(num / 100000).toFixed(1)}L`;
    return `₦${num.toLocaleString()}`;
  };

  return (
    <div className="bg-[#FFF5E6] rounded-[20px] p-2 w-[200px] flex-shrink-0">
      <div className="bg-white rounded-[16px] overflow-hidden border-b-[5px] border-[#FE9200] h-full flex flex-col">
        {/* Content area with padding */}
        <div className="p-3 flex flex-col flex-1">
          {/* Badges at top */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-full text-[10px] font-medium">
              {lead.contactCount} Contacts
            </span>
            <span className="bg-[#FE9200] text-white px-2.5 py-1 rounded-full text-[10px] font-semibold">
              {formatBudget(lead.budget)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 mb-0.5">{lead.type}</h3>
          <p className="text-xs text-gray-400 mb-3">{lead.location}</p>

          {/* 2x2 Specs Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#F8F8F8] rounded-xl px-2.5 py-2">
                <p className="text-[9px] text-gray-500 mb-0.5">Specification:</p>
                <p className="text-[9px] text-[#FE9200] font-medium">Housing type With</p>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-[#FFF5E6] rounded-xl p-2.5 border-2 border-[#FE9200] mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-[8px] text-gray-600 font-medium">Leads Mobile Number</p>
                <p className="text-[8px] text-gray-400">With Icons</p>
              </div>
              <div className="w-px h-6 bg-[#FE9200] mx-2" />
              <div className="flex-1 text-center">
                <p className="text-[8px] text-gray-600 font-medium">Leads Email</p>
                <p className="text-[8px] text-gray-400">With Icons</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage = ({ onNavigate, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);

  const cardWidth = 200;
  const gap = 16;
  const totalCards = sampleLeads.length;

  // Create extended array for infinite loop (clone first few cards at end)
  const extendedLeads = [...sampleLeads, ...sampleLeads.slice(0, 5)];

  // Auto-scroll every 3.5 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Handle infinite loop reset
  useEffect(() => {
    if (currentIndex >= totalCards) {
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
  const activeIndex = currentIndex % totalCards;

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
                  <LeadCard key={`${lead.id}-${index}`} lead={lead} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2.5 py-4">
          {sampleLeads.map((_, index) => (
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

