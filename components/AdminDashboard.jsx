"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, CreditCard, FileText, CheckCircle, XCircle,
  LogOut, Search, Bell, ShieldCheck, DollarSign, Activity, User, Settings as SettingsIcon, Shield, Mail, Zap,
  Menu, X, Flag, Star, Gift, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, Ticket, Headphones
} from 'lucide-react';
import { Button } from './ui/Button';
import {
  getPendingAgents,
  approveAgent,
  rejectAgent
} from '@/lib/database';
import { AdminOverview } from './admin/AdminOverview';
import { AgentManagement } from './admin/AgentManagement';
import { RenterManagement } from './admin/RenterManagement';
import { LeadManagement } from './admin/LeadManagement';
import { FinanceManagement } from './admin/FinanceManagement';
import { SubscriptionManagement } from './admin/SubscriptionManagement';
import { AdminManagement } from './admin/AdminManagement';
import { NotificationTemplates } from './admin/NotificationTemplates';
import { ExternalLeadsManagement } from './admin/ExternalLeadsManagement';
import { BadLeadReportsManagement } from './admin/BadLeadReportsManagement';
import { ReferralDashboard } from './admin/ReferralDashboard';
import { RatingsManagement } from './admin/RatingsManagement';
import { ExternalLeadsAnalytics } from './admin/ExternalLeadsAnalytics';
import { SystemSettings } from './admin/SystemSettings';
import { AdminActivityLogs } from './admin/AdminActivityLogs';
import AdminVoucherManagement from './admin/AdminVoucherManagement';
import { NotificationBell } from './NotificationBell';
import { useToast } from '@/context/ToastContext';
import { AdminTicketsDashboard } from './tickets';
import { getTicketStats } from '@/lib/ticket-service';

// Sidebar navigation items configuration
const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { id: 'admin_management', label: 'Admin Users', icon: Shield, section: 'main' },
  { id: 'support_tickets', label: 'Support Tickets', icon: Headphones, section: 'main' },
  { id: 'leads', label: 'All Leads', icon: FileText, section: 'leads' },
  { id: 'agents', label: 'Agents', icon: Users, section: 'users' },
  { id: 'renters', label: 'Renters', icon: User, section: 'users' },
  { id: 'verifications', label: 'Verifications', icon: ShieldCheck, section: 'users' },
  { id: 'bad_leads', label: 'Bad Reports', icon: Flag, section: 'leads' },
  { id: 'finance', label: 'Finance', icon: DollarSign, section: 'business' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, section: 'business' },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket, section: 'business' },
  { id: 'referrals', label: 'Referrals', icon: Gift, section: 'marketing' },
  { id: 'ratings', label: 'Ratings', icon: Star, section: 'marketing' },
  { id: 'analytics', label: 'Analytics', icon: Zap, section: 'marketing' },
  { id: 'external_leads', label: 'External Leads', icon: Zap, section: 'integrations' },
  { id: 'notification_templates', label: 'Notifications', icon: Mail, section: 'system' },
  { id: 'activity_logs', label: 'Activity Logs', icon: Activity, section: 'system' },
  { id: 'system_settings', label: 'Settings', icon: SettingsIcon, section: 'system' },
];

