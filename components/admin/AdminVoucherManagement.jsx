'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Gift, Ticket, Upload, Download, Search, Filter, MoreVertical,
    CheckCircle2, XCircle, Clock, Eye, Trash2, Plus, RefreshCw,
    Package, TrendingUp, Users, Store, Calendar, FileText, AlertCircle,
    ChevronDown, X, Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
    getAllVouchers,
    getVoucherStats,
    getPoolStats,
    addVouchersToPool,
    updateVoucherStatus,
    importVouchersFromCSV
} from '@/lib/vouchers';

const AdminVoucherManagement = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [vouchers, setVouchers] = useState([]);
    const [poolStats, setPoolStats] = useState(null);
    const [voucherStats, setVoucherStats] = useState(null);
    const [activeTab, setActiveTab] = useState('issued'); // issued, pool
    const [filters, setFilters] = useState({ status: 'all', planTier: 'all' });
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [vouchersResult, statsResult, poolResult] = await Promise.all([
                getAllVouchers(filters.status !== 'all' ? { status: filters.status } : {}),
                getVoucherStats(),
                getPoolStats()
            ]);

            if (vouchersResult.success) setVouchers(vouchersResult.data);
            if (statsResult.success) setVoucherStats(statsResult.data);
            if (poolResult.success) setPoolStats(poolResult.data);
        } catch (error) {
            console.error('Error fetching voucher data:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter vouchers
    const filteredVouchers = vouchers.filter(v => {
        const matchesSearch =
            v.voucher_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.agent?.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filters.status === 'all' || v.status === filters.status;
        const matchesTier = filters.planTier === 'all' || v.plan_tier === filters.planTier;

        return matchesSearch && matchesStatus && matchesTier;
    });

    // Update voucher status
    const handleStatusChange = async (voucherId, newStatus) => {
        const result = await updateVoucherStatus(voucherId, newStatus, currentUser?.id);
        if (result.success) {
            setVouchers(vouchers.map(v =>
                v.id === voucherId ? { ...v, status: newStatus } : v
            ));
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const styles = {
            issued: 'bg-blue-100 text-blue-700',
            viewed: 'bg-purple-100 text-purple-700',
            redeemed: 'bg-emerald-100 text-emerald-700',
            expired: 'bg-gray-100 text-gray-500',
            cancelled: 'bg-red-100 text-red-700'
        };

        const icons = {
            issued: <Ticket size={12} />,
            viewed: <Eye size={12} />,
            redeemed: <CheckCircle2 size={12} />,
            expired: <Clock size={12} />,
            cancelled: <XCircle size={12} />
        };

        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${styles[status] || styles.issued}`}>
                {icons[status] || icons.issued}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
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
                        Voucher Management
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Manage GiftPesa vouchers and rewards</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchData} variant="outline" size="sm">
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} className="bg-[#FE9200] hover:bg-[#E58300] text-white" size="sm">
                        <Plus size={16} className="mr-2" />
                        Add Vouchers
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{poolStats?.available || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available in Pool</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-[#FE9200]" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{voucherStats?.total_issued || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Issued</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{voucherStats?.redeemed || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Redeemed</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{voucherStats?.expired || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expired</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        KES {(voucherStats?.total_value_issued || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Value</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by code, merchant, or agent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 text-sm font-medium"
                    >
                        <option value="all">All Status</option>
                        <option value="issued">Issued</option>
                        <option value="viewed">Viewed</option>
                        <option value="redeemed">Redeemed</option>
                        <option value="expired">Expired</option>
                    </select>
                    <select
                        value={filters.planTier}
                        onChange={(e) => setFilters({ ...filters, planTier: e.target.value })}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 text-sm font-medium"
                    >
                        <option value="all">All Plans</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="elite">Elite</option>
                    </select>
                </div>
            </div>

            {/* Vouchers Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Code</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merchant</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issued</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredVouchers.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Ticket className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="font-bold text-gray-900 mb-1">No vouchers found</p>
                                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVouchers.map(voucher => (
                                    <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold text-gray-900">
                                                {voucher.voucher_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{voucher.agent?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{voucher.agent?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Store className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{voucher.merchant_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">
                                                {voucher.currency} {voucher.value?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full capitalize">
                                                {voucher.plan_tier || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(voucher.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(voucher.issued_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(voucher.expires_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                {voucher.status !== 'redeemed' && voucher.status !== 'expired' && (
                                                    <button
                                                        onClick={() => handleStatusChange(voucher.id, 'redeemed')}
                                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Mark as Redeemed"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedVoucher(voucher)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pool Status by Tier */}
            {poolStats?.byTier && Object.keys(poolStats.byTier).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#FE9200]" />
                        Pool Status by Plan Tier
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(poolStats.byTier).map(([tier, data]) => (
                            <div key={tier} className="bg-gray-50 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 capitalize">
                                    {tier === 'any' ? 'Any Plan' : tier}
                                </p>
                                <p className="text-lg font-black text-gray-900">{data.available}</p>
                                <p className="text-xs text-gray-500">of {data.total} total</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Vouchers Modal */}
            {showAddModal && (
                <AddVouchersModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchData();
                    }}
                />
            )}

            {/* Voucher Detail Modal */}
            {selectedVoucher && (
                <VoucherDetailModal
                    voucher={selectedVoucher}
                    onClose={() => setSelectedVoucher(null)}
                    onStatusChange={handleStatusChange}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                />
            )}
        </div>
    );
};

// Add Vouchers Modal
const AddVouchersModal = ({ onClose, onSuccess }) => {
    const [mode, setMode] = useState('manual'); // manual, csv
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        value: '',
        merchantName: '',
        merchantCategory: '',
        expiresAt: '',
        planTier: ''
    });
    const [csvData, setCsvData] = useState('');

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code || !formData.value || !formData.merchantName || !formData.expiresAt) return;

        setLoading(true);
        const result = await addVouchersToPool([{
            code: formData.code,
            value: parseFloat(formData.value),
            merchantName: formData.merchantName,
            merchantCategory: formData.merchantCategory,
            expiresAt: formData.expiresAt,
            planTier: formData.planTier || null
        }]);
        setLoading(false);

        if (result.success) {
            onSuccess();
        } else {
            alert('Failed to add voucher: ' + result.error);
        }
    };

    const handleCSVSubmit = async () => {
        if (!csvData.trim()) return;

        setLoading(true);
        const result = await importVouchersFromCSV(csvData);
        setLoading(false);

        if (result.success) {
            alert(`Successfully imported ${result.count} vouchers`);
            onSuccess();
        } else {
            alert('Failed to import vouchers: ' + result.error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Add Vouchers to Pool</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'manual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                                }`}
                        >
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setMode('csv')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'csv' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                                }`}
                        >
                            Import CSV
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {mode === 'manual' ? (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Voucher Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200]"
                                    placeholder="e.g., GIFT-2024-ABCD"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Value (KES) *</label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200]"
                                        placeholder="500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Plan Tier</label>
                                    <select
                                        value={formData.planTier}
                                        onChange={(e) => setFormData({ ...formData, planTier: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200]"
                                    >
                                        <option value="">Any Plan</option>
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium</option>
                                        <option value="elite">Elite</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Merchant Name *</label>
                                <input
                                    type="text"
                                    value={formData.merchantName}
                                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200]"
                                    placeholder="e.g., Java House"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Expires At *</label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200]"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                                Add Voucher
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-800 font-medium mb-2">CSV Format</p>
                                <p className="text-xs text-blue-600 font-mono">
                                    code,value,merchant,expires,tier<br />
                                    GIFT-001,500,Java House,2024-12-31,premium
                                </p>
                            </div>
                            <textarea
                                value={csvData}
                                onChange={(e) => setCsvData(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] h-48 font-mono text-sm"
                                placeholder="Paste CSV data here..."
                            />
                            <Button
                                onClick={handleCSVSubmit}
                                disabled={loading || !csvData.trim()}
                                className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
                                Import Vouchers
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Voucher Detail Modal
const VoucherDetailModal = ({ voucher, onClose, onStatusChange, formatDate, getStatusBadge }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Voucher Details</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-center py-4 bg-gradient-to-br from-[#FE9200] to-[#FF7A00] rounded-2xl">
                        <p className="text-white/80 text-sm mb-1">{voucher.merchant_name}</p>
                        <p className="text-3xl font-black text-white">
                            {voucher.currency} {voucher.value?.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Voucher Code</p>
                        <p className="font-mono text-lg font-bold text-gray-900">{voucher.voucher_code}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Agent</p>
                            <p className="font-bold text-gray-900">{voucher.agent?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{voucher.agent?.email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Plan</p>
                            <p className="font-bold text-gray-900 capitalize">{voucher.plan_tier || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{voucher.plan_name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Issued</p>
                            <p className="text-sm text-gray-900">{formatDate(voucher.issued_at)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Expires</p>
                            <p className="text-sm text-gray-900">{formatDate(voucher.expires_at)}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                        {getStatusBadge(voucher.status)}
                    </div>

                    {/* Notification Status */}
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Notifications</p>
                        <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${voucher.email_sent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                                }`}>
                                Email {voucher.email_sent ? '✓' : '✗'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${voucher.sms_sent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                                }`}>
                                SMS {voucher.sms_sent ? '✓' : '✗'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${voucher.whatsapp_sent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                                }`}>
                                WhatsApp {voucher.whatsapp_sent ? '✓' : '✗'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <Button onClick={onClose} variant="outline" className="flex-1">
                        Close
                    </Button>
                    {voucher.status !== 'redeemed' && voucher.status !== 'expired' && (
                        <Button
                            onClick={() => { onStatusChange(voucher.id, 'redeemed'); onClose(); }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            <CheckCircle2 size={16} className="mr-2" />
                            Mark Redeemed
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminVoucherManagement;
