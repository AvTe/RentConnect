"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Star, Search, RefreshCw, Loader2, Flag, CheckCircle, XCircle,
    AlertTriangle, ChevronLeft, ChevronRight, Eye, Trash2, Filter,
    TrendingUp, MessageCircle, User, Calendar
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getAllRatings, flagAgentRating, deleteAgentRating } from '@/lib/database';

export const RatingsManagement = () => {
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState([]);
    const [filteredRatings, setFilteredRatings] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, flagged, removed
    const [ratingFilter, setRatingFilter] = useState('all'); // all, 5, 4, 3, 2, 1
    const [selectedRating, setSelectedRating] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        average: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
        flagged: 0
    });

    // Fetch all ratings
    const fetchRatings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllRatings({
                status: statusFilter !== 'all' ? statusFilter : undefined
            });
            if (result.success) {
                setRatings(result.data || []);
                calculateStats(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchRatings();
    }, [fetchRatings]);

    // Calculate statistics
    const calculateStats = (data) => {
        const total = data.length;
        const average = total > 0
            ? (data.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1)
            : 0;

        setStats({
            total,
            average: parseFloat(average),
            fiveStars: data.filter(r => r.rating === 5).length,
            fourStars: data.filter(r => r.rating === 4).length,
            threeStars: data.filter(r => r.rating === 3).length,
            twoStars: data.filter(r => r.rating === 2).length,
            oneStar: data.filter(r => r.rating === 1).length,
            flagged: data.filter(r => r.status === 'flagged').length
        });
    };

    // Filter and search ratings
    useEffect(() => {
        let filtered = [...ratings];

        // Apply rating filter
        if (ratingFilter !== 'all') {
            filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.agent?.name?.toLowerCase().includes(query) ||
                r.tenant?.name?.toLowerCase().includes(query) ||
                r.review?.toLowerCase().includes(query)
            );
        }

        setFilteredRatings(filtered);
    }, [ratings, ratingFilter, searchQuery]);

    // Handle flag rating
    const handleFlagRating = async (rating) => {
        const reason = prompt('Enter reason for flagging this review:');
        if (!reason) return;

        setLoading(true);
        try {
            const result = await flagAgentRating(rating.id, reason);
            if (result.success) {
                alert('Rating flagged for review');
                fetchRatings();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete rating
    const handleDeleteRating = async (rating) => {
        if (!confirm('Are you sure you want to remove this rating?')) return;

        setLoading(true);
        try {
            const result = await deleteAgentRating(rating.id, 'admin');
            if (result.success) {
                alert('Rating removed successfully');
                fetchRatings();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Render stars
    const renderStars = (count) => (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={14}
                    className={i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                />
            ))}
        </div>
    );

    // Rating detail modal
    if (selectedRating) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedRating(null)}
                    className="text-gray-600 hover:bg-gray-100"
                    size="sm"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Ratings
                </Button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                                    <span className="text-4xl font-black text-gray-900">{selectedRating.rating}</span>
                                </div>
                                {renderStars(selectedRating.rating)}
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs text-gray-400 mb-1">Reviewed by</p>
                                <p className="text-lg font-bold text-gray-900">{selectedRating.tenant?.name || 'Anonymous'}</p>
                                <p className="text-sm text-gray-500">{selectedRating.tenant?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Agent Info */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Agent Reviewed</p>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                                    {selectedRating.agent?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{selectedRating.agent?.name || 'Agent'}</p>
                                    <p className="text-sm text-gray-500">{selectedRating.agent?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Review */}
                        {selectedRating.review && (
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Review</p>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-gray-700 leading-relaxed">&quot;{selectedRating.review}&quot;</p>
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedRating.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                    selectedRating.status === 'flagged' ? 'bg-red-50 text-red-600' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {selectedRating.status?.toUpperCase()}
                                </span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                <p className="text-sm font-bold text-gray-900">
                                    {selectedRating.created_at ? new Date(selectedRating.created_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Flag Reason */}
                        {selectedRating.flag_reason && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Flag Reason</p>
                                <p className="text-sm text-red-700">{selectedRating.flag_reason}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            {selectedRating.status !== 'flagged' && (
                                <Button
                                    onClick={() => handleFlagRating(selectedRating)}
                                    variant="outline"
                                    className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                                >
                                    <Flag className="w-4 h-4 mr-2" /> Flag Review
                                </Button>
                            )}
                            <Button
                                onClick={() => handleDeleteRating(selectedRating)}
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Remove
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Ratings Management</h2>
                    <p className="text-sm text-gray-500 font-medium">Review and moderate agent ratings</p>
                </div>
                <Button
                    onClick={fetchRatings}
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
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <MessageCircle size={22} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Reviews</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Star size={22} className="text-amber-500 fill-amber-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-amber-600">{stats.average}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Rating</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <TrendingUp size={22} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-emerald-600">{stats.fiveStars}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">5-Star Reviews</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                            <Flag size={22} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-red-600">{stats.flagged}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flagged</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = stats[`${star === 5 ? 'five' : star === 4 ? 'four' : star === 3 ? 'three' : star === 2 ? 'two' : 'one'}Stars`];
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-4">
                                <button
                                    onClick={() => setRatingFilter(ratingFilter === String(star) ? 'all' : String(star))}
                                    className={`flex items-center gap-1 w-16 text-sm font-bold transition-colors ${ratingFilter === String(star) ? 'text-[#FE9200]' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {star} <Star size={12} className="fill-current" />
                                </button>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${star === 5 ? 'bg-emerald-500' :
                                            star === 4 ? 'bg-lime-500' :
                                                star === 3 ? 'bg-amber-400' :
                                                    star === 2 ? 'bg-orange-500' :
                                                        'bg-red-500'
                                            }`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-gray-400 w-12 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by agent, tenant, or review content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'active', label: 'Active' },
                            { key: 'flagged', label: 'Flagged' },
                            { key: 'removed', label: 'Removed' }
                        ].map((status) => (
                            <button
                                key={status.key}
                                onClick={() => setStatusFilter(status.key)}
                                className={`px-4 h-12 rounded-xl font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === status.key
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>
                {(searchQuery || ratingFilter !== 'all') && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Showing {filteredRatings.length} of {ratings.length} ratings</span>
                        {(searchQuery || ratingFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setRatingFilter('all');
                                }}
                                className="text-[#FE9200] font-bold hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Ratings List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading ratings...</p>
                    </div>
                ) : filteredRatings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-900 font-bold mb-1">No ratings found</p>
                        <p className="text-gray-500 text-sm">
                            {searchQuery || ratingFilter !== 'all' ? 'Try adjusting your filters.' : 'Ratings will appear here.'}
                        </p>
                    </div>
                ) : (
                    filteredRatings.map((rating) => (
                        <div
                            key={rating.id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${rating.status === 'flagged' ? 'border-red-200' : 'border-gray-100'
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* Rating Score */}
                                    <div className="text-center flex-shrink-0">
                                        <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                                            <span className="text-2xl font-black text-amber-600">{rating.rating}</span>
                                        </div>
                                        {renderStars(rating.rating)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        Review for {rating.agent?.name || 'Agent'}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rating.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                                        rating.status === 'flagged' ? 'bg-red-50 text-red-600' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {rating.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    by {rating.tenant?.name || 'Anonymous'} • {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {rating.review && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">&quot;{rating.review}&quot;</p>
                                        )}

                                        {rating.flag_reason && (
                                            <div className="p-2 bg-red-50 rounded-lg text-xs text-red-600 mb-3">
                                                <Flag size={10} className="inline mr-1" />
                                                Flagged: {rating.flag_reason}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => setSelectedRating(rating)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:bg-blue-50"
                                            >
                                                <Eye size={14} className="mr-1" /> View
                                            </Button>
                                            {rating.status !== 'flagged' && (
                                                <Button
                                                    onClick={() => handleFlagRating(rating)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-amber-600 hover:bg-amber-50"
                                                >
                                                    <Flag size={14} className="mr-1" /> Flag
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => handleDeleteRating(rating)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} className="mr-1" /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
