"use client";

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Users, Plus, Trash2, Edit, RefreshCw, CheckCircle, XCircle,
  Star, Crown, Zap, Clock, Calendar, DollarSign, Check, X, UserCheck,
  TrendingUp, Package, AlertCircle, Search, ChevronDown, MoreVertical, Eye
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllSubscriptions
} from '@/lib/database';

// Stats Card Component - Matches global design
const StatsCard = ({ icon: Icon, label, value, bgColor, iconColor, subtext }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

// Plan Card Component
const PlanCard = ({ plan, onEdit, onDelete, isPopular }) => {
  const features = Array.isArray(plan.features) ? plan.features :
    (plan.features ? plan.features.split(',').map(f => f.trim()) : []);

  return (
    <div className={`relative bg-white rounded-2xl border ${isPopular ? 'border-[#FE9200]' : 'border-gray-200'} p-6 hover:border-gray-300 transition-all`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#FE9200] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-black text-[#FE9200]">KSh {parseInt(plan.price || 0).toLocaleString()}</span>
          <span className="text-sm text-gray-400 font-medium">/{plan.interval || 'monthly'}</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">{plan.description || 'No description'}</p>
      </div>

      <div className="space-y-3 mb-6">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">{feature}</span>
          </div>
        ))}
        {features.length === 0 && (
          <p className="text-sm text-gray-400 italic">No features listed</p>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
          onClick={() => onEdit(plan)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => onDelete(plan.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Plan Form Modal with dynamic feature fields
const PlanFormModal = ({ isOpen, onClose, plan, onSave, loading }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    interval: 'monthly',
    description: ''
  });
  const [features, setFeatures] = useState(['']);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name || '',
        price: plan.price || '',
        interval: plan.interval || 'monthly',
        description: plan.description || ''
      });
      // Parse features array
      const planFeatures = Array.isArray(plan.features)
        ? plan.features
        : (plan.features ? plan.features.split(',').map(f => f.trim()) : []);
      setFeatures(planFeatures.length > 0 ? planFeatures : ['']);
    } else {
      setForm({ name: '', price: '', interval: 'monthly', description: '' });
      setFeatures(['']);
    }
  }, [plan, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validFeatures = features.filter(f => f.trim() !== '');
    onSave({
      ...form,
      features: validFeatures
    });
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index) => {
    if (features.length === 1) {
      setFeatures(['']);
      return;
    }
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Plan Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Premium Plan"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (KSh)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g., 1500"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Billing Interval</label>
              <div className="relative">
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm appearance-none bg-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this plan"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
            />
          </div>

          {/* Dynamic Feature Fields */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Features</label>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-[#FE9200] hover:bg-[#E58300] text-white"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {plan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    expired: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' }
  };
  const style = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
      {status === 'active' && <CheckCircle className="w-3 h-3" />}
      {status === 'expired' && <XCircle className="w-3 h-3" />}
      {status === 'cancelled' && <X className="w-3 h-3" />}
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

export const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'plans') fetchPlans();
    if (activeTab === 'subscribers') fetchSubscriptions();
  }, [activeTab]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const result = await getAllSubscriptionPlans();
      if (result.success) setPlans(result.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await getAllSubscriptions();
      if (result.success) setSubscriptions(result.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (data) => {
    setSaving(true);
    try {
      if (currentPlan) {
        await updateSubscriptionPlan(currentPlan.id, data);
      } else {
        await createSubscriptionPlan(data);
      }
      setShowPlanModal(false);
      setCurrentPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    try {
      await deleteSubscriptionPlan(id);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Error deleting plan');
    }
  };

  const handleEditPlan = (plan) => {
    setCurrentPlan(plan);
    setShowPlanModal(true);
  };

  const handleAddPlan = () => {
    setCurrentPlan(null);
    setShowPlanModal(true);
  };

  // Calculate stats
  const stats = {
    totalPlans: plans.length,
    totalSubscribers: subscriptions.length,
    activeSubscribers: subscriptions.filter(s => s.status === 'active').length,
    monthlyRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (parseInt(s.amount) || 0), 0)
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery ||
      sub.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.users?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Subscription Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage plans, subscribers, and billing</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'plans'
                ? 'bg-[#FE9200] text-white'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'subscribers'
                ? 'bg-[#FE9200] text-white'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Subscribers
            </button>
          </div>
          {activeTab === 'plans' && (
            <Button
              onClick={handleAddPlan}
              className="bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Plan
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Package}
          label="Total Plans"
          value={stats.totalPlans}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={Users}
          label="Total Subscribers"
          value={stats.totalSubscribers}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          icon={UserCheck}
          label="Active Subscribers"
          value={stats.activeSubscribers}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={`KSh ${stats.monthlyRevenue.toLocaleString()}`}
          bgColor="bg-[#FFF2E5]"
          iconColor="text-[#FE9200]"
        />
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-[#FE9200] animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No plans yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create your first subscription plan to get started</p>
              <Button
                onClick={handleAddPlan}
                className="bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, idx) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={handleEditPlan}
                  onDelete={handleDeletePlan}
                  isPopular={idx === 1 && plans.length > 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 text-sm font-medium min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <Button
                variant="outline"
                onClick={fetchSubscriptions}
                disabled={loading}
                className="rounded-xl border-[#FE9200] text-[#FE9200] hover:bg-[#FFF2E5]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-[#FE9200] animate-spin" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">No subscribers found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Start Date</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Expires</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">
                                {sub.users?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{sub.users?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{sub.users?.email || sub.user_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 text-sm">{sub.plan_name || sub.plan || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={sub.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(sub.starts_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(sub.expires_at)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">KSh {parseInt(sub.amount || 0).toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {filteredSubscriptions.map((sub) => (
                    <div key={sub.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">
                            {sub.users?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{sub.users?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{sub.users?.email?.substring(0, 20)}...</p>
                          </div>
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs mt-3 bg-gray-50 rounded-xl p-3">
                        <div>
                          <span className="text-gray-400 block">Plan</span>
                          <span className="font-bold text-gray-900">{sub.plan_name || sub.plan || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Amount</span>
                          <span className="font-bold text-gray-900">KSh {parseInt(sub.amount || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Start</span>
                          <span className="text-gray-600">{formatDate(sub.starts_at)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Expires</span>
                          <span className="text-gray-600">{formatDate(sub.expires_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Plan Form Modal */}
      <PlanFormModal
        isOpen={showPlanModal}
        onClose={() => { setShowPlanModal(false); setCurrentPlan(null); }}
        plan={currentPlan}
        onSave={handleSavePlan}
        loading={saving}
      />
    </div>
  );
};
