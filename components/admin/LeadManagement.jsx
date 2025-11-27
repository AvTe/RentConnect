import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, Eye, ChevronLeft, ChevronRight, MapPin, DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllLeads, getLead } from '@/lib/firestore';
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
    const matchesSearch = 
      lead.requirements?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.requirements?.property_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
        <div className="flex gap-2">
          <Button onClick={fetchLeads} variant="outline" size="sm">Refresh</Button>
          <Button className="bg-blue-600 text-white" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by location or property type..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['all', 'active', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
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

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      {lead.requirements?.property_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.requirements?.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ₦{lead.requirements?.budget?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        lead.status === 'active' ? 'bg-green-100 text-green-800' : 
                        lead.status === 'closed' ? 'bg-gray-100 text-gray-800' : 
                        'bg-red-100 text-red-800'
                      }>
                        {lead.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'N/A'}
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
    </div>
  );
};
