'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  ShieldCheck,
  ShieldAlert,
  Calendar, 
  Clock, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';

export const AdminDetailModal = ({ isOpen, onClose, admin, onEdit }) => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!admin?.id) return;
      
      try {
        setLoadingLogs(true);
        const response = await fetch(`/api/admins/logs?adminId=${admin.id}&limit=10`);
        const data = await response.json();
        if (data.success) {
          setActivityLogs(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    if (isOpen && admin) {
      fetchLogs();
    }
  }, [isOpen, admin]);

  if (!isOpen || !admin) return null;

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
    invited: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Invited' },
    inactive: { color: 'bg-gray-100 text-gray-600', icon: XCircle, label: 'Inactive' },
    suspended: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Suspended' }
  };

  const roleConfig = {
    super_admin: { color: 'bg-purple-100 text-purple-700', icon: ShieldCheck, label: 'Super Admin' },
    main_admin: { color: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Main Admin' },
    sub_admin: { color: 'bg-slate-100 text-slate-700', icon: ShieldAlert, label: 'Sub Admin' }
  };

  const status = statusConfig[admin.status] || statusConfig.inactive;
  const role = roleConfig[admin.role] || roleConfig.sub_admin;
  const StatusIcon = status.icon;
  const RoleIcon = role.icon;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
      }
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get initials for avatar
  const initials = admin.name
    ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = admin.name ? admin.name.charCodeAt(0) % avatarColors.length : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            {admin.avatar ? (
              <img
                src={admin.avatar}
                alt={admin.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl ${avatarColors[colorIndex]} flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg`}>
                {initials}
              </div>
            )}
          </div>
          <div className="absolute -bottom-12 right-6">
            <Button 
              onClick={onEdit}
              variant="outline"
              className="gap-2 bg-white"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-16 px-6 pb-6">
          {/* Name and Status */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{admin.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                <RoleIcon className="w-4 h-4" />
                {admin.custom_role_name || role.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">{admin.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Team</p>
                <p className="text-sm font-medium text-gray-900">
                  {admin.team_name || admin.parent_admin?.name || 'Not assigned'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Last Login</p>
                <p className="text-sm font-medium text-gray-900">
                  {admin.last_login_at ? formatRelativeDate(admin.last_login_at) : 'Never'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(admin.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {admin.role !== 'super_admin' && admin.permissions && admin.permissions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {admin.permissions.map((perm) => (
                  <span 
                    key={perm} 
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                  >
                    {perm.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {admin.role === 'super_admin' && (
            <div className="mb-6 p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-2 text-purple-700">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium">Super Admin has all permissions</span>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h3>
            
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatRelativeDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDetailModal;
