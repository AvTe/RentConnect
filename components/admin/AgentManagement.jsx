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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
        <div className="flex gap-2">
          <Button onClick={fetchAgents} variant="outline" size="sm">Refresh</Button>
          <Button className="bg-blue-600 text-white" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or agency..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['all', 'verified', 'pending', 'suspended'].map((f) => (
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

      {/* Agents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Wallet</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading agents...</td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No agents found matching your filters.</td>
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
                    <td className="px-6 py-4 font-mono text-gray-600">
                      {agent.walletBalance || 0} CR
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {agent.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {agent.createdAt?.toDate ? agent.createdAt.toDate().toLocaleDateString() : 'N/A'}
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
    </div>
  );
};
