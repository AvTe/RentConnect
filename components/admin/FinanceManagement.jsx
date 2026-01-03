"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, CreditCard, Download, Plus, Trash2, Edit, RefreshCw, FileText,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Filter,
  Users, Package, Wallet, Clock, CheckCircle, XCircle, ChevronDown, Search,
  Eye, MoreVertical, X, Check, Zap, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getAllTransactions,
  getAllCreditBundles,
  createCreditBundle,
  updateCreditBundle,
  deleteCreditBundle,
  addCredits,
  getAllSubscriptions
} from '@/lib/database';

// Stats Card Component - Matches global design
const StatsCard = ({ icon: Icon, label, value, bgColor, iconColor, trend, trendValue, subtext }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

// Revenue Chart Component (Simple bar chart visualization)
const RevenueChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-6">{title}</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end h-32">
              <div
                className="w-full bg-[#FE9200] rounded-t-lg transition-all hover:bg-[#E58300]"
                style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? '8px' : '0' }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Transaction Type Distribution
const TransactionTypeChart = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const colors = {
    credit: '#10B981',
    debit: '#EF4444',
    subscription: '#8B5CF6',
    lead_unlock: '#3B82F6',
    refund: '#F59E0B'
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-6">Transaction Types</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">{item.type.replace('_', ' ')}</span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.count / total) * 100}%`,
                    backgroundColor: colors[item.type] || '#9CA3AF'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Transaction Badge
const TransactionBadge = ({ type }) => {
  const config = {
    credit: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Credit' },
    debit: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Debit' },
    credit_purchase: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Purchase' },
    lead_unlock: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Lead Unlock' },
    subscription: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', label: 'Subscription' },
    refund: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Refund' },
    bonus: { bg: 'bg-[#FFF2E5]', text: 'text-[#FE9200]', border: 'border-[#FFE4C4]', label: 'Bonus' }
  };
  const style = config[type] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', label: type };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
      {style.label}
    </span>
  );
};

// Bundle Form Modal with dynamic features
const BundleFormModal = ({ isOpen, onClose, bundle, onSave, loading }) => {
  const [form, setForm] = useState({
    name: '',
    credits: '',
    price: '',
    perLead: '',
    popular: false
  });
  const [features, setFeatures] = useState(['']);

  useEffect(() => {
    if (bundle) {
      setForm({
        name: bundle.name || '',
        credits: bundle.credits || '',
        price: bundle.price || '',
        perLead: bundle.perLead || '',
        popular: bundle.popular || false
      });
      const bundleFeatures = Array.isArray(bundle.features)
        ? bundle.features
        : (bundle.features ? bundle.features.split(',').map(f => f.trim()) : []);
      setFeatures(bundleFeatures.length > 0 ? bundleFeatures : ['']);
    } else {
      setForm({ name: '', credits: '', price: '', perLead: '', popular: false });
      setFeatures(['']);
    }
  }, [bundle, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      credits: parseInt(form.credits) || 0,
      features: features.filter(f => f.trim() !== '')
    });
  };

  const addFeature = () => setFeatures([...features, '']);
  const removeFeature = (idx) => {
    if (features.length === 1) { setFeatures(['']); return; }
    setFeatures(features.filter((_, i) => i !== idx));
  };
  const updateFeature = (idx, value) => {
    const newFeatures = [...features];
    newFeatures[idx] = value;
    setFeatures(newFeatures);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">
            {bundle ? 'Edit Bundle' : 'Create New Bundle'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Bundle Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Starter Pack"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Credits</label>
              <input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
                placeholder="e.g., 100"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (KSh)</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g., KSh 500"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Per Lead Text</label>
            <input
              type="text"
              value={form.perLead}
              onChange={(e) => setForm({ ...form, perLead: e.target.value })}
              placeholder="e.g., KSh 50/lead"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
            />
          </div>

          {/* Dynamic Features */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Features</label>
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      placeholder={`Feature ${idx + 1}`}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-[#FE9200] hover:text-[#E58300] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="popular"
              checked={form.popular}
              onChange={(e) => setForm({ ...form, popular: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#FE9200] focus:ring-[#FE9200]"
            />
            <label htmlFor="popular" className="text-sm font-medium text-gray-700">Mark as Popular</label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-[#FE9200] hover:bg-[#E58300] text-white" disabled={loading}>
              {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              {bundle ? 'Save Changes' : 'Create Bundle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FinanceManagement = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // Modals
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [currentBundle, setCurrentBundle] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'bundles') fetchBundles();
  }, [activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [txResult, subResult] = await Promise.all([
        getAllTransactions(500),
        getAllSubscriptions()
      ]);
      if (txResult.success) setTransactions(txResult.data || []);
      if (subResult.success) setSubscriptions(subResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result = await getAllTransactions(500);
      if (result.success) setTransactions(result.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const result = await getAllCreditBundles();
      if (result.success) setBundles(result.data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBundle = async (data) => {
    setSaving(true);
    try {
      if (currentBundle) {
        await updateCreditBundle(currentBundle.id, data);
      } else {
        await createCreditBundle(data);
      }
      setShowBundleModal(false);
      setCurrentBundle(null);
      fetchBundles();
    } catch (error) {
      console.error('Error saving bundle:', error);
      alert('Error saving bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBundle = async (id) => {
    if (!confirm('Delete this bundle?')) return;
    await deleteCreditBundle(id);
    fetchBundles();
  };

  const handleRefund = async (transaction) => {
    if (!confirm(`Refund ${transaction.amount} credits to user?`)) return;
    setLoading(true);
    try {
      const result = await addCredits(transaction.user_id, transaction.amount, `Refund for TX: ${transaction.id}`);
      if (result.success) {
        alert('Refund processed successfully');
        fetchTransactions();
      } else {
        alert('Error processing refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Amount', 'Description', 'User', 'Date'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.id,
        tx.type,
        tx.amount,
        `"${tx.description || ''}"`,
        tx.users?.name || tx.user_id || '',
        tx.created_at ? new Date(tx.created_at).toISOString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate financial stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Filter transactions by time
    const monthlyTx = transactions.filter(tx => {
      if (!tx.created_at) return false;
      const date = new Date(tx.created_at);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const creditTx = transactions.filter(tx => tx.type === 'credit' || tx.type === 'credit_purchase');
    const debitTx = transactions.filter(tx => tx.type === 'debit' || tx.type === 'lead_unlock');

    const totalRevenue = creditTx.reduce((sum, tx) => sum + (parseInt(tx.amount) || 0), 0);
    const monthlyRevenue = monthlyTx
      .filter(tx => tx.type === 'credit' || tx.type === 'credit_purchase')
      .reduce((sum, tx) => sum + (parseInt(tx.amount) || 0), 0);

    const totalSubscriptionRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (parseInt(s.amount) || 0), 0);

    const leadUnlocks = debitTx.length;
    const pendingRevenue = subscriptions
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + (parseInt(s.amount) || 0), 0);

    return {
      totalRevenue,
      monthlyRevenue,
      totalSubscriptionRevenue,
      leadUnlocks,
      pendingRevenue,
      totalTransactions: transactions.length
    };
  }, [transactions, subscriptions]);

  // Chart data
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12;
      const monthTx = transactions.filter(tx => {
        if (!tx.created_at) return false;
        const date = new Date(tx.created_at);
        return date.getMonth() === monthIdx && (tx.type === 'credit' || tx.type === 'credit_purchase');
      });
      last6Months.push({
        label: months[monthIdx],
        value: monthTx.reduce((sum, tx) => sum + (parseInt(tx.amount) || 0), 0)
      });
    }
    return last6Months;
  }, [transactions]);

  const transactionTypeData = useMemo(() => {
    const types = {};
    transactions.forEach(tx => {
      const type = tx.type || 'other';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !searchQuery ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.users?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      let matchesTime = true;
      if (timeFilter !== 'all' && tx.created_at) {
        const txDate = new Date(tx.created_at);
        const now = new Date();
        if (timeFilter === 'today') {
          matchesTime = txDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = txDate >= weekAgo;
        } else if (timeFilter === 'month') {
          matchesTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesType && matchesTime;
    });
  }, [transactions, searchQuery, typeFilter, timeFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Financial Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Track revenue, transactions, and credit bundles</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['transactions', 'bundles', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-[#FE9200] text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={DollarSign}
          label="Total Revenue"
          value={`KSh ${stats.totalRevenue.toLocaleString()}`}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          icon={TrendingUp}
          label="This Month"
          value={`KSh ${stats.monthlyRevenue.toLocaleString()}`}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          subtext="Monthly revenue"
        />
        <StatsCard
          icon={CreditCard}
          label="Subscriptions"
          value={`KSh ${stats.totalSubscriptionRevenue.toLocaleString()}`}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
          subtext={`${subscriptions.filter(s => s.status === 'active').length} active`}
        />
        <StatsCard
          icon={Wallet}
          label="Pending Revenue"
          value={`KSh ${stats.pendingRevenue.toLocaleString()}`}
          bgColor="bg-[#FFF2E5]"
          iconColor="text-[#FE9200]"
          subtext="Awaiting payment"
        />
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={monthlyChartData} title="Revenue Overview (Last 6 Months)" />
            </div>
            <TransactionTypeChart data={transactionTypeData} />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                />
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm font-medium min-w-[140px]"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="credit_purchase">Purchases</option>
                  <option value="lead_unlock">Lead Unlocks</option>
                  <option value="subscription">Subscriptions</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm font-medium min-w-[140px]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <Button
                variant="outline"
                onClick={fetchTransactions}
                disabled={loading}
                className="rounded-xl border-[#FE9200] text-[#FE9200] hover:bg-[#FFF2E5]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Recent Transactions</h3>
              <span className="text-sm text-gray-500">{filteredTransactions.length} transactions</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-[#FE9200] animate-spin" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTransactions.slice(0, 50).map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{formatDate(tx.created_at)}</p>
                              <p className="text-xs text-gray-400">{formatTime(tx.created_at)}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {tx.users?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{tx.users?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{tx.users?.email?.substring(0, 25)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <TransactionBadge type={tx.type} />
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 max-w-xs truncate">{tx.description || '-'}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-bold ${tx.type === 'debit' || tx.type === 'lead_unlock' ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                              {tx.type === 'debit' || tx.type === 'lead_unlock' ? '-' : '+'}
                              {parseInt(tx.amount || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {(tx.type === 'lead_unlock' || tx.type === 'debit') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRefund(tx)}
                                className="rounded-lg text-xs border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Refund
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {filteredTransactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {tx.users?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{tx.users?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${tx.type === 'debit' || tx.type === 'lead_unlock' ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                          {tx.type === 'debit' || tx.type === 'lead_unlock' ? '-' : '+'}
                          {parseInt(tx.amount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TransactionBadge type={tx.type} />
                        <span className="text-xs text-gray-500 truncate flex-1">{tx.description || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bundles Tab */}
      {activeTab === 'bundles' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => { setCurrentBundle(null); setShowBundleModal(true); }}
              className="bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Bundle
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-[#FE9200] animate-spin" />
            </div>
          ) : bundles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No bundles yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create your first credit bundle</p>
              <Button
                onClick={() => { setCurrentBundle(null); setShowBundleModal(true); }}
                className="bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Bundle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => (
                <div key={bundle.id} className={`relative bg-white rounded-2xl border ${bundle.popular ? 'border-[#FE9200]' : 'border-gray-200'} p-6 hover:border-gray-300 transition-all`}>
                  {bundle.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#FE9200] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                  <h3 className="font-black text-gray-900 text-lg">{bundle.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-[#FE9200]">{bundle.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{bundle.credits} Credits • {bundle.perLead}</p>

                  <div className="space-y-2 my-6">
                    {Array.isArray(bundle.features) && bundle.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl"
                      onClick={() => { setCurrentBundle(bundle); setShowBundleModal(true); }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteBundle(bundle.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Transaction Report</h3>
                  <p className="text-sm text-gray-500">Export all transactions as CSV</p>
                </div>
              </div>
              <Button
                onClick={handleExportCSV}
                className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl gap-2"
              >
                <Download className="w-4 h-4" />
                Export Transactions (CSV)
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Revenue Summary</h3>
                  <p className="text-sm text-gray-500">Quick financial overview</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <span className="font-bold text-gray-900">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Lead Unlocks</span>
                  <span className="font-bold text-gray-900">{stats.leadUnlocks}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Active Subscriptions</span>
                  <span className="font-bold text-gray-900">{subscriptions.filter(s => s.status === 'active').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bundle Form Modal */}
      <BundleFormModal
        isOpen={showBundleModal}
        onClose={() => { setShowBundleModal(false); setCurrentBundle(null); }}
        bundle={currentBundle}
        onSave={handleSaveBundle}
        loading={saving}
      />
    </div>
  );
};
