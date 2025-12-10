import React, { useState } from 'react';
import { 
  MapPin, Calendar, DollarSign, Eye, Phone, Trash2, XCircle, CheckCircle, ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { updateLead, deleteLead } from '@/lib/database';

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
    <div className="space-y-4 md:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="text-gray-600" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {lead.status === 'active' ? (
            <Button
              onClick={() => handleAction('close')}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <XCircle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Close Lead</span>
            </Button>
          ) : (
            <Button
              onClick={() => handleAction('activate')}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <CheckCircle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reactivate</span>
            </Button>
          )}
          <Button
            onClick={() => handleAction('delete')}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
            disabled={loading}
            size="sm"
          >
            <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                  {lead.requirements?.property_type || 'Property Request'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {lead.requirements?.location || 'No location specified'}
                </div>
              </div>
              <Badge className={
                lead.status === 'active' ? 'bg-[#FFE4C4] text-green-800' :
                lead.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }>
                {lead.status?.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
              <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Budget</p>
                <p className="text-base md:text-xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-1" />
                  <span className="truncate">{lead.requirements?.budget?.toLocaleString() || 'N/A'}</span>
                </p>
              </div>
              <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Posted Date</p>
                <p className="text-base md:text-xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-1" />
                  <span className="truncate">{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Requirements</h3>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600">
                <p><span className="font-medium">Bedrooms:</span> {lead.requirements?.bedrooms || 'Any'}</p>
                <p><span className="font-medium">Bathrooms:</span> {lead.requirements?.bathrooms || 'Any'}</p>
                <p><span className="font-medium">Furnishing:</span> {lead.requirements?.furnishing || 'Any'}</p>
                <div className="mt-3 md:mt-4">
                  <span className="font-medium block mb-1">Description:</span>
                  <p className="bg-gray-50 p-2 md:p-3 rounded-lg text-xs md:text-sm">
                    {lead.requirements?.description || 'No additional details provided.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Contact Info */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Engagement Stats</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center p-2 md:p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-xs md:text-sm font-medium text-blue-900">Views</span>
                </div>
                <span className="font-bold text-blue-700 text-sm md:text-base">{lead.views || 0}</span>
              </div>
              <div className="flex justify-between items-center p-2 md:p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span className="text-xs md:text-sm font-medium text-purple-900">Contacts/Unlocks</span>
                </div>
                <span className="font-bold text-purple-700 text-sm md:text-base">{lead.contacts || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Contact Information</h3>
            <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <p><span className="text-gray-500">Name:</span> {lead.tenant_info?.name || lead.name || 'Anonymous'}</p>
              <p className="truncate"><span className="text-gray-500">Email:</span> {lead.tenant_info?.email || lead.email || 'N/A'}</p>
              <p><span className="text-gray-500">Phone:</span> {lead.tenant_info?.phone || lead.phone || lead.whatsapp || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
