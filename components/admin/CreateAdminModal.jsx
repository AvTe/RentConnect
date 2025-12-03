'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, UserPlus, Shield, ShieldCheck, ShieldAlert, Send, Info } from 'lucide-react';
import { Button } from '../ui/Button';

// Permission checkbox component
const PermissionCheckbox = ({ permission, checked, onChange, disabled }) => (
  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
    checked 
      ? 'bg-blue-50 border-blue-200' 
      : 'bg-white border-gray-200 hover:border-gray-300'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(permission.name, e.target.checked)}
      disabled={disabled}
      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">
        {permission.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </p>
      {permission.description && (
        <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
      )}
    </div>
  </label>
);

export const CreateAdminModal = ({ isOpen, onClose, onSuccess, currentAdminRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sub_admin',
    customRoleName: '',
    permissions: [],
    teamName: '',
    sendInvite: true,
    customMessage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState({ grouped: {} });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Fetch available permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/admins/permissions');
        const data = await response.json();
        if (data.success) {
          setPermissions(data);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        role: 'sub_admin',
        customRoleName: '',
        permissions: [],
        teamName: '',
        sendInvite: true,
        customMessage: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handlePermissionChange = (permName, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permName]
        : prev.permissions.filter(p => p !== permName)
    }));
  };

  const handleSelectAllCategory = (category, perms) => {
    const categoryPermNames = perms.map(p => p.name);
    const allSelected = categoryPermNames.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermNames.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermNames])]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const roleOptions = [
    { value: 'sub_admin', label: 'Sub Admin', icon: ShieldAlert, description: 'Limited permissions, assigned to specific tasks' },
    { value: 'main_admin', label: 'Main Admin', icon: Shield, description: 'Full permissions except super admin actions', disabled: currentAdminRole !== 'super_admin' },
    { value: 'super_admin', label: 'Super Admin', icon: ShieldCheck, description: 'Complete control over the system', disabled: currentAdminRole !== 'super_admin' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Admin</h2>
              <p className="text-sm text-gray-500">Add a new admin to the dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Role</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.role === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={formData.role === option.value}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        disabled={option.disabled}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${formData.role === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </label>
                  );
                })}
              </div>

              {/* Custom Role Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Role Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.customRoleName}
                  onChange={(e) => setFormData({ ...formData, customRoleName: e.target.value })}
                  placeholder="e.g., Finance Manager, Support Lead"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team / Department (optional)
              </label>
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                placeholder="e.g., Finance, Support, Operations"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            {/* Permissions */}
            {formData.role !== 'super_admin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Permissions</h3>
                  {formData.role === 'super_admin' && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      All permissions included
                    </span>
                  )}
                </div>

                {loadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(permissions.grouped || {}).map(([category, perms]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700 capitalize">{category}</h4>
                          <button
                            type="button"
                            onClick={() => handleSelectAllCategory(category, perms)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {perms.every(p => formData.permissions.includes(p.name)) ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <PermissionCheckbox
                              key={perm.name}
                              permission={perm}
                              checked={formData.permissions.includes(perm.name)}
                              onChange={handlePermissionChange}
                              disabled={formData.role === 'super_admin'}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invite Options */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Invite Options</h3>
              
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.sendInvite}
                  onChange={(e) => setFormData({ ...formData, sendInvite: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Send invite email now</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Admin will receive an email with a link to set their password and access the dashboard
                  </p>
                </div>
                <Send className="w-5 h-5 text-gray-400" />
              </label>

              {formData.sendInvite && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (optional)
                  </label>
                  <textarea
                    value={formData.customMessage}
                    onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                    placeholder="Add a personal message to include in the invite email..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="w-4 h-4" />
              <span>Invite expires in 72 hours</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {formData.sendInvite ? 'Create & Send Invite' : 'Create Admin'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminModal;
