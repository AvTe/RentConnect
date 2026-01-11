'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, Clock, CheckCircle,
  XCircle, Loader2, CreditCard, TrendingUp, History, ChevronRight,
  ArrowLeft, Coins, Gift, Zap
} from 'lucide-react';
import { Button } from './ui/Button';
import { getWalletBalance, getWalletTransactions } from '@/lib/database';

export const WalletManagement = ({ currentUser, onBack, onTopUp }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, credits, debits

  const userId = currentUser?.uid || currentUser?.id;

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [balanceResult, transactionsResult] = await Promise.all([
        getWalletBalance(userId),
        getWalletTransactions ? getWalletTransactions(userId) : { success: true, data: [] }
      ]);

      if (balanceResult.success) setBalance(balanceResult.balance);
      if (transactionsResult.success) setTransactions(transactionsResult.data || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'credits') return t.amount > 0;
    if (filter === 'debits') return t.amount < 0;
    return true;
  });

  const getTransactionIcon = (type, amount) => {
    if (type === 'referral' || type === 'bonus') return <Gift className="w-5 h-5 text-purple-500" />;
    if (type === 'purchase' || type === 'topup') return <Plus className="w-5 h-5 text-green-500" />;
    if (amount > 0) return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    return <ArrowUpRight className="w-5 h-5 text-red-500" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900">My Wallet</h2>
          <p className="text-sm text-gray-500">Manage your credits and transactions</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#FE9200] to-[#E58300] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          <Coins className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wider">Available Balance</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <span className="text-4xl md:text-5xl font-black">{balance}</span>
          <span className="text-lg opacity-80">Credits</span>
        </div>
        <Button
          onClick={onTopUp}
          className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Top Up Credits
        </Button>
      </div>

      {/* Quick Stats - Responsive grid with proper spacing */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-2 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-1 md:mb-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          </div>
          <p className="text-base md:text-lg font-bold text-gray-900">
            {transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
          </p>
          <p className="text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Total Earned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-1 md:mb-2">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
          </div>
          <p className="text-base md:text-lg font-bold text-gray-900">
            {Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))}
          </p>
          <p className="text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Total Spent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-1 md:mb-2">
            <Gift className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
          </div>
          <p className="text-base md:text-lg font-bold text-gray-900">
            {transactions.filter(t => t.type === 'referral' || t.type === 'bonus').length}
          </p>
          <p className="text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Bonuses</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Transaction History</h3>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {['all', 'credits', 'debits'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900 mb-1">No transactions yet</p>
            <p className="text-sm text-gray-500">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction, index) => (
              <div key={transaction.id || index} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  transaction.amount > 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {getTransactionIcon(transaction.type, transaction.amount)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {transaction.description || transaction.type || 'Transaction'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.created_at || transaction.date)}
                  </p>
                </div>
                <div className={`text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="font-bold">
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">Credits</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagement;

