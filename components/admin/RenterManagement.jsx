"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, MoreVertical, Eye, ChevronLeft, ChevronRight, X,
  Users, Home, CheckCircle, Clock, AlertTriangle, MapPin,
  Calendar, TrendingUp, Download, RefreshCw, ChevronDown,
  Mail, Phone, FileText, History, Ban, Play, Pause,
  DollarSign, CreditCard, Star, Loader2, AlertCircle,
  Activity, MessageSquare, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getAllRenters, getFullRenterProfile, suspendUser, reactivateUser } from '@/lib/database';
import { RenterDetail } from './RenterDetail';
import { useToast } from '@/context/ToastContext';

// Stats Card Component - Compact for mobile
const StatsCard = ({ icon: Icon, label, value, bgColor, iconColor, subtext, trend }) => (
  <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-5 hover:border-gray-300 transition-colors">
    <div className="flex items-center gap-3 md:flex-col md:items-start">
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0 md:mt-3">
        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider md:tracking-widest truncate">{label}</p>
        <p className="text-lg md:text-2xl lg:text-3xl font-black text-gray-900 truncate">{value}</p>
        {subtext && <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate hidden md:block">{subtext}</p>}
      </div>
      {trend && (
        <span className={`hidden md:flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend.type === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <TrendingUp size={12} />
          {trend.value}
        </span>
      )}
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Active', icon: CheckCircle },
    suspended: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Suspended', icon: Ban },
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Pending', icon: Clock },
    inactive: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-100', label: 'Inactive', icon: AlertCircle }
  };
  const style = config[status] || config.active;
  const IconComponent = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap ${style.bg} ${style.text} border ${style.border}`}>
      <IconComponent className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{style.label}</span>
    </span>
  );
};

// Skeleton Loader
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-40"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-8"></div></td>
  </tr>
);

// Actions Dropdown - Fixed position to avoid overflow clipping
const ActionsDropdown = ({ renter, onAction, isOpen, onToggle, buttonRef }) => {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  const actions = [
    { id: 'view', label: 'View Details', icon: Eye, color: 'text-gray-700' },
    { id: 'viewLeads', label: 'View Leads', icon: Home, color: 'text-blue-600' },
    { id: 'divider1' },
    ...(renter.status === 'suspended' ? [
      { id: 'activate', label: 'Activate Tenant', icon: Play, color: 'text-emerald-600' },
    ] : [
      { id: 'suspend', label: 'Suspend Tenant', icon: Ban, color: 'text-red-600' },
    ]),
    { id: 'divider2' },
    { id: 'addNote', label: 'Add Admin Note', icon: MessageSquare, color: 'text-gray-700' },
    { id: 'viewLogs', label: 'Activity Logs', icon: History, color: 'text-gray-700' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onToggle}></div>
      <div
        className="fixed w-48 bg-white rounded-xl border border-gray-200 py-2 z-[101]"
        style={{ top: position.top, right: position.right }}
      >
        {actions.map((action) => (
          action.id?.startsWith('divider') ? (
            <div key={action.id} className="my-1 border-t border-gray-100"></div>
          ) : (
            <button
              key={action.id}
              onClick={() => { onAction(action.id, renter); onToggle(); }}
              className={`w-full px-4 py-2 text-left text-sm font-medium flex items-center gap-2 hover:bg-gray-50 ${action.color}`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          )
        ))}
      </div>
    </>
  );
};

// Action Button with ref
const ActionButton = ({ renter, isOpen, onToggle, onClose, onAction }) => {
  const buttonRef = useRef(null);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
      <ActionsDropdown
        renter={renter}
        isOpen={isOpen}
        onToggle={onClose}
        onAction={onAction}
        buttonRef={buttonRef}
      />
    </>
  );
};

// Tenant Payments View (Placeholder - to be implemented)
const TenantPaymentsView = ({ renter, onBack }) => {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:bg-gray-100" size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tenants
      </Button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Payment History for {renter?.name || 'Tenant'}</h3>
          <p className="text-gray-500 text-sm">Payment tracking for tenants coming soon.</p>
        </div>
      </div>
    </div>
  );
};

