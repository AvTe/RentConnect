"use client";

import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Users, Coins } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

/**
 * LiveActivityTicker - Shows real-time activity for social proof (FOMO)
 * 
 * Displays recent activities like:
 * - "Agent X just unlocked a lead in Roysambu"
 * - "Someone in Ruaka just topped up their wallet"
 * - "3 agents are viewing leads right now"
 */
export const LiveActivityTicker = ({ className = '' }) => {
    const [activities, setActivities] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Fetch recent activities from database
    useEffect(() => {
        const fetchRecentActivities = async () => {
            try {
                const supabase = createClient();

                // Get recent unlocks (last 24 hours) for activity feed
                const { data: recentUnlocks, error } = await supabase
                    .from('contact_history')
                    .select(`
                        id,
                        created_at,
                        cost_credits,
                        contact_type,
                        lead:leads!contact_history_lead_id_fkey(location, property_type),
                        agent:users!contact_history_agent_id_fkey(name)
                    `)
                    .in('contact_type', ['unlock', 'exclusive'])
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) {
                    console.error('Error fetching activities:', error);
                    return;
                }

                // LIVE STAT 1: Count leads unlocked in the last hour (REAL DATA)
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
                const { count: hourlyUnlockCount, error: countError } = await supabase
                    .from('contact_history')
                    .select('id', { count: 'exact', head: true })
                    .in('contact_type', ['unlock', 'exclusive'])
                    .gte('created_at', oneHourAgo);

                // LIVE STAT 2: Approximate active viewers (based on recent browse activity in last 10 mins)
                const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
                const { count: recentViewCount, error: viewError } = await supabase
                    .from('contact_history')
                    .select('agent_id', { count: 'exact', head: true })
                    .eq('contact_type', 'browse')
                    .gte('created_at', tenMinsAgo);

                // Transform to display format
                const formattedActivities = (recentUnlocks || []).map(item => {
                    const agentName = item.agent?.name ? anonymizeName(item.agent.name) : 'An agent';
                    const location = item.lead?.location || 'Nairobi';
                    const propertyType = item.lead?.property_type || 'property';
                    const isExclusive = item.contact_type === 'exclusive';
                    const timeAgo = getTimeAgo(new Date(item.created_at));

                    return {
                        id: item.id,
                        type: 'unlock',
                        message: isExclusive
                            ? `${agentName} bought EXCLUSIVE access in ${location}`
                            : `${agentName} unlocked a ${propertyType} lead in ${location}`,
                        subtext: timeAgo,
                        icon: isExclusive ? Coins : Zap,
                        color: isExclusive ? 'text-[#FE9200]' : 'text-green-500',
                        bgColor: isExclusive ? 'bg-[#FFF9F2]' : 'bg-green-50'
                    };
                });

                // Build LIVE stats activities
                const liveUnlockCount = countError ? 0 : (hourlyUnlockCount || 0);
                const liveViewerCount = viewError ? 0 : Math.min(recentViewCount || 0, 20); // Cap at 20 for display

                const statsActivities = [];

                // Only show if there's actual activity
                if (liveViewerCount > 0) {
                    statsActivities.push({
                        id: 'stat-1',
                        type: 'stat',
                        message: `~${liveViewerCount} agent${liveViewerCount !== 1 ? 's' : ''} viewing leads right now`,
                        subtext: 'Live',
                        icon: Users,
                        color: 'text-blue-500',
                        bgColor: 'bg-blue-50'
                    });
                }

                if (liveUnlockCount > 0) {
                    statsActivities.push({
                        id: 'stat-2',
                        type: 'stat',
                        message: `${liveUnlockCount} lead${liveUnlockCount !== 1 ? 's' : ''} unlocked in the last hour`,
                        subtext: 'Trending',
                        icon: TrendingUp,
                        color: 'text-purple-500',
                        bgColor: 'bg-purple-50'
                    });
                }

                // Interleave real activities with stats
                const combined = [];
                formattedActivities.forEach((activity, index) => {
                    combined.push(activity);
                    if (index % 5 === 4 && statsActivities.length > 0) {
                        combined.push(statsActivities.shift());
                    }
                });

                // Add remaining stats at the end
                statsActivities.forEach(stat => combined.push(stat));

                setActivities(combined.length > 0 ? combined : []);
            } catch (error) {
                console.error('Activity ticker error:', error);
            }
        };

        fetchRecentActivities();

        // Refresh every 2 minutes
        const refreshInterval = setInterval(fetchRecentActivities, 120000);
        return () => clearInterval(refreshInterval);
    }, []);

    // Cycle through activities
    useEffect(() => {
        if (activities.length === 0) return;

        const cycleInterval = setInterval(() => {
            setIsVisible(false);

            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % activities.length);
                setIsVisible(true);
            }, 300);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(cycleInterval);
    }, [activities.length]);

    // Helper: Anonymize agent name (e.g., "John Doe" -> "John D.")
    const anonymizeName = (name) => {
        if (!name) return 'Agent';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    };

    // Helper: Get relative time string
    const getTimeAgo = (date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return 'Today';
    };

    if (activities.length === 0) return null;

    const current = activities[currentIndex];
    if (!current) return null;

    const IconComponent = current.icon;

    return (
        <div className={`overflow-hidden ${className}`}>
            <div
                className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 
                    ${current.bgColor} border-transparent
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                `}
            >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${current.bgColor} flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${current.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                        {current.message}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${current.color}`}>
                        {current.subtext}
                    </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
            </div>
        </div>
    );
};

