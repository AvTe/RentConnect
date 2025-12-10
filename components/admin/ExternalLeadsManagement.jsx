'use client';
import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, RefreshCw, Filter, Search, Calendar, 
  TrendingUp, Users, Target, Zap, Facebook, Chrome,
  Copy, CheckCircle, Eye, MoreVertical, Download,
  ArrowUpRight, Clock, MapPin, DollarSign, Home
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  getExternalLeads, 
  getExternalLeadLogs, 
  getLeadSourceAnalytics 
} from '@/lib/database';

export const ExternalLeadsManagement = () => {
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');
  const [filters, setFilters] = useState({
    source: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // API endpoint info
  const apiEndpoint = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/leads/external`
    : '/api/leads/external';
  const apiKey = process.env.NEXT_PUBLIC_EXTERNAL_LEADS_API_KEY || 'rc_zapier_key_2024';

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsResult, logsResult, analyticsResult] = await Promise.all([
        getExternalLeads(filters),
        getExternalLeadLogs({ limit: 50 }),
        getLeadSourceAnalytics()
      ]);

      if (leadsResult.success) setLeads(leadsResult.data);
      if (logsResult.success) setLogs(logsResult.data);
      if (analyticsResult.success) setAnalytics(analyticsResult.data);
    } catch (error) {
      console.error('Error fetching external leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'facebook_ads':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'google_ads':
        return <Chrome className="w-4 h-4 text-red-500" />;
      case 'zapier':
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return <ExternalLink className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'facebook_ads': return 'Facebook Ads';
      case 'google_ads': return 'Google Ads';
      case 'zapier': return 'Zapier';
      default: return source || 'External';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      contacted: 'bg-yellow-100 text-yellow-700',
      converted: 'bg-purple-100 text-purple-700',
      closed: 'bg-gray-100 text-gray-700'
    };
    return styles[status] || styles.new;
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.tenant_name?.toLowerCase().includes(search) ||
      lead.tenant_email?.toLowerCase().includes(search) ||
      lead.location?.toLowerCase().includes(search)
    );
  });

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">External Leads</h2>
          <p className="text-sm text-gray-500">Leads from Google Ads, Facebook Ads & Zapier</p>
        </div>
        <Button onClick={fetchData} disabled={loading} className="w-full sm:w-auto" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{analytics.external?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <Facebook className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Facebook</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{analytics.external?.facebook_ads || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-red-100 rounded-lg">
                <Chrome className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Google</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{analytics.external?.google_ads || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Zapier</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{analytics.external?.zapier || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Integration Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 border border-blue-200">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-white rounded-lg shadow-sm">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Zapier Integration</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
              Connect Google Ads & Facebook Ads lead forms to automatically sync leads.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">API Endpoint</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white px-2 md:px-3 py-2 rounded-lg border border-gray-200 text-xs md:text-sm text-gray-800 font-mono truncate">
                    {apiEndpoint}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiEndpoint)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">API Key (x-api-key)</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white px-2 md:px-3 py-2 rounded-lg border border-gray-200 text-xs md:text-sm text-gray-800 font-mono">
                    {apiKeyCopied ? '✓ Copied!' : '••••••••••••••••'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey)}
                    className="flex-shrink-0"
                  >
                    {apiKeyCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://zapier.com/apps/facebook-lead-ads/integrations/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:text-blue-700"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook Ads</span>
                <span className="sm:hidden">FB</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
              <a
                href="https://zapier.com/apps/google-ads/integrations/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:text-blue-700"
              >
                <Chrome className="w-4 h-4" />
                <span className="hidden sm:inline">Google Ads</span>
                <span className="sm:hidden">Google</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 md:gap-6">
          {['leads', 'logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 md:pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'leads' ? 'External Leads' : 'API Logs'}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">All Sources</option>
            <option value="google_ads">Google Ads</option>
            <option value="facebook_ads">Facebook Ads</option>
            <option value="zapier">Zapier</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'leads' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 md:p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 md:p-12 text-center text-gray-500">
              <Target className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm md:text-base">No external leads yet</p>
              <p className="text-xs md:text-sm mt-1">Connect Zapier to start receiving leads from your ads</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requirements</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(lead.external_source)}
                            <span className="text-sm text-gray-700">
                              {getSourceLabel(lead.external_source)}
                            </span>
                          </div>
                          {lead.campaign_name && (
                            <p className="text-xs text-gray-400 mt-0.5">{lead.campaign_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{lead.tenant_name}</p>
                          <p className="text-sm text-gray-500">{lead.tenant_email}</p>
                          <p className="text-sm text-gray-500">{lead.tenant_phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="w-3 h-3" />
                            {lead.location}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Home className="w-3 h-3" />
                              {lead.property_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              KSh {lead.budget?.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredLeads.map(lead => (
                  <div key={lead.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{lead.tenant_name}</p>
                        <p className="text-xs text-gray-500 truncate">{lead.tenant_email}</p>
                        <p className="text-xs text-gray-500">{lead.tenant_phone}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {getSourceIcon(lead.external_source)}
                        <span>{getSourceLabel(lead.external_source)}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{lead.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        <span>{lead.property_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>KSh {lead.budget?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* API Logs Tab */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 md:p-12 text-center text-gray-500">
              <Clock className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm md:text-base">No API logs yet</p>
              <p className="text-xs md:text-sm mt-1">Logs will appear when leads are received via API</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{formatDate(log.created_at)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(log.source)}
                            <span className="text-sm">{getSourceLabel(log.source)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{log.campaign_name || '-'}</span>
                          {log.campaign_id && (
                            <p className="text-xs text-gray-400">{log.campaign_id}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {log.lead?.tenant_name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(log.lead?.status)}`}>
                            {log.lead?.status || 'new'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {logs.map(log => (
                  <div key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {log.lead?.tenant_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{log.campaign_name || 'No campaign'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadge(log.lead?.status)}`}>
                        {log.lead?.status || 'new'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {getSourceIcon(log.source)}
                        <span>{getSourceLabel(log.source)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExternalLeadsManagement;
