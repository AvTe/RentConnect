/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Phone, Mail, MapPin, Calendar, Shield, ShieldAlert,
  CreditCard, Activity, Lock, Unlock, CheckCircle, XCircle, AlertTriangle,
  Edit, Trash2, ArrowLeft, Star, Crown, Loader2, RefreshCw, Users,
  Home, DollarSign, TrendingUp, Copy, ExternalLink, Gift, Award, Flag
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  approveAgent,
  rejectAgent,
  suspendUser,
  reactivateUser,
  addCredits,
  updateUser,
  softDeleteUser,
  getAgentConnectedLeads,
  getReferralStats,
  getAgentRatings
} from '@/lib/database';

export const AgentDetail = ({ agent, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [connectedLeads, setConnectedLeads] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, leads, referrals, ratings

  const [editForm, setEditForm] = useState({
    name: agent.name || '',
    phone: agent.phone || '',
    agencyName: agent.agencyName || '',
    location: agent.location || ''
  });

  // Fetch connected leads for this agent
  const fetchConnectedLeads = useCallback(async () => {
    if (!agent?.id) return;
    try {
      const result = await getAgentConnectedLeads(agent.id);
      if (result.success) {
        setConnectedLeads(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching connected leads:', error);
    }
  }, [agent?.id]);

  // Fetch referral stats
  const fetchReferralStats = useCallback(async () => {
    if (!agent?.id) return;
    try {
      const result = await getReferralStats(agent.id);
      if (result.success) {
        setReferralStats(result);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  }, [agent?.id]);

  // Fetch ratings
  const fetchRatings = useCallback(async () => {
    if (!agent?.id) return;
    try {
      const result = await getAgentRatings(agent.id);
      if (result.success) {
        setRatings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }, [agent?.id]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingData(true);
      await Promise.all([
        fetchConnectedLeads(),
        fetchReferralStats(),
        fetchRatings()
      ]);
      setLoadingData(false);
    };
    fetchAllData();
  }, [fetchConnectedLeads, fetchReferralStats, fetchRatings]);

  const handleAction = async (action, ...args) => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    setLoading(true);
    try {
      let result;
      if (action === 'approve') result = await approveAgent(agent.id);
      if (action === 'reject') result = await rejectAgent(agent.id, ...args);
      if (action === 'suspend') result = await suspendUser(agent.id, ...args);
      if (action === 'reactivate') result = await reactivateUser(agent.id);
      if (action === 'delete') result = await softDeleteUser(agent.id);

      if (result.success) {
        alert(`Agent ${action}d successfully`);
        onUpdate();
        onBack();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateUser(agent.id, editForm);
      if (result.success) {
        alert('Agent profile updated successfully');
        setIsEditing(false);
        onUpdate();
      } else {
        alert('Error updating profile: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    const amount = prompt('Enter amount of credits to add:');
    if (!amount || isNaN(amount)) return;

    const reason = prompt('Enter reason (e.g., Bonus, Refund):', 'Admin Adjustment');

    setLoading(true);
    const result = await addCredits(agent.id, parseInt(amount), reason);
    setLoading(false);

    if (result.success) {
      alert('Credits added successfully');
      onUpdate();
    } else {
      alert('Error adding credits: ' + result.error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Get connection status badge
  const getConnectionStatusBadge = (status) => {
    const badges = {
      'connected': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Connected' },
      'pending': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Pending' },
      'converted': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Converted' },
      'lost': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Lost' }
    };
    const badge = badges[status] || badges.connected;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text} border ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  // Edit Form View
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900">Edit Agent Profile</h2>
          <Button variant="ghost" onClick={() => setIsEditing(false)} size="sm">Cancel</Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Agency Name</label>
              <input
                type="text"
                value={editForm.agencyName}
                onChange={(e) => setEditForm({ ...editForm, agencyName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 border-0"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 bg-[#FE9200] text-white rounded-xl font-bold text-sm hover:bg-[#E58300] border-0 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:bg-gray-100" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
            disabled={loading}
            size="sm"
          >
            <Edit className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
          </Button>

          {agent.status === 'suspended' ? (
            <Button
              onClick={() => handleAction('reactivate')}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <Unlock className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reactivate</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                const reason = prompt('Reason for suspension:');
                if (reason) handleAction('suspend', reason);
              }}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <Lock className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Suspend</span>
            </Button>
          )}

          <Button
            onClick={() => handleAction('delete')}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
            disabled={loading}
            size="sm"
          >
            <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Agent Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl font-black text-gray-400 flex-shrink-0 border-2 border-white shadow-lg">
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                agent.name?.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{agent.name}</h2>
                  <p className="text-sm text-gray-500 font-medium">{agent.agencyName || 'Independent Agent'}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center md:justify-end">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${agent.verificationStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : agent.verificationStatus === 'pending'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                    {agent.verificationStatus}
                  </span>
                  {agent.status === 'suspended' && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                      SUSPENDED
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-[#FE9200]">{agent.walletBalance || 0}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-purple-600">{connectedLeads.length}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leads Unlocked</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-blue-600">{referralStats?.stats?.totalReferrals || 0}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Referrals</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <p className="text-2xl font-black text-gray-900">{agent.average_rating?.toFixed(1) || '—'}</p>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{agent.total_ratings || 0} Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <Mail size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">{agent.email}</span>
            <button onClick={() => copyToClipboard(agent.email)} className="ml-auto p-1 hover:bg-gray-100 rounded">
              <Copy size={12} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <Phone size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700">{agent.phone || 'N/A'}</span>
            {agent.phone && (
              <button onClick={() => copyToClipboard(agent.phone)} className="ml-auto p-1 hover:bg-gray-100 rounded">
                <Copy size={12} className="text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">{agent.location || agent.city || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'leads', label: 'Connected Leads', icon: Unlock, count: connectedLeads.length },
          { key: 'referrals', label: 'Referrals', icon: Gift, count: referralStats?.stats?.totalReferrals || 0 },
          { key: 'ratings', label: 'Ratings', icon: Star, count: ratings.length }
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Section */}
            {agent.verificationStatus === 'pending' && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-800 mb-1">Verification Pending</h3>
                    <p className="text-sm text-amber-700 mb-4">
                      This agent has submitted documents for review. Review and approve or reject.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        onClick={() => handleAction('approve')}
                        className="bg-[#16A34A] hover:bg-[#15803D] text-white border-0"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) handleAction('reject', reason);
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
                {agent.idDocumentUrl && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ID Document</p>
                    <img
                      src={agent.idDocumentUrl}
                      alt="ID Document"
                      className="max-h-48 rounded-lg object-contain mx-auto"
                    />
                    <a
                      href={agent.idDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-sm text-blue-600 hover:underline mt-2"
                    >
                      View Full Size
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Activity size={16} className="text-gray-400" />
                  Recent Transactions
                </h3>
              </div>
              <div className="p-6">
                {agent.transactions?.length > 0 ? (
                  <div className="space-y-4">
                    {agent.transactions.slice(0, 10).map((tx, idx) => (
                      <div key={tx.id || idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900">
                            {tx.type === 'credit_purchase' ? 'Purchased Credits' :
                              tx.type === 'lead_unlock' ? 'Unlocked Lead' :
                                tx.type === 'credit' ? 'Credit Added' :
                                  tx.type === 'debit' ? 'Credit Deducted' :
                                    tx.type === 'referral_bonus' ? 'Referral Bonus' : tx.type}
                          </p>
                          <p className="text-xs text-gray-400">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Unknown date'}
                          </p>
                          {tx.reason && (
                            <p className="text-xs text-gray-500 mt-0.5">{tx.reason}</p>
                          )}
                        </div>
                        <div className={`font-mono font-bold text-lg ml-4 ${tx.type === 'credit_add' || tx.type === 'credit_purchase' || tx.type === 'credit' || tx.type === 'referral_bonus'
                          ? 'text-[#16A34A]' : 'text-red-600'
                          }`}>
                          {tx.type === 'credit_add' || tx.type === 'credit_purchase' || tx.type === 'credit' || tx.type === 'referral_bonus' ? '+' : '-'}
                          {Math.abs(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <CreditCard size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Wallet Balance</span>
              </div>
              <p className="text-4xl font-black mb-6">{agent.walletBalance || 0} <span className="text-lg font-medium opacity-60">credits</span></p>
              <Button
                onClick={handleAddCredits}
                className="w-full bg-white/10 hover:bg-white/20 border-0 text-white font-bold"
              >
                + Add Credits
              </Button>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Account Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-bold ${agent.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {agent.status?.charAt(0).toUpperCase() + agent.status?.slice(1) || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium text-gray-700">{agent.role || 'Agent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined</span>
                  <span className="text-gray-700">{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                {agent.referralCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Referral Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#FE9200]">{agent.referralCode}</span>
                      <button onClick={() => copyToClipboard(agent.referralCode)} className="p-1 hover:bg-gray-100 rounded">
                        <Copy size={12} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Leads Tab */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Unlock size={16} className="text-gray-400" />
              Connected Leads ({connectedLeads.length})
            </h3>
            <Button onClick={fetchConnectedLeads} variant="ghost" size="sm" className="text-gray-400">
              <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
            </Button>
          </div>
          <div className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
              </div>
            ) : connectedLeads.length === 0 ? (
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No leads unlocked yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectedLeads.map((connection, idx) => (
                  <div key={connection.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-gray-200 flex-shrink-0">
                      <Home size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">
                          {connection.lead?.property_type || connection.property_type || 'Property'}
                        </p>
                        {connection.is_exclusive && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-600">
                            EXCLUSIVE
                          </span>
                        )}
                        {getConnectionStatusBadge(connection.status || 'connected')}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {connection.lead?.location || connection.location || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={10} />
                          {connection.lead?.budget ? `KSh ${parseInt(connection.lead.budget).toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#FE9200]">
                        {connection.credits_paid || 0} credits
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {connection.created_at ? new Date(connection.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          {/* Referral Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-3xl font-black text-gray-900">{referralStats?.stats?.totalReferrals || 0}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Referrals</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-emerald-100">
              <p className="text-3xl font-black text-emerald-600">{referralStats?.stats?.earnedFromReferrals || 0}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits Earned</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-blue-100">
              <p className="text-3xl font-black text-blue-600">{referralStats?.stats?.referralsWithPurchase || 0}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Converted</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#FE9200]/20">
              <p className="text-3xl font-black text-[#FE9200]">{agent.referralCode || 'N/A'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Referral Code</p>
            </div>
          </div>

          {/* Referred Users List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                Referred Users
              </h3>
            </div>
            <div className="p-6">
              {referralStats?.referrals?.length > 0 ? (
                <div className="space-y-4">
                  {referralStats.referrals.map((referral, idx) => (
                    <div key={referral.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200">
                        {referral.referred?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{referral.referred?.name || 'User'}</p>
                        <p className="text-xs text-gray-400">{referral.referred?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${referral.bonus_awarded ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                          {referral.bonus_awarded ? 'Bonus Paid' : 'Pending'}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No referrals yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ratings Tab */}
      {activeTab === 'ratings' && (
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-10 h-10 text-amber-400 fill-amber-400" />
                  <span className="text-5xl font-black text-gray-900">{agent.average_rating?.toFixed(1) || '—'}</span>
                </div>
                <p className="text-sm text-gray-500">{agent.total_ratings || 0} reviews</p>
              </div>
              <div className="flex-1 w-full">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratings.filter(r => r.rating === star).length;
                  const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-500 w-8">{star} ★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Award size={16} className="text-gray-400" />
                Reviews ({ratings.length})
              </h3>
            </div>
            <div className="p-6">
              {ratings.length > 0 ? (
                <div className="space-y-4">
                  {ratings.map((review, idx) => (
                    <div key={review.id || idx} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200">
                            {review.tenant?.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{review.tenant?.name || 'Tenant'}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-sm text-gray-600 italic">&quot;{review.review}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
