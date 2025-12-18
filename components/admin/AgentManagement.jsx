import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, ShieldCheck, ShieldAlert, 
  UserX, UserCheck, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllAgents, getFullAgentProfile } from '@/lib/database';
import { AgentDetail } from './AgentDetail';

export const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [filter, setFilter] = useState('all'); // all, verified, pending, suspended
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    const result = await getAllAgents({ limit: 100 }); // Fetch more for client-side filtering
    if (result.success) {
      setAgents(result.data);
    }
    setLoading(false);
  };

  const handleViewAgent = async (agentId) => {
    setLoading(true);
    const result = await getFullAgentProfile(agentId);
    setLoading(false);
    
    if (result.success) {
      setSelectedAgent(result.data);
    } else {
      alert('Error fetching agent details: ' + result.error);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'verified' ? agent.verificationStatus === 'verified' :
      filter === 'pending' ? agent.verificationStatus === 'pending' :
      filter === 'suspended' ? agent.status === 'suspended' : true;

    return matchesSearch && matchesFilter;
  });

  if (selectedAgent) {
    return (
      <AgentDetail 
        agent={selectedAgent} 
        onBack={() => setSelectedAgent(null)} 
        onUpdate={() => {
          fetchAgents();
          handleViewAgent(selectedAgent.id); // Refresh detail view too
        }}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Agent Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={fetchAgents} variant="outline" size="sm" className="flex-1 sm:flex-none">Refresh</Button>
          <Button className="bg-blue-600 text-white flex-1 sm:flex-none" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 md:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or agency..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {['all', 'verified', 'pending', 'suspended'].map((f) => (
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
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">Loading agents...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">No agents found matching your filters.</div>
        ) : (
          filteredAgents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                    {agent.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                  </div>
                </div>
                <Badge className={`flex-shrink-0 text-xs ${
                  agent.verificationStatus === 'verified' ? 'bg-[#FFE4C4] text-green-800' :
                  agent.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {agent.verificationStatus || 'Unverified'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-gray-500">Wallet:</span>
                  <span className="ml-1 font-mono text-gray-700">{agent.walletBalance || 0} CR</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-1 text-gray-700">{agent.location || agent.city || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Joined:</span>
                  <span className="ml-1 text-gray-700">{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Leads Unlocked:</span>
                  <span className="ml-1 font-medium text-gray-700">{agent.unlockedLeadsCount ?? 0}</span>
                </div>
              </div>
              {agent.status === 'suspended' && (
                <div className="text-xs text-red-600 font-medium mb-2">SUSPENDED</div>
              )}
              <Button
                onClick={() => handleViewAgent(agent.id)}
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
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Leads Unlocked</th>
                <th className="px-6 py-3">Wallet</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading agents...</td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No agents found matching your filters.</td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                          {agent.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge className={
                          agent.verificationStatus === 'verified' ? 'bg-[#FFE4C4] text-green-800 w-fit' :
                          agent.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 w-fit' :
                          'bg-gray-100 text-gray-800 w-fit'
                        }>
                          {agent.verificationStatus || 'Unverified'}
                        </Badge>
                        {agent.status === 'suspended' && (
                          <span className="text-[10px] text-red-600 font-medium">SUSPENDED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {agent.unlockedLeadsCount ?? 0}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">
                      {agent.walletBalance || 0} CR
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {agent.location || agent.city || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleViewAgent(agent.id)}
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
          <span>Showing {filteredAgents.length} agents</span>
          <div className="flex gap-2">
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="md:hidden px-4 py-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>Showing {filteredAgents.length} agents</span>
        <div className="flex gap-2">
          <button className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};
