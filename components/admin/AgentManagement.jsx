"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, MoreVertical, ShieldCheck, ShieldAlert,
  UserX, UserCheck, Eye, ChevronLeft, ChevronRight, X,
  Users, Wallet, CheckCircle, Clock, AlertTriangle, MapPin,
  Calendar, TrendingUp, Download, RefreshCw, ChevronDown,
  Mail, Phone, Building, FileText, History, Key, Ban, Play,
  Edit, Trash2, Star, Plus, Check, AlertCircle, Loader2,
  CreditCard, ArrowLeft, DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getAllAgents,
  getFullAgentProfile,
  approveAgent,
  rejectAgent,
  addAgentCredits
} from '@/lib/database';
import { AgentDetail } from './AgentDetail';
import { useToast } from '@/context/ToastContext';

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, bgColor, iconColor, subtext, trend }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend.type === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
          <TrendingUp size={12} />
          {trend.value}
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

// Status Badge Component
const StatusBadge = ({ status, verificationStatus }) => {
  const getStatusConfig = () => {
    if (status === 'suspended') {
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Suspended', icon: Ban };
    }
    switch (verificationStatus) {
      case 'verified':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Verified', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Pending', icon: Clock };
      case 'rejected':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Rejected', icon: AlertTriangle };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', label: 'Unverified', icon: AlertCircle };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
      <IconComponent className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Skeleton Loader
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-40"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-8"></div></td>
  </tr>
);

// Actions Dropdown - Using fixed position to avoid overflow clipping
const ActionsDropdown = ({ agent, onAction, isOpen, onToggle, buttonRef }) => {
  const [position, setPosition] = React.useState({ top: 0, right: 0 });

  React.useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  const actions = [
    { id: 'view', label: 'View Details', icon: Eye, color: 'text-gray-700' },
    { id: 'divider1' },
    ...(agent.verificationStatus === 'pending' ? [
      { id: 'verify', label: 'Verify Agent', icon: ShieldCheck, color: 'text-emerald-600' },
      { id: 'reject', label: 'Reject Verification', icon: ShieldAlert, color: 'text-red-600' },
    ] : []),
    ...(agent.status === 'suspended' ? [
      { id: 'activate', label: 'Activate Agent', icon: Play, color: 'text-emerald-600' },
    ] : agent.status !== 'suspended' ? [
      { id: 'suspend', label: 'Suspend Agent', icon: Ban, color: 'text-red-600' },
    ] : []),
    { id: 'divider2' },
    { id: 'addCredits', label: 'Add Credits', icon: Wallet, color: 'text-blue-600' },
    { id: 'viewTransactions', label: 'View Transactions', icon: CreditCard, color: 'text-purple-600' },
    { id: 'resetPassword', label: 'Reset Password', icon: Key, color: 'text-gray-700' },
    { id: 'viewLogs', label: 'View Activity Logs', icon: History, color: 'text-gray-700' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onToggle}></div>
      <div
        className="fixed w-48 bg-white rounded-xl border border-gray-200 py-2 z-[101]"
        style={{ top: position.top, right: position.right }}
      >
        {actions.map((action, idx) => (
          action.id?.startsWith('divider') ? (
            <div key={action.id} className="my-1 border-t border-gray-100"></div>
          ) : (
            <button
              key={action.id}
              onClick={() => { onAction(action.id, agent); onToggle(); }}
              className={`w-full px-4 py-2 text-left text-sm font-medium flex items-center gap-2 hover:bg-gray-50 ${action.color}`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          )
        ))}
      </div>
    </>
  );
};

// Action Button with ref for dropdown positioning
const ActionButton = ({ agent, isOpen, onToggle, onClose, onAction }) => {
  const buttonRef = React.useRef(null);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
      <ActionsDropdown
        agent={agent}
        isOpen={isOpen}
        onToggle={onClose}
        onAction={onAction}
        buttonRef={buttonRef}
      />
    </>
  );
};

