'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Gift, Ticket, Clock, CheckCircle2, XCircle, Copy, Check,
    ExternalLink, QrCode, Store, Calendar, Sparkles, ChevronRight,
    AlertCircle, Tag, CreditCard, ShoppingBag, Loader2
} from 'lucide-react';
import { Button } from './ui/Button';
import { getAgentVouchers, markVoucherViewed } from '@/lib/vouchers';

export const AgentRewards = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [copySuccess, setCopySuccess] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, used, expired

    const agentId = currentUser?.uid || currentUser?.id;

    // Fetch vouchers
    const fetchVouchers = useCallback(async () => {
        if (!agentId) return;
        setLoading(true);
        try {
            const result = await getAgentVouchers(agentId);
            if (result.success) {
                setVouchers(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    }, [agentId]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    // Filter vouchers
    const filteredVouchers = vouchers.filter(v => {
        const today = new Date().toISOString().split('T')[0];
        const isExpired = v.expires_at < today;

        switch (filter) {
            case 'active':
                return (v.status === 'issued' || v.status === 'viewed') && !isExpired;
            case 'used':
                return v.status === 'redeemed';
            case 'expired':
                return isExpired || v.status === 'expired';
            default:
                return true;
        }
    });

    // Stats
    const stats = {
        total: vouchers.length,
        active: vouchers.filter(v => {
            const today = new Date().toISOString().split('T')[0];
            return (v.status === 'issued' || v.status === 'viewed') && v.expires_at >= today;
        }).length,
        totalValue: vouchers
            .filter(v => v.status !== 'expired' && v.status !== 'cancelled')
            .reduce((sum, v) => sum + (v.value || 0), 0)
    };

    // Copy voucher code
    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    // View voucher detail
    const viewVoucher = async (voucher) => {
        setSelectedVoucher(voucher);
        if (voucher.status === 'issued') {
            await markVoucherViewed(voucher.id, agentId);
            setVouchers(vouchers.map(v =>
                v.id === voucher.id ? { ...v, status: 'viewed' } : v
            ));
        }
    };

    // Get status badge
    const getStatusBadge = (voucher) => {
        const today = new Date().toISOString().split('T')[0];
        const isExpired = voucher.expires_at < today;

        if (isExpired || voucher.status === 'expired') {
            return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full flex items-center gap-1">
                <XCircle size={10} /> Expired
            </span>;
        }
        if (voucher.status === 'redeemed') {
            return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> Redeemed
            </span>;
        }
        if (voucher.status === 'issued') {
            return <span className="px-2 py-1 bg-[#FFF2E5] text-[#FE9200] text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                <Sparkles size={10} /> New
            </span>;
        }
        return <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Ticket size={10} /> Active
        </span>;
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Days until expiry
    const daysUntilExpiry = (dateStr) => {
        const today = new Date();
        const expiry = new Date(dateStr);
        const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading && !vouchers.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Gift className="w-6 h-6 text-[#FE9200]" />
                        My Rewards
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Your subscription reward vouchers</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-[#FE9200]" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Vouchers</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{stats.active}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">KES {stats.totalValue.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Value</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: 'Active' },
                    { id: 'used', label: 'Used' },
                    { id: 'expired', label: 'Expired' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Vouchers List */}
            {filteredVouchers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Gift className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">No vouchers yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        {filter === 'all'
                            ? 'Subscribe to a premium plan to earn reward vouchers!'
                            : `No ${filter} vouchers found.`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredVouchers.map(voucher => (
                        <VoucherCard
                            key={voucher.id}
                            voucher={voucher}
                            onView={() => viewVoucher(voucher)}
                            onCopy={() => copyCode(voucher.voucher_code)}
                            copySuccess={copySuccess === voucher.voucher_code}
                            getStatusBadge={getStatusBadge}
                            formatDate={formatDate}
                            daysUntilExpiry={daysUntilExpiry}
                        />
                    ))}
                </div>
            )}

            {/* Voucher Detail Modal */}
            {selectedVoucher && (
                <VoucherDetailModal
                    voucher={selectedVoucher}
                    onClose={() => setSelectedVoucher(null)}
                    onCopy={() => copyCode(selectedVoucher.voucher_code)}
                    copySuccess={copySuccess === selectedVoucher.voucher_code}
                    formatDate={formatDate}
                    daysUntilExpiry={daysUntilExpiry}
                />
            )}

            {/* How it works */}
            <div className="bg-gradient-to-r from-[#FFF9F0] to-[#FFF2E5] rounded-2xl p-6 border border-[#FFE5CC]">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FE9200]" />
                    How Reward Vouchers Work
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FE9200] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Subscribe to Premium</p>
                            <p className="text-xs text-gray-500">Upgrade to a higher plan to unlock voucher rewards</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FE9200] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Receive Your Voucher</p>
                            <p className="text-xs text-gray-500">Get a digital voucher instantly after payment</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FE9200] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Redeem & Enjoy</p>
                            <p className="text-xs text-gray-500">Use at partner stores before expiry date</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Voucher Card Component
const VoucherCard = ({ voucher, onView, onCopy, copySuccess, getStatusBadge, formatDate, daysUntilExpiry }) => {
    const days = daysUntilExpiry(voucher.expires_at);
    const isExpired = days < 0 || voucher.status === 'expired';
    const isExpiringSoon = days <= 7 && days >= 0 && voucher.status !== 'redeemed';

    return (
        <div
            className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${isExpired ? 'border-gray-200 opacity-60' : 'border-gray-200'
                }`}
        >
            <div className="flex">
                {/* Left section - Merchant branding */}
                <div className={`w-28 flex items-center justify-center p-4 ${isExpired ? 'bg-gray-100' : 'bg-gradient-to-br from-[#FE9200] to-[#FF7A00]'
                    }`}>
                    {voucher.merchant_logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={voucher.merchant_logo} alt={voucher.merchant_name} className="w-16 h-16 rounded-xl bg-white p-2 object-contain" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                            <Store className={`w-8 h-8 ${isExpired ? 'text-gray-400' : 'text-white'}`} />
                        </div>
                    )}
                </div>

                {/* Middle section - Details */}
                <div className="flex-1 p-4 cursor-pointer" onClick={onView}>
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <p className="font-bold text-gray-900">{voucher.merchant_name}</p>
                            <p className="text-xs text-gray-500">{voucher.plan_name} Reward</p>
                        </div>
                        {getStatusBadge(voucher)}
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Value</p>
                            <p className={`text-lg font-black ${isExpired ? 'text-gray-400' : 'text-gray-900'}`}>
                                {voucher.currency} {voucher.value.toLocaleString()}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Expires</p>
                            <p className={`text-sm font-bold ${isExpired ? 'text-gray-400' : isExpiringSoon ? 'text-amber-600' : 'text-gray-700'
                                }`}>
                                {isExpired ? 'Expired' : `${days} days`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right section - Actions */}
                <div className="flex flex-col items-center justify-center p-4 border-l border-dashed border-gray-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onCopy(); }}
                        disabled={isExpired || voucher.status === 'redeemed'}
                        className={`p-2 rounded-lg transition-colors ${copySuccess
                                ? 'bg-emerald-100 text-emerald-600'
                                : isExpired || voucher.status === 'redeemed'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                    >
                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <p className="text-[8px] text-gray-400 mt-1 font-bold">COPY</p>
                </div>
            </div>

            {/* Warning banner for expiring soon */}
            {isExpiringSoon && (
                <div className="bg-amber-50 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-medium">
                    <AlertCircle size={14} />
                    Expires in {days} day{days !== 1 ? 's' : ''} - Use it before {formatDate(voucher.expires_at)}
                </div>
            )}
        </div>
    );
};

// Voucher Detail Modal
const VoucherDetailModal = ({ voucher, onClose, onCopy, copySuccess, formatDate, daysUntilExpiry }) => {
    const days = daysUntilExpiry(voucher.expires_at);
    const isExpired = days < 0 || voucher.status === 'expired';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
                {/* Header gradient */}
                <div className={`p-6 text-center ${isExpired
                        ? 'bg-gray-200'
                        : 'bg-gradient-to-br from-[#FE9200] to-[#FF7A00]'
                    }`}>
                    {voucher.merchant_logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={voucher.merchant_logo}
                            alt={voucher.merchant_name}
                            className="w-20 h-20 rounded-2xl bg-white p-3 mx-auto mb-3 object-contain"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                            <Store className={`w-10 h-10 ${isExpired ? 'text-gray-400' : 'text-white'}`} />
                        </div>
                    )}
                    <h3 className={`text-xl font-black ${isExpired ? 'text-gray-600' : 'text-white'}`}>
                        {voucher.merchant_name}
                    </h3>
                    <p className={`text-sm ${isExpired ? 'text-gray-500' : 'text-white/80'}`}>
                        {voucher.merchant_category || 'Partner Store'}
                    </p>
                </div>

                {/* Value display */}
                <div className="text-center py-6 border-b border-gray-100">
                    <p className="text-4xl font-black text-gray-900">
                        {voucher.currency} {voucher.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{voucher.plan_name} Reward</p>
                </div>

                {/* Voucher code */}
                <div className="p-6 bg-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Voucher Code</p>
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">
                            {voucher.voucher_code}
                        </span>
                        <button
                            onClick={onCopy}
                            disabled={isExpired || voucher.status === 'redeemed'}
                            className={`p-2 rounded-lg transition-colors ${copySuccess
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-[#FFF2E5] text-[#FE9200] hover:bg-[#FFE5CC]'
                                }`}
                        >
                            {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    {/* QR Code if available */}
                    {voucher.qr_code_url && (
                        <div className="mt-4 text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={voucher.qr_code_url}
                                alt="QR Code"
                                className="w-32 h-32 mx-auto rounded-xl"
                            />
                            <p className="text-xs text-gray-400 mt-2">Scan at merchant</p>
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                            <Calendar size={14} />
                            Issued
                        </span>
                        <span className="font-bold text-gray-900">
                            {formatDate(voucher.issued_at)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                            <Clock size={14} />
                            Expires
                        </span>
                        <span className={`font-bold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(voucher.expires_at)} {!isExpired && `(${days} days)`}
                        </span>
                    </div>
                    {voucher.description && (
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">{voucher.description}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <Button onClick={onClose} variant="outline" className="flex-1">
                        Close
                    </Button>
                    {!isExpired && voucher.status !== 'redeemed' && (
                        <Button
                            onClick={onCopy}
                            className="flex-1 bg-[#FE9200] hover:bg-[#E58300] text-white"
                        >
                            {copySuccess ? (
                                <>
                                    <Check size={16} className="mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={16} className="mr-2" />
                                    Copy Code
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentRewards;
