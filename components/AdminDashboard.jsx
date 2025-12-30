import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, CreditCard, FileText, CheckCircle, XCircle,
  LogOut, Search, Bell, ShieldCheck, ShieldAlert, DollarSign, Activity, User, Settings as SettingsIcon, Shield, Mail, Zap,
  Menu, X
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
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
import { SupportManagement } from './admin/SupportManagement';
import { SystemConfiguration } from './admin/SystemConfiguration';
import { Settings } from './admin/Settings';
import { AdminManagement } from './admin/AdminManagement';
import { NotificationTemplates } from './admin/NotificationTemplates';
import { ExternalLeadsManagement } from './admin/ExternalLeadsManagement';
import { NotificationBell } from './NotificationBell';

const SidebarItem = ({ icon: Icon, label, id, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
      ? 'bg-blue-50 text-blue-700 shadow-sm'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
      }`}
  >
    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
    <span className="truncate">{label}</span>
  </button>
);

export const AdminDashboard = ({ onNavigate, currentUser, onLogout, onNotificationClick }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle tab change and close sidebar on mobile
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
    if (confirm('Are you sure you want to approve this agent?')) {
      const result = await approveAgent(agentId);
      if (result.success) {
        setPendingAgents(prev => prev.filter(a => a.id !== agentId));
        alert('Agent approved successfully');
      } else {
        alert('Error approving agent: ' + result.error);
      }
    }
  };

  const handleRejectAgent = async (agentId) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason) {
      const result = await rejectAgent(agentId, reason);
      if (result.success) {
        setPendingAgents(prev => prev.filter(a => a.id !== agentId));
        alert('Agent rejected successfully');
      } else {
        alert('Error rejecting agent: ' + result.error);
      }
    }
  };

  const renderContent = () => {
    if (activeTab === 'overview') {
      return <AdminOverview />;
    }

    if (activeTab === 'agents') {
      return <AgentManagement />;
    }

    if (activeTab === 'renters') {
      return <RenterManagement />;
    }

    if (activeTab === 'leads') {
      return <LeadManagement />;
    }

    if (activeTab === 'settings') {
      return <Settings user={currentUser} />;
    }

    if (activeTab === 'verifications') {
      if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
      }
      return (
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Pending Verifications</h2>
          {pendingAgents.length === 0 ? (
            <div className="text-center py-8 md:py-12 px-4 bg-white rounded-xl border border-gray-200 border-dashed">
              <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending verifications</p>
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {pendingAgents.map(agent => (
                <div key={agent.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg md:text-xl font-bold text-gray-600 flex-shrink-0">
                      {agent.name?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{agent.email}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">Agency: {agent.agencyName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 md:gap-3 w-full md:w-auto flex-shrink-0">
                    <Button
                      onClick={() => handleRejectAgent(agent.id)}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 flex-1 md:flex-none"
                    >
                      <XCircle className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Reject</span>
                    </Button>
                    <Button
                      onClick={() => handleApproveAgent(agent.id)}
                      className="bg-[#16A34A] hover:bg-[#15803D] text-white flex-1 md:flex-none"
                    >
                      <CheckCircle className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Approve</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'finance') {
      return <FinanceManagement />;
    }

    if (activeTab === 'subscriptions') {
      return <SubscriptionManagement />;
    }

    if (activeTab === 'support') {
      return <SupportManagement />;
    }

    if (activeTab === 'system_config') {
      return <SystemConfiguration />;
    }

    if (activeTab === 'admin_management') {
      return <AdminManagement currentUser={currentUser} />;
    }

    if (activeTab === 'notification_templates') {
      return <NotificationTemplates />;
    }

    if (activeTab === 'external_leads') {
      return <ExternalLeadsManagement />;
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile slide-in, Desktop fixed */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-end mb-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="font-bold text-gray-900">Admin Panel</span>
          </div>

          {/* Scrollable navigation for many items */}
          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" active={activeTab === 'overview'} onClick={handleTabChange} />
            <SidebarItem icon={Shield} label="Admin Management" id="admin_management" active={activeTab === 'admin_management'} onClick={handleTabChange} />
            <SidebarItem icon={Users} label="Agents" id="agents" active={activeTab === 'agents'} onClick={handleTabChange} />
            <SidebarItem icon={User} label="Renters" id="renters" active={activeTab === 'renters'} onClick={handleTabChange} />
            <SidebarItem icon={ShieldCheck} label="Verifications" id="verifications" active={activeTab === 'verifications'} onClick={handleTabChange} />
            <SidebarItem icon={DollarSign} label="Finance" id="finance" active={activeTab === 'finance'} onClick={handleTabChange} />
            <SidebarItem icon={CreditCard} label="Subscriptions" id="subscriptions" active={activeTab === 'subscriptions'} onClick={handleTabChange} />
            <SidebarItem icon={ShieldAlert} label="Support" id="support" active={activeTab === 'support'} onClick={handleTabChange} />
            <SidebarItem icon={Activity} label="System Config" id="system_config" active={activeTab === 'system_config'} onClick={handleTabChange} />
            <SidebarItem icon={Mail} label="Notifications" id="notification_templates" active={activeTab === 'notification_templates'} onClick={handleTabChange} />
            <SidebarItem icon={Zap} label="External Leads" id="external_leads" active={activeTab === 'external_leads'} onClick={handleTabChange} />
            <SidebarItem icon={FileText} label="All Leads" id="leads" active={activeTab === 'leads'} onClick={handleTabChange} />
            <SidebarItem icon={SettingsIcon} label="Settings" id="settings" active={activeTab === 'settings'} onClick={handleTabChange} />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => { onLogout(); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification Bell */}
            {currentUser?.id && (
              <NotificationBell
                userId={currentUser.id}
                onNotificationClick={(notif) => {
                  if (onNotificationClick) {
                    onNotificationClick(notif);
                  }
                  // Handle notification click - navigate to relevant section
                  if (notif.type === 'new_lead' && notif.data?.lead_id) {
                    setActiveTab('leads');
                  }
                }}
              />
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{currentUser?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
