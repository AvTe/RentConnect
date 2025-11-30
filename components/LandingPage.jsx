/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLeads, useSubscription } from '@/lib/hooks';
import { trackAgentLeadContact } from '@/lib/firestore';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { 
  Home, 
  MapPin, 
  CheckCircle2, 
  Zap,
  Phone,
  Mail,
  Users,
  Lock,
  Eye
} from 'lucide-react';

const LeadCard = ({ lead, currentUser, isPremium, onNavigate, onContactClick }) => {
  const [isRevealing, setIsRevealing] = useState(false);

  const formatBudget = (amount) => {
    const num = parseInt(amount?.toString().replace(/[^0-9]/g, '') || '0');
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
  const area = lead?.requirements?.area || lead?.area || 'N/A';

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

    setIsRevealing(true);
    
    await trackAgentLeadContact(currentUser.uid, lead.id, type);
    
    if (onContactClick) {
      await onContactClick(lead.id, type, tenantPhone, tenantEmail);
    }
    
    setTimeout(() => setIsRevealing(false), 300);
  };

  const maskValue = (value, type) => {
    if (!value) return '—';
    if (isPremium && currentUser) return value;
    
    if (type === 'phone') {
      return value.substring(0, 4) + '****' + value.substring(value.length - 2);
    }
    if (type === 'email') {
      const [name, domain] = value.split('@');
      return name.substring(0, 2) + '***@' + (domain || '***');
    }
    return value;
  };

  return (
    <div className="bg-[#FFF5E6] rounded-[20px] p-2 w-[220px] flex-shrink-0 transform hover:scale-[1.02] transition-transform duration-300">
      <div className="bg-white rounded-[16px] overflow-hidden border-b-[5px] border-[#FE9200] h-full flex flex-col shadow-sm">
        <div className="p-3.5 flex flex-col flex-1">
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 bg-[#E8F5E9] px-2.5 py-1.5 rounded-full">
              <Users size={12} className="text-[#2E7D32]" />
              <span className="text-[10px] font-semibold text-[#2E7D32]">
                {contactCount} Agents
              </span>
            </div>
            <span className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm">
              {formatBudget(budget)}
            </span>
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-0.5 leading-tight">{propertyType}</h3>
          <div className="flex items-center gap-1 mb-3">
            <MapPin size={11} className="text-gray-400" />
            <p className="text-[11px] text-gray-500">{location}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gradient-to-br from-[#F8F8F8] to-[#F0F0F0] rounded-xl px-2.5 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FFF5E6] flex items-center justify-center">
                <Home size={12} className="text-[#FE9200]" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-wide">Type</p>
                <p className="text-[10px] text-gray-800 font-semibold truncate max-w-[50px]">{propertyType.split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#F8F8F8] to-[#F0F0F0] rounded-xl px-2.5 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                <MapPin size={12} className="text-[#2E7D32]" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-wide">Area</p>
                <p className="text-[10px] text-gray-800 font-semibold truncate max-w-[50px]">{area !== 'N/A' ? area : location.split(',')[0]}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#F8F8F8] to-[#F0F0F0] rounded-xl px-2.5 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
                <CheckCircle2 size={12} className="text-[#1976D2]" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-wide">Status</p>
                <p className="text-[10px] text-gray-800 font-semibold capitalize">{status}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#F8F8F8] to-[#F0F0F0] rounded-xl px-2.5 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FCE4EC] flex items-center justify-center">
                <Zap size={12} className="text-[#C2185B]" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-wide">Active</p>
                <p className="text-[10px] text-gray-800 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Live
                </p>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-[#FFF5E6] to-[#FFE8CC] rounded-xl p-3 border-2 border-[#FE9200] mt-auto overflow-hidden">
            {!isPremium && (
              <button
                onClick={handleOverlayClick}
                className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px] cursor-pointer hover:from-white/90 hover:via-white/75 transition-all"
              >
                <Lock size={16} className="text-[#FE9200] mb-1" />
                <p className="text-[7px] text-gray-600 text-center px-2 leading-tight font-medium">
                  Contact details available for subscribed agents
                </p>
                <span className="mt-1.5 text-[8px] bg-[#FE9200] text-white px-2.5 py-0.5 rounded-full font-semibold">
                  Subscribe Now
                </span>
              </button>
            )}
            
            <div className={`flex items-stretch justify-between gap-2 ${!isPremium ? 'blur-[3px]' : ''}`}>
              <button
                onClick={() => handleContactClick('phone')}
                disabled={!isPremium}
                className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                  isPremium 
                    ? 'bg-white/80 hover:bg-white cursor-pointer hover:shadow-md' 
                    : 'bg-white/50 pointer-events-none'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#FE9200]/10 flex items-center justify-center mb-1">
                  <Phone size={13} className="text-[#FE9200]" />
                </div>
                <p className="text-[8px] text-gray-500 font-medium">Phone</p>
                <p className="text-[9px] text-[#FE9200] font-bold truncate max-w-[70px]">
                  {maskValue(tenantPhone, 'phone')}
                </p>
              </button>
              
              <div className="w-px bg-[#FE9200]/30 my-1" />
              
              <button
                onClick={() => handleContactClick('email')}
                disabled={!isPremium}
                className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                  isPremium 
                    ? 'bg-white/80 hover:bg-white cursor-pointer hover:shadow-md' 
                    : 'bg-white/50 pointer-events-none'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#FE9200]/10 flex items-center justify-center mb-1">
                  <Mail size={13} className="text-[#FE9200]" />
                </div>
                <p className="text-[8px] text-gray-500 font-medium">Email</p>
                <p className="text-[9px] text-[#FE9200] font-bold truncate max-w-[70px]">
                  {maskValue(tenantEmail, 'email')}
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-2 py-1.5 bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] rounded-lg">
            <Eye size={10} className="text-[#2E7D32]" />
            <p className="text-[9px] font-semibold text-[#2E7D32]">
              {contactCount} agent{contactCount !== 1 ? 's' : ''} contacted this lead
            </p>
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

  const { leads, loading } = useLeads({}, true);
  const { isPremium } = useSubscription(currentUser?.uid);

  const displayLeads = useMemo(() => {
    return leads && leads.length > 0 ? leads : [];
  }, [leads]);

  const cardWidth = 220;
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
                    <div key={i} className="w-[220px] flex-shrink-0">
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
