import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, FileText, CheckCircle, XCircle, 
  LogOut, Search, Bell, ShieldCheck, ShieldAlert, DollarSign, Activity, User, Settings as SettingsIcon
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  getPendingAgents, 
  approveAgent, 
  rejectAgent
} from '@/lib/firestore';
import { AdminOverview } from './admin/AdminOverview';
import { AgentManagement } from './admin/AgentManagement';
import { RenterManagement } from './admin/RenterManagement';
import { LeadManagement } from './admin/LeadManagement';
import { FinanceManagement } from './admin/FinanceManagement';
import { SubscriptionManagement } from './admin/SubscriptionManagement';
import { SupportManagement } from './admin/SupportManagement';
import { SystemConfiguration } from './admin/SystemConfiguration';
import { Settings } from './admin/Settings';

export const AdminDashboard = ({ onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-blue-50 text-blue-700 shadow-sm' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
      {label}
    </button>
  );

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

    if (loading) {
      return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    if (activeTab === 'verifications') {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pending Verifications</h2>
          {pendingAgents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending verifications</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingAgents.map(agent => (
                <div key={agent.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                      {agent.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Agency: {agent.agencyName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleRejectAgent(agent.id)}
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleApproveAgent(agent.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
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

    return null;
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="font-bold text-gray-900">Admin Panel</span>
          </div>

          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" active={activeTab === 'overview'} />
            <SidebarItem icon={Users} label="Agents" id="agents" active={activeTab === 'agents'} />
            <SidebarItem icon={User} label="Renters" id="renters" active={activeTab === 'renters'} />
            <SidebarItem icon={ShieldCheck} label="Verifications" id="verifications" active={activeTab === 'verifications'} />
            <SidebarItem icon={DollarSign} label="Finance" id="finance" active={activeTab === 'finance'} />
            <SidebarItem icon={CreditCard} label="Subscriptions" id="subscriptions" active={activeTab === 'subscriptions'} />
            <SidebarItem icon={ShieldAlert} label="Support" id="support" active={activeTab === 'support'} />
            <SidebarItem icon={Activity} label="System Config" id="system_config" active={activeTab === 'system_config'} />
            <SidebarItem icon={FileText} label="All Leads" id="leads" active={activeTab === 'leads'} />
            <SidebarItem icon={SettingsIcon} label="Settings" id="settings" active={activeTab === 'settings'} />
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700">{currentUser?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
