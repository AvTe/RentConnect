import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, Eye, ChevronLeft, ChevronRight, MapPin, DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllLeads, getLead } from '@/lib/database';
import { LeadDetail } from './LeadDetail';

export const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, closed
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchLeads = async () => {
    setLoading(true);
    // Pass 'all' to get all leads if filter is 'all', otherwise pass specific status
    const statusFilter = filter === 'all' ? 'all' : filter;
    const result = await getAllLeads({ status: statusFilter, limit: 100 });
    
    if (result.success) {
      setLeads(result.data);
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

  const filteredLeads = leads.filter(lead => {
    const location = lead.location || lead.requirements?.location || '';
    const propertyType = lead.property_type || lead.requirements?.property_type || '';
    const tenantName = lead.tenant_name || '';
    const tenantEmail = lead.tenant_email || '';
    
    const matchesSearch = 
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenantEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesSearch;
  });

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Lead Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={fetchLeads} variant="outline" size="sm" className="flex-1 sm:flex-none">Refresh</Button>
          <Button className="bg-blue-600 text-white flex-1 sm:flex-none" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 md:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by location or property type..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {['all', 'active', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">No leads found matching your filters.</div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {lead.property_type || lead.requirements?.property_type || 'N/A'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{lead.location || lead.requirements?.location || 'N/A'}</span>
                  </div>
                </div>
                <Badge className={`flex-shrink-0 text-xs ${
                  lead.status === 'active' ? 'bg-[#FFE4C4] text-green-800' :
                  lead.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {lead.status?.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700">KSh {(lead.budget || lead.requirements?.budget)?.toLocaleString() || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Posted:</span>
                  <span className="ml-1 text-gray-700">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              <Button
                onClick={() => handleViewLead(lead.id)}
                variant="outline"
                size="sm"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Property Type</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Posted</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading leads...</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No leads found matching your filters.</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {lead.property_type || lead.requirements?.property_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.location || lead.requirements?.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      KSh {(lead.budget || lead.requirements?.budget)?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        lead.status === 'active' ? 'bg-[#FFE4C4] text-green-800' :
                        lead.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {lead.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleViewLead(lead.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Mock) */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filteredLeads.length} leads</span>
          <div className="flex gap-2">
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="md:hidden px-4 py-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>Showing {filteredLeads.length} leads</span>
        <div className="flex gap-2">
          <button className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};
