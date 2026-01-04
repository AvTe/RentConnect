"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Calendar, DollarSign, Eye, Phone, Trash2, XCircle, CheckCircle,
  ArrowLeft, Clock, Users, Home, MessageCircle, Flag, AlertCircle,
  Coins, FileText, Loader2, UserCheck, Lock, Unlock, RefreshCw, Crown,
  PhoneOff, UserX, HelpCircle, Copy, ExternalLink, Mail, Edit,
  ToggleLeft, ToggleRight, Save, X, Settings, CreditCard, Timer, EyeOff, RotateCcw, Play, Pause
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { updateLead, deleteLead, getLeadConnections, getBadLeadReports } from '@/lib/database';
import { useToast } from '@/context/ToastContext';

export const LeadDetail = ({ lead, onBack, onUpdate }) => {
  const { toast, showConfirm } = useToast();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editForm, setEditForm] = useState({
    property_type: lead?.property_type || '',
    location: lead?.location || '',
    budget: lead?.budget || '',
    status: lead?.status || 'active',
    tenant_name: lead?.tenant_name || '',
    tenant_phone: lead?.tenant_phone || '',
    tenant_email: lead?.tenant_email || '',
    bedrooms: lead?.bedrooms || ''
  });
  const [pricingForm, setPricingForm] = useState({
    base_price: lead?.base_price || 250,
    max_slots: lead?.max_slots || 3
  });
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState(null); // 'reactivate', 'expire', 'hide', 'duration'
  const [durationHours, setDurationHours] = useState(48);

  // Update current time every minute for remaining time calculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate remaining time for lead (uses expires_at if available, else 48 hours from creation)
  const getRemainingTime = (createdAt, expiresAt) => {
    if (!createdAt && !expiresAt) return "N/A";
    const expiry = expiresAt
      ? new Date(expiresAt).getTime()
      : new Date(createdAt).getTime() + (48 * 60 * 60 * 1000);
    const diff = expiry - currentTime.getTime();
    if (diff <= 0) return "EXPIRED";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Format budget with KSh and K/M suffixes
  const formatBudget = (amount) => {
    if (!amount) return 'N/A';
    const num = parseInt(amount);
    if (isNaN(num)) return amount;
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${(num / 1000).toFixed(0)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Fetch connections (agents who unlocked this lead)
  const fetchConnections = useCallback(async () => {
    if (!lead?.id) return;
    setLoadingConnections(true);
    try {
      const result = await getLeadConnections(lead.id);
      if (result.success) {
        setConnections(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  }, [lead?.id]);

  // Fetch bad lead reports for this lead
  const fetchReports = useCallback(async () => {
    if (!lead?.id) return;
    try {
      const result = await getBadLeadReports({ leadId: lead.id });
      if (result.success) {
        setReports(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, [lead?.id]);

  useEffect(() => {
    fetchConnections();
    fetchReports();
  }, [fetchConnections, fetchReports]);

  // Toggle lead status (Live/Unlive)
  const handleToggleStatus = async () => {
    const newStatus = lead.status === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'make live' : 'pause';

    setLoading(true);
    try {
      const result = await updateLead(lead.id, { status: newStatus });
      if (result.success) {
        toast.success(`Lead ${newStatus === 'active' ? 'is now LIVE' : 'has been PAUSED'}`);
        onUpdate();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    showConfirm(`Are you sure you want to ${action} this lead?`, async () => {
      setLoading(true);
      try {
        let result;
        if (action === 'close') {
          result = await updateLead(lead.id, { status: 'closed' });
        } else if (action === 'activate') {
          result = await updateLead(lead.id, { status: 'active' });
        } else if (action === 'pause') {
          result = await updateLead(lead.id, { status: 'paused' });
        } else if (action === 'delete') {
          result = await deleteLead(lead.id);
        }

        if (result.success) {
          toast.success(`Lead ${action}d successfully`);
          onUpdate();
          if (action === 'delete') {
            onBack();
          }
        } else {
          toast.error(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error(error);
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateLead(lead.id, editForm);
      if (result.success) {
        toast.success('Lead updated successfully');
        setShowEditModal(false);
        onUpdate();
      } else {
        toast.error('Error: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateLead(lead.id, {
        base_price: parseInt(pricingForm.base_price),
        max_slots: parseInt(pricingForm.max_slots)
      });
      if (result.success) {
        toast.success('Pricing updated successfully');
        setShowPricingModal(false);
        onUpdate();
      } else {
        toast.error('Error: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle lifecycle actions (reactivate, expire, hide, duration change)
  const handleLifecycleAction = async (action, hours = 48) => {
    setLoading(true);
    try {
      let updates = {};
      let successMessage = '';

      switch (action) {
        case 'reactivate':
          updates = {
            status: 'active',
            expires_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
            is_hidden: false,
            reactivated_at: new Date().toISOString()
          };
          successMessage = `Lead reactivated for ${hours} hours`;
          break;
        case 'expire':
          updates = {
            status: 'closed',
            expires_at: new Date().toISOString() // Set to now (expired)
          };
          successMessage = 'Lead manually expired';
          break;
        case 'hide':
          updates = {
            is_hidden: !lead.is_hidden
          };
          successMessage = lead.is_hidden ? 'Lead is now visible to agents' : 'Lead hidden from agents';
          break;
        case 'duration':
          updates = {
            expires_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
          };
          successMessage = `Lead active duration updated to ${hours} hours`;
          break;
        default:
          break;
      }

      const result = await updateLead(lead.id, updates);
      if (result.success) {
        toast.success(successMessage);
        setShowLifecycleModal(false);
        setLifecycleAction(null);
        onUpdate();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Calculate lead time status
  const timeLeft = getRemainingTime(lead.created_at, lead.expires_at);
  const isExpired = timeLeft === "EXPIRED" || lead.status === 'expired' || lead.status === 'closed';

  // Get connection status badge
  const getConnectionStatusBadge = (status) => {
    const badges = {
      'connected': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Connected' },
      'pending': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Pending' },
      'converted': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Converted' },
      'lost': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Lost' }
    };
    const badge = badges[status] || badges.connected;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text} border ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  // Get report status badge
  const getReportStatusBadge = (status) => {
    const badges = {
      'pending': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending Review' },
      'approved': { bg: 'bg-green-50', text: 'text-green-600', label: 'Approved' },
      'rejected': { bg: 'bg-red-50', text: 'text-red-600', label: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Get reason label
  const getReasonLabel = (reason) => {
    const labels = {
      'unreachable': 'Number Unreachable',
      'fake_number': 'Fake/Wrong Number',
      'already_closed': 'Already Found House',
      'wrong_info': 'Incorrect Details',
      'other': 'Other Issue'
    };
    return labels[reason] || reason;
  };

  // Format property type
  const propertyType = (lead.property_type || lead.requirements?.property_type || 'Property')
    .toString()
    .replace(/\bBed\b/gi, 'Bedroom')
    .replace(/\bBHK\b/gi, 'Bedroom');

  // Calculate slot pricing
  const basePrice = lead.base_price || 250;
  const maxSlots = lead.max_slots || 3;
  const claimedSlots = lead.claimed_slots || 0;
  const slotPrices = [
    { slot: 1, price: basePrice, multiplier: '1x' },
    { slot: 2, price: Math.round(basePrice * 0.8), multiplier: '0.8x' },
    { slot: 3, price: Math.round(basePrice * 0.6), multiplier: '0.6x' }
  ];

  // Info Row Component matching LeadDetailModal style
  const InfoRow = ({ icon: Icon, label, value, valueColor = 'text-gray-900', action }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${valueColor} break-words`}>{value}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <action.icon size={14} className="text-gray-400" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:bg-gray-100" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leads
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Status Toggle Button */}
          <Button
            onClick={handleToggleStatus}
            disabled={loading}
            className={`flex-1 sm:flex-none ${lead.status === 'active'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            size="sm"
          >
            {lead.status === 'active' ? (
              <>
                <ToggleRight className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">LIVE</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">PAUSED</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowEditModal(true)}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
            size="sm"
          >
            <Edit className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            onClick={() => setShowPricingModal(true)}
            variant="outline"
            className="text-purple-600 border-purple-200 hover:bg-purple-50 flex-1 sm:flex-none"
            size="sm"
          >
            <Settings className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Pricing</span>
          </Button>

          <Button
            onClick={() => setShowLifecycleModal(true)}
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-1 sm:flex-none"
            size="sm"
          >
            <Timer className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Lifecycle</span>
          </Button>

          <Button
            onClick={() => handleAction('delete')}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
            disabled={loading}
            size="sm"
          >
            <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header with Status Badges */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${lead.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  lead.status === 'paused' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${lead.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                    lead.status === 'paused' ? 'bg-amber-500' :
                      'bg-gray-400'
                    }`} />
                  {lead.status?.toUpperCase()}
                </span>

                {!isExpired ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                    <Clock size={10} />
                    {timeLeft} left
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                    <Clock size={10} />
                    EXPIRED
                  </span>
                )}

                {lead.is_exclusive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                    <Crown size={10} />
                    EXCLUSIVE
                  </span>
                )}

                {lead.source && lead.source !== 'organic' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    <ExternalLink size={10} />
                    {lead.source.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">
                Looking for {propertyType}
              </h2>
              <p className="text-sm text-gray-500">
                Posted {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
              </p>
            </div>

            {/* Lead Details */}
            <div className="p-6">
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-6">
                <div className="divide-y divide-gray-100">
                  <InfoRow
                    icon={Coins}
                    label="Monthly Budget"
                    value={formatBudget(lead.budget || lead.requirements?.budget)}
                    valueColor="text-[#FE9200]"
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Preferred Location"
                    value={lead.location || lead.requirements?.location || 'Not specified'}
                    action={{ icon: Copy, onClick: () => copyToClipboard(lead.location || '') }}
                  />
                  <InfoRow
                    icon={Home}
                    label="Property Type"
                    value={propertyType}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Move-in Timeline"
                    value={lead.move_in_date ? new Date(lead.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate / Flexible'}
                  />
                </div>
              </div>

              {/* Slots Indicator with Pricing */}
              <div className="p-4 bg-white rounded-2xl border border-gray-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent Slots & Pricing</span>
                  <Button
                    onClick={() => setShowPricingModal(true)}
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 text-xs"
                  >
                    <Settings size={12} className="mr-1" /> Edit
                  </Button>
                </div>

                {/* Slot Visual */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {slotPrices.slice(0, maxSlots).map((sp) => (
                      <div
                        key={sp.slot}
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${sp.slot <= claimedSlots
                          ? 'bg-[#FE9200] text-white shadow-lg shadow-orange-200/50'
                          : 'bg-gray-100 text-gray-400'
                          }`}
                      >
                        <span className="text-xs font-bold">{sp.slot}</span>
                        <span className="text-[8px]">{sp.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right flex-1">
                    <span className="text-lg font-black text-emerald-600">{claimedSlots}/{maxSlots}</span>
                    <span className="text-xs text-gray-400 ml-1">filled</span>
                  </div>
                </div>

                {/* Pricing Breakdown Table */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Slot Pricing</p>
                  <div className="space-y-1.5">
                    {slotPrices.slice(0, maxSlots).map((sp) => (
                      <div key={sp.slot} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Slot {sp.slot} <span className="text-gray-400">({sp.multiplier})</span>
                        </span>
                        <span className={`font-bold ${sp.slot <= claimedSlots ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {sp.price} credits
                          {sp.slot <= claimedSlots && <span className="ml-1 text-[10px] text-emerald-500">✓ Sold</span>}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-gray-700">Total Revenue</span>
                        <span className="font-black text-[#FE9200]">
                          {slotPrices.slice(0, claimedSlots).reduce((sum, sp) => sum + sp.price, 0)} credits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Requirements */}
              {(lead.requirements?.additional_requirements || lead.additional_requirements) && (
                <div className="bg-[#FFF9F2] rounded-2xl p-4 border border-[#FE9200]/20 mb-6">
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="text-[#FE9200] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-[#E58300] uppercase tracking-widest mb-2">Additional Notes</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        &quot;{lead.requirements?.additional_requirements || lead.additional_requirements}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connected Agents Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Users size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Connected Agents</h3>
                  <p className="text-xs text-gray-400">{connections.length} agents unlocked this lead</p>
                </div>
              </div>
              <Button
                onClick={fetchConnections}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw size={14} className={loadingConnections ? 'animate-spin' : ''} />
              </Button>
            </div>

            <div className="p-6">
              {loadingConnections ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No agents have unlocked this lead yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection, idx) => (
                    <div key={connection.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200">
                        {connection.agent?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{connection.agent?.name || 'Agent'}</p>
                          {connection.is_exclusive && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-600">
                              EXCLUSIVE
                            </span>
                          )}
                          {getConnectionStatusBadge(connection.status || 'connected')}
                        </div>
                        <p className="text-xs text-gray-400">{connection.agent?.email || 'No email'}</p>
                        {connection.agent?.phone && (
                          <p className="text-xs text-gray-400">{connection.agent.phone}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#FE9200]">
                          {connection.unlockCost || connection.credits_paid || 0} credits
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {connection.created_at ? new Date(connection.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                        {connection.contact_type && (
                          <p className="text-[9px] text-gray-300 uppercase">{connection.contact_type.replace('_', ' ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bad Lead Reports Section */}
          {reports.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <Flag size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Bad Lead Reports</h3>
                    <p className="text-xs text-gray-500">{reports.length} report(s) submitted for this lead</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{report.agent?.name || 'Agent'}</span>
                        {getReportStatusBadge(report.status)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600">
                        {getReasonLabel(report.reason)}
                      </span>
                      <span className="text-xs text-gray-400">• {report.credits_paid || 0} credits at stake</span>
                    </div>
                    {report.details && (
                      <p className="text-xs text-gray-500 italic">&quot;{report.details}&quot;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & Tenant Info */}
        <div className="space-y-6">
          {/* Engagement Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Eye size={16} className="text-gray-400" />
                Engagement Stats
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-400 mb-2">
                    <Eye size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Views</span>
                  </div>
                  <p className="text-2xl font-black text-blue-600">{lead.views || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-2">
                    <Unlock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Unlocks</span>
                  </div>
                  <p className="text-2xl font-black text-purple-600">{lead.contacts || claimedSlots}</p>
                </div>
              </div>

              <div className="p-4 bg-[#FFF9F2] rounded-xl border border-[#FE9200]/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 font-medium">Revenue Generated</span>
                  <span className="text-sm font-black text-[#FE9200]">
                    {slotPrices.slice(0, claimedSlots).reduce((sum, sp) => sum + sp.price, 0)} credits
                  </span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Base price: {basePrice} credits | Max slots: {maxSlots}
                </div>
              </div>
            </div>
          </div>

          {/* Tenant/Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <UserCheck size={16} className="text-gray-400" />
                Tenant Information
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-lg font-bold text-emerald-600 border border-emerald-100">
                  {(lead.tenant_name || lead.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 truncate">
                    {lead.tenant_name || lead.name || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span className="text-xs text-gray-500">
                      {lead.is_verified ? 'Verified Tenant' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {lead.tenant_phone || lead.phone || lead.whatsapp || 'Not provided'}
                    </p>
                  </div>
                  {(lead.tenant_phone || lead.phone) && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyToClipboard(lead.tenant_phone || lead.phone)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Copy size={14} className="text-gray-400" />
                      </button>
                      <a
                        href={`tel:${lead.tenant_phone || lead.phone}`}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Phone size={14} className="text-emerald-600" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MessageCircle size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {lead.whatsapp || lead.tenant_phone || 'Not provided'}
                    </p>
                  </div>
                  {(lead.whatsapp || lead.tenant_phone) && (
                    <a
                      href={`https://wa.me/${(lead.whatsapp || lead.tenant_phone || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[#25D366]/10 rounded-lg transition-colors"
                    >
                      <MessageCircle size={14} className="text-[#25D366]" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {lead.tenant_email || lead.email || 'Not provided'}
                    </p>
                  </div>
                  {(lead.tenant_email || lead.email) && (
                    <a
                      href={`mailto:${lead.tenant_email || lead.email}`}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Mail size={14} className="text-blue-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lead Metadata */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                Lead Metadata
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Lead ID</span>
                <span className="text-gray-900 font-mono text-xs">{lead.id?.slice(0, 8) || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Source</span>
                <span className="text-gray-900">{lead.source || 'Organic'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base Price</span>
                <span className="text-gray-900 font-bold">{basePrice} credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created</span>
                <span className="text-gray-900">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-gray-900">{lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-black text-gray-900">Edit Lead</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tenant Name</label>
                <input
                  type="text"
                  value={editForm.tenant_name}
                  onChange={(e) => setEditForm({ ...editForm, tenant_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Property Type</label>
                <input
                  type="text"
                  value={editForm.property_type}
                  onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Budget (KSh)</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                  >
                    <option value="active">Active (Live)</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={editForm.tenant_phone}
                    onChange={(e) => setEditForm({ ...editForm, tenant_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.tenant_email}
                    onChange={(e) => setEditForm({ ...editForm, tenant_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl" disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Settings Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Slot Pricing Settings</h3>
              <button onClick={() => setShowPricingModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handlePricingSubmit} className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="font-bold text-gray-900">Slot Pricing Model</p>
                    <p className="text-xs text-gray-500">Slot 1: 100% | Slot 2: 80% | Slot 3: 60%</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Base Price (Credits)</label>
                <input
                  type="number"
                  min="0"
                  value={pricingForm.base_price}
                  onChange={(e) => setPricingForm({ ...pricingForm, base_price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">The base price for the first slot</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Max Slots</label>
                <select
                  value={pricingForm.max_slots}
                  onChange={(e) => setPricingForm({ ...pricingForm, max_slots: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                >
                  <option value="1">1 Slot (Exclusive)</option>
                  <option value="2">2 Slots</option>
                  <option value="3">3 Slots (Standard)</option>
                </select>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price Preview</p>
                <div className="space-y-1">
                  {[1, 2, 3].slice(0, parseInt(pricingForm.max_slots)).map(slot => {
                    const multiplier = slot === 1 ? 1 : slot === 2 ? 0.8 : 0.6;
                    const price = Math.round(parseInt(pricingForm.base_price || 0) * multiplier);
                    return (
                      <div key={slot} className="flex justify-between text-sm">
                        <span className="text-gray-600">Slot {slot}</span>
                        <span className="font-bold text-gray-900">{price} credits</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowPricingModal(false)} className="flex-1 rounded-xl" disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Update Pricing
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Lifecycle Modal */}
      {showLifecycleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black text-gray-900">Lead Lifecycle Control</h3>
              <button onClick={() => { setShowLifecycleModal(false); setLifecycleAction(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Timer className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="font-bold text-gray-900">Current Status</p>
                    <p className="text-xs text-gray-500">Manage lead visibility and duration</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
                    <p className={`font-bold ${lead.status === 'active' ? 'text-emerald-600' : lead.status === 'paused' ? 'text-amber-600' : 'text-gray-500'}`}>
                      {lead.status?.toUpperCase() || 'Unknown'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Time Left</p>
                    <p className={`font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>{timeLeft}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Visibility</p>
                    <p className={`font-bold ${lead.is_hidden ? 'text-gray-500' : 'text-blue-600'}`}>
                      {lead.is_hidden ? 'Hidden' : 'Visible'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Slots</p>
                    <p className="font-bold text-gray-900">{lead.claimed_slots || 0}/{lead.max_slots || 3}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {!lifecycleAction && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">Quick Actions</p>

                  {/* Reactivate (only show if expired or closed) */}
                  {(isExpired || lead.status === 'closed' || lead.status === 'expired') && (
                    <button
                      onClick={() => setLifecycleAction('reactivate')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <RotateCcw className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Reactivate Lead</p>
                        <p className="text-xs text-gray-500">Bring this expired lead back to life</p>
                      </div>
                    </button>
                  )}

                  {/* Adjust Duration (only show if active) */}
                  {lead.status === 'active' && !isExpired && (
                    <button
                      onClick={() => setLifecycleAction('duration')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Adjust Duration</p>
                        <p className="text-xs text-gray-500">Extend or reduce active time</p>
                      </div>
                    </button>
                  )}

                  {/* Hide/Unhide Lead */}
                  <button
                    onClick={() => handleLifecycleAction('hide')}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      {lead.is_hidden ? <Eye className="w-6 h-6 text-purple-600" /> : <EyeOff className="w-6 h-6 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{lead.is_hidden ? 'Show Lead' : 'Hide Lead'}</p>
                      <p className="text-xs text-gray-500">{lead.is_hidden ? 'Make visible to agents again' : 'Hide from agents without deleting'}</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  </button>

                  {/* Manually Expire (only show if active) */}
                  {lead.status === 'active' && (
                    <button
                      onClick={() => setLifecycleAction('expire')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-red-300 hover:bg-red-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Manually Expire</p>
                        <p className="text-xs text-gray-500">Close this lead immediately</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Reactivate Form */}
              {lifecycleAction === 'reactivate' && (
                <div className="space-y-4">
                  <button onClick={() => setLifecycleAction(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={16} /> Back to actions
                  </button>

                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <RotateCcw className="w-6 h-6 text-emerald-600" />
                      <p className="font-bold text-emerald-900">Reactivate Lead</p>
                    </div>
                    <p className="text-sm text-emerald-700">Select how long this lead should stay active:</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { hours: 24, label: '24 Hours' },
                      { hours: 48, label: '48 Hours (Default)' },
                      { hours: 72, label: '72 Hours' },
                      { hours: 168, label: '1 Week' }
                    ].map((option) => (
                      <button
                        key={option.hours}
                        onClick={() => setDurationHours(option.hours)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${durationHours === option.hours
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{option.label}</span>
                          {durationHours === option.hours && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                        </div>
                      </button>
                    ))}

                    {/* Custom Duration */}
                    <div className="p-3 rounded-xl border-2 border-gray-100">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Custom Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={durationHours}
                        onChange={(e) => setDurationHours(parseInt(e.target.value) || 48)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setLifecycleAction(null)} className="flex-1 rounded-xl" disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLifecycleAction('reactivate', durationHours)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      Reactivate for {durationHours}h
                    </Button>
                  </div>
                </div>
              )}

              {/* Adjust Duration Form */}
              {lifecycleAction === 'duration' && (
                <div className="space-y-4">
                  <button onClick={() => setLifecycleAction(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={16} /> Back to actions
                  </button>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <p className="font-bold text-blue-900">Adjust Duration</p>
                    </div>
                    <p className="text-sm text-blue-700">Set new active duration from now:</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { hours: 12, label: '12 Hours' },
                      { hours: 24, label: '24 Hours' },
                      { hours: 48, label: '48 Hours' },
                      { hours: 72, label: '72 Hours' },
                      { hours: 168, label: '1 Week' }
                    ].map((option) => (
                      <button
                        key={option.hours}
                        onClick={() => setDurationHours(option.hours)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${durationHours === option.hours
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{option.label}</span>
                          {durationHours === option.hours && <CheckCircle className="w-5 h-5 text-blue-600" />}
                        </div>
                      </button>
                    ))}

                    {/* Custom Duration */}
                    <div className="p-3 rounded-xl border-2 border-gray-100">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Custom Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={durationHours}
                        onChange={(e) => setDurationHours(parseInt(e.target.value) || 48)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setLifecycleAction(null)} className="flex-1 rounded-xl" disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLifecycleAction('duration', durationHours)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                      Set {durationHours}h Duration
                    </Button>
                  </div>
                </div>
              )}

              {/* Expire Confirmation */}
              {lifecycleAction === 'expire' && (
                <div className="space-y-4">
                  <button onClick={() => setLifecycleAction(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={16} /> Back to actions
                  </button>

                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                      <p className="font-bold text-red-900">Expire Lead Now?</p>
                    </div>
                    <p className="text-sm text-red-700">This will close the lead immediately. Agents will no longer be able to claim slots.</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setLifecycleAction(null)} className="flex-1 rounded-xl" disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLifecycleAction('expire')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Expire Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
