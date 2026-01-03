"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Search, RefreshCw, Loader2, Filter, Calendar,
    User, Shield, Settings, CreditCard, FileText, Users, Bell,
    CheckCircle, XCircle, AlertTriangle, Download, Clock, Eye
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getRecentActivity } from '@/lib/database';

export const AdminActivityLogs = () => {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState('7'); // days

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

    // Fetch activity logs
    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getRecentActivity();
            if (result.success) {
                setActivities(result.data || []);
                setFilteredActivities(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    // Filter activities
    useEffect(() => {
        let filtered = [...activities];

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.type === typeFilter);
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.description?.toLowerCase().includes(query) ||
                a.actor?.name?.toLowerCase().includes(query) ||
                a.type?.toLowerCase().includes(query)
            );
        }

        // Apply date range
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        filtered = filtered.filter(a => {
            const activityDate = new Date(a.created_at);
            return activityDate >= daysAgo;
        });

        setFilteredActivities(filtered);
    }, [activities, typeFilter, searchQuery, dateRange]);

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Activity Logs</h2>
                    <p className="text-sm text-gray-500 font-medium">Track all admin actions and system events</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={fetchActivities}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    <Button
                        onClick={exportLogs}
                        className="bg-blue-600 text-white flex items-center gap-2"
                        size="sm"
                    >
                        <Download size={14} />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Activity size={18} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{filteredActivities.length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Events</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Users size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-emerald-600">
                                {filteredActivities.filter(a => a.type === 'agent_approved').length}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approvals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#FE9200]/20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FFF9F2] flex items-center justify-center">
                            <Eye size={18} className="text-[#FE9200]" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#FE9200]">
                                {filteredActivities.filter(a => a.type === 'lead_unlocked').length}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unlocks</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <CreditCard size={18} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-purple-600">
                                {filteredActivities.filter(a => a.type === 'credit_purchase').length}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purchases</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium bg-white"
                        >
                            <option value="1">Last 24 hours</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                    </div>
                </div>

                {/* Type Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${typeFilter === 'all'
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
                            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${typeFilter === key
                                    ? `${config.bg} ${config.color}`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <config.icon size={12} />
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading activity logs...</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-900 font-bold mb-1">No activities found</p>
                        <p className="text-gray-500 text-sm">
                            {searchQuery || typeFilter !== 'all' ? 'Try adjusting your filters.' : 'Activities will appear here.'}
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedActivities).map(([date, dayActivities]) => (
                        <div key={date}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <Calendar size={14} />
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-xs text-gray-400">{dayActivities.length} events</span>
                            </div>

                            <div className="space-y-3">
                                {dayActivities.map((activity, idx) => {
                                    const config = getActivityConfig(activity.type);
                                    const IconComponent = config.icon;
                                    return (
                                        <div
                                            key={activity.id || idx}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                                    <IconComponent size={20} className={config.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {formatRelativeTime(activity.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 mb-1">
                                                        {activity.description || activity.type}
                                                    </p>
                                                    {activity.actor && (
                                                        <p className="text-xs text-gray-500">
                                                            By: {activity.actor.name || activity.actor.email || 'System'}
                                                        </p>
                                                    )}
                                                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                                        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
                                                            {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                                                                <span key={key} className="mr-3">
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
