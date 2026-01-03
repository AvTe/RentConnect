"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, FileText, TrendingUp, Activity, Clock,
  AlertCircle, DollarSign, UserPlus, CreditCard, Lock, Wallet,
  ArrowUpRight, ArrowDownRight, Eye, RefreshCw, ChevronRight
} from 'lucide-react';
import { getDashboardStats, getRecentActivity } from '@/lib/database';

export const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResult, activityResult] = await Promise.all([
        getDashboardStats(),
        getRecentActivity()
      ]);

      if (statsResult.success) setStats(statsResult.data);
      if (activityResult.success) setActivity(activityResult.data || []);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'KSh 0';
    const num = parseFloat(amount);
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${(num / 1000).toFixed(1)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'signup':
      case 'user_registered':
        return { icon: UserPlus, bg: 'bg-blue-50', color: 'text-blue-600' };
      case 'transaction':
      case 'credit_purchase':
        return { icon: CreditCard, bg: 'bg-emerald-50', color: 'text-emerald-600' };
      case 'lead':
      case 'lead_created':
      case 'new_lead':
        return { icon: FileText, bg: 'bg-[#FFF2E5]', color: 'text-[#FE9200]' };
      case 'lead_unlocked':
        return { icon: Eye, bg: 'bg-purple-50', color: 'text-purple-600' };
      default:
        return { icon: Activity, bg: 'bg-gray-50', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FE9200] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
          </h1>
          <p className="text-gray-500 font-medium mt-1">Here's what's happening with your platform today.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Agents */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              +12%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Agents</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{stats?.totalAgents || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.verifiedAgents || 0} Verified</p>
          </div>
        </div>

        {/* Active Renters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Renters</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{stats?.activeRenters || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Total registered tenants</p>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#FE9200]" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-[#FE9200] bg-[#FFF2E5] px-2 py-1 rounded-full">
              {stats?.openLeads || 0} Active
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Leads</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{stats?.totalLeads || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.dailyUnlocks || 0} Unlocks (24h)</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              30d
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">System Revenue (30d)</p>
            <p className="text-2xl md:text-3xl font-black text-white mt-1">{formatCurrency(stats?.revenueLast30Days)}</p>
            <p className="text-xs text-white/50 mt-1">Wallet: {formatCurrency(stats?.totalWalletBalance)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                <p className="text-xs text-gray-400">Latest platform events</p>
              </div>
            </div>
            <button className="text-sm font-bold text-[#FE9200] hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="p-6">
            {activity.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.slice(0, 8).map((item, idx) => {
                  const iconConfig = getActivityIcon(item.type);
                  const IconComponent = iconConfig.icon;
                  return (
                    <div key={item.id || idx} className="flex items-start gap-4 group">
                      <div className={`w-10 h-10 rounded-xl ${iconConfig.bg} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-5 h-5 ${iconConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-[#FE9200] transition-colors">
                          {item.title || item.description || item.type}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeTime(item.timestamp || item.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                System Health
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification API</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Healthy
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#FE9200] rounded-2xl p-5 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                <FileText className="w-4 h-4" />
                Create Manual Lead
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                <CreditCard className="w-4 h-4" />
                Top Up Agent Wallet
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                <Lock className="w-4 h-4" />
                Freeze Account
              </button>
            </div>
          </div>

          {/* Last Activity Timestamp */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Update</p>
                <p className="text-lg font-black text-gray-900">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
