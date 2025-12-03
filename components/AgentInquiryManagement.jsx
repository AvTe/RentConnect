import React, { useState, useEffect, useCallback } from 'react';
import { 
  Inbox, Send, MessageCircle, Clock, CheckCircle, 
  XCircle, AlertCircle, Search, Filter
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getAgentInquiries, updateInquiryStatus } from '../lib/database';

export const AgentInquiryManagement = ({ agentId, agentName }) => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    const result = await getAgentInquiries(agentId);
    if (result.success) {
      setInquiries(result.data);
    }
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleRespond = async () => {
    if (!responseMessage.trim()) {
      alert('Please enter a response message');
      return;
    }

    const result = await updateInquiryStatus(
      selectedInquiry.id,
      'responded',
      responseMessage
    );

    if (result.success) {
      alert('Response sent successfully!');
      setSelectedInquiry(null);
      setResponseMessage('');
      loadInquiries();
    } else {
      alert('Failed to send response');
    }
  };

  const handleStatusChange = async (inquiryId, status) => {
    const result = await updateInquiryStatus(inquiryId, status);
    if (result.success) {
      loadInquiries();
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
      responded: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Responded' },
      closed: { icon: CheckCircle, color: 'text-[#FE9200]', bg: 'bg-[#FFF5E6]', label: 'Closed' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const filteredInquiries = filterStatus === 'all' 
    ? inquiries 
    : inquiries.filter(inq => inq.status === filterStatus);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-6 h-6" />
            Lead Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage inquiries from users. Note: User contact details are private.
          </p>
        </div>
        <Badge className="bg-[#FFE4C4] text-[#E58300]">
          {inquiries.length} Total Leads
        </Badge>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Privacy Protected</h4>
            <p className="text-sm text-blue-800">
              For user privacy, you cannot see user contact details directly. 
              All communication happens through the platform. Respond to inquiries 
              here and users will be notified.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'responded', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === status
                ? 'bg-[#FE9200] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 text-xs">
                ({inquiries.filter(i => i.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries found</h3>
          <p className="text-gray-600">
            {filterStatus === 'all' 
              ? "You haven't received any inquiries yet" 
              : `No ${filterStatus} inquiries`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => {
            const statusInfo = getStatusInfo(inquiry.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div 
                key={inquiry.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{inquiry.userName}</h4>
                      <Badge className={`${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {inquiry.propertyTitle || 'General Inquiry'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {inquiry.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-gray-700 text-sm">{inquiry.message}</p>
                </div>

                {inquiry.response && (
                  <div className="bg-[#FFF5E6] border border-[#FFD4A3] rounded-lg p-3 mb-3">
                    <p className="text-xs text-[#E58300] font-medium mb-1">Your Response:</p>
                    <p className="text-gray-700 text-sm">{inquiry.response}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {inquiry.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Respond
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(inquiry.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {inquiry.status === 'responded' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(inquiry.id, 'closed')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark as Closed
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Respond to Inquiry
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>From:</strong> {selectedInquiry.userName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Property:</strong> {selectedInquiry.propertyTitle}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Message:</strong> {selectedInquiry.message}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response here..."
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your response will be sent to the user through the platform. 
                They will receive a notification and can view your response in their dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedInquiry(null);
                  setResponseMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRespond}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Response
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