/**
 * LiveActivityPopup - Corner popup notification style
 * Shows briefly and then disappears (like booking.com)
 */
export const LiveActivityPopup = ({ position = 'bottom-left' }) => {
    const [activity, setActivity] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchAndShow = async () => {
            try {
                const supabase = createClient();

                const { data, error } = await supabase
                    .from('contact_history')
                    .select(`
                        id,
                        created_at,
                        contact_type,
                        lead:leads!contact_history_lead_id_fkey(location)
                    `)
                    .in('contact_type', ['unlock', 'exclusive'])
                    .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error || !data) return;

                const location = data.lead?.location || 'Nairobi';
                const isExclusive = data.contact_type === 'exclusive';

                setActivity({
                    message: isExclusive
                        ? `Someone just bought EXCLUSIVE access in ${location}!`
                        : `Someone just unlocked a lead in ${location}`,
                    type: isExclusive ? 'exclusive' : 'unlock'
                });

                // Show popup
                setIsVisible(true);

                // Hide after 4 seconds
                setTimeout(() => setIsVisible(false), 4000);
            } catch (error) {
                console.error('Activity popup error:', error);
            }
        };

        // Show first popup after 10 seconds
        const initialTimeout = setTimeout(fetchAndShow, 10000);

        // Then show periodically (every 30-60 seconds with randomness)
        const periodicInterval = setInterval(() => {
            const randomDelay = Math.random() * 30000 + 30000; // 30-60 seconds
            setTimeout(fetchAndShow, randomDelay);
        }, 60000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(periodicInterval);
        };
    }, []);

    const positionClasses = {
        'bottom-left': 'bottom-24 left-4',
        'bottom-right': 'bottom-24 right-4',
        'top-left': 'top-24 left-4',
        'top-right': 'top-24 right-4'
    };

    if (!activity) return null;

    return (
        <div
            className={`
                fixed ${positionClasses[position]} z-[90] transition-all duration-500 max-w-xs
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            `}
        >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.type === 'exclusive' ? 'bg-[#FFF9F2]' : 'bg-green-50'
                    }`}>
                    <Zap className={`w-5 h-5 ${activity.type === 'exclusive' ? 'text-[#FE9200]' : 'text-green-500'}`} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">{activity.message}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Just now • <span className="text-green-500">Live</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
