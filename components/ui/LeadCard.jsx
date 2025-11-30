'use client';
import React from 'react';
import { Phone, Mail } from 'lucide-react';

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

  if (compact) {
    return (
      <div className="bg-[#FFF5E6] rounded-[20px] p-[6px] min-w-[260px] max-w-[280px]">
        <div className="bg-white rounded-[16px] p-4 border-2 border-[#FE9200]/40 h-full">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">{type}</h3>
              <p className="text-gray-400 text-xs">{location}</p>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded-full text-[10px] font-medium">
              {contactCount} Contacts
            </div>
            <div className="bg-[#FE9200] text-white px-3 py-1 rounded-full text-[10px] font-semibold">
              {formatBudget(budget)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
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
          <div className="bg-[#FFF5E6] rounded-xl p-2 border-2 border-[#FE9200]/30">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Mobile</span>
              </div>
              <div className="w-px h-4 bg-[#FE9200]/40" />
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

  return (
    <div className="bg-[#FFF5E6] rounded-[24px] p-2">
      <div className="bg-white rounded-[20px] p-6 border-2 border-[#FE9200]/40 h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{type}</h3>
            <p className="text-gray-400 text-lg">{location}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-[#E8F5E9] text-[#2E7D32] px-4 py-2 rounded-full text-xs font-medium">
              {contactCount} Contacts
            </div>
            <div className="bg-[#FE9200] text-white px-5 py-2 rounded-full text-sm font-semibold">
              {formatBudget(budget)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <span className="text-sm text-gray-700">Property: <span className="text-[#FE9200] font-semibold">{type}</span></span>
          </div>
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <span className="text-sm text-gray-700">Budget: <span className="text-[#FE9200] font-semibold">{formatBudget(budget)}</span></span>
          </div>
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <span className="text-sm text-gray-700">Location: <span className="text-[#FE9200] font-semibold">{location}</span></span>
          </div>
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <span className="text-sm text-gray-700">Status: <span className="text-[#FE9200] font-semibold">Active</span></span>
          </div>
        </div>
        <div className="bg-[#FFF5E6] rounded-2xl p-5 border-2 border-[#FE9200]/30">
          {showContactInfo || isPremium ? (
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{whatsapp || 'N/A'}</span>
              </div>
              <div className="w-px h-8 bg-[#FE9200]/40" />
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{email || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Mobile Number</span>
              </div>
              <div className="w-px h-8 bg-[#FE9200]/40" />
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Email Address</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
