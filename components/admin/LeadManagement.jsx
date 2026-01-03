"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Eye, ChevronLeft, ChevronRight, MapPin, DollarSign, Inbox,
  Clock, Users, Loader2, RefreshCw, Download, TrendingUp, Crown, AlertCircle,
  CheckCircle, XCircle, Flag
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LeadFilters } from '../ui/LeadFilters';
import { getAllLeads, getLead } from '@/lib/database';
import { LeadDetail } from './LeadDetail';

export const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    totalViews: 0,
    totalUnlocks: 0
  });

  // Update current time every minute for remaining time calculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate remaining time for lead (48 hours from creation)
  const getRemainingTime = (createdAt) => {
    if (!createdAt) return { text: "N/A", isExpired: false, isUrgent: false };
    const expiry = new Date(createdAt).getTime() + (48 * 60 * 60 * 1000);
    const diff = expiry - currentTime.getTime();
    if (diff <= 0) return { text: "EXPIRED", isExpired: true, isUrgent: false };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const isUrgent = hours < 12;
    return { text: `${hours}h ${minutes}m`, isExpired: false, isUrgent };
  };

  // Format budget with KSh and K/M suffixes
  const formatBudget = (amount) => {
    if (!amount) return 'N/A';
    const num = parseInt(amount);
    if (isNaN(num)) return amount;
    if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `KSh ${(num / 1000).toFixed(0)}K`;
    return `KSh ${num.toLocaleString()}`;
  };

  // Handle filter change from LeadFilters component
  const handleFilterChange = (filtered, filters) => {
    setFilteredLeads(filtered);
    setActiveFilters(filters);
  };

  // Calculate stats from leads
  const calculateStats = useCallback((leadsData) => {
    setStats({
      total: leadsData.length,
      active: leadsData.filter(l => l.status === 'active').length,
      closed: leadsData.filter(l => l.status === 'closed').length,
      paused: leadsData.filter(l => l.status === 'paused').length,
      totalViews: leadsData.reduce((sum, l) => sum + (l.views || 0), 0),
      totalUnlocks: leadsData.reduce((sum, l) => sum + (l.contacts || 0), 0)
    });
  }, []);

  // Fetch leads on mount and when filter changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const status = statusFilter === 'all' ? 'all' : statusFilter;

      const result = await getAllLeads({ status, limit: 200 });
      if (result.success) {
        setLeads(result.data);
        setFilteredLeads(result.data);
        calculateStats(result.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [statusFilter, calculateStats]);

  const fetchLeads = async () => {
    setLoading(true);
    const status = statusFilter === 'all' ? 'all' : statusFilter;
    const result = await getAllLeads({ status, limit: 200 });
    if (result.success) {
      setLeads(result.data);
      setFilteredLeads(result.data);
      calculateStats(result.data);
    }
    setLoading(false);
  };

  const handleViewLead = async (leadId) => {
    setLoading(true);
    const result = await getLead(leadId);
    setLoading(false);

    if (result.success) {
      setSelectedLead(result.data);
    } else {
      alert('Error fetching lead details: ' + result.error);
    }
  };

  // Export leads to CSV
  const exportToCSV = () => {
    const headers = ['Property Type', 'Location', 'Budget', 'Status', 'Views', 'Unlocks', 'Created'];
    const csvData = displayLeads.map(lead => [
      lead.property_type || 'N/A',
      lead.location || 'N/A',
      lead.budget || 'N/A',
      lead.status || 'N/A',
      lead.views || 0,
      lead.contacts || 0,
      lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Determine which leads to display
  const displayLeads = filteredLeads.length > 0 || Object.keys(activeFilters).some(k => activeFilters[k])
    ? filteredLeads
    : leads;

  const hasActiveFilters = Object.keys(activeFilters).some(k => activeFilters[k]);

  if (selectedLead) {
    return (
      <LeadDetail
        lead={selectedLead}
        onBack={() => setSelectedLead(null)}
        onUpdate={() => {
          fetchLeads();
          handleViewLead(selectedLead.id);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Lead Management</h2>
          <p className="text-sm text-gray-500 font-medium">Monitor and manage all rental requests</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={fetchLeads}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            onClick={exportToCSV}
            className="bg-blue-600 text-white flex-1 sm:flex-none flex items-center gap-2"
            size="sm"
          >
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Inbox size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <XCircle size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-500">{stats.closed}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Closed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Eye size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">{stats.totalViews}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#FE9200]/20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF9F2] flex items-center justify-center">
              <Users size={18} className="text-[#FE9200]" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#FE9200]">{stats.totalUnlocks}</p>
              <p className="text-[10px] text-[#E58300] font-bold uppercase tracking-widest">Unlocks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Leads', icon: Inbox },
          { key: 'active', label: 'Active', icon: CheckCircle },
          { key: 'paused', label: 'Paused', icon: Clock },
          { key: 'closed', label: 'Closed', icon: XCircle }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === tab.key
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <LeadFilters
          leads={leads}
          onFilterChange={handleFilterChange}
          showSearch={true}
          showPropertyType={true}
          showLocation={true}
          showBudget={true}
          className="w-full"
        />
        {hasActiveFilters && (
          <p className="text-xs text-gray-500 mt-3 font-medium">
            Showing {displayLeads.length} of {leads.length} leads
          </p>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin mb-3" />
            <p className="text-gray-500 font-medium text-sm">Loading leads...</p>
          </div>
        ) : displayLeads.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-bold mb-1">No leads found</p>
            <p className="text-gray-500 text-sm">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Leads will appear here when tenants submit requests.'}
            </p>
          </div>
        ) : (
          displayLeads.map((lead) => {
            const timeInfo = getRemainingTime(lead.created_at);
            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewLead(lead.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate text-base">
                      {lead.property_type || lead.requirements?.property_type || 'Property Request'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{lead.location || lead.requirements?.location || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${lead.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      lead.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                      {lead.status}
                    </span>
                    {!timeInfo.isExpired && lead.status === 'active' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${timeInfo.isUrgent ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                        <Clock size={8} className="inline mr-1" />
                        {timeInfo.text}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FE9200] font-bold">
                    {formatBudget(lead.budget || lead.requirements?.budget)}
                  </span>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {lead.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {lead.contacts || 0}
                    </span>
                  </div>
                </div>

                {/* Slots indicator */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Slots</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i <= (lead.claimed_slots || 0)
                          ? 'bg-[#FE9200] text-white'
                          : 'bg-gray-100 text-gray-400'
                          }`}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {lead.claimed_slots || 0}/3 filled
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-400 font-bold text-[10px] uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time Left</th>
                <th className="px-6 py-4">Slots</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Unlocks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-[#FE9200] animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">Loading leads...</p>
                  </td>
                </tr>
              ) : displayLeads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">
                      {hasActiveFilters ? 'No leads match your filters.' : 'No leads found.'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayLeads.map((lead) => {
                  const timeInfo = getRemainingTime(lead.created_at);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp size={16} className="text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {lead.property_type || lead.requirements?.property_type || 'N/A'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin size={12} className="text-gray-400" />
                          <span className="truncate max-w-[150px]">
                            {lead.location || lead.requirements?.location || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#FE9200]">
                          {formatBudget(lead.budget || lead.requirements?.budget)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${lead.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : lead.status === 'paused'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${lead.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                            lead.status === 'paused' ? 'bg-amber-500' :
                              'bg-gray-400'
                            }`} />
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {timeInfo.isExpired ? (
                          <span className="text-[10px] text-gray-400 font-bold">EXPIRED</span>
                        ) : lead.status === 'active' ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${timeInfo.isUrgent ? 'text-red-500' : 'text-orange-500'
                            }`}>
                            <Clock size={10} />
                            {timeInfo.text}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i <= (lead.claimed_slots || 0)
                                ? 'bg-[#FE9200] text-white'
                                : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                              {i}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-700">{lead.views || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-purple-600">{lead.contacts || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleViewLead(lead.id)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50 font-bold"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span className="font-medium">Showing {displayLeads.length} of {leads.length} leads</span>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="md:hidden px-4 py-3 bg-white rounded-2xl border border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium">Showing {displayLeads.length} of {leads.length} leads</span>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50" disabled>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
