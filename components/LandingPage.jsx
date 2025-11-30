/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLeads, useSubscription } from '@/lib/hooks';
import { trackAgentLeadContact } from '@/lib/firestore';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { 
  Home, 
  MapPin, 
  Clock, 
  Zap,
  Phone,
  Mail,
  Users,
  Lock
} from 'lucide-react';

const LeadCard = ({ lead, currentUser, isPremium, onNavigate, onContactClick }) => {
  const formatBudget = (amount) => {
    const num = parseInt(amount?.toString().replace(/[^0-9]/g, '') || '0');
    if (num >= 10000000) return `₦${(num / 1000000).toFixed(1)}M`;
    if (num >= 100000) return `₦${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₦${(num / 1000).toFixed(0)}K`;
    return `₦${num.toLocaleString()}`;
  };

  const propertyType = lead?.requirements?.property_type || lead?.type || 'Property';
  const location = lead?.requirements?.location || lead?.location || 'Location';
  const budget = lead?.requirements?.budget || lead?.budget || '0';
  const contactCount = lead?.contacts || 0;
  const tenantPhone = lead?.tenant_info?.phone || '';
  const tenantEmail = lead?.tenant_info?.email || '';
  const status = lead?.status || 'active';
  const area = lead?.requirements?.area || location.split(',')[0] || 'N/A';

  const handleOverlayClick = () => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    if (!isPremium) {
      onNavigate('subscription');
      return;
    }
  };

  const handleContactClick = async (type) => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }

    if (!isPremium) {
      onNavigate('subscription');
      return;
    }
    
    await trackAgentLeadContact(currentUser.uid, lead.id, type);
    
    if (onContactClick) {
      await onContactClick(lead.id, type, tenantPhone, tenantEmail);
    }
  };

  return (
    <div className="bg-[#FFF5E6] rounded-[20px] p-2.5 w-[280px] flex-shrink-0">
      <div className="bg-white rounded-[16px] overflow-hidden border-b-[5px] border-[#FE9200] h-full flex flex-col shadow-sm">
        <div className="p-4 flex flex-col flex-1">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 bg-[#E8F5E9] px-3 py-2 rounded-full">
              <Users size={14} className="text-[#2E7D32]" />
              <span className="text-[11px] font-semibold text-[#2E7D32]">
                {contactCount} Agents Contacted
              </span>
            </div>
            <span className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] text-white px-3 py-2 rounded-full text-[11px] font-bold shadow-sm">
              {formatBudget(budget)}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">{propertyType}</h3>
          <p className="text-sm text-gray-500 mb-4">{location}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#F5F5F5] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Home size={14} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">Type</span>
              </div>
              <p className="text-[13px] text-[#2E7D32] font-semibold">{propertyType}</p>
            </div>
            
            <div className="bg-[#F5F5F5] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">Area</span>
              </div>
              <p className="text-[13px] text-[#2E7D32] font-semibold">{area}</p>
            </div>
            
            <div className="bg-[#F5F5F5] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">Status</span>
              </div>
              <p className="text-[13px] text-[#2E7D32] font-semibold capitalize">{status}</p>
            </div>
            
            <div className="bg-[#F5F5F5] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">Ready</span>
              </div>
              <p className="text-[13px] text-[#2E7D32] font-semibold">Available</p>
            </div>
          </div>

          {isPremium ? (
            <div className="bg-[#E8F5E9] rounded-xl p-3 border-2 border-[#2E7D32] mt-auto">
              <div className="flex items-center justify-around">
                <button
                  onClick={() => handleContactClick('phone')}
                  className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center">
                    <Phone size={14} className="text-white" />
                  </div>
                  <span className="text-[10px] text-[#2E7D32] font-medium">Call</span>
                </button>
                <div className="w-px h-10 bg-[#2E7D32]/30" />
                <button
                  onClick={() => handleContactClick('email')}
                  className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center">
                    <Mail size={14} className="text-white" />
                  </div>
                  <span className="text-[10px] text-[#2E7D32] font-medium">Email</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleOverlayClick}
              className="bg-[#FFF5E6] rounded-xl p-4 border-2 border-[#FE9200] mt-auto hover:bg-[#FFE8CC] transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <Lock size={20} className="text-[#FE9200]" />
                <p className="text-[12px] text-gray-600 text-center">
                  Contact details available for
                </p>
                <p className="text-[13px] text-[#FE9200] font-semibold">
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

export const LandingPage = ({ onNavigate, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);

  const { leads, loading } = useLeads({}, true);
  const { isPremium } = useSubscription(currentUser?.uid);

  const displayLeads = useMemo(() => {
    return leads && leads.length > 0 ? leads : [];
  }, [leads]);

  const cardWidth = 280;
  const gap = 16;
  const totalCards = displayLeads.length || 1;

  const extendedLeads = displayLeads.length > 0 
    ? [...displayLeads, ...displayLeads.slice(0, Math.min(5, displayLeads.length))]
    : [];

  useEffect(() => {
    if (isPaused || displayLeads.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused, displayLeads.length]);

  useEffect(() => {
    if (displayLeads.length === 0) return;
    
    if (currentIndex >= totalCards) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, totalCards, displayLeads.length]);

  const handleContactClick = async (leadId, type, phone, email) => {
    console.log(`Contact clicked: Lead ${leadId}, Type: ${type}`);
    if (type === 'phone' && phone) {
      window.location.href = `tel:${phone}`;
    } else if (type === 'email' && email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const translateX = -(currentIndex * (cardWidth + gap));
  const activeIndex = displayLeads.length > 0 ? currentIndex % totalCards : 0;

  return (
    <div className="h-screen w-screen bg-[#F5F5F5] font-sans overflow-hidden flex flex-col">
      <div className="px-8 pt-5 pb-3">
        <div className="max-w-[1380px] mx-auto bg-white rounded-full shadow-sm border border-gray-100 px-8 py-2.5 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => onNavigate('landing')}>
            <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-9 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('profile')}>
                <span className="text-gray-700 font-medium">Hi {(currentUser.name || 'User').split(' ')[0]}</span>
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

      <div className="flex-1 px-8 pb-5 flex flex-col min-h-0">
        <div className="flex-1 max-w-[1380px] w-full mx-auto relative rounded-[28px] overflow-hidden shadow-xl">
          <img
            src="/hero-section.jpg"
            alt="Modern homes"
            className="w-full h-full object-cover"
          />

          <div
            className="absolute bottom-6 left-0 right-0 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="mx-auto overflow-hidden px-4"
              style={{ maxWidth: '1380px' }}
            >
              {loading ? (
                <div className="flex gap-4 px-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-[280px] flex-shrink-0">
                      <SkeletonCard />
                    </div>
                  ))}
                </div>
              ) : extendedLeads.length > 0 ? (
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
                      isPremium={isPremium}
                      onNavigate={onNavigate}
                      onContactClick={handleContactClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>No property leads available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {displayLeads.length > 0 && (
          <div className="flex justify-center items-center gap-2.5 py-4">
            {displayLeads.map((_, index) => (
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
        )}
      </div>
    </div>
  );
};
