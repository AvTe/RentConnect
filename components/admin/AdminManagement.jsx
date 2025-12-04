'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Mail,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CreateAdminModal } from './CreateAdminModal';
import { EditAdminModal } from './EditAdminModal';
import { AdminDetailModal } from './AdminDetailModal';
import { BulkInviteModal } from './BulkInviteModal';

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Active' },
    invited: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Invited' },
    inactive: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle, label: 'Inactive' },
    suspended: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Suspended' }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Role badge component
const RoleBadge = ({ role, customRole }) => {
  const roleConfig = {
    super_admin: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: ShieldCheck, label: 'Super Admin' },
    main_admin: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield, label: 'Main Admin' },
    sub_admin: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: ShieldAlert, label: 'Sub Admin' }
  };

  const config = roleConfig[role] || roleConfig.sub_admin;
  const Icon = config.icon;
  const displayLabel = customRole || config.label;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {displayLabel}
    </span>
  );
};

// Admin avatar component
const AdminAvatar = ({ name, avatar, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
      />
    );
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}>
      {initials}
    </div>
  );
};

// Dropdown menu component
const DropdownMenu = ({ admin, onView, onEdit, onResendInvite, onDeactivate, onReactivate, onDelete, currentAdminRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  const canEdit = currentAdminRole === 'super_admin' || 
    (currentAdminRole === 'main_admin' && admin.role === 'sub_admin');
  const canDeactivate = canEdit && admin.status === 'active';
  const canReactivate = canEdit && ['inactive', 'suspended'].includes(admin.status);
  const canResendInvite = canEdit && admin.status === 'invited';
  const canDelete = currentAdminRole === 'super_admin';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => { onView(admin); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            
            {canEdit && (
              <button
                onClick={() => { onEdit(admin); setIsOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}

            {canResendInvite && (
              <button
                onClick={() => { onResendInvite(admin); setIsOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Resend Invite
              </button>
            )}

            {canDeactivate && (
              <button
                onClick={() => { onDeactivate(admin); setIsOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Deactivate
              </button>
            )}

            {canReactivate && (
              <button
                onClick={() => { onReactivate(admin); setIsOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Reactivate
              </button>
            )}

            {canDelete && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { onDelete(admin); setIsOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Confirmation modal component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmVariant = 'danger', loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
            className={confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Stats card component
const StatsCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export const AdminManagement = ({ currentUser }) => {
  // State
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters and pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Confirmation modals
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', admin: null });

  // Current admin info (from the logged-in user)
  const [currentAdminRole, setCurrentAdminRole] = useState('sub_admin');

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admins?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch admins');
      }

      setAdmins(data.data || []);
      setStats(data.stats || {});
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      // Try to determine current admin role
      if (currentUser?.email && data.data) {
        const currentAdminData = data.data.find(a => a.email === currentUser.email);
        if (currentAdminData) {
          setCurrentAdminRole(currentAdminData.role);
        }
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder, currentUser]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Action handlers
  const handleView = (admin) => {
    setSelectedAdmin(admin);
    setShowDetailModal(true);
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleResendInvite = async (admin) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admins/${admin.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      alert('Invite sent successfully!');
      fetchAdmins();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = (admin) => {
    setConfirmModal({
      isOpen: true,
      type: 'deactivate',
      admin,
      title: 'Deactivate Admin',
      message: `Are you sure you want to deactivate ${admin.name}? They will no longer be able to access the admin dashboard.`,
      confirmText: 'Deactivate'
    });
  };

  const handleReactivate = (admin) => {
    setConfirmModal({
      isOpen: true,
      type: 'reactivate',
      admin,
      title: 'Reactivate Admin',
      message: `Are you sure you want to reactivate ${admin.name}? They will regain access to the admin dashboard.`,
      confirmText: 'Reactivate',
      confirmVariant: 'success'
    });
  };

  const handleDelete = (admin) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      admin,
      title: 'Delete Admin',
      message: `Are you sure you want to delete ${admin.name}? This action cannot be undone.`,
      confirmText: 'Delete'
    });
  };

  const handleConfirmAction = async () => {
    const { type, admin } = confirmModal;
    
    try {
      setActionLoading(true);
      let response;

      if (type === 'deactivate') {
        response = await fetch(`/api/admins/${admin.id}/deactivate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deactivate' })
        });
      } else if (type === 'reactivate') {
        response = await fetch(`/api/admins/${admin.id}/deactivate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reactivate' })
        });
      } else if (type === 'delete') {
        response = await fetch(`/api/admins/${admin.id}`, {
          method: 'DELETE'
        });
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setConfirmModal({ isOpen: false, type: '', admin: null });
      fetchAdmins();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admins/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admins-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
      }
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-500 mt-1">Manage main admins, sub-admins, roles, and access.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setShowBulkInviteModal(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Invite
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Admins" value={stats.total || 0} color="bg-blue-500" />
        <StatsCard icon={CheckCircle} label="Active" value={stats.active || 0} color="bg-green-500" />
        <StatsCard icon={Clock} label="Invited" value={stats.invited || 0} color="bg-amber-500" />
        <StatsCard icon={XCircle} label="Inactive" value={stats.inactive || 0} color="bg-gray-500" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-900 min-w-[160px]"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="main_admin">Main Admin</option>
              <option value="sub_admin">Sub Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-900 min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            onClick={fetchAdmins}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Active filters */}
        {(search || roleFilter || statusFilter) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                Search: {search}
                <button onClick={() => setSearch('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {roleFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                Role: {roleFilter.replace('_', ' ')}
                <button onClick={() => setRoleFilter('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p className="font-medium">No admins found</p>
            <p className="text-sm">Try adjusting your filters or create a new admin.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AdminAvatar name={admin.name} avatar={admin.avatar} />
                          <div>
                            <p className="font-medium text-gray-900">{admin.name}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={admin.role} customRole={admin.custom_role_name} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {admin.team_name || admin.parent_admin?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={admin.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(admin.last_login_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu
                          admin={admin}
                          onView={handleView}
                          onEdit={handleEdit}
                          onResendInvite={handleResendInvite}
                          onDeactivate={handleDeactivate}
                          onReactivate={handleReactivate}
                          onDelete={handleDelete}
                          currentAdminRole={currentAdminRole}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {admins.map((admin) => (
                <div key={admin.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AdminAvatar name={admin.name} avatar={admin.avatar} />
                      <div>
                        <p className="font-medium text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                    <DropdownMenu
                      admin={admin}
                      onView={handleView}
                      onEdit={handleEdit}
                      onResendInvite={handleResendInvite}
                      onDeactivate={handleDeactivate}
                      onReactivate={handleReactivate}
                      onDelete={handleDelete}
                      currentAdminRole={currentAdminRole}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <RoleBadge role={admin.role} customRole={admin.custom_role_name} />
                    <StatusBadge status={admin.status} />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Last login: {formatDate(admin.last_login_at)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} admins
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchAdmins();
        }}
        currentAdminRole={currentAdminRole}
      />

      <EditAdminModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedAdmin(null); }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedAdmin(null);
          fetchAdmins();
        }}
        admin={selectedAdmin}
        currentAdminRole={currentAdminRole}
      />

      <AdminDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedAdmin(null); }}
        admin={selectedAdmin}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
      />

      <BulkInviteModal
        isOpen={showBulkInviteModal}
        onClose={() => setShowBulkInviteModal(false)}
        onSuccess={() => {
          setShowBulkInviteModal(false);
          fetchAdmins();
        }}
        currentAdminRole={currentAdminRole}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', admin: null })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminManagement;