// Agent Detail Drawer
const AgentDrawer = ({ agent, isOpen, onClose, onAction }) => {
  if (!isOpen || !agent) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Agent Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
              {agent.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-900 text-lg">{agent.name}</h3>
              <p className="text-sm text-gray-500">{agent.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={agent.status} verificationStatus={agent.verificationStatus} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">Wallet Balance</p>
              <p className="text-xl font-black text-gray-900">{agent.walletBalance || 0} CR</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">Leads Unlocked</p>
              <p className="text-xl font-black text-gray-900">{agent.unlockedLeadsCount || 0}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{agent.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{agent.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{agent.location || agent.city || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{agent.agencyName || 'Independent'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Account Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-900 font-medium">
                  {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Active</span>
                <span className="text-gray-900 font-medium">
                  {agent.lastLogin ? new Date(agent.lastLogin).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rating</span>
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {agent.rating || 'No ratings'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => onAction('viewFull', agent)}
              className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl"
            >
              View Full Profile
            </Button>
            <div className="grid grid-cols-2 gap-3">
              {agent.verificationStatus === 'pending' && (
                <>
                  <Button
                    onClick={() => onAction('verify', agent)}
                    variant="outline"
                    className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                  <Button
                    onClick={() => onAction('reject', agent)}
                    variant="outline"
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {agent.status !== 'suspended' && agent.verificationStatus !== 'pending' && (
                <Button
                  onClick={() => onAction('suspend', agent)}
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 col-span-2"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend Agent
                </Button>
              )}
              {agent.status === 'suspended' && (
                <Button
                  onClick={() => onAction('activate', agent)}
                  variant="outline"
                  className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 col-span-2"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Activate Agent
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Add Credits Modal
const AddCreditsModal = ({ isOpen, agent, onClose, onSubmit, loading }) => {
  const [credits, setCredits] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(agent.id, parseInt(credits), reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">Add Credits</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
              {agent?.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{agent?.name}</p>
              <p className="text-xs text-gray-500">Current balance: {agent?.walletBalance || 0} CR</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Credits to Add</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Promotional bonus"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-[#FE9200] hover:bg-[#E58300] text-white" disabled={loading || !credits}>
              {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Add Credits
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reject Modal
const RejectModal = ({ isOpen, agent, onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(agent.id, reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">Reject Verification</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-bold text-gray-900">Rejecting: {agent?.name}</p>
              <p className="text-xs text-gray-500">This will notify the agent of the rejection.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Rejection Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this verification is being rejected..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white" disabled={loading || !reason}>
              {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Reject Verification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Agent Transactions View
const AgentTransactionsView = ({ agent, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalCredits: 0, totalSpent: 0, currentBalance: 0 });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const result = await getFullAgentProfile(agent.id);
        if (result.success) {
          const txs = result.data.transactions || [];
          setTransactions(txs);

          // Calculate stats
          const credits = txs.filter(t => t.type === 'credit').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
          const debits = txs.filter(t => t.type === 'debit').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

          setStats({
            totalCredits: credits,
            totalSpent: debits,
            currentBalance: result.data.walletBalance || 0
          });
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [agent.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Credit Transactions</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Viewing transactions for <span className="text-[#FE9200] font-bold">{agent.name}</span>
          </p>
        </div>
      </div>

      {/* Agent Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
            {agent.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-gray-900 text-lg">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={agent.status} verificationStatus={agent.verificationStatus} />
              <span className="text-xs text-gray-400">
                Wallet: <span className="font-bold text-emerald-600">KSh {stats.currentBalance.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          icon={CreditCard}
          label="Total Credits Added"
          value={`KSh ${stats.totalCredits.toLocaleString()}`}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={DollarSign}
          label="Total Spent"
          value={`KSh ${stats.totalSpent.toLocaleString()}`}
          bgColor="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          icon={Wallet}
          label="Current Balance"
          value={`KSh ${stats.currentBalance.toLocaleString()}`}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Transaction History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500 text-sm">This agent hasn't made any transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {tx.type === 'credit' ? '+ Credit' : '- Debit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tx.reason || 'No description'}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                      {tx.type === 'credit' ? '+' : '-'}KSh {parseFloat(tx.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AgentManagement = () => {
  const { toast, showConfirm } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [fullViewAgent, setFullViewAgent] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Modals
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [creditsAgent, setCreditsAgent] = useState(null);
  const [rejectAgent, setRejectAgentModal] = useState(null);

  // Views
  const [currentView, setCurrentView] = useState('list');
  const [transactionsAgent, setTransactionsAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const result = await getAllAgents({ limit: 500 });
      if (result.success) {
        setAgents(result.data || []);
      } else {
        toast.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAgent = async (agentId) => {
    setLoading(true);
    try {
      const result = await getFullAgentProfile(agentId);
      if (result.success) {
        setFullViewAgent(result.data);
      } else {
        toast.error('Error fetching agent details');
      }
    } catch (error) {
      toast.error('Error fetching agent details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionId, agent) => {
    switch (actionId) {
      case 'view':
        setSelectedAgent(agent);
        setShowDrawer(true);
        break;
      case 'viewFull':
        handleViewAgent(agent.id);
        setShowDrawer(false);
        break;
      case 'verify':
        showConfirm(`Verify ${agent.name}? This will grant them full agent access.`, async () => {
          setActionLoading(true);
          const result = await approveAgent(agent.id);
          setActionLoading(false);
          if (result.success) {
            toast.success(`${agent.name} has been verified successfully!`);
            fetchAgents();
            setShowDrawer(false);
          } else {
            toast.error('Failed to verify agent');
          }
        });
        break;
      case 'reject':
        setRejectAgentModal(agent);
        setShowRejectModal(true);
        setShowDrawer(false);
        break;
      case 'suspend':
        showConfirm(`Suspend ${agent.name}? They will lose access to the platform.`, async () => {
          setActionLoading(true);
          // TODO: Add suspendAgent function
          toast.warning('Suspend functionality coming soon');
          setActionLoading(false);
        });
        break;
      case 'activate':
        showConfirm(`Activate ${agent.name}? They will regain platform access.`, async () => {
          setActionLoading(true);
          // TODO: Add activateAgent function
          toast.warning('Activate functionality coming soon');
          setActionLoading(false);
        });
        break;
      case 'addCredits':
        setCreditsAgent(agent);
        setShowCreditsModal(true);
        break;
      case 'viewTransactions':
        setTransactionsAgent(agent);
        setCurrentView('transactions');
        setShowDrawer(false);
        break;
      case 'resetPassword':
        toast.info('Password reset email sent to agent');
        break;
      case 'viewLogs':
        toast.info('Activity logs coming soon');
        break;
    }
  };

  const handleRejectSubmit = async (agentId, reason) => {
    setActionLoading(true);
    try {
      const result = await rejectAgent(agentId, reason);
      if (result.success) {
        toast.success('Agent verification rejected');
        setShowRejectModal(false);
        setRejectAgentModal(null);
        fetchAgents();
      } else {
        toast.error('Failed to reject agent');
      }
    } catch (error) {
      toast.error('Failed to reject agent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCredits = async (agentId, credits, reason) => {
    setActionLoading(true);
    try {
      const result = await addAgentCredits(agentId, credits, { description: reason || 'Admin credit' });
      if (result.success) {
        toast.success(`${credits} credits added successfully`);
        setShowCreditsModal(false);
        setCreditsAgent(null);
        fetchAgents();
      } else {
        toast.error('Failed to add credits');
      }
    } catch (error) {
      toast.error('Failed to add credits');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Verification', 'Wallet', 'Leads', 'Location', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredAgents.map(a => [
        `"${a.name || ''}"`,
        a.email || '',
        a.phone || '',
        a.status || '',
        a.verificationStatus || '',
        a.walletBalance || 0,
        a.unlockedLeadsCount || 0,
        `"${a.location || a.city || ''}"`,
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export completed');
  };

  // Calculate stats
  const stats = useMemo(() => ({
    total: agents.length,
    verified: agents.filter(a => a.verificationStatus === 'verified').length,
    pending: agents.filter(a => a.verificationStatus === 'pending').length,
    suspended: agents.filter(a => a.status === 'suspended').length,
    totalLeads: agents.reduce((sum, a) => sum + (a.unlockedLeadsCount || 0), 0),
    totalWallet: agents.reduce((sum, a) => sum + (a.walletBalance || 0), 0)
  }), [agents]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = new Set();
    agents.forEach(a => {
      if (a.location) locs.add(a.location);
      if (a.city) locs.add(a.city);
    });
    return Array.from(locs).filter(Boolean).sort();
  }, [agents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = !searchTerm ||
        agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'verified') matchesStatus = agent.verificationStatus === 'verified';
      else if (statusFilter === 'pending') matchesStatus = agent.verificationStatus === 'pending';
      else if (statusFilter === 'suspended') matchesStatus = agent.status === 'suspended';

      const matchesLocation = !locationFilter ||
        agent.location === locationFilter ||
        agent.city === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [agents, searchTerm, statusFilter, locationFilter]);

  // Paginated agents
  const paginatedAgents = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAgents.slice(start, start + perPage);
  }, [filteredAgents, page]);

  const totalPages = Math.ceil(filteredAgents.length / perPage);

  // If viewing agent transactions
  if (currentView === 'transactions' && transactionsAgent) {
    return (
      <AgentTransactionsView
        agent={transactionsAgent}
        onBack={() => { setCurrentView('list'); setTransactionsAgent(null); }}
      />
    );
  }

  // If viewing full agent profile
  if (fullViewAgent) {
    return (
      <AgentDetail
        agent={fullViewAgent}
        onBack={() => setFullViewAgent(null)}
        onUpdate={() => {
          fetchAgents();
          handleViewAgent(fullViewAgent.id);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Agent Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage agent accounts, verifications, and wallets</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={fetchAgents}
            variant="outline"
            disabled={loading}
            className="rounded-xl border-[#FE9200] text-[#FE9200] hover:bg-[#FFF2E5]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            className="bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          icon={Users}
          label="Total Agents"
          value={stats.total}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={CheckCircle}
          label="Verified"
          value={stats.verified}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatsCard
          icon={Ban}
          label="Suspended"
          value={stats.suspended}
          bgColor="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Total Leads"
          value={stats.totalLeads}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          icon={Wallet}
          label="Total Credits"
          value={`${stats.totalWallet.toLocaleString()} CR`}
          bgColor="bg-[#FFF2E5]"
          iconColor="text-[#FE9200]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or agency..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['all', 'verified', 'pending', 'suspended'].map((f) => (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${statusFilter === f ? 'bg-[#FE9200] text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Location Filter */}
          {locations.length > 0 && (
            <div className="relative">
              <select
                value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none transition-all text-sm font-medium min-w-[140px]"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Agent</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Leads</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Wallet</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Location</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedAgents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">No agents found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {agent.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={agent.status} verificationStatus={agent.verificationStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{agent.unlockedLeadsCount || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-900">{agent.walletBalance || 0} CR</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{agent.location || agent.city || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionButton
                        agent={agent}
                        isOpen={openDropdown === agent.id}
                        onToggle={() => setOpenDropdown(openDropdown === agent.id ? null : agent.id)}
                        onClose={() => setOpenDropdown(null)}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin mx-auto" />
            </div>
          ) : paginatedAgents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No agents found</p>
            </div>
          ) : (
            paginatedAgents.map((agent) => (
              <div key={agent.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {agent.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} verificationStatus={agent.verificationStatus} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 rounded-xl p-3">
                  <div>
                    <span className="text-gray-400 block">Wallet</span>
                    <span className="font-bold text-gray-900">{agent.walletBalance || 0} CR</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Leads</span>
                    <span className="font-bold text-gray-900">{agent.unlockedLeadsCount || 0}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => handleAction('view', agent)}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl border-[#FE9200] text-[#FE9200]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredAgents.length > perPage && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredAgents.length)} of {filteredAgents.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${page === pageNum ? 'bg-[#FE9200] text-white' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers and Modals */}
      <AgentDrawer
        agent={selectedAgent}
        isOpen={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedAgent(null); }}
        onAction={handleAction}
      />

      <AddCreditsModal
        isOpen={showCreditsModal}
        agent={creditsAgent}
        onClose={() => { setShowCreditsModal(false); setCreditsAgent(null); }}
        onSubmit={handleAddCredits}
        loading={actionLoading}
      />

      <RejectModal
        isOpen={showRejectModal}
        agent={rejectAgent}
        onClose={() => { setShowRejectModal(false); setRejectAgentModal(null); }}
        onSubmit={handleRejectSubmit}
        loading={actionLoading}
      />
    </div>
  );
};
