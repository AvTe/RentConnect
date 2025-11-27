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
} from '@/lib/firestore';

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Agent Profile</h2>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
              <input
                type="text"
                value={editForm.agencyName}
                onChange={(e) => setEditForm({...editForm, agencyName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="submit" disabled={loading} className="bg-blue-600 text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-gray-600">
          ← Back to List
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            disabled={loading}
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
          
          {agent.status === 'suspended' ? (
            <Button 
              onClick={() => handleAction('reactivate')}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              <Unlock className="w-4 h-4 mr-2" /> Reactivate Account
            </Button>
          ) : (
            <Button 
              onClick={() => {
                const reason = prompt('Reason for suspension:');
                if (reason) handleAction('suspend', reason);
              }}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              disabled={loading}
            >
              <Lock className="w-4 h-4 mr-2" /> Suspend Account
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

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 flex-shrink-0">
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              agent.name?.charAt(0)
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{agent.name}</h2>
                <p className="text-gray-500">{agent.agencyName || 'Independent Agent'}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={
                  agent.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4" /> {agent.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4" /> {agent.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" /> {agent.location || 'N/A'}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" /> Joined: {agent.createdAt?.toDate ? agent.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Activity className="w-4 h-4" /> Role: {agent.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              Verification Details
            </h3>
            
            {agent.verificationStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Verification Pending</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This agent has submitted documents for review. Please check the ID document below.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleAction('approve')}
                      className="bg-green-600 hover:bg-green-700 text-white border-0"
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
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">ID Document</p>
                {agent.idDocumentUrl ? (
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img 
                      src={agent.idDocumentUrl} 
                      alt="ID Document" 
                      className="max-h-64 rounded object-contain mx-auto" 
                    />
                    <div className="mt-2 text-center">
                      <a 
                        href={agent.idDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Full Size
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No document uploaded</div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {agent.transactions?.length > 0 ? (
                agent.transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.type === 'credit_purchase' ? 'Purchased Credits' : 
                         tx.type === 'lead_unlock' ? 'Unlocked Lead' : tx.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <div className={`font-mono font-medium ${
                      tx.type === 'credit_add' || tx.type === 'credit_purchase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'credit_add' || tx.type === 'credit_purchase' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </div>
        </div>

        {/* Wallet & Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Wallet Balance</span>
            </div>
            <div className="text-3xl font-bold mb-6">{agent.walletBalance || 0} Credits</div>
            <Button 
              onClick={handleAddCredits}
              className="w-full bg-white/10 hover:bg-white/20 border-0 text-white"
            >
              + Add Manual Credits
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Unlocks</span>
                <span className="font-semibold">{agent.stats?.unlockedCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Referrals</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
