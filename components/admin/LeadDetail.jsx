import React, { useState } from 'react';
import { 
  MapPin, Calendar, DollarSign, Eye, Phone, Trash2, XCircle, CheckCircle, ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { updateLead, deleteLead } from '@/lib/firestore';

export const LeadDetail = ({ lead, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    if (!confirm(`Are you sure you want to ${action} this lead?`)) return;
    
    setLoading(true);
    try {
      let result;
      if (action === 'close') {
        result = await updateLead(lead.id, { status: 'closed' });
      } else if (action === 'activate') {
        result = await updateLead(lead.id, { status: 'active' });
      } else if (action === 'delete') {
        result = await deleteLead(lead.id);
      }
      
      if (result.success) {
        alert(`Lead ${action}d successfully`);
        onUpdate();
        onBack();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-gray-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
        <div className="flex gap-2">
          {lead.status === 'active' ? (
            <Button 
              onClick={() => handleAction('close')}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              disabled={loading}
            >
              <XCircle className="w-4 h-4 mr-2" /> Close Lead
            </Button>
          ) : (
            <Button 
              onClick={() => handleAction('activate')}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Reactivate
            </Button>
          )}
          <Button 
            onClick={() => handleAction('delete')}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lead.requirements?.property_type || 'Property Request'}
                </h2>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {lead.requirements?.location || 'No location specified'}
                </div>
              </div>
              <Badge className={
                lead.status === 'active' ? 'bg-green-100 text-green-800' : 
                lead.status === 'closed' ? 'bg-gray-100 text-gray-800' : 
                'bg-red-100 text-red-800'
              }>
                {lead.status?.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Budget</p>
                <p className="text-xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-1" />
                  {lead.requirements?.budget?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Posted Date</p>
                <p className="text-xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-1" />
                  {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Requirements</h3>
              <div className="space-y-3 text-gray-600">
                <p><span className="font-medium">Bedrooms:</span> {lead.requirements?.bedrooms || 'Any'}</p>
                <p><span className="font-medium">Bathrooms:</span> {lead.requirements?.bathrooms || 'Any'}</p>
                <p><span className="font-medium">Furnishing:</span> {lead.requirements?.furnishing || 'Any'}</p>
                <div className="mt-4">
                  <span className="font-medium block mb-1">Description:</span>
                  <p className="bg-gray-50 p-3 rounded-lg text-sm">
                    {lead.requirements?.description || 'No additional details provided.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Contact Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Engagement Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Views</span>
                </div>
                <span className="font-bold text-blue-700">{lead.views || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Contacts/Unlocks</span>
                </div>
                <span className="font-bold text-purple-700">{lead.contacts || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500">Name:</span> {lead.tenant_info?.name || 'Anonymous'}</p>
              <p><span className="text-gray-500">Email:</span> {lead.tenant_info?.email || 'N/A'}</p>
              <p><span className="text-gray-500">Phone:</span> {lead.tenant_info?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
