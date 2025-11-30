import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, CheckCircle, XCircle, Clock, Filter, Search, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  getAllSupportTickets, 
  updateSupportTicket, 
  resolveSupportTicket,
  createSupportTicket
} from '@/lib/firestore';

export const SupportManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, open, resolved
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // For testing/demo purposes
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium', userId: 'admin_test' });

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchTickets = async () => {
    setLoading(true);
    const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
    const result = await getAllSupportTickets(filters);
    if (result.success) setTickets(result.data);
    setLoading(false);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    
    const result = await resolveSupportTicket(selectedTicket.id, resolutionNote);
    if (result.success) {
      alert('Ticket resolved successfully');
      setSelectedTicket(null);
      setResolutionNote('');
      fetchTickets();
    } else {
      alert('Error resolving ticket');
    }
  };

  const handleCreateTestTicket = async (e) => {
    e.preventDefault();
    const result = await createSupportTicket({
      ...newTicket,
      userEmail: 'test@example.com', // Mock data
      userName: 'Test User'
    });
    
    if (result.success) {
      setIsCreating(false);
      setNewTicket({ subject: '', message: '', priority: 'medium', userId: 'admin_test' });
      fetchTickets();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-[#FFE4C4] text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Support & Disputes</h2>
        <div className="flex gap-2">
          <select 
            className="border rounded-lg px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <Button onClick={() => setIsCreating(true)} variant="outline" size="sm">
            + Test Ticket
          </Button>
        </div>
      </div>

      {/* Create Ticket Modal (For Demo) */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Create Test Ticket</h3>
            <form onSubmit={handleCreateTestTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input 
                  className="w-full border rounded p-2"
                  value={newTicket.subject}
                  onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  className="w-full border rounded p-2"
                  value={newTicket.priority}
                  onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea 
                  className="w-full border rounded p-2"
                  value={newTicket.message}
                  onChange={e => setNewTicket({...newTicket, message: e.target.value})}
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-xl text-gray-900">{selectedTicket.subject}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'Just now'}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                  {selectedTicket.userName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedTicket.userName || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500">{selectedTicket.userEmail}</p>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            {selectedTicket.status === 'resolved' && (
              <div className="bg-[#FFF5E6] p-4 rounded-lg mb-6 border border-[#FFE4C4]">
                <h4 className="font-medium text-green-900 mb-1">Resolution</h4>
                <p className="text-green-800 text-sm">{selectedTicket.resolutionNote}</p>
                <p className="text-xs text-[#16A34A] mt-2">
                  Resolved at: {selectedTicket.resolvedAt?.toDate ? selectedTicket.resolvedAt.toDate().toLocaleString() : 'N/A'}
                </p>
              </div>
            )}

            {selectedTicket.status !== 'resolved' && (
              <form onSubmit={handleResolve} className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Resolve Ticket</h4>
                <textarea 
                  className="w-full border rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter resolution details..."
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  rows="3"
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" className="bg-[#16A34A] text-white hover:bg-[#15803D]">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Resolved
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">Loading...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">No tickets found</td></tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{ticket.subject}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex flex-col">
                        <span>{ticket.userName || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{ticket.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        onClick={() => setSelectedTicket(ticket)}
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
      </div>
    </div>
  );
};
