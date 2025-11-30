import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Wallet, FileText, TrendingUp, Activity, 
  AlertCircle, DollarSign, UserPlus, CreditCard, Lock
} from 'lucide-react';
import { getDashboardStats, getRecentActivity } from '@/lib/firestore';
import { Badge } from '../ui/Badge';

export const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsResult, activityResult] = await Promise.all([
          getDashboardStats(),
          getRecentActivity()
        ]);

        if (statsResult.success) setStats(statsResult.data);
        if (activityResult.success) setActivity(activityResult.data);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading dashboard...</div>;
  }

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Agents" 
          value={stats?.totalAgents || 0} 
          subtext={`${stats?.verifiedAgents || 0} Verified`}
          icon={Users} 
          colorClass="bg-blue-600 text-blue-600" 
        />
        <StatCard 
          title="Active Renters" 
          value={stats?.activeRenters || 0} 
          subtext="Total registered tenants"
          icon={UserPlus} 
          colorClass="bg-purple-600 text-purple-600" 
        />
        <StatCard 
          title="Total Leads" 
          value={stats?.totalLeads || 0} 
          subtext={`${stats?.openLeads || 0} Active • ${stats?.dailyUnlocks || 0} Unlocks (24h)`}
          icon={FileText} 
          colorClass="bg-[#FE9200] text-[#FE9200]" 
        />
        <StatCard 
          title="System Revenue (30d)" 
          value={`₦ ${(stats?.revenueLast30Days || 0).toLocaleString()}`} 
          subtext={`Wallet Balance: ₦ ${(stats?.totalWalletBalance || 0).toLocaleString()}`}
          icon={DollarSign} 
          colorClass="bg-[#16A34A] text-[#16A34A]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Recent Activity
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          
          <div className="space-y-6">
            {activity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity found.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === 'signup' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'transaction' ? 'bg-[#FFE4C4] text-[#16A34A]' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {item.type === 'signup' && <UserPlus className="w-5 h-5" />}
                    {item.type === 'transaction' && <CreditCard className="w-5 h-5" />}
                    {item.type === 'lead' && <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health & Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <Badge className="bg-[#FFE4C4] text-green-800 border-[#D4F3D4]">Operational</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verification API</span>
                <Badge className="bg-[#FFE4C4] text-green-800 border-[#D4F3D4]">Operational</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <Badge className="bg-[#FFE4C4] text-green-800 border-[#D4F3D4]">Healthy</Badge>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
            <h3 className="font-bold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> Create Manual Lead
              </button>
              <button className="w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Top Up Agent Wallet
              </button>
              <button className="w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center gap-2">
                <Lock className="w-4 h-4" /> Freeze Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
