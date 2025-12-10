/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { 
  User, Phone, Mail, MapPin, Calendar, Shield, ShieldAlert, 
  Activity, Lock, Unlock, CheckCircle, XCircle, AlertTriangle, FileText, Edit, Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  suspendUser, 
  reactivateUser,
  updateUser,
  softDeleteUser
} from '@/lib/database';
import { resetPassword } from '@/lib/auth-supabase';

export const RenterDetail = ({ renter, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: renter.name || '',
    phone: renter.phone || '',
    location: renter.location || ''
  });

  const handleAction = async (action, ...args) => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    
    setLoading(true);
    try {
      let result;
      if (action === 'suspend') result = await suspendUser(renter.id, ...args);
      if (action === 'reactivate') result = await reactivateUser(renter.id);
      if (action === 'delete') result = await softDeleteUser(renter.id);
      
      if (result.success) {
        alert(`Renter ${action}d successfully`);
        onUpdate(); // Refresh parent list
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateUser(renter.id, editForm);
      if (result.success) {
        alert('Renter profile updated successfully');
        setIsEditing(false);
        onUpdate();
      } else {
        alert('Error updating profile: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!confirm(`Send password reset email to ${renter.email}?`)) return;
    
    setLoading(true);
    try {
      const result = await resetPassword(renter.email);
      if (result.success) {
        alert('Password reset email sent successfully');
      } else {
        alert('Error sending password reset email: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('Error sending password reset email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Edit Renter Profile</h2>
          <Button variant="ghost" onClick={() => setIsEditing(false)} size="sm">Cancel</Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 max-w-2xl">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 text-white w-full sm:w-auto">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="text-gray-600" size="sm">
          ← Back to List
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
            disabled={loading}
            size="sm"
          >
            <Edit className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            onClick={handlePasswordReset}
            variant="outline"
            className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none"
            disabled={loading}
            size="sm"
          >
            <Shield className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reset</span>
          </Button>

          {renter.status === 'suspended' ? (
            <Button
              onClick={() => handleAction('reactivate')}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <Unlock className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reactivate</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                const reason = prompt('Reason for suspension:');
                if (reason) handleAction('suspend', reason);
              }}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-1 sm:flex-none"
              disabled={loading}
              size="sm"
            >
              <Lock className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Suspend</span>
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

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold text-gray-400 flex-shrink-0">
            {renter.avatar ? (
              <img src={renter.avatar} alt={renter.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              renter.name?.charAt(0)
            )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{renter.name}</h2>
                <p className="text-sm text-gray-500">Tenant Account</p>
              </div>
              <div className="flex gap-2">
                <Badge className={
                  renter.status === 'active' ? 'bg-[#FFE4C4] text-green-800' :
                  renter.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {renter.status?.toUpperCase() || 'ACTIVE'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6 text-left">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{renter.email}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" /> {renter.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" /> {renter.location || 'N/A'}
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" /> Joined: {renter.createdAt?.toDate ? renter.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Activity className="w-4 h-4 flex-shrink-0" /> Last Active: {renter.updatedAt?.toDate ? renter.updatedAt.toDate().toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Requests History */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              Posted Requests
            </h3>

            <div className="space-y-3 md:space-y-4">
              {renter.requests?.length > 0 ? (
                renter.requests.map(req => (
                  <div key={req.id} className="border border-gray-100 rounded-lg p-3 md:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 text-sm md:text-base">
                        {req.requirements?.property_type} in {req.requirements?.location}
                      </h4>
                      <Badge className={
                        req.status === 'active' ? 'bg-[#FFE4C4] text-green-800' : 'bg-gray-100 text-gray-600'
                      }>
                        {req.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between text-xs md:text-sm text-gray-500 gap-1">
                      <span>Budget: KSh {req.requirements?.budget?.toLocaleString()}</span>
                      <span>{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm text-gray-500 text-center py-6 md:py-8 bg-gray-50 rounded-lg">
                  No requests posted yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Recent Activity</h3>
            <div className="space-y-3 md:space-y-4">
              {renter.activity?.length > 0 ? (
                renter.activity.map(act => (
                  <div key={act.id} className="flex gap-2 md:gap-3 items-start text-xs md:text-sm border-b border-gray-100 pb-2 md:pb-3 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900 truncate">{act.description || 'User action'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm text-gray-500">No recent activity recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
