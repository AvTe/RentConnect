"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Gift, Users, TrendingUp, Coins, Search, RefreshCw, Loader2,
    ChevronRight, ChevronDown, ChevronLeft, Crown, CheckCircle,
    Clock, ArrowRight, Trophy, Star, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllAgents, getReferralStats } from '@/lib/database';

export const ReferralDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState([]);
    const [referralData, setReferralData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('referrals'); // referrals, earnings, recent
    const [expandedAgent, setExpandedAgent] = useState(null);
    const [stats, setStats] = useState({
        totalReferrals: 0,
        totalCreditsAwarded: 0,
        convertedReferrals: 0,
        topReferrer: null
    });

    // Fetch all agents with referral data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllAgents({ limit: 500 });
            if (result.success) {
                const agentsWithReferrals = result.data.filter(a => a.referralCode);
                setAgents(agentsWithReferrals);

                // Fetch referral stats for each agent
                const referralPromises = agentsWithReferrals.map(async (agent) => {
                    try {
                        const refStats = await getReferralStats(agent.id);
                        return {
                            ...agent,
                            referralStats: refStats.success ? refStats : null,
                            totalReferrals: refStats.stats?.totalReferrals || 0,
                            earnedCredits: refStats.stats?.earnedFromReferrals || 0,
                            convertedCount: refStats.stats?.referralsWithPurchase || 0,
                            referrals: refStats.referrals || []
                        };
                    } catch (e) {
                        return { ...agent, totalReferrals: 0, earnedCredits: 0, convertedCount: 0, referrals: [] };
                    }
                });

                const agentsWithStats = await Promise.all(referralPromises);
                setReferralData(agentsWithStats);

                // Calculate overall stats
                const totalReferrals = agentsWithStats.reduce((sum, a) => sum + a.totalReferrals, 0);
                const totalCredits = agentsWithStats.reduce((sum, a) => sum + a.earnedCredits, 0);
                const converted = agentsWithStats.reduce((sum, a) => sum + a.convertedCount, 0);
                const topReferrer = agentsWithStats.sort((a, b) => b.totalReferrals - a.totalReferrals)[0];

                setStats({
                    totalReferrals,
                    totalCreditsAwarded: totalCredits,
                    convertedReferrals: converted,
                    topReferrer
                });
            }
        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter and sort agents
    const filteredAgents = referralData
        .filter(agent => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                agent.name?.toLowerCase().includes(query) ||
                agent.email?.toLowerCase().includes(query) ||
                agent.referralCode?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'referrals':
                    return b.totalReferrals - a.totalReferrals;
                case 'earnings':
                    return b.earnedCredits - a.earnedCredits;
                case 'recent':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                default:
                    return b.totalReferrals - a.totalReferrals;
            }
        });

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Render referral tree for expanded agent
    const renderReferralTree = (agent) => {
        if (!agent.referrals || agent.referrals.length === 0) {
            return (
                <div className="py-8 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No referrals yet</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {agent.referrals.map((ref, idx) => (
                    <div key={ref.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <ArrowRight className="w-4 h-4 text-gray-300" />
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                {ref.referred?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">{ref.referred?.name || 'User'}</p>
                            <p className="text-xs text-gray-400">{ref.referred?.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ref.bonus_awarded
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                {ref.bonus_awarded ? 'Bonus Paid' : 'Pending'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Referral Analytics</h2>
                    <p className="text-sm text-gray-500 font-medium">Track referral performance across all agents</p>
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
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Users size={22} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-gray-900">{stats.totalReferrals}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Referrals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Coins size={22} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-emerald-600">{stats.totalCreditsAwarded}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits Awarded</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <TrendingUp size={22} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-blue-600">{stats.convertedReferrals}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Converted</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#FE9200] to-[#E58300] rounded-2xl p-6 shadow-sm text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Trophy size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-black truncate">{stats.topReferrer?.name || '—'}</p>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Top Referrer</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or referral code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'referrals', label: 'Most Referrals' },
                            { key: 'earnings', label: 'Top Earners' },
                            { key: 'recent', label: 'Recent' }
                        ].map((sort) => (
                            <button
                                key={sort.key}
                                onClick={() => setSortBy(sort.key)}
                                className={`px-4 h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${sortBy === sort.key
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {sort.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Agents List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading referral data...</p>
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                        <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-900 font-bold mb-1">No agents found</p>
                        <p className="text-gray-500 text-sm">
                            {searchQuery ? 'Try adjusting your search.' : 'Agents will appear here with their referrals.'}
                        </p>
                    </div>
                ) : (
                    filteredAgents.map((agent) => (
                        <div
                            key={agent.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            {/* Agent Header Row */}
                            <div
                                className="p-6 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                            >
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-black text-gray-400 flex-shrink-0 border-2 border-white shadow-md">
                                    {agent.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-xl object-cover" />
                                    ) : (
                                        agent.name?.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-base font-bold text-gray-900">{agent.name}</p>
                                        {agent.totalReferrals > 0 && stats.topReferrer?.id === agent.id && (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                                                <Crown size={10} />
                                                TOP
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{agent.email}</span>
                                        {agent.referralCode && (
                                            <span className="flex items-center gap-1 font-mono text-[#FE9200] font-bold">
                                                {agent.referralCode}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(agent.referralCode);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Copy size={10} />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6">
                                    <div className="text-center hidden md:block">
                                        <p className="text-2xl font-black text-gray-900">{agent.totalReferrals}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Referrals</p>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-2xl font-black text-emerald-600">{agent.earnedCredits}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits</p>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-2xl font-black text-blue-600">{agent.convertedCount}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Converted</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedAgent === agent.id ? 'bg-gray-900 text-white rotate-180' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Stats Row */}
                            <div className="md:hidden px-6 pb-4 grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xl font-black text-gray-900">{agent.totalReferrals}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Referrals</p>
                                </div>
                                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                    <p className="text-xl font-black text-emerald-600">{agent.earnedCredits}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Credits</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-xl">
                                    <p className="text-xl font-black text-blue-600">{agent.convertedCount}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Converted</p>
                                </div>
                            </div>

                            {/* Expanded Referral Tree */}
                            {expandedAgent === agent.id && (
                                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Gift size={16} className="text-gray-400" />
                                        <p className="text-sm font-bold text-gray-900">Referral Tree</p>
                                        <span className="text-xs text-gray-400">({agent.referrals?.length || 0} users)</span>
                                    </div>
                                    {renderReferralTree(agent)}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