const SidebarItem = ({ icon: Icon, label, id, active, onClick, collapsed, badge }) => (
  <button
    onClick={() => onClick(id)}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
      ${active
        ? 'bg-[#FE9200] text-white'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }
      ${collapsed ? 'justify-center' : ''}
    `}
  >
    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
    {!collapsed && <span className="truncate">{label}</span>}
    {!collapsed && badge > 0 && (
      <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
        {badge}
      </span>
    )}
    {collapsed && badge > 0 && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

export const AdminDashboard = ({ onNavigate, currentUser, onLogout, onNotificationClick }) => {
  const { toast, showConfirm, showPrompt } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openTicketCount, setOpenTicketCount] = useState(0);

  // Handle tab change and close sidebar on mobile
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  // Toggle sidebar collapse (desktop only)
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchData();
    }
    // Fetch ticket stats on mount
    fetchTicketCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchTicketCount = async () => {
    try {
      const result = await getTicketStats();
      if (result.success) {
        setOpenTicketCount(result.data.open || 0);
      }
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'verifications') {
        const result = await getPendingAgents();
        if (result.success) setPendingAgents(result.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAgent = async (agentId) => {
    showConfirm('Are you sure you want to approve this agent?', async () => {
      const result = await approveAgent(agentId);
      if (result.success) {
        setPendingAgents(prev => prev.filter(a => a.id !== agentId));
        toast.success('Agent approved successfully');
      } else {
        toast.error('Error approving agent: ' + result.error);
      }
    });
  };

  const handleRejectAgent = async (agentId) => {
    showPrompt('Please enter a reason for rejection:', async (reason) => {
      if (reason) {
        const result = await rejectAgent(agentId, reason);
        if (result.success) {
          setPendingAgents(prev => prev.filter(a => a.id !== agentId));
          toast.success('Agent rejected successfully');
        } else {
          toast.error('Error rejecting agent: ' + result.error);
        }
      } else {
        toast.warning('Rejection reason is required.');
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'agents':
        return <AgentManagement />;
      case 'renters':
        return <RenterManagement />;
      case 'leads':
        return <LeadManagement />;
      case 'verifications':
        return renderVerifications();
      case 'finance':
        return <FinanceManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'vouchers':
        return <AdminVoucherManagement currentUser={currentUser} />;
      case 'admin_management':
        return <AdminManagement currentUser={currentUser} />;
      case 'notification_templates':
        return <NotificationTemplates />;
      case 'external_leads':
        return <ExternalLeadsManagement />;
      case 'bad_leads':
        return <BadLeadReportsManagement currentUser={currentUser} />;
      case 'referrals':
        return <ReferralDashboard />;
      case 'ratings':
        return <RatingsManagement />;
      case 'analytics':
        return <ExternalLeadsAnalytics />;
      case 'system_settings':
        return <SystemSettings />;
      case 'activity_logs':
        return <AdminActivityLogs />;
      case 'support_tickets':
        return <AdminTicketsDashboard currentUser={currentUser} />;
      default:
        return <AdminOverview />;
    }
  };

  const renderVerifications = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#FE9200] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Pending Verifications</h2>
          <p className="text-sm text-gray-500 font-medium">Review and approve agent verification requests</p>
        </div>
        {pendingAgents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-gray-900 font-bold mb-1">All caught up!</p>
            <p className="text-gray-500 text-sm">No pending verifications</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingAgents.map(agent => (
              <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center text-xl font-bold text-gray-600">
                      {agent.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Agency: {agent.agencyName || 'Independent'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button
                      onClick={() => handleRejectAgent(agent.id)}
                      variant="outline"
                      className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveAgent(agent.id)}
                      className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get current nav item for header title
  const currentNavItem = navItems.find(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans overflow-hidden">
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-10" />
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

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              id={item.id}
              active={activeTab === item.id}
              onClick={handleTabChange}
              collapsed={isSidebarCollapsed}
              badge={item.id === 'support_tickets' ? openTicketCount : 0}
            />
          ))}
        </div>

        {/* Sidebar Footer - User Profile */}
        <div className={`p-4 border-t border-gray-100 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{currentUser?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email || 'admin@rentconnect.co.ke'}</p>
              </div>
            </div>
          ) : null}
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
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {currentNavItem?.section?.toUpperCase() || 'OVERVIEW'}
              </p>
              <h1 className="text-lg font-black text-gray-900">
                {currentNavItem?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-40 placeholder:text-gray-400"
              />
            </div>

            {/* Notifications */}
            {currentUser?.id && (
              <NotificationBell
                userId={currentUser.id}
                onNotificationClick={(notif) => {
                  if (onNotificationClick) onNotificationClick(notif);
                  if (notif.type === 'new_lead' && notif.data?.lead_id) {
                    setActiveTab('leads');
                  }
                }}
              />
            )}

            {/* User Avatar (desktop) */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-gray-900">{currentUser?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