// Suspend Tenant Modal
const SuspendModal = ({ isOpen, renter, onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !renter) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(renter.id, reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">Suspend Tenant</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <Ban className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-bold text-gray-900">Suspending: {renter?.name}</p>
              <p className="text-xs text-gray-500">Their leads will be hidden from agents.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Suspension Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this tenant is being suspended..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white" disabled={loading || !reason}>
              {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Suspend Tenant
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Tenant Leads View (filtered leads for specific tenant)
const TenantLeadsView = ({ renter, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const result = await getFullRenterProfile(renter.id);
        if (result.success) {
          setLeads(result.data.leads || []);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [renter.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tenant Leads</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Viewing leads posted by <span className="text-[#FE9200] font-bold">{renter.name}</span>
          </p>
        </div>
      </div>

      {/* Tenant Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 font-black text-xl">
            {renter.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-gray-900 text-lg">{renter.name}</h3>
            <p className="text-sm text-gray-500">{renter.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={renter.status || 'active'} />
              <span className="text-xs text-gray-400">
                {leads.length} lead{leads.length !== 1 ? 's' : ''} posted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FileText}
          label="Total Leads"
          value={leads.length}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={CheckCircle}
          label="Active"
          value={leads.filter(l => l.status === 'active').length}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={Pause}
          label="Paused"
          value={leads.filter(l => l.status === 'paused').length}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatsCard
          icon={Clock}
          label="Expired"
          value={leads.filter(l => l.status === 'expired' || l.status === 'closed').length}
          bgColor="bg-gray-50"
          iconColor="text-gray-500"
        />
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Lead Requests</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin mx-auto" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-500 text-sm">This tenant hasn&apos;t posted any leads yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Property Type</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Budget</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{lead.property_type || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{lead.location || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">KSh {lead.budget?.toLocaleString() || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${lead.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        lead.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Renter Detail Drawer
const RenterDrawer = ({ renter, isOpen, onClose, onAction }) => {
  if (!isOpen || !renter) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Tenant Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 font-black text-xl">
              {renter.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-900 text-lg">{renter.name}</h3>
              <p className="text-sm text-gray-500">{renter.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={renter.status || 'active'} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">Total Leads</p>
              <p className="text-xl font-black text-gray-900">{renter.leadsCount || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">Active Leads</p>
              <p className="text-xl font-black text-emerald-600">{renter.activeLeadsCount || 0}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{renter.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{renter.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{renter.location || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Account Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-900 font-medium">
                  {renter.createdAt ? new Date(renter.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray.500">Last Active</span>
                <span className="text-gray-900 font-medium">
                  {renter.lastActive ? new Date(renter.lastActive).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Lead Stats */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Lead Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-600 font-medium">Active</p>
                <p className="text-lg font-black text-emerald-700">{renter.activeLeadsCount || 0}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-medium">Paused</p>
                <p className="text-lg font-black text-amber-700">{renter.pausedLeadsCount || 0}</p>
              </div>
              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-medium">Expired</p>
                <p className="text-lg font-black text-gray-700">{renter.expiredLeadsCount || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-medium">Total</p>
                <p className="text-lg font-black text-blue-700">{renter.leadsCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => onAction('viewFull', renter)}
              className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl"
            >
              View Full Profile
            </Button>
            <Button
              onClick={() => onAction('viewLeads', renter)}
              variant="outline"
              className="w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Home className="w-4 h-4 mr-2" />
              View All Leads
            </Button>
            {renter.status !== 'suspended' ? (
              <Button
                onClick={() => onAction('suspend', renter)}
                variant="outline"
                className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspend Tenant
              </Button>
            ) : (
              <Button
                onClick={() => onAction('activate', renter)}
                variant="outline"
                className="w-full rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Play className="w-4 h-4 mr-2" />
                Activate Tenant
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const RenterManagement = () => {
  const { toast, showConfirm } = useToast();
  const [renters, setRenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [fullViewRenter, setFullViewRenter] = useState(null);

  // View states
  const [currentView, setCurrentView] = useState('list'); // 'list', 'leads', 'payments'
  const [viewRenter, setViewRenter] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Modals
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendRenter, setSuspendRenter] = useState(null);

  useEffect(() => {
    fetchRenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRenters = async () => {
    setLoading(true);
    try {
      const result = await getAllRenters({ limit: 500 });
      if (result.success) {
        setRenters(result.data || []);
      } else {
        toast.error('Failed to fetch tenants');
      }
    } catch (error) {
      console.error('Error fetching renters:', error);
      toast.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRenter = async (renterId) => {
    setLoading(true);
    try {
      const result = await getFullRenterProfile(renterId);
      if (result.success) {
        setFullViewRenter(result.data);
      } else {
        toast.error('Error fetching tenant details');
      }
    } catch (error) {
      toast.error('Error fetching tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionId, renter) => {
    switch (actionId) {
      case 'view':
        setSelectedRenter(renter);
        setShowDrawer(true);
        break;
      case 'viewFull':
        handleViewRenter(renter.id);
        setShowDrawer(false);
        break;
      case 'viewLeads':
        setViewRenter(renter);
        setCurrentView('leads');
        setShowDrawer(false);
        break;
      case 'suspend':
        setSuspendRenter(renter);
        setShowSuspendModal(true);
        setShowDrawer(false);
        break;
      case 'activate':
        showConfirm(`Activate ${renter.name}? Their leads will be visible again.`, async () => {
          setActionLoading(true);
          try {
            const result = await reactivateUser(renter.id);
            if (result.success) {
              toast.success(`${renter.name} has been activated successfully!`);
              fetchRenters();
            } else {
              toast.error('Failed to activate tenant');
            }
          } catch (error) {
            toast.error('Failed to activate tenant');
          } finally {
            setActionLoading(false);
          }
        });
        break;
      case 'viewPayments':
        setViewRenter(renter);
        setCurrentView('payments');
        setShowDrawer(false);
        break;
      case 'addNote':
        toast.info('Admin notes coming soon');
        break;
      case 'viewLogs':
        toast.info('Activity logs coming soon');
        break;
    }
  };

  const handleSuspendSubmit = async (renterId, reason) => {
    setActionLoading(true);
    try {
      const result = await suspendUser(renterId, reason);
      if (result.success) {
        toast.success('Tenant suspended successfully');
        setShowSuspendModal(false);
        setSuspendRenter(null);
        fetchRenters();
      } else {
        toast.error('Failed to suspend tenant');
      }
    } catch (error) {
      toast.error('Failed to suspend tenant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Location', 'Leads', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredRenters.map(r => [
        `"${r.name || ''}"`,
        r.email || '',
        r.phone || '',
        r.status || 'active',
        `"${r.location || ''}"`,
        r.leadsCount || 0,
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export completed');
  };

  // Calculate stats
  const stats = useMemo(() => ({
    total: renters.length,
    active: renters.filter(r => r.status !== 'suspended').length,
    suspended: renters.filter(r => r.status === 'suspended').length,
    withLeads: renters.filter(r => (r.leadsCount || 0) > 0).length,
    totalLeads: renters.reduce((sum, r) => sum + (r.leadsCount || 0), 0)
  }), [renters]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = new Set();
    renters.forEach(r => {
      if (r.location) locs.add(r.location);
    });
    return Array.from(locs).filter(Boolean).sort();
  }, [renters]);

  // Filter renters
  const filteredRenters = useMemo(() => {
    return renters.filter(renter => {
      const matchesSearch = !searchTerm ||
        renter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renter.email?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = renter.status !== 'suspended';
      else if (statusFilter === 'suspended') matchesStatus = renter.status === 'suspended';
      else if (statusFilter === 'with_leads') matchesStatus = (renter.leadsCount || 0) > 0;

      const matchesLocation = !locationFilter || renter.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [renters, searchTerm, statusFilter, locationFilter]);

  // Paginated renters
  const paginatedRenters = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRenters.slice(start, start + perPage);
  }, [filteredRenters, page]);

  const totalPages = Math.ceil(filteredRenters.length / perPage);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // If viewing full renter profile
  if (fullViewRenter) {
    return (
      <RenterDetail
        renter={fullViewRenter}
        onBack={() => setFullViewRenter(null)}
        onUpdate={() => {
          fetchRenters();
          handleViewRenter(fullViewRenter.id);
        }}
      />
    );
  }

  // If viewing tenant leads
  if (currentView === 'leads' && viewRenter) {
    return (
      <TenantLeadsView
        renter={viewRenter}
        onBack={() => { setCurrentView('list'); setViewRenter(null); }}
      />
    );
  }

  // If viewing tenant payments
  if (currentView === 'payments' && viewRenter) {
    return (
      <TenantPaymentsView
        renter={viewRenter}
        onBack={() => { setCurrentView('list'); setViewRenter(null); }}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900">Tenant Management</h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5 md:mt-1">Monitor and manage tenant accounts and leads</p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
          <Button
            onClick={fetchRenters}
            variant="outline"
            disabled={loading}
            size="sm"
            className="rounded-lg md:rounded-xl border-[#FE9200] text-[#FE9200] hover:bg-[#FFF2E5] text-xs md:text-sm flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            size="sm"
            className="bg-[#FE9200] hover:bg-[#E58300] text-white rounded-lg md:rounded-xl gap-1.5 md:gap-2 text-xs md:text-sm flex-1 sm:flex-none"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        <StatsCard
          icon={Users}
          label="Total Tenants"
          value={stats.total}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={CheckCircle}
          label="Active"
          value={stats.active}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={Ban}
          label="Suspended"
          value={stats.suspended}
          bgColor="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          icon={Home}
          label="With Leads"
          value={stats.withLeads}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          icon={Activity}
          label="Total Leads"
          value={stats.totalLeads}
          bgColor="bg-[#FFF2E5]"
          iconColor="text-[#FE9200]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-4">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
            />
          </div>

          {/* Status Filter - Scrollable on mobile */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex bg-gray-100 rounded-lg md:rounded-xl p-1 min-w-max">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'suspended', label: 'Suspended' },
                  { id: 'with_leads', label: 'With Leads' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setStatusFilter(f.id); setPage(1); }}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${statusFilter === f.id ? 'bg-[#FE9200] text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            {locations.length > 0 && (
              <div className="relative flex-shrink-0">
                <select
                  value={locationFilter}
                  onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                  className="appearance-none pl-3 pr-8 py-1.5 md:py-2.5 rounded-lg md:rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-xs md:text-sm font-medium w-full min-w-[100px] md:min-w-[140px]"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tenant</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Leads</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Location</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedRenters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">No tenants found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedRenters.map((renter) => (
                  <tr key={renter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">
                          {renter.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{renter.name}</p>
                          <p className="text-xs text-gray-400">{renter.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={renter.status || 'active'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{renter.leadsCount || 0}</span>
                        {(renter.activeLeadsCount || 0) > 0 && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {renter.activeLeadsCount} active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{renter.location || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(renter.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionButton
                        renter={renter}
                        isOpen={openDropdown === renter.id}
                        onToggle={() => setOpenDropdown(openDropdown === renter.id ? null : renter.id)}
                        onClose={() => setOpenDropdown(null)}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 text-[#FE9200] animate-spin mx-auto" />
            </div>
          ) : paginatedRenters.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tenants found</p>
            </div>
          ) : (
            paginatedRenters.map((renter) => (
              <div key={renter.id} className="p-3">
                {/* Tenant Header Row */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                    {renter.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-gray-900 text-sm truncate">{renter.name}</p>
                      <StatusBadge status={renter.status || 'active'} />
                    </div>
                    <p className="text-xs text-gray-400 truncate">{renter.email}</p>
                  </div>
                </div>
                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs mb-2 pl-12">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">Leads:</span>
                    <span className="font-bold text-gray-900">{renter.leadsCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-bold text-gray-900 truncate">{renter.location || 'N/A'}</span>
                  </div>
                </div>
                {/* View Button */}
                <Button
                  onClick={() => handleAction('view', renter)}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg border-[#FE9200] text-[#FE9200] py-2 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredRenters.length > perPage && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs md:text-sm text-gray-500 order-2 sm:order-1">
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filteredRenters.length)} of {filteredRenters.length}
            </span>
            <div className="flex gap-1 md:gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center text-xs md:text-sm font-medium ${page === pageNum ? 'bg-[#FE9200] text-white' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <RenterDrawer
        renter={selectedRenter}
        isOpen={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedRenter(null); }}
        onAction={handleAction}
      />

      {/* Suspend Modal */}
      <SuspendModal
        isOpen={showSuspendModal}
        renter={suspendRenter}
        onClose={() => { setShowSuspendModal(false); setSuspendRenter(null); }}
        onSubmit={handleSuspendSubmit}
        loading={actionLoading}
      />
    </div>
  );
};
