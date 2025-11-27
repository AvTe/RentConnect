import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, ShieldCheck, ShieldAlert, 
  UserX, UserCheck, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllRenters, getFullRenterProfile } from '@/lib/firestore';
import { RenterDetail } from './RenterDetail';

export const RenterManagement = () => {
  const [renters, setRenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, suspended
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRenters();
  }, []);

  const fetchRenters = async () => {
    setLoading(true);
    const result = await getAllRenters({ limit: 100 });
    if (result.success) {
      setRenters(result.data);
    }
    setLoading(false);
  };

  const handleViewRenter = async (renterId) => {
    setLoading(true);
    const result = await getFullRenterProfile(renterId);
    setLoading(false);
    
    if (result.success) {
      setSelectedRenter(result.data);
    } else {
      alert('Error fetching renter details: ' + result.error);
    }
  };

  const filteredRenters = renters.filter(renter => {
    const matchesSearch = 
      renter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      renter.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'active' ? renter.status !== 'suspended' :
      filter === 'suspended' ? renter.status === 'suspended' : true;

    return matchesSearch && matchesFilter;
  });

  if (selectedRenter) {
    return (
      <RenterDetail 
        renter={selectedRenter} 
        onBack={() => setSelectedRenter(null)} 
        onUpdate={() => {
          fetchRenters();
          handleViewRenter(selectedRenter.id); // Refresh detail view too
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Renter Management</h2>
        <div className="flex gap-2">
          <Button onClick={fetchRenters} variant="outline" size="sm">Refresh</Button>
          <Button className="bg-blue-600 text-white" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['all', 'active', 'suspended'].map((f) => (
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

      {/* Renters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Renter</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading renters...</td>
                </tr>
              ) : filteredRenters.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No renters found matching your filters.</td>
                </tr>
              ) : (
                filteredRenters.map((renter) => (
                  <tr key={renter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                          {renter.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{renter.name}</p>
                          <p className="text-xs text-gray-500">{renter.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        renter.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {renter.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {renter.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {renter.createdAt?.toDate ? renter.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        onClick={() => handleViewRenter(renter.id)}
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
          <span>Showing {filteredRenters.length} renters</span>
          <div className="flex gap-2">
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
