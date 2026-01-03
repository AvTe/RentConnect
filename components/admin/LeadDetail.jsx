"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Calendar, DollarSign, Eye, Phone, Trash2, XCircle, CheckCircle,
  ArrowLeft, Clock, Users, Home, MessageCircle, Flag, AlertCircle,
  Coins, FileText, Loader2, UserCheck, Lock, Unlock, RefreshCw, Crown,
  PhoneOff, UserX, HelpCircle, Copy, ExternalLink, Mail, Edit
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { updateLead, deleteLead, getLeadConnections, getBadLeadReports } from '@/lib/database';

export const LeadDetail = ({ lead, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    property_type: lead?.property_type || '',
    location: lead?.location || '',
    budget: lead?.budget || '',
    status: lead?.status || 'active'
  });

  // Update current time every minute for remaining time calculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate remaining time for lead (48 hours from creation)
  const getRemainingTime = (createdAt) => {
    if (!createdAt) return "N/A";
    const expiry = new Date(createdAt).getTime() + (48 * 60 * 60 * 1000);
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

  const handleAction = async (action) => {
    if (!confirm(`Are you sure you want to ${action} this lead?`)) return;

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
        alert(`Lead ${action}d successfully`);
        onUpdate();
        if (action === 'delete') {
          onBack();
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateLead(lead.id, editForm);
      if (result.success) {
        alert('Lead updated successfully');
        setShowEditModal(false);
        onUpdate();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Calculate lead time status
  const timeLeft = getRemainingTime(lead.created_at);
  const isExpired = timeLeft === "EXPIRED";

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
          <Button
            onClick={() => setShowEditModal(true)}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
            size="sm"
          >
            <Edit className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
          </Button>

          {lead.status === 'active' ? (
            <>
              <Button
                onClick={() => handleAction('pause')}
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50 flex-1 sm:flex-none"
                disabled={loading}
                size="sm"
              >
                <Clock className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Pause</span>
              </Button>
              <Button
                onClick={() => handleAction('close')}
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-1 sm:flex-none"
                disabled={loading}
                size="sm"
              >
                <XCircle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Close</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => handleAction('activate')}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <CheckCircle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reactivate</span>
            </Button>
          )}

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

              {/* Slots Indicator */}
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent Slots</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${i <= (lead.claimed_slots || 0)
                            ? 'bg-[#FE9200] text-white shadow-lg shadow-orange-200/50'
                            : 'bg-gray-100 text-gray-400'
                          }`}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600">{lead.claimed_slots || 0}/3</span>
                  <span className="text-xs text-gray-400 ml-1">filled</span>
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
                        "{lead.requirements?.additional_requirements || lead.additional_requirements}"
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
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-gray-500">
                          {connection.credits_paid || 0} credits
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {connection.created_at ? new Date(connection.created_at).toLocaleDateString() : 'N/A'}
                        </p>
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
                      <p className="text-xs text-gray-500 italic">"{report.details}"</p>
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
                  <p className="text-2xl font-black text-purple-600">{lead.contacts || 0}</p>
                </div>
              </div>

              <div className="p-4 bg-[#FFF9F2] rounded-xl border border-[#FE9200]/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 font-medium">Revenue Generated</span>
                  <span className="text-sm font-black text-[#FE9200]">
                    {(lead.base_price || 250) * (lead.contacts || 0)} credits
                  </span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Base price: {lead.base_price || 250} credits
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Lead Metadata</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Lead ID</span>
                <span className="font-mono text-gray-700 truncate max-w-[120px]">{lead.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Source</span>
                <span className="font-medium text-gray-700">{lead.source || 'Organic'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Base Price</span>
                <span className="font-medium text-gray-700">{lead.base_price || 250} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-700">
                  {lead.updated_at ? new Date(lead.updated_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Lead</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle size={18} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Property Type</label>
                <input
                  type="text"
                  value={editForm.property_type}
                  onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Budget (KSh)</label>
                <input
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 border-0"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 bg-[#FE9200] text-white rounded-xl font-bold text-sm hover:bg-[#E58300] border-0 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
