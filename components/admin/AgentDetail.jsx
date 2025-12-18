/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { 
  User, Phone, Mail, MapPin, Calendar, Shield, ShieldAlert, 
  CreditCard, Activity, Lock, Unlock, CheckCircle, XCircle, AlertTriangle, Edit, Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  approveAgent, 
  rejectAgent, 
  suspendUser, 
  reactivateUser, 
  addCredits,
  updateUser,
  softDeleteUser
} from '@/lib/database';

export const AgentDetail = ({ agent, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: agent.name || '',
    phone: agent.phone || '',
    agencyName: agent.agencyName || '',
    location: agent.location || ''
  });

  const handleAction = async (action, ...args) => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    
    setLoading(true);
    try {
      let result;
      if (action === 'approve') result = await approveAgent(agent.id);
      if (action === 'reject') result = await rejectAgent(agent.id, ...args);
      if (action === 'suspend') result = await suspendUser(agent.id, ...args);
      if (action === 'reactivate') result = await reactivateUser(agent.id);
      if (action === 'delete') result = await softDeleteUser(agent.id);
      
      if (result.success) {
        alert(`Agent ${action}d successfully`);
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
      const result = await updateUser(agent.id, editForm);
      if (result.success) {
        alert('Agent profile updated successfully');
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

  const handleAddCredits = async () => {
    const amount = prompt('Enter amount of credits to add:');
    if (!amount || isNaN(amount)) return;
    
    const reason = prompt('Enter reason (e.g., Bonus, Refund):', 'Admin Adjustment');
    
    setLoading(true);
    const result = await addCredits(agent.id, parseInt(amount), reason);
    setLoading(false);
    
    if (result.success) {
      alert('Credits added successfully');
      onUpdate();
    } else {
      alert('Error adding credits: ' + result.error);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Edit Agent Profile</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
              <input
                type="text"
                value={editForm.agencyName}
                onChange={(e) => setEditForm({...editForm, agencyName: e.target.value})}
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

          {agent.status === 'suspended' ? (
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
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              agent.name?.charAt(0)
            )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{agent.name}</h2>
                <p className="text-sm text-gray-500">{agent.agencyName || 'Independent Agent'}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center md:justify-end">
                <Badge className={
                  agent.verificationStatus === 'verified' ? 'bg-[#FFE4C4] text-green-800' :
                  agent.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {agent.verificationStatus?.toUpperCase()}
                </Badge>
                {agent.status === 'suspended' && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">SUSPENDED</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6 text-left">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{agent.email}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" /> {agent.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" /> {agent.location || agent.city || 'N/A'}
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" /> Joined: {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                  <Activity className="w-4 h-4 flex-shrink-0" /> Role: {agent.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Verification Section */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              Verification Details
            </h3>

            {agent.verificationStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-start gap-2 md:gap-3">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 text-sm md:text-base">Verification Pending</h4>
                  <p className="text-xs md:text-sm text-yellow-700 mt-1">
                    This agent has submitted documents for review. Please check the ID document below.
                  </p>
                  <div className="flex flex-wrap gap-2 md:gap-3 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAction('approve')}
                      className="bg-[#16A34A] hover:bg-[#15803D] text-white border-0 flex-1 sm:flex-none"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) handleAction('reject', reason);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-700 mb-2">ID Document</p>
                {agent.idDocumentUrl ? (
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img
                      src={agent.idDocumentUrl}
                      alt="ID Document"
                      className="max-h-48 md:max-h-64 rounded object-contain mx-auto"
                    />
                    <div className="mt-2 text-center">
                      <a
                        href={agent.idDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs md:text-sm text-blue-600 hover:underline"
                      >
                        View Full Size
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs md:text-sm text-gray-500 italic">No document uploaded</div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              Recent Activity
            </h3>
            <div className="space-y-3 md:space-y-4">
              {agent.transactions?.length > 0 ? (
                agent.transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-2 md:py-3 border-b border-gray-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                        {tx.type === 'credit_purchase' ? 'Purchased Credits' :
                         tx.type === 'lead_unlock' ? 'Unlocked Lead' :
                         tx.type === 'credit' ? 'Credit Added' :
                         tx.type === 'debit' ? 'Credit Deducted' : tx.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown date'}
                      </p>
                      {tx.reason && (
                        <p className="text-xs text-gray-400 mt-0.5">{tx.reason}</p>
                      )}
                    </div>
                    <div className={`font-mono font-medium text-sm md:text-base flex-shrink-0 ml-2 ${
                      tx.type === 'credit_add' || tx.type === 'credit_purchase' || tx.type === 'credit' ? 'text-[#16A34A]' : 'text-red-600'
                    }`}>
                      {tx.type === 'credit_add' || tx.type === 'credit_purchase' || tx.type === 'credit' ? '+' : '-'}{Math.abs(tx.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </div>

          {/* Recent Lead Unlocks */}
          {agent.recentUnlocks?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <Unlock className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                Recent Lead Unlocks
              </h3>
              <div className="space-y-3">
                {agent.recentUnlocks.map((unlock, idx) => (
                  <div key={idx} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-900">
                        {unlock.lead?.tenant_name || 'Lead'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {unlock.lead?.location || 'Unknown location'} • {unlock.lead?.property_type || 'Property'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {unlock.created_at ? new Date(unlock.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wallet & Stats */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-3 md:mb-4 opacity-80">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium uppercase tracking-wider">Wallet Balance</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{agent.walletBalance || 0} Credits</div>
            <Button
              onClick={handleAddCredits}
              className="w-full bg-white/10 hover:bg-white/20 border-0 text-white text-sm"
            >
              + Add Manual Credits
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Performance</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-gray-600">Total Leads Unlocked</span>
                <span className="font-semibold text-sm md:text-base">{agent.stats?.unlockedCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-gray-600">Properties Listed</span>
                <span className="font-semibold text-sm md:text-base">{agent.stats?.propertiesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-gray-600">Referrals</span>
                <span className="font-semibold text-sm md:text-base">{agent.stats?.referralsCount || 0}</span>
              </div>
              {agent.average_rating > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">Rating</span>
                  <span className="font-semibold text-sm md:text-base">⭐ {agent.average_rating?.toFixed(1)} ({agent.total_ratings || 0})</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Account Details</h3>
            <div className="space-y-2 text-xs md:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Account Status</span>
                <span className={`font-medium ${agent.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {agent.status?.charAt(0).toUpperCase() + agent.status?.slice(1) || 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subscription</span>
                <span className="font-medium text-gray-700">
                  {agent.subscriptionStatus?.charAt(0).toUpperCase() + agent.subscriptionStatus?.slice(1) || 'Free'}
                </span>
              </div>
              {agent.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Verified On</span>
                  <span className="text-gray-700">{new Date(agent.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
              {agent.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Login</span>
                  <span className="text-gray-700">{new Date(agent.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
