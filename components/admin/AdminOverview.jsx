import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Wallet, FileText, TrendingUp, Activity, 
  AlertCircle, DollarSign, UserPlus, CreditCard, Lock
} from 'lucide-react';
import { getDashboardStats, getRecentActivity } from '@/lib/database';
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
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</h3>
        </div>
        <div className={`p-2 md:p-3 rounded-lg ${colorClass} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-500 truncate">{subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
          value={`KSh ${(stats?.revenueLast30Days || 0).toLocaleString()}`} 
          subtext={`Wallet Balance: KSh ${(stats?.totalWalletBalance || 0).toLocaleString()}`}
          icon={DollarSign} 
          colorClass="bg-[#16A34A] text-[#16A34A]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              Recent Activity
            </h3>
            <button className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {activity.length === 0 ? (
              <p className="text-gray-500 text-center py-6 md:py-8 text-sm">No recent activity found.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="flex gap-3 md:gap-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === 'signup' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'transaction' ? 'bg-[#FFE4C4] text-[#16A34A]' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {item.type === 'signup' && <UserPlus className="w-4 h-4 md:w-5 md:h-5" />}
                    {item.type === 'transaction' && <CreditCard className="w-4 h-4 md:w-5 md:h-5" />}
                    {item.type === 'lead' && <FileText className="w-4 h-4 md:w-5 md:h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-2">{item.description}</p>
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
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              System Health
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs md:text-sm text-gray-600">Payment Gateway</span>
                <Badge className="bg-[#FFE4C4] text-green-800 border-[#D4F3D4] text-xs">Operational</Badge>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs md:text-sm text-gray-600">Verification API</span>
                <Badge className="bg-[#FFE4C4] text-green-800 border-[#D4F3D4] text-xs">Operational</Badge>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs md:text-sm text-gray-600">Database</span>
                <Badge className="bg-[#FFE4C4] text-green-800 border-[#D4F3D4] text-xs">Healthy</Badge>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 text-white">
            <h3 className="font-bold mb-2 text-sm md:text-base">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 md:px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">Create Manual Lead</span>
              </button>
              <button className="w-full text-left px-3 md:px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-2">
                <Wallet className="w-4 h-4 flex-shrink-0" /> <span className="truncate">Top Up Agent Wallet</span>
              </button>
              <button className="w-full text-left px-3 md:px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" /> <span className="truncate">Freeze Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
