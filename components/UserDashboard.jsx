/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, FileText, Settings, LogOut,
  Plus, Menu, X, Users, User,
  Eye, MapPin, Home, Zap, Edit2, Trash2, Clock, PauseCircle, PlayCircle,
  MessageSquare, HelpCircle, ChevronRight, Info,
  PanelLeftClose, PanelLeft, Headphones, RefreshCw
} from 'lucide-react';
import { Button } from './ui/Button';
import { UserProfile } from './UserProfile';
import { RatingPrompt } from './RatingPrompt';
import { getAllLeads, deleteLead, updateLead } from '@/lib/database';
import { BottomNavigation } from './ui/BottomNavigation';
import { NotificationBell } from './NotificationBell';
import { Tooltip } from './ui/Tooltip';
import { useToast } from '@/context/ToastContext';
import { EditLeadModal } from './EditLeadModal';
import { HelpCenter } from './HelpCenter';
import { UserSupportDashboard } from './tickets';
import { getUserTickets } from '@/lib/ticket-service';

export const UserDashboard = ({ onNavigate, initialTab = 'dashboard', currentUser, onUpdateUser,
  onLogout,
  onNotificationClick,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [activeTicketCount, setActiveTicketCount] = useState(0);

  // Helper function to check if a lead is expired based on expires_at or 48-hour default
  const isLeadExpired = (request) => {
    if (request.status === 'sold_out' || request.status === 'closed' || request.status === 'expired') {
      return true;
    }
    const expiryTime = request.expires_at
      ? new Date(request.expires_at).getTime()
      : new Date(request.created_at).getTime() + (48 * 60 * 60 * 1000);
    return Date.now() > expiryTime;
  };

  // Get the display status for a lead (considering expiration)
  const getLeadDisplayStatus = (request) => {
    if (isLeadExpired(request)) return 'expired';
    if (request.status === 'sold_out') return 'sold_out';
    return request.status || 'active';
  };

  // Sort leads: active first, then paused, then expired/sold_out
  const getSortedLeads = (leads) => {
    const statusOrder = { active: 0, paused: 1, expired: 2, sold_out: 3 };
    return [...leads].sort((a, b) => {
      const statusA = getLeadDisplayStatus(a);
      const statusB = getLeadDisplayStatus(b);
      const orderA = statusOrder[statusA] ?? 4;
      const orderB = statusOrder[statusB] ?? 4;
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort by created_at (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenuId && !event.target.closest('.request-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const handleDeleteRequest = async (e, requestId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      try {
        const result = await deleteLead(requestId);
        if (result.success) {
          toast.success('Request deleted successfully');
          fetchMyRequests();
        } else {
          toast.error(result.error || 'Failed to delete request');
        }
      } catch (error) {
        console.error('Error deleting request:', error);
        toast.error('An unexpected error occurred');
      }
    }
    setActiveMenuId(null);
  };

  const handleEditRequest = (e, request) => {
    e.stopPropagation();
    setEditingRequest(request);
    setActiveMenuId(null);
  };

  const handleToggleStatus = async (e, request) => {
    e.stopPropagation();
    const newStatus = request.status === 'paused' ? 'active' : 'paused';
    try {
      const result = await updateLead(request.id, { status: newStatus });
      if (result.success) {
        toast.success(`Request ${newStatus === 'paused' ? 'paused' : 'resumed'} successfully`);
        fetchMyRequests();
      } else {
        // Handle database constraint error
        if (result.error?.includes('leads_status_check') || result.code === '23514') {
          toast.error('Database update required: Please run the SQL fix script to enable pausing.');
        } else {
          toast.error(result.error || 'Failed to update status');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An unexpected error occurred');
    }
    setActiveMenuId(null);
  };

  const handleBoostRequest = (e) => {
    e.stopPropagation();
    // Boost coming soon
    setActiveMenuId(null);
  };

  // Reactivate an expired lead - reset status to active and extend expiry by 48 hours
  const handleReactivateLead = async (e, request) => {
    e.stopPropagation();
    try {
      const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const result = await updateLead(request.id, {
        status: 'active',
        expires_at: newExpiresAt
      });
      if (result.success) {
        toast.success('Lead reactivated successfully! Active for 48 hours.');
        fetchMyRequests();
      } else {
        toast.error(result.error || 'Failed to reactivate lead');
      }
    } catch (error) {
      console.error('Error reactivating lead:', error);
      toast.error('An unexpected error occurred');
    }
    setActiveMenuId(null);
  };

  const handleSaveEditedLead = async (leadId, updatedData) => {
    try {
      const result = await updateLead(leadId, updatedData);
      if (result.success) {
        toast.success('Request updated successfully');
        fetchMyRequests();
      } else {
        toast.error(result.error || 'Failed to update request');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('An unexpected error occurred');
      throw error;
    }
  };

  // Helper to update URL hash with view and tab
  const updateUrlHashWithTab = (tab) => {
    if (typeof window === 'undefined') return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#user-dashboard/${tab}`);
  };

  // Handle responsive sidebar close
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
    updateUrlHashWithTab(tabId);
  };

  // Use currentUser if available, otherwise fallback
  const user = currentUser || {
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    phone: '+254 700 123 456',
    city: 'Nairobi',
    avatar: null
  };

  // Fetch requests when currentUser changes or on initial load
  useEffect(() => {
    const userId = currentUser?.uid || currentUser?.id;
    if (userId) {
      fetchMyRequests();
      // Fetch active support ticket count
      fetchActiveTicketCount(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.id]);

  const fetchActiveTicketCount = async (userId) => {
    try {
      const result = await getUserTickets(userId, {});
      if (result.success) {
        const activeCount = result.data.filter(t => t.status === 'open' || t.status === 'in_progress').length;
        setActiveTicketCount(activeCount);
      }
    } catch (error) {
      console.error('Error fetching ticket count:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchMyRequests = async () => {
    const userId = currentUser?.uid || currentUser?.id;
    if (!userId) return;
    setLoadingRequests(true);
    try {
      // Fetch all leads for this tenant, including closed ones if needed
      const result = await getAllLeads({ tenantId: userId, status: 'all' });
      if (result.success) {
        setMyRequests(result.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSaveProfile = (updatedUser) => {
    onUpdateUser(updatedUser);
    setActiveTab('dashboard');
  };

  const formatLocation = (location) => {
    if (!location) return 'Location';
    const parts = location.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    }
    return location;
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => handleTabChange(id)}
      title={isSidebarCollapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
        ${active
          ? 'bg-[#FE9200] text-white'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
        ${isSidebarCollapsed ? 'justify-center' : ''}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
      {!isSidebarCollapsed && <span className="truncate">{label}</span>}
    </button>
  );

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <UserProfile
          user={user}
          onSave={handleSaveProfile}
          onCancel={() => setActiveTab('dashboard')}
          onLogout={onLogout}
          onOpenHelpCenter={() => setShowHelpCenter(true)}
        />
      );
    }

    if (activeTab === 'requests') {
      return (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">My Requests</h2>
              <p className="text-gray-500 text-sm">Manage your property requests.</p>
            </div>
            <Button onClick={() => onNavigate('tenant-form')} className="w-full sm:w-auto h-11 bg-[#FE9200] hover:bg-[#E58300] shadow-lg shadow-orange-100 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="font-bold">New Request</span>
            </Button>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE9200]"></div>
            </div>
          ) : myRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {getSortedLeads(myRequests).map(request => {
                const displayStatus = getLeadDisplayStatus(request);
                return (
                <div key={request.id} className={`relative group bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden ${displayStatus === 'expired' || displayStatus === 'sold_out' ? 'opacity-75' : ''}`}>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          displayStatus === 'expired'
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : displayStatus === 'sold_out'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : displayStatus === 'active'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : displayStatus === 'paused'
                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                  : 'bg-gray-50 text-gray-500 border-gray-100'
                          }`}>
                          {displayStatus === 'expired' ? 'Expired' : displayStatus === 'sold_out' ? 'Sold Out' : displayStatus || 'Active'}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium italic">
                          Posted {request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recently'}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[#FE9200]">
                        KSh {parseInt(request.budget || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/ month</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-[#FE9200] transition-colors">
                      {request.property_type || 'Property Request'} In {formatLocation(request.location)}
                    </h3>

                    <div className="flex items-center gap-1.5 text-gray-500 mb-6">
                      <MapPin size={14} className="text-[#FE9200]" />
                      <span className="text-sm font-medium">{formatLocation(request.location)} • Near City Center</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Eye size={15} className="text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-0.5">Views</span>
                            <span className="text-xs font-bold text-gray-700">{request.views || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={15} className="text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-0.5">Contacts</span>
                            <span className="text-xs font-bold text-gray-700">{request.contacts || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative request-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === request.id ? null : request.id);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-[#FE9200] transition-all group"
                        >
                          Manage <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Quick Menu Popover */}
                        {activeMenuId === request.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button
                              onClick={(e) => handleEditRequest(e, request)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 size={16} className="text-gray-400" />
                              <span className="font-medium text-gray-700">Edit Lead</span>
                            </button>
                            {displayStatus === 'expired' ? (
                              <button
                                onClick={(e) => handleReactivateLead(e, request)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-emerald-50 transition-colors"
                              >
                                <RefreshCw size={16} className="text-emerald-500" />
                                <span className="font-medium text-emerald-600">Reactivate Lead</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleToggleStatus(e, request)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                {request.status === 'paused' ? (
                                  <>
                                    <PlayCircle size={16} className="text-emerald-500" />
                                    <span className="font-medium text-gray-700">Resume Lead</span>
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle size={16} className="text-amber-500" />
                                    <span className="font-medium text-gray-700">Pause Lead</span>
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteRequest(e, request.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50 mt-1"
                            >
                              <Trash2 size={16} className="text-red-500" />
                              <span className="font-medium">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><FileText className="w-10 h-10 text-gray-300" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No active requests</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">Post a request to let pre-verified agents find exactly what you care about.</p>
              <Button onClick={() => onNavigate('tenant-form')} className="h-12 px-8 bg-[#FE9200] hover:bg-[#E58300]">Post Your First Request</Button>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'messages') {
      return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-[#FE9200]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">My Messages</h2>
          <p className="text-gray-500 text-center max-w-xs mx-auto mb-8 font-medium">
            Direct messaging with agents is coming soon. You&apos;ll be notified when agents respond to your requests.
          </p>
          <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100">
            <Info size={18} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-600">Agents currently reach out via WhatsApp/Phone</span>
          </div>
        </div>
      );
    }

    if (activeTab === 'support') {
      return (
        <UserSupportDashboard
          user={user}
          userType="tenant"
        />
      );
    }

    // Default Dashboard View
    return (
      <div className="space-y-5 md:space-y-8 animate-in fade-in duration-500 overflow-hidden">
        {/* Rating Prompt */}
        <RatingPrompt currentUser={currentUser} />

        {/* Hero Banner Section - Compact on mobile */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-[180px] md:aspect-[21/6] group shadow-lg">
          {/* Background image with full overlay on mobile for cleaner look */}
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-50 group-hover:scale-105 transition-transform duration-1000"
          />
          {/* Full gradient overlay on mobile, partial on desktop */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/60 md:from-gray-900/90 md:to-transparent" />
          <div className="relative z-10 flex items-center h-full px-5 py-6 md:px-12 md:py-0">
            <div className="max-w-md space-y-3 md:space-y-6">
              <h2 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Jambo, {user.name?.split(' ')[0]}!
              </h2>
              <p className="text-gray-300 text-sm md:text-lg font-medium leading-relaxed">
                Ready to find your next home? Post a request to let agents come to you.
              </p>
              <Button
                onClick={() => onNavigate('tenant-form')}
                className="h-11 md:h-14 px-6 md:px-8 bg-[#FE9200] hover:bg-[#E58300] text-white font-bold rounded-xl md:rounded-2xl shadow-lg flex items-center gap-2 md:gap-3 group/btn transition-all border-none text-sm md:text-base"
              >
                <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                <span>Post New Request</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row - Horizontal scroll on mobile for compact view */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6">
          {/* Active Requests */}
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">Active</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-orange-50 flex items-center justify-center text-[#FE9200]">
                <Home size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <div className="text-2xl md:text-4xl font-black text-gray-900 mb-0.5 md:mb-1 tracking-tight">
              {myRequests.filter(r => r.status === 'active' && !isLeadExpired(r)).length}
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
              <Zap size={12} fill="currentColor" /> Last updated just now
            </div>
            <div className="md:hidden text-[9px] font-medium text-gray-400">Requests</div>
          </div>

          {/* Total Views */}
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">Views</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Eye size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <div className="text-2xl md:text-4xl font-black text-gray-900 mb-0.5 md:mb-1 tracking-tight">
              {myRequests.reduce((sum, req) => sum + (req.views || 0), 0)}
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-blue-500">
              <Plus size={12} strokeWidth={3} /> +12 this week
            </div>
            <div className="md:hidden text-[9px] font-medium text-gray-400">Total</div>
          </div>

          {/* Agent Responses */}
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">Replies</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                <MessageSquare size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <div className="text-2xl md:text-4xl font-black text-gray-900 mb-0.5 md:mb-1 tracking-tight">
              {myRequests.reduce((sum, req) => sum + (req.contacts || 0), 0)}
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
              <Clock size={12} strokeWidth={3} /> 3 new pending
            </div>
            <div className="md:hidden text-[9px] font-medium text-gray-400">Agents</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">My Requests</h3>
              <button onClick={() => setActiveTab('requests')} className="text-sm font-bold text-[#FE9200] hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </button>
            </div>

            {getSortedLeads(myRequests).slice(0, 3).map(request => {
              const displayStatus = getLeadDisplayStatus(request);
              return (
              <div key={request.id} className={`bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-2xl hover:border-[#FE9200]/10 transition-all duration-500 relative overflow-hidden ${displayStatus === 'expired' || displayStatus === 'sold_out' ? 'opacity-75' : ''}`}>
                <div className="flex-1 space-y-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      displayStatus === 'expired'
                        ? 'bg-gray-100 text-gray-500 border-gray-200'
                        : displayStatus === 'sold_out'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : displayStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {displayStatus === 'expired' ? 'Expired' : displayStatus === 'sold_out' ? 'Sold Out' : displayStatus || 'Active'}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 italic">Posted {request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recently'}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-[#FE9200] transition-colors">{request.property_type} In {formatLocation(request.location)}</h4>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 font-medium bg-gray-50/50 px-3 py-1 rounded-full border border-gray-100"><MapPin size={14} className="text-[#FE9200]" /> {formatLocation(request.location)} • Near City Center</div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-8 relative z-10 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Monthly Budget</p>
                    <p className="text-xl font-black text-gray-900">KSh {parseInt(request.budget || 0).toLocaleString()}<span className="text-xs text-gray-400 font-normal ml-1">/ mo</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-gray-50/50 px-3 py-2 rounded-2xl border border-gray-100 min-w-[64px]">
                      <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Views</p>
                      <p className="text-sm font-black text-gray-700">{request.views || 0}</p>
                    </div>
                    <div className="text-center bg-gray-50/50 px-3 py-2 rounded-2xl border border-gray-100 min-w-[64px]">
                      <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Contacts</p>
                      <p className="text-sm font-black text-gray-700">{request.contacts || 0}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="absolute bottom-0 right-0 p-4 bg-gray-50 text-gray-400 rounded-tl-3xl opacity-0 group-hover:opacity-100 group-hover:bg-[#FE9200] group-hover:text-white transition-all duration-300"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            );
            })}

            {myRequests.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 border-dashed">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#FE9200] opacity-50">
                  <Plus size={40} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Ready to find a home?</h4>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Post your requirements and let verified agents send you matching properties.</p>
                <Button onClick={() => onNavigate('tenant-form')} className="h-12 px-10 bg-[#FE9200] hover:bg-[#E58300] font-bold shadow-xl shadow-orange-100 border-none rounded-2xl">Create New Request</Button>
              </div>
            )}
          </div>

          {/* Widgets Sidebar */}
          <div className="space-y-6 lg:pt-14">
            {/* Profile Completion Widget */}
            <div className="bg-[#FFF9F2] rounded-2xl p-6 border border-[#FE9200]/10 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#FE9200]/5 rounded-full blur-2xl group-hover:bg-[#FE9200]/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Profile Setup</h3>
                <button className="text-[11px] font-bold text-[#FE9200] hover:underline">Complete</button>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-black text-gray-900">80%</span>
                  <span className="text-[11px] font-bold text-[#E58300]/80">Almost there!</span>
                </div>
                <div className="h-3 w-full bg-white rounded-full overflow-hidden p-0.5 border border-orange-100/50 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-[#FE9200] to-[#FF6B00] rounded-full w-[80%] shadow-sm" />
                </div>
                <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                  Add a profile photo and verify your phone number to gain more trust from agents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bottom navigation items for mobile
  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // If showing help center, render it full screen
  if (showHelpCenter) {
    return <HelpCenter onBack={() => setShowHelpCenter(false)} />;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans overflow-hidden">
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        bg-white border-r border-gray-200
        flex flex-col flex-shrink-0
        transform transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-gray-100`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center">
              <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-10" />
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-[#FE9200] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Collapse toggle (desktop) */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isSidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Close button (mobile) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile Card - Only when expanded */}
        {!isSidebarCollapsed && (
          <div className="px-3 py-4 border-b border-gray-100">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#FE9200] text-white font-bold text-sm">
                    {user.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] font-semibold text-[#FE9200] uppercase tracking-wider">Tenant Account</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <SidebarItem icon={LayoutGrid} label="Dashboard" id="dashboard" active={activeTab === 'dashboard'} />
          <SidebarItem icon={FileText} label="My Requests" id="requests" active={activeTab === 'requests'} />
          <div className="relative">
            <SidebarItem icon={MessageSquare} label="Messages" id="messages" active={activeTab === 'messages'} />
            {!isSidebarCollapsed && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FE9200] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
            )}
          </div>
          <div className="relative">
            <SidebarItem icon={Headphones} label="Support" id="support" active={activeTab === 'support'} />
            {!isSidebarCollapsed && activeTicketCount > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeTicketCount}</span>
            )}
          </div>
          <SidebarItem icon={Settings} label="Profile Settings" id="profile" active={activeTab === 'profile'} />
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-gray-100 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => { onLogout(); setIsSidebarOpen(false); }}
            title={isSidebarCollapsed ? 'Log Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Dashboard</h1>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            {/* Notification Bell - visible on all screen sizes */}
            {(currentUser?.id || currentUser?.uid) && (
              <NotificationBell
                userId={currentUser.id || currentUser.uid}
                onNotificationClick={(notif) => {
                  if (onNotificationClick) {
                    onNotificationClick(notif);
                  }
                  if (notif.type === 'agent_interested' || notif.type === 'agent_contact') {
                    handleTabChange('requests');
                  }
                }}
              />
            )}
            {/* Help button - hidden on mobile */}
            <button
              onClick={() => setShowHelpCenter(true)}
              className="hidden md:flex p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
            >
              <HelpCircle size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area - proper spacing per guidelines */}
        {/* Top padding: 16px, Bottom: 80px for nav safe area */}
        <div className="flex-1 overflow-auto px-4 md:px-8 pt-4 md:pt-6 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        activeId={activeTab}
        onNavigate={handleTabChange}
      />
      <EditLeadModal
        isOpen={!!editingRequest}
        onClose={() => setEditingRequest(null)}
        lead={editingRequest}
        onSave={handleSaveEditedLead}
      />
    </div>
  );
};

