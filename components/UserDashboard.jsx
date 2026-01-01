/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, FileText, History, Settings, LogOut,
  Plus, Search, Bell, Menu, X, Users, User,
  MoreVertical, Eye, Coins, MapPin, Home, Calendar, Zap, Edit2, Trash2, Clock, PauseCircle, PlayCircle,
  MessageSquare, HelpCircle, CheckCircle, ChevronRight, Phone, Send, Info
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

export const UserDashboard = ({ onNavigate, initialTab = 'dashboard', currentUser, onUpdateUser,
  onLogout,
  onNotificationClick,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);

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

  // Handle responsive sidebar close
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.id]);

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

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
        }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-gray-900' : 'text-gray-500'}`} />
      <span className="truncate">{label}</span>
    </button>
  );

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <UserProfile user={user} onSave={handleSaveProfile} onCancel={() => setActiveTab('dashboard')} />;
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
              {myRequests.map(request => (
                <div key={request.id} className="relative group bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden">
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${request.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : request.status === 'paused'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                          }`}>
                          {request.status || 'Active'}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
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
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm">
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

    // Default Dashboard View
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        {/* Rating Prompt */}
        <RatingPrompt currentUser={currentUser} />

        {/* Hero Banner Section */}
        <div className="relative rounded-[32px] overflow-hidden bg-gray-900 aspect-[21/9] md:aspect-[21/6] group shadow-2xl shadow-orange-100/20">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-transparent flex items-center px-8 md:px-12">
            <div className="max-w-md space-y-4 md:space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Jambo, {user.name?.split(' ')[0]}!
              </h2>
              <p className="text-gray-200 text-sm md:text-lg font-medium leading-relaxed opacity-90">
                Ready to find your next home? Post a request to let agents come to you.
              </p>
              <Button
                onClick={() => onNavigate('tenant-form')}
                className="h-12 md:h-14 px-8 bg-[#FE9200] hover:bg-[#E58300] text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 flex items-center gap-3 group/btn transition-all border-none"
              >
                <Plus size={20} className="group-hover/btn:rotate-90 transition-transform" />
                <span>Post New Request</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none">Active Requests</span>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FE9200] group-hover:scale-110 transition-transform duration-300"><Home size={18} /></div>
            </div>
            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{myRequests.filter(r => r.status === 'active').length}</div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
              <Zap size={12} fill="currentColor" /> Last updated just now
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none">Total Views</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300"><Eye size={18} /></div>
            </div>
            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{myRequests.reduce((sum, req) => sum + (req.views || 0), 0)}</div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-500">
              <Plus size={12} strokeWidth={3} /> +12 this week
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none">Agent Responses</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300"><MessageSquare size={18} /></div>
            </div>
            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{myRequests.reduce((sum, req) => sum + (req.contacts || 0), 0)}</div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
              <Clock size={12} strokeWidth={3} /> 3 new pending
            </div>
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

            {myRequests.slice(0, 3).map(request => (
              <div key={request.id} className="bg-white rounded-[32px] border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-2xl hover:border-[#FE9200]/10 transition-all duration-500 relative overflow-hidden">
                <div className="flex-1 space-y-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${request.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {request.status || 'Active'}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 italic">Posted 2 days ago</span>
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
            ))}

            {myRequests.length === 0 && (
              <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 border-dashed">
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
          <div className="space-y-8 lg:pt-14">
            {/* Agent Activity Widget */}
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/50">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-[#FCFCFD]">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Agent Activity</h3>
                <button className="text-[11px] font-bold text-[#FE9200] uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-6">
                  <div className="flex gap-4 group/item">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shadow-sm border-2 border-white">
                        <img src="https://i.pravatar.cc/150?u=agent1" alt="Agent" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">David Mwangi</h4>
                        <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0">2m ago</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 leading-none mb-3 uppercase tracking-widest">Apex Realty Ltd</p>
                      <div className="bg-gray-50 p-3 rounded-2xl text-[13px] text-gray-600 line-clamp-2 italic leading-relaxed border border-gray-100 relative group-hover/item:bg-orange-50/30 transition-colors">
                        &quot;Hi {user.name?.split(' ')[0]}, I have a unit in Westlands matching...&quot;
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button className="flex-1 bg-[#FE9200] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#E58300] transition-all shadow-lg shadow-orange-100 active:scale-95">Reply</button>
                        <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-[#FE9200] transition-all border border-gray-100"><Phone size={14} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 flex gap-4 opacity-70 group/item hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border-2 border-white flex-shrink-0">
                      <img src="https://i.pravatar.cc/150?u=agent2" alt="Agent" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">Sarah Wanjiku</h4>
                        <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0">1h ago</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 leading-none mb-2 uppercase tracking-widest">Independent Agent</p>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                        <CheckCircle size={10} /> Unlocked contact
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Completion Widget */}
            <div className="bg-[#FFF9F2] rounded-[32px] p-6 border border-[#FE9200]/10 relative overflow-hidden group">
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

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Sidebar - Desktop & Mobile overlay */}
      <div className={`fixed inset-0 z-50 md:hidden bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col flex-shrink-0 border-r border-gray-100 shadow-2xl md:shadow-none`}>
        <div className="flex flex-col h-full bg-[#FCFCFD]">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FE9200] rounded-lg flex items-center justify-center shadow-lg shadow-orange-200">
                <Home className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900 text-xl tracking-tight">Yoombaa</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* User Profile Info Card */}
          <div className="px-4 mb-6">
            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white font-bold">
                    {user.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Tenant Account</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 space-y-1.5">
            <SidebarItem icon={LayoutGrid} label="Dashboard" id="dashboard" active={activeTab === 'dashboard'} />
            <SidebarItem icon={FileText} label="My Requests" id="requests" active={activeTab === 'requests'} />
            <div className="relative group">
              <SidebarItem icon={MessageSquare} label="Messages" id="messages" active={activeTab === 'messages'} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FE9200] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">2</span>
            </div>
            <SidebarItem icon={Settings} label="Profile Settings" id="profile" active={activeTab === 'profile'} />
          </div>

          <div className="p-4 mt-auto border-t border-gray-50">
            <button
              onClick={() => { onLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              Log Out
            </button>
          </div>
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

          <div className="flex items-center gap-2 md:gap-5">
            <div className="hidden md:flex items-center gap-1">
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
              <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                <HelpCircle size={20} />
              </button>
            </div>

            <div className="w-[1px] h-6 bg-gray-100 hidden md:block" />

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 pl-2 py-1.5 pr-1.5 group cursor-pointer hover:bg-gray-50 rounded-xl transition-all">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shadow-sm border border-white">
                {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">{user.name?.charAt(0)}</div>}
              </div>
              <span className="hidden md:block text-sm font-bold text-gray-700">{user.name}</span>
              <Menu size={14} className="text-gray-400 hidden md:block group-hover:text-gray-900 transition-colors" />
            </div>
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

