'use client';
import React from 'react';
import { Phone, Mail } from 'lucide-react';

/**
 * LeadCard Component
 * Mobile Guidelines:
 * - Card padding: 12-16px
 * - Border radius: 12-16px (rounded-xl = 12px)
 * - Text sizes: Title 16-18px, Body 14px, Small 12px
 */
export const LeadCard = ({
  lead,
  onContact,
  showContactInfo = false,
  isPremium = false,
  compact = false
}) => {
  const {
    type = 'Mini Flat',
    location = 'Location',
    budget = '0',
    whatsapp = '',
    email = '',
    contactCount = 0,
  } = lead || {};

  const formatBudget = (amount) => {
    const num = parseInt(amount?.toString().replace(/[^0-9]/g, '') || '0');
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${(num / 1000).toFixed(0)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Compact version for carousel/grid display
  if (compact) {
    return (
      <div className="bg-[#FFF5E6] rounded-xl p-1.5 min-w-[240px] max-w-[280px]">
        <div className="bg-white rounded-xl p-3 border border-[#FE9200]/30 h-full">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-900 truncate">{type}</h3>
              <p className="text-gray-400 text-xs truncate">{location}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <div className="bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full text-[10px] font-medium">
              {contactCount} Contacts
            </div>
            <div className="bg-[#FE9200] text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
              {formatBudget(budget)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="bg-gray-50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-gray-600">Property: <span className="text-[#FE9200] font-medium">{type}</span></span>
            </div>
            <div className="bg-gray-50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-gray-600">Budget: <span className="text-[#FE9200] font-medium">{formatBudget(budget)}</span></span>
            </div>
            <div className="bg-gray-50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-gray-600">Location: <span className="text-[#FE9200] font-medium">View</span></span>
            </div>
            <div className="bg-gray-50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-gray-600">Status: <span className="text-[#FE9200] font-medium">Active</span></span>
            </div>
          </div>
          <div className="bg-[#FFF5E6] rounded-lg p-2 border border-[#FE9200]/20">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Mobile</span>
              </div>
              <div className="w-px h-3 bg-[#FE9200]/40" />
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Email</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-size card - responsive for mobile
  return (
    <div className="bg-[#FFF5E6] rounded-xl md:rounded-2xl p-1.5 md:p-2">
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#FE9200]/30 h-full">
        {/* Header - stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 md:mb-4">
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">{type}</h3>
            <p className="text-gray-400 text-sm truncate">{location}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-full text-xs font-medium">
              {contactCount} Contacts
            </div>
            <div className="bg-[#FE9200] text-white px-3 py-1 rounded-full text-xs font-semibold">
              {formatBudget(budget)}
            </div>
          </div>
        </div>

        {/* Info grid - 12-16px padding per guidelines */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
            <span className="text-xs md:text-sm text-gray-700">Property: <span className="text-[#FE9200] font-semibold">{type}</span></span>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
            <span className="text-xs md:text-sm text-gray-700">Budget: <span className="text-[#FE9200] font-semibold">{formatBudget(budget)}</span></span>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
            <span className="text-xs md:text-sm text-gray-700">Location: <span className="text-[#FE9200] font-semibold truncate">{location}</span></span>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
            <span className="text-xs md:text-sm text-gray-700">Status: <span className="text-[#FE9200] font-semibold">Active</span></span>
          </div>
        </div>

        {/* Contact info section */}
        <div className="bg-[#FFF5E6] rounded-xl p-3 md:p-4 border border-[#FE9200]/20">
          {showContactInfo || isPremium ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-around gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{whatsapp || 'N/A'}</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-[#FE9200]/40" />
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{email || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-xs md:text-sm text-gray-500">Mobile Number</span>
              </div>
              <div className="w-px h-5 bg-[#FE9200]/40" />
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-xs md:text-sm text-gray-500">Email Address</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
