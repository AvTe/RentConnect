"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, ExternalLink, Loader2, RefreshCw, Search, Filter,
    Zap, Target, Globe, ArrowUpRight, ArrowDownRight, BarChart3,
    PieChart, Activity, Calendar, Eye, Users, Inbox, MapPin,
    Facebook, Chrome, Instagram, Layout, Sparkles, Link2, Share2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getExternalLeads, getLeadSourceAnalytics, getExternalLeadLogs } from '@/lib/database';

export const ExternalLeadsAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [externalLeads, setExternalLeads] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('30');
    const [sourceFilter, setSourceFilter] = useState('all');

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

    // Get source icon component - using Lucide icons instead of emojis
    const SourceIcon = ({ source, size = 18, className = '' }) => {
        const iconProps = { size, className };
        switch (source?.toLowerCase()) {
            case 'facebook':
                return <Facebook {...iconProps} />;
            case 'google':
                return <Chrome {...iconProps} />;
            case 'zapier':
                return <Zap {...iconProps} />;
            case 'tiktok':
                return <Share2 {...iconProps} />;
            case 'instagram':
                return <Instagram {...iconProps} />;
            case 'website':
                return <Globe {...iconProps} />;
            case 'organic':
                return <Sparkles {...iconProps} />;
            default:
                return <Link2 {...iconProps} />;
        }
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
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        {totals.totalLeads > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} />
                                Active
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">External Leads</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{externalLeads.length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Converted</p>
                        <p className="text-2xl md:text-3xl font-black text-emerald-600 mt-1">{totals.totalConverted}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                            <Zap className="w-6 h-6 text-[#FE9200]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits Revenue</p>
                        <p className="text-2xl md:text-3xl font-black text-[#FE9200] mt-1">{totals.totalRevenue}</p>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            {totals.topSource ? (
                                <SourceIcon source={totals.topSource[0]} className="text-white" />
                            ) : (
                                <BarChart3 className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Top Source</p>
                        <p className="text-xl font-black text-white mt-1 capitalize">{totals.topSource?.[0] || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl p-2 border border-gray-200 inline-flex gap-1">
                {[
                    { key: 'overview', label: 'Overview', icon: BarChart3 },
                    { key: 'leads', label: 'External Leads', icon: Inbox, count: externalLeads.length },
                    { key: 'logs', label: 'Activity Logs', icon: Activity, count: logs.length }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.key
                            ? 'bg-[#FE9200] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                <PieChart size={18} className="text-gray-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Lead Sources Breakdown</h3>
                                <p className="text-xs text-gray-400">Performance by acquisition channel</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
                                </div>
                            ) : !analytics || Object.keys(analytics).length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Globe className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-900 font-bold mb-1">No external lead data yet</p>
                                    <p className="text-gray-500 text-sm">Connect your ad platforms to start tracking leads</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
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
                                                            <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center`}>
                                                                <SourceIcon source={source} size={18} className={color.text} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-gray-900 capitalize">{source}</span>
                                                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${color.light} ${color.text}`}>
                                                                    {data.count || 0} leads
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-emerald-600 font-bold">{data.converted || 0} converted</span>
                                                            <span className="text-gray-400 font-medium">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-13">
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
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                                        <Sparkles size={18} className="text-purple-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-600">Organic (Direct)</span>
                                                </div>
                                                <span className="text-gray-500 text-sm">{analytics.organic.count || 0} leads</span>
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
                                <div key={source} className={`bg-white rounded-2xl p-5 border-2 ${color.border} hover:shadow-md transition-all`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center`}>
                                            <SourceIcon source={source} size={18} className={color.text} />
                                        </div>
                                        <span className="font-bold text-gray-900 capitalize">{source}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xl font-black text-gray-900">{data.count || 0}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Leads</p>
                                        </div>
                                        <div className={`${color.light} rounded-xl p-3`}>
                                            <p className={`text-xl font-black ${color.text}`}>{conversionRate}%</p>
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
                    <div className="bg-white rounded-2xl p-4 border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSourceFilter('all')}
                                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${sourceFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${sourceFilter === source
                                            ? `${color.bg} text-white`
                                            : `${color.light} ${color.text} hover:opacity-80`
                                            }`}
                                    >
                                        <SourceIcon source={source} size={14} />
                                        <span className="capitalize">{source}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Leads List */}
                    {loading ? (
                        <div className="bg-white rounded-2xl p-12 border border-gray-200 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading external leads...</p>
                        </div>
                    ) : externalLeads.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-900 font-bold mb-1">No external leads found</p>
                            <p className="text-gray-500 text-sm">Leads from ads and integrations will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {externalLeads.map((lead) => {
                                const color = getSourceColor(lead.source);
                                return (
                                    <div key={lead.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${color.light} flex items-center justify-center flex-shrink-0`}>
                                                <SourceIcon source={lead.source} size={20} className={color.text} />
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
                                                        <MapPin size={12} />
                                                        {lead.location || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[#FE9200] font-bold">
                                                        KSh {lead.budget?.toLocaleString() || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={12} />
                                                        {lead.views || 0} views
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        {lead.contacts || 0} contacts
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-gray-400">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</p>
                                                {lead.campaign && (
                                                    <p className="mt-1 text-xs font-medium text-gray-500">Campaign: {lead.campaign}</p>
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Activity size={18} className="text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Import Activity Logs</h3>
                            <p className="text-xs text-gray-400">Track all lead imports and updates</p>
                        </div>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Activity className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-900 font-bold mb-1">No activity logs yet</p>
                                <p className="text-gray-500 text-sm">Import activity will be recorded here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log, idx) => {
                                    const color = getSourceColor(log.source);
                                    return (
                                        <div key={log.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center`}>
                                                <SourceIcon source={log.source} size={16} className={color.text} />
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
