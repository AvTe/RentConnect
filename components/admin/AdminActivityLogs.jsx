"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Search, RefreshCw, Loader2, Filter, Calendar,
    User, Shield, Settings, CreditCard, FileText, Users, Bell,
    CheckCircle, XCircle, AlertTriangle, Download, Clock, Eye
} from 'lucide-react';
import { Button } from '../ui/Button';

export const AdminActivityLogs = () => {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState('7'); // days
    const [stats, setStats] = useState({ total: 0, approvals: 0, unlocks: 0, purchases: 0 });

    // Activity type configurations
    const activityTypes = {
        agent_approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Agent Approved' },
        agent_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Agent Rejected' },
        agent_suspended: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Agent Suspended' },
        agent_reactivated: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Agent Reactivated' },
        lead_created: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Lead Created' },
        lead_unlocked: { icon: Eye, color: 'text-[#FE9200]', bg: 'bg-orange-50', label: 'Lead Unlocked' },
        credit_purchase: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Credit Purchase' },
        credit_added: { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Credits Added' },
        user_registered: { icon: User, color: 'text-purple-600', bg: 'bg-purple-50', label: 'User Registered' },
        admin_login: { icon: Shield, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Admin Login' },
        settings_updated: { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Settings Updated' },
        notification_sent: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Notification Sent' },
        bad_lead_reported: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Bad Lead Reported' },
        bad_lead_approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Bad Lead Approved' },
        bad_lead_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Bad Lead Rejected' }
    };

    // Default activity type
    const defaultType = { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Activity' };

    // Fetch activity logs from API
    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const typeParam = typeFilter === 'all' ? 'all' : typeFilter;
            const response = await fetch(`/api/admin/activity-logs?type=${typeParam}&days=${dateRange}&limit=200`);
            const result = await response.json();

            if (result.success) {
                setActivities(result.data || []);
                setStats(result.stats || { total: 0, approvals: 0, unlocks: 0, purchases: 0 });
            } else {
                console.error('Error fetching activities:', result.error);
                setActivities([]);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [typeFilter, dateRange]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    // Filter activities (search is done client-side, type/date filter triggers API refetch)
    useEffect(() => {
        let filtered = [...activities];

        // Apply search filter client-side
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.description?.toLowerCase().includes(query) ||
                a.actor?.name?.toLowerCase().includes(query) ||
                a.actor?.email?.toLowerCase().includes(query) ||
                a.type?.toLowerCase().includes(query)
            );
        }

        setFilteredActivities(filtered);
    }, [activities, searchQuery]);

    // Export to CSV
    const exportLogs = () => {
        const headers = ['Type', 'Description', 'Actor', 'Date', 'Details'];
        const csvData = filteredActivities.map(a => [
            a.type || 'unknown',
            a.description || '',
            a.actor?.name || a.actor?.email || 'System',
            a.created_at ? new Date(a.created_at).toLocaleString() : '',
            JSON.stringify(a.metadata || {})
        ]);

        const csvContent = [headers, ...csvData].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Get activity type config
    const getActivityConfig = (type) => activityTypes[type] || defaultType;

    // Format relative time
    const formatRelativeTime = (dateString) => {
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

    // Group activities by date
    const groupedActivities = filteredActivities.reduce((groups, activity) => {
        const date = new Date(activity.created_at).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(activity);
        return groups;
    }, {});

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">Activity Logs</h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Track all admin actions and system events</p>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                        onClick={fetchActivities}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-center text-xs sm:text-sm"
                    >
                        <RefreshCw size={12} className={`sm:hidden ${loading ? 'animate-spin' : ''}`} />
                        <RefreshCw size={14} className={`hidden sm:block ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={exportLogs}
                        className="bg-blue-600 text-white flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-center text-xs sm:text-sm"
                        size="sm"
                    >
                        <Download size={12} className="sm:hidden" />
                        <Download size={14} className="hidden sm:block" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Activity size={16} className="text-gray-600 sm:hidden" />
                            <Activity size={18} className="text-gray-600 hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-black text-gray-900">{stats.total}</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Events</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Users size={16} className="text-emerald-600 sm:hidden" />
                            <Users size={18} className="text-emerald-600 hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-black text-emerald-600">{stats.approvals}</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Approvals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-[#FE9200]/20 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FFF9F2] flex items-center justify-center flex-shrink-0">
                            <Eye size={16} className="text-[#FE9200] sm:hidden" />
                            <Eye size={18} className="text-[#FE9200] hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-black text-[#FE9200]">{stats.unlocks}</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Unlocks</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <CreditCard size={16} className="text-purple-600 sm:hidden" />
                            <CreditCard size={18} className="text-purple-600 hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-black text-purple-600">{stats.purchases}</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Purchases</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-lg sm:rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-xs sm:text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="h-10 sm:h-12 px-3 sm:px-4 rounded-lg sm:rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-xs sm:text-sm font-medium bg-white flex-1 sm:flex-none"
                        >
                            <option value="1">Last 24 hours</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                    </div>
                </div>

                {/* Type Filter Chips - Scrollable on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap transition-all ${typeFilter === 'all'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All Events
                    </button>
                    {Object.entries(activityTypes).slice(0, 6).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 ${typeFilter === key
                                    ? `${config.bg} ${config.color}`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <config.icon size={10} className="sm:hidden" />
                            <config.icon size={12} className="hidden sm:block" />
                            <span className="hidden sm:inline">{config.label}</span>
                            <span className="sm:hidden">{config.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4 sm:space-y-6">
                {loading ? (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-gray-100 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#FE9200] animate-spin mb-3 sm:mb-4" />
                        <p className="text-gray-500 font-medium text-sm sm:text-base">Loading activity logs...</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-gray-100 text-center">
                        <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <p className="text-gray-900 font-bold mb-1 text-sm sm:text-base">No activities found</p>
                        <p className="text-gray-500 text-xs sm:text-sm">
                            {searchQuery || typeFilter !== 'all' ? 'Try adjusting your filters.' : 'Activities will appear here.'}
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedActivities).map(([date, dayActivities]) => (
                        <div key={date}>
                            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-gray-400">
                                    <Calendar size={12} className="sm:hidden" />
                                    <Calendar size={14} className="hidden sm:block" />
                                    <span className="hidden sm:inline">
                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="sm:hidden">
                                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] sm:text-xs text-gray-400">{dayActivities.length} events</span>
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                {dayActivities.map((activity, idx) => {
                                    const config = getActivityConfig(activity.type);
                                    const IconComponent = config.icon;
                                    return (
                                        <div
                                            key={activity.id || idx}
                                            className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start gap-2.5 sm:gap-4">
                                                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                                    <IconComponent size={16} className={`${config.color} sm:hidden`} />
                                                    <IconComponent size={20} className={`${config.color} hidden sm:block`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock size={8} className="sm:hidden" />
                                                            <Clock size={10} className="hidden sm:block" />
                                                            {formatRelativeTime(activity.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                                                        {activity.description || activity.type}
                                                    </p>
                                                    {activity.actor && (
                                                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                                            By: {activity.actor.name || activity.actor.email || 'System'}
                                                        </p>
                                                    )}
                                                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                                        <div className="mt-2 p-1.5 sm:p-2 bg-gray-50 rounded-lg text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                                                            {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                                                                <span key={key} className="mr-2 sm:mr-3">
                                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
