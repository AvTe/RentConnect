"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, ExternalLink, Loader2, RefreshCw, Search, Filter,
    Zap, Target, Globe, ArrowUpRight, ArrowDownRight, BarChart3,
    PieChart, Activity, Calendar, Eye, Users, Inbox, MapPin
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getExternalLeads, getLeadSourceAnalytics, getExternalLeadLogs } from '@/lib/database';

export const ExternalLeadsAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [externalLeads, setExternalLeads] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, leads, logs
    const [dateRange, setDateRange] = useState('30'); // 7, 15, 30, 90 days
    const [sourceFilter, setSourceFilter] = useState('all'); // all, facebook, google, zapier, etc.

    // Fetch all data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsResult, analyticsResult, logsResult] = await Promise.all([
                getExternalLeads({ source: sourceFilter !== 'all' ? sourceFilter : undefined }),
                getLeadSourceAnalytics(),
                getExternalLeadLogs({})
            ]);

            if (leadsResult.success) setExternalLeads(leadsResult.data || []);
            if (analyticsResult.success) setAnalytics(analyticsResult.data);
            if (logsResult.success) setLogs(logsResult.data || []);
        } catch (error) {
            console.error('Error fetching external leads data:', error);
        } finally {
            setLoading(false);
        }
    }, [sourceFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Get source color
    const getSourceColor = (source) => {
        const colors = {
            facebook: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
            google: { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
            zapier: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
            tiktok: { bg: 'bg-gray-900', light: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
            instagram: { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
            website: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
            organic: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' }
        };
        return colors[source?.toLowerCase()] || { bg: 'bg-gray-400', light: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    };

    // Get source icon
    const getSourceIcon = (source) => {
        const icons = {
            facebook: '📘',
            google: '🔍',
            zapier: '⚡',
            tiktok: '🎵',
            instagram: '📷',
            website: '🌐',
            organic: '🌱'
        };
        return icons[source?.toLowerCase()] || '📊';
    };

    // Calculate totals from analytics
    const totals = analytics ? {
        totalLeads: Object.values(analytics).reduce((sum, s) => sum + (s.count || 0), 0),
        totalConverted: Object.values(analytics).reduce((sum, s) => sum + (s.converted || 0), 0),
        totalRevenue: Object.values(analytics).reduce((sum, s) => sum + (s.revenue || 0), 0),
        topSource: Object.entries(analytics).sort((a, b) => (b[1].count || 0) - (a[1].count || 0))[0]
    } : { totalLeads: 0, totalConverted: 0, totalRevenue: 0, topSource: null };

    // Sources list from analytics
    const sources = analytics ? Object.keys(analytics).filter(k => k !== 'organic') : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">External Leads Analytics</h2>
                    <p className="text-sm text-gray-500 font-medium">Track leads from Facebook, Google Ads, Zapier & more</p>
                </div>
                <Button
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Target size={22} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-gray-900">{externalLeads.length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">External Leads</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <TrendingUp size={22} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-emerald-600">{totals.totalConverted}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Converted</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#FE9200]/20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FFF9F2] flex items-center justify-center">
                            <Zap size={22} className="text-[#FE9200]" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-[#FE9200]">{totals.totalRevenue}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits Revenue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-sm text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                            {totals.topSource ? getSourceIcon(totals.topSource[0]) : '📊'}
                        </div>
                        <div>
                            <p className="text-lg font-black truncate capitalize">{totals.topSource?.[0] || '—'}</p>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Top Source</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                    { key: 'overview', label: 'Overview', icon: BarChart3 },
                    { key: 'leads', label: 'External Leads', icon: Inbox, count: externalLeads.length },
                    { key: 'logs', label: 'Activity Logs', icon: Activity, count: logs.length }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.key
                                ? 'bg-gray-900 text-white shadow-lg'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Source Breakdown */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <PieChart size={16} className="text-gray-400" />
                                Lead Sources Breakdown
                            </h3>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
                                </div>
                            ) : !analytics || Object.keys(analytics).length === 0 ? (
                                <div className="text-center py-12">
                                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No external lead data yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(analytics)
                                        .filter(([key]) => key !== 'organic')
                                        .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
                                        .map(([source, data]) => {
                                            const color = getSourceColor(source);
                                            const percentage = totals.totalLeads > 0
                                                ? ((data.count || 0) / totals.totalLeads * 100).toFixed(1)
                                                : 0;
                                            return (
                                                <div key={source} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">{getSourceIcon(source)}</span>
                                                            <span className="font-bold text-gray-900 capitalize">{source}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color.light} ${color.text}`}>
                                                                {data.count || 0} leads
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-emerald-600 font-bold">{data.converted || 0} converted</span>
                                                            <span className="text-gray-400">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${color.bg}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {/* Include organic for comparison */}
                                    {analytics.organic && (
                                        <div className="pt-4 mt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <span>🌱</span>
                                                    <span className="font-medium">Organic (Direct)</span>
                                                </div>
                                                <span>{analytics.organic.count || 0} leads</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {sources.slice(0, 4).map((source) => {
                            const data = analytics?.[source] || {};
                            const color = getSourceColor(source);
                            const conversionRate = data.count > 0
                                ? ((data.converted || 0) / data.count * 100).toFixed(1)
                                : 0;
                            return (
                                <div key={source} className={`bg-white rounded-2xl p-5 border ${color.border} shadow-sm`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">{getSourceIcon(source)}</span>
                                        <span className="font-bold text-gray-900 capitalize">{source}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div>
                                            <p className="text-2xl font-black text-gray-900">{data.count || 0}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Leads</p>
                                        </div>
                                        <div>
                                            <p className={`text-2xl font-black ${color.text}`}>{conversionRate}%</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Conv.</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* External Leads Tab */}
            {activeTab === 'leads' && (
                <div className="space-y-4">
                    {/* Filter */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSourceFilter('all')}
                                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${sourceFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All Sources
                            </button>
                            {sources.map((source) => {
                                const color = getSourceColor(source);
                                return (
                                    <button
                                        key={source}
                                        onClick={() => setSourceFilter(source)}
                                        className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${sourceFilter === source
                                                ? `${color.bg} text-white`
                                                : `${color.light} ${color.text} hover:opacity-80`
                                            }`}
                                    >
                                        {getSourceIcon(source)} {source}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Leads List */}
                    {loading ? (
                        <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading external leads...</p>
                        </div>
                    ) : externalLeads.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                            <ExternalLink className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-900 font-bold mb-1">No external leads found</p>
                            <p className="text-gray-500 text-sm">Leads from ads and integrations will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {externalLeads.map((lead) => {
                                const color = getSourceColor(lead.source);
                                return (
                                    <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${color.light} flex items-center justify-center text-2xl flex-shrink-0`}>
                                                {getSourceIcon(lead.source)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <p className="font-bold text-gray-900">{lead.property_type || 'Property Request'}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${color.light} ${color.text} border ${color.border}`}>
                                                        {lead.source}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${lead.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                                            lead.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                                                                'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {lead.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={10} />
                                                        {lead.location || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[#FE9200] font-bold">
                                                        KSh {lead.budget?.toLocaleString() || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={10} /> {lead.views || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={10} /> {lead.contacts || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 text-xs text-gray-400">
                                                <p>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</p>
                                                {lead.campaign && (
                                                    <p className="mt-1 font-medium text-gray-500">Campaign: {lead.campaign}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Activity size={16} className="text-gray-400" />
                            Import Activity Logs
                        </h3>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No activity logs yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log, idx) => {
                                    const color = getSourceColor(log.source);
                                    return (
                                        <div key={log.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className={`w-10 h-10 rounded-lg ${color.light} flex items-center justify-center text-lg`}>
                                                {getSourceIcon(log.source)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900">{log.action || 'Lead imported'}</p>
                                                <p className="text-xs text-gray-400">{log.details || `From ${log.source}`}</p>
                                            </div>
                                            <div className="text-right text-xs text-gray-400">
                                                <p>{log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
