"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Flag,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    Filter,
    Phone,
    MapPin,
    Clock,
    User,
    Calendar,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    ExternalLink,
    MessageSquare,
    Coins
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getBadLeadReports, approveBadLeadReport, rejectBadLeadReport } from '@/lib/database';

export const BadLeadReportsManagement = ({ currentUser }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getBadLeadReports({
                status: filter === 'all' ? null : filter
            });
            if (result.success) {
                setReports(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleApprove = async (report) => {
        setActionLoading(true);
        try {
            const adminId = currentUser?.uid || currentUser?.id;
            const result = await approveBadLeadReport(report.id, adminId, adminNotes);

            if (result.success) {
                // Update local state
                setReports(prev => prev.map(r =>
                    r.id === report.id ? { ...r, status: 'approved', refunded_amount: result.refundAmount } : r
                ));
                setSelectedReport(null);
                setAdminNotes('');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error approving report:', error);
            alert('Failed to approve report');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setActionLoading(true);
        try {
            const adminId = currentUser?.uid || currentUser?.id;
            const result = await rejectBadLeadReport(selectedReport.id, adminId, rejectReason);

            if (result.success) {
                setReports(prev => prev.map(r =>
                    r.id === selectedReport.id ? { ...r, status: 'rejected' } : r
                ));
                setShowRejectModal(false);
                setSelectedReport(null);
                setRejectReason('');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error rejecting report:', error);
            alert('Failed to reject report');
        } finally {
            setActionLoading(false);
        }
    };

    const getReasonLabel = (reason) => {
        const labels = {
            'unreachable': 'Number Unreachable',
            'fake_number': 'Fake/Wrong Number',
            'already_closed': 'Already Found House',
            'wrong_info': 'Incorrect Details',
            'other': 'Other Issue'
        };
        return labels[reason] || reason;
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Pending Review' },
            'approved': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', label: 'Approved & Refunded' },
            'rejected': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Rejected' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.bg} ${badge.text} border ${badge.border}`}>
                {badge.label}
            </span>
        );
    };

    const filteredReports = reports.filter(report => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            report.agent?.name?.toLowerCase().includes(query) ||
            report.agent?.email?.toLowerCase().includes(query) ||
            report.lead?.location?.toLowerCase().includes(query) ||
            report.reason?.toLowerCase().includes(query)
        );
    });

    const stats = {
        pending: reports.filter(r => r.status === 'pending').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
        totalRefunded: reports.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.refunded_amount || r.credits_paid || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Bad Lead Reports</h2>
                    <p className="text-sm text-gray-500 font-medium">Review and process agent refund requests</p>
                </div>
                <Button
                    onClick={fetchReports}
                    className="h-10 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 flex items-center gap-2 border-0"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-green-600">{stats.approved}</p>
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-red-600">{stats.rejected}</p>
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Rejected</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#FFF9F2] border border-[#FE9200]/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FE9200]/10 flex items-center justify-center">
                            <Coins className="w-5 h-5 text-[#FE9200]" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#FE9200]">{stats.totalRefunded}</p>
                            <p className="text-[10px] text-[#E58300] font-bold uppercase tracking-widest">Credits Refunded</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by agent, location, or reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${filter === status
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-12 h-12 text-[#FE9200] animate-spin mb-4" />
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-3xl">
                        <Flag className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold text-sm">No reports found</p>
                        <p className="text-gray-400 text-xs mt-1">
                            {filter === 'pending' ? 'All caught up! No pending reports to review.' : 'Try adjusting your filters.'}
                        </p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div
                            key={report.id}
                            className={`bg-white border rounded-3xl p-6 transition-all hover:shadow-lg cursor-pointer ${selectedReport?.id === report.id ? 'border-[#FE9200] shadow-lg' : 'border-gray-100'
                                }`}
                            onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Left: Agent & Lead Info */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-lg">
                                        {report.agent?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-gray-900">{report.agent?.name || 'Unknown Agent'}</h3>
                                            {getStatusBadge(report.status)}
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mt-1">{report.agent?.email}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {report.lead?.location || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Reason & Credits */}
                                <div className="flex flex-col items-end gap-2">
                                    <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                                        <Flag className="w-3 h-3" />
                                        {getReasonLabel(report.reason)}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-black text-[#FE9200]">
                                        <Coins className="w-4 h-4" />
                                        {report.credits_paid} credits
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {selectedReport?.id === report.id && (
                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                    {/* Lead Details */}
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Lead Details</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs font-medium">Tenant</p>
                                                <p className="font-bold text-gray-900">{report.lead?.tenant_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs font-medium">Phone</p>
                                                <p className="font-bold text-gray-900">{report.lead?.tenant_phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs font-medium">Property Type</p>
                                                <p className="font-bold text-gray-900">{report.lead?.property_type || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs font-medium">Budget</p>
                                                <p className="font-bold text-gray-900">{report.lead?.budget || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent's Details */}
                                    {report.details && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3" />
                                                Agent&apos;s Description
                                            </p>
                                            <p className="text-sm text-amber-800 font-medium">&quot;{report.details}&quot;</p>
                                        </div>
                                    )}

                                    {/* Action Buttons (only for pending) */}
                                    {report.status === 'pending' && (
                                        <div className="flex gap-3 pt-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                                    Admin Notes (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={adminNotes}
                                                    onChange={(e) => setAdminNotes(e.target.value)}
                                                    placeholder="Add notes for approval..."
                                                    className="w-full h-10 px-4 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApprove(report);
                                                }}
                                                disabled={actionLoading}
                                                className="h-10 px-6 bg-green-500 text-white rounded-xl font-bold text-xs hover:bg-green-600 flex items-center gap-2 border-0 self-end"
                                            >
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Approve & Refund
                                            </Button>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowRejectModal(true);
                                                }}
                                                disabled={actionLoading}
                                                className="h-10 px-6 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 flex items-center gap-2 border-0 self-end"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {/* Resolution Info (for resolved reports) */}
                                    {report.status !== 'pending' && (
                                        <div className={`rounded-2xl p-4 ${report.status === 'approved' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {report.status === 'approved' ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                )}
                                                <p className={`text-xs font-black uppercase tracking-widest ${report.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {report.status === 'approved' ? `Refunded ${report.refunded_amount || report.credits_paid} credits` : 'Report Rejected'}
                                                </p>
                                            </div>
                                            {report.admin_notes && (
                                                <p className="text-sm text-gray-600 font-medium">{report.admin_notes}</p>
                                            )}
                                            {report.resolved_at && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Resolved on {new Date(report.resolved_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900">Reject Report</h3>
                                <p className="text-xs text-gray-400">Provide a reason for rejection</p>
                            </div>
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="E.g., Number was verified as active, Tenant confirmed they spoke with the agent..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-red-500 outline-none text-sm resize-none"
                        />

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 border-0"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading}
                                className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 border-0 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
