'use client';
import React, { useState, useEffect } from 'react';
import {
  Mail, Bell, MessageSquare, Plus, Edit2, Trash2, Save, X,
  Check, AlertCircle, Eye, Copy, ChevronDown, ChevronUp, RefreshCw,
  Phone, Target, Clock, CreditCard, ShieldCheck, ShieldX, HelpCircle,
  Headphones, Settings, Loader2, FileText, ToggleLeft, ToggleRight,
  Send, Users, UserCheck, Home, CheckCircle2, Search
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate
} from '@/lib/database';

// Notification types with Lucide icons
const NOTIFICATION_TYPES = [
  { value: 'welcome', label: 'Welcome Email', icon: Mail, color: 'blue' },
  { value: 'new_lead', label: 'New Lead Alert', icon: Target, color: 'orange' },
  { value: 'agent_contact', label: 'Agent Contact', icon: Phone, color: 'emerald' },
  { value: 'subscription_expiry', label: 'Subscription Expiry', icon: Clock, color: 'amber' },
  { value: 'payment', label: 'Payment Confirmation', icon: CreditCard, color: 'purple' },
  { value: 'verification_approved', label: 'Verification Approved', icon: ShieldCheck, color: 'green' },
  { value: 'verification_rejected', label: 'Verification Rejected', icon: ShieldX, color: 'red' },
  { value: 'new_inquiry', label: 'New Inquiry', icon: HelpCircle, color: 'cyan' },
  { value: 'support', label: 'Support Ticket Update', icon: Headphones, color: 'indigo' },
  { value: 'system', label: 'System', icon: Settings, color: 'gray' }
];

// Get color classes for each type
const getTypeColors = (color) => {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' }
  };
  return colors[color] || colors.gray;
};

export const NotificationTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Send notification modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendConfig, setSendConfig] = useState({
    targetType: 'all',
    channels: { email: true, push: true, whatsapp: false },
    variableValues: {},
    confirmed: false,
    selectedUsers: [] // For specific user targeting
  });

  // User selection state
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'system',
    subject: '',
    body: '',
    variables: [],
    sendEmail: true,
    sendPush: true,
    sendWhatsapp: false,
    isActive: true
  });

  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const result = await getNotificationTemplates();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'system',
      subject: '',
      body: '',
      variables: [],
      sendEmail: true,
      sendPush: true,
      sendWhatsapp: false,
      isActive: true
    });
    setEditingTemplate(null);
    setNewVariable('');
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables || [],
        sendEmail: template.send_email,
        sendPush: template.send_push,
        sendWhatsapp: template.send_whatsapp,
        isActive: template.is_active
      });
    } else {
      resetForm();
    }
    setShowModal(true);
    setPreviewMode(false);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable]
      });
      setNewVariable('');
    }
  };

  const removeVariable = (variable) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    });
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-body');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setFormData({
      ...formData,
      body: before + `{{${variable}}}` + after
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (editingTemplate) {
        result = await updateNotificationTemplate(editingTemplate.id, formData);
      } else {
        result = await createNotificationTemplate(formData);
      }

      if (result.success) {
        await fetchTemplates();
        closeModal();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const result = await deleteNotificationTemplate(templateId);
      if (result.success) {
        await fetchTemplates();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const toggleActive = async (template) => {
    try {
      await updateNotificationTemplate(template.id, { isActive: !template.is_active });
      await fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const getPreviewBody = () => {
    let preview = formData.body;
    formData.variables.forEach(v => {
      preview = preview.replace(new RegExp(`{{${v}}}`, 'g'), `<span class="bg-[#FFF2E5] text-[#FE9200] px-1 rounded font-medium">[${v}]</span>`);
    });
    return preview;
  };

  const getTypeInfo = (type) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || { label: type, icon: Mail, color: 'gray' };
  };

  // Open send notification modal
  const openSendModal = (template) => {
    setSendingTemplate(template);
    setSendConfig({
      targetType: 'all',
      channels: {
        email: template.send_email,
        push: template.send_push,
        whatsapp: template.send_whatsapp
      },
      variableValues: {},
      confirmed: false,
      selectedUsers: []
    });
    setSendResult(null);
    setAvailableUsers([]);
    setUserSearchQuery('');
    setUserRoleFilter('all');
    setShowSendModal(true);
  };

  const closeSendModal = () => {
    setShowSendModal(false);
    setSendingTemplate(null);
    setSendResult(null);
    setSendConfig({
      targetType: 'all',
      channels: { email: true, push: true, whatsapp: false },
      variableValues: {},
      confirmed: false,
      selectedUsers: []
    });
    setAvailableUsers([]);
    setUserSearchQuery('');
    setUserRoleFilter('all');
  };

  // Fetch users for specific targeting
  const fetchUsersForSelection = async (role = 'all', search = '') => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('role', role);
      params.set('limit', '100');
      if (search && search.trim()) {
        params.set('search', search.trim());
      }
      const response = await fetch(`/api/admin/users/list?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setAvailableUsers(result.data || []);
      } else {
        console.error('Failed to fetch users:', result.error);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle target type change
  const handleTargetTypeChange = (newType) => {
    setSendConfig({ ...sendConfig, targetType: newType, selectedUsers: [] });
    if (newType === 'specific') {
      // Fetch users based on the previous role filter
      fetchUsersForSelection(userRoleFilter, userSearchQuery);
    }
  };

  // Handle user role filter change (for specific targeting)
  const handleUserRoleFilterChange = (role) => {
    setUserRoleFilter(role);
    fetchUsersForSelection(role, userSearchQuery);
  };

  // Handle user search
  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    // Debounce search
    clearTimeout(window.userSearchTimeout);
    window.userSearchTimeout = setTimeout(() => {
      fetchUsersForSelection(userRoleFilter, query);
    }, 300);
  };

  // Toggle user selection
  const toggleUserSelection = (user) => {
    const isSelected = sendConfig.selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSendConfig({
        ...sendConfig,
        selectedUsers: sendConfig.selectedUsers.filter(u => u.id !== user.id)
      });
    } else {
      setSendConfig({
        ...sendConfig,
        selectedUsers: [...sendConfig.selectedUsers, user]
      });
    }
  };

  // Remove user from selection
  const removeUserFromSelection = (userId) => {
    setSendConfig({
      ...sendConfig,
      selectedUsers: sendConfig.selectedUsers.filter(u => u.id !== userId)
    });
  };

  // Select all visible users
  const selectAllUsers = () => {
    const currentIds = sendConfig.selectedUsers.map(u => u.id);
    const newUsers = availableUsers.filter(u => !currentIds.includes(u.id));
    setSendConfig({
      ...sendConfig,
      selectedUsers: [...sendConfig.selectedUsers, ...newUsers]
    });
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSendConfig({ ...sendConfig, selectedUsers: [] });
  };

  // Get preview with variable substitution
  const getSendPreview = (text) => {
    if (!text || !sendingTemplate) return text;
    let preview = text;
    (sendingTemplate.variables || []).forEach(v => {
      const value = sendConfig.variableValues[v] || `[${v}]`;
      preview = preview.replace(new RegExp(`{{${v}}}`, 'g'), value);
    });
    return preview;
  };

  // Send notification to users
  const handleSendNotification = async () => {
    if (!sendConfig.confirmed) {
      alert('Please confirm that you want to send this notification');
      return;
    }

    // Validate specific user selection
    if (sendConfig.targetType === 'specific' && sendConfig.selectedUsers.length === 0) {
      alert('Please select at least one user to send the notification to');
      return;
    }

    setSendLoading(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: getSendPreview(sendingTemplate.subject),
          body: getSendPreview(sendingTemplate.body),
          channels: sendConfig.channels,
          targetType: sendConfig.targetType,
          specificUserIds: sendConfig.selectedUsers.map(u => u.id),
          variables: sendConfig.variableValues,
          confirm: true
        })
      });

      const result = await response.json();
      setSendResult(result);

      if (result.success) {
        console.log('Notification sent successfully:', result);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setSendResult({ success: false, error: error.message });
    } finally {
      setSendLoading(false);
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Notification Templates</h2>
          <p className="text-sm text-gray-500 font-medium">Manage email, push, and WhatsApp templates</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchTemplates} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={() => openModal()} className="bg-[#FE9200] hover:bg-[#E58300] text-white" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Templates</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{templates.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-600 mt-1">{templates.filter(t => t.is_active).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Push Enabled</p>
            <p className="text-2xl md:text-3xl font-black text-purple-600 mt-1">{templates.filter(t => t.send_push).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</p>
            <p className="text-2xl md:text-3xl font-black text-green-600 mt-1">{templates.filter(t => t.send_whatsapp).length}</p>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Mail size={18} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">All Templates</h3>
            <p className="text-xs text-gray-400">{templates.length} notification templates configured</p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-bold mb-1">No templates found</p>
            <p className="text-gray-500 text-sm">Create your first notification template to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map(template => {
              const typeInfo = getTypeInfo(template.type);
              const TypeIcon = typeInfo.icon;
              const colors = getTypeColors(typeInfo.color);
              const isExpanded = expandedId === template.id;

              return (
                <div key={template.id} className="hover:bg-gray-50/50 transition-colors">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {/* Type Icon */}
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon size={20} className={colors.text} />
                      </div>

                      {/* Template Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900">{template.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                      </div>

                      {/* Channels */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {template.send_email && (
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center" title="Email">
                            <Mail size={14} className="text-blue-600" />
                          </div>
                        )}
                        {template.send_push && (
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center" title="Push">
                            <Bell size={14} className="text-purple-600" />
                          </div>
                        )}
                        {template.send_whatsapp && (
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center" title="WhatsApp">
                            <MessageSquare size={14} className="text-green-600" />
                          </div>
                        )}
                      </div>

                      {/* Status Toggle */}
                      <button
                        onClick={() => toggleActive(template)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${template.is_active
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                      >
                        {template.is_active ? (
                          <>
                            <ToggleRight size={14} />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={14} />
                            Inactive
                          </>
                        )}
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {template.is_active && (
                          <button
                            onClick={() => openSendModal(template)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#FFF2E5] text-[#FE9200]"
                            title="Send Notification"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : template.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-500"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => openModal(template)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-500"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="ml-16 space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subject</p>
                          <p className="text-sm text-gray-700">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Message Body</p>
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                            {template.body}
                          </pre>
                        </div>
                        {template.variables?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Variables</p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map(v => (
                                <code key={v} className="px-2 py-1 bg-[#FFF2E5] text-[#FE9200] rounded-lg text-xs font-medium">
                                  {`{{${v}}}`}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                  {editingTemplate ? <Edit2 className="w-5 h-5 text-[#FE9200]" /> : <Plus className="w-5 h-5 text-[#FE9200]" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </h3>
                  <p className="text-xs text-gray-400">Configure notification settings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${previewMode ? 'bg-[#FE9200] text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <Eye size={18} />
                </button>
                <button onClick={closeModal} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {previewMode ? (
                /* Preview Mode */
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Subject</p>
                    <p className="text-lg font-bold text-gray-900">{formData.subject || '(No subject)'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Body Preview</p>
                    <div
                      className="prose prose-sm max-w-none whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{ __html: getPreviewBody() || '(No content)' }}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Variables shown in orange will be replaced with actual values when sent</span>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Template Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 placeholder-gray-400 font-medium"
                        placeholder="e.g., Welcome Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 font-medium"
                        required
                      >
                        {NOTIFICATION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Subject *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 placeholder-gray-400 font-medium"
                      placeholder="Email subject line"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Message Body *</label>
                    <textarea
                      id="template-body"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] h-40 bg-white text-gray-900 placeholder-gray-400 font-medium"
                      placeholder="Enter the notification message. Use {{variable}} for dynamic content."
                      required
                    />
                    {formData.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-gray-400">Click to insert:</span>
                        {formData.variables.map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="px-2 py-1 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-[#FE9200] rounded-lg text-xs font-medium transition-colors"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Variables</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newVariable}
                        onChange={(e) => setNewVariable(e.target.value.replace(/[^a-z_]/gi, '').toLowerCase())}
                        className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 placeholder-gray-400 font-medium"
                        placeholder="variable_name"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                      />
                      <Button type="button" onClick={addVariable} variant="outline" className="px-4">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                    {formData.variables.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.variables.map(v => (
                          <span key={v} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-medium">
                            {v}
                            <button type="button" onClick={() => removeVariable(v)} className="hover:text-red-600 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Channels</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.sendEmail ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={formData.sendEmail}
                          onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <Mail className={`w-5 h-5 ${formData.sendEmail ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${formData.sendEmail ? 'text-blue-700' : 'text-gray-600'}`}>Email</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.sendPush ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={formData.sendPush}
                          onChange={(e) => setFormData({ ...formData, sendPush: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <Bell className={`w-5 h-5 ${formData.sendPush ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${formData.sendPush ? 'text-purple-700' : 'text-gray-600'}`}>Push</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.sendWhatsapp ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={formData.sendWhatsapp}
                          onChange={(e) => setFormData({ ...formData, sendWhatsapp: e.target.checked })}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                        <MessageSquare className={`w-5 h-5 ${formData.sendWhatsapp ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${formData.sendWhatsapp ? 'text-green-700' : 'text-gray-600'}`}>WhatsApp</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900">Template Status</p>
                      <p className="text-xs text-gray-500">Enable or disable this notification template</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${formData.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                      {formData.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" onClick={closeModal} variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#FE9200] hover:bg-[#E58300] text-white w-full sm:w-auto">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && sendingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#FE9200]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Send Notification</h3>
                  <p className="text-xs text-gray-400">{sendingTemplate.name}</p>
                </div>
              </div>
              <button onClick={closeSendModal} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {sendResult ? (
                /* Result View */
                <div className="space-y-4">
                  <div className={`p-6 rounded-xl ${sendResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      {sendResult.success ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      )}
                      <div>
                        <p className={`font-bold text-lg ${sendResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                          {sendResult.success ? 'Notification Sent!' : 'Failed to Send'}
                        </p>
                        <p className={`text-sm ${sendResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                          {sendResult.message || sendResult.error}
                        </p>
                      </div>
                    </div>
                    {sendResult.stats && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-white p-3 rounded-lg text-center">
                          <p className="text-2xl font-black text-purple-600">{sendResult.stats.push || 0}</p>
                          <p className="text-xs text-gray-500">Push Sent</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                          <p className="text-2xl font-black text-blue-600">{sendResult.stats.email || 0}</p>
                          <p className="text-xs text-gray-500">Emails Sent</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                          <p className="text-2xl font-black text-green-600">{sendResult.stats.whatsapp || 0}</p>
                          <p className="text-xs text-gray-500">WhatsApp Sent</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button onClick={closeSendModal} className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white">
                    Close
                  </Button>
                </div>
              ) : (
                /* Configuration View */
                <>
                  {/* Target Audience */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Target Audience</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => handleTargetTypeChange('all')}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${sendConfig.targetType === 'all' ? 'border-[#FE9200] bg-[#FFF2E5]' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <Users className={`w-4 h-4 ${sendConfig.targetType === 'all' ? 'text-[#FE9200]' : 'text-gray-400'}`} />
                        <span className={`font-medium text-sm ${sendConfig.targetType === 'all' ? 'text-[#FE9200]' : 'text-gray-600'}`}>All Users</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTargetTypeChange('agents')}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${sendConfig.targetType === 'agents' ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <UserCheck className={`w-4 h-4 ${sendConfig.targetType === 'agents' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className={`font-medium text-sm ${sendConfig.targetType === 'agents' ? 'text-emerald-700' : 'text-gray-600'}`}>Agents</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTargetTypeChange('tenants')}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${sendConfig.targetType === 'tenants' ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <Home className={`w-4 h-4 ${sendConfig.targetType === 'tenants' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`font-medium text-sm ${sendConfig.targetType === 'tenants' ? 'text-blue-700' : 'text-gray-600'}`}>Tenants</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTargetTypeChange('specific')}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${sendConfig.targetType === 'specific' ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <Target className={`w-4 h-4 ${sendConfig.targetType === 'specific' ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={`font-medium text-sm ${sendConfig.targetType === 'specific' ? 'text-purple-700' : 'text-gray-600'}`}>Specific</span>
                      </button>
                    </div>
                  </div>

                  {/* Specific User Selection */}
                  {sendConfig.targetType === 'specific' && (
                    <div className="space-y-4">
                      {/* Role filter and search */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUserRoleFilterChange('all')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${userRoleFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUserRoleFilterChange('agent')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${userRoleFilter === 'agent' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            Agents
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUserRoleFilterChange('tenant')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${userRoleFilter === 'tenant' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            Tenants
                          </button>
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full px-4 py-2 pl-10 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] text-sm"
                          />
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      {/* Selected users */}
                      {sendConfig.selectedUsers.length > 0 && (
                        <div className="bg-purple-50 p-3 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-purple-700">{sendConfig.selectedUsers.length} user(s) selected</span>
                            <button type="button" onClick={clearAllSelections} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                              Clear all
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sendConfig.selectedUsers.map(user => (
                              <span key={user.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700">
                                {user.name || user.email}
                                <button type="button" onClick={() => removeUserFromSelection(user.id)} className="text-gray-400 hover:text-red-500">
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* User list */}
                      <div className="border-2 border-gray-100 rounded-xl max-h-48 overflow-y-auto">
                        {usersLoading ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 text-[#FE9200] animate-spin" />
                          </div>
                        ) : availableUsers.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm">
                            {userSearchQuery ? 'No users found matching your search' : 'Click a filter to load users'}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            <div className="px-3 py-2 bg-gray-50 sticky top-0 flex items-center justify-between">
                              <span className="text-xs text-gray-500">{availableUsers.length} users</span>
                              <button type="button" onClick={selectAllUsers} className="text-xs text-[#FE9200] hover:text-[#E58300] font-medium">
                                Select all visible
                              </button>
                            </div>
                            {availableUsers.map(user => {
                              const isSelected = sendConfig.selectedUsers.some(u => u.id === user.id);
                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => toggleUserSelection(user)}
                                  className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-purple-50' : ''}`}
                                >
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                                    {isSelected && <Check size={12} className="text-white" />}
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Unnamed'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'agent' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {user.role}
                                    </span>
                                    {user.verification_status === 'verified' && (
                                      <ShieldCheck size={14} className="text-green-500" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Channels */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Channels</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${sendConfig.channels.email ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={sendConfig.channels.email}
                          onChange={(e) => setSendConfig({ ...sendConfig, channels: { ...sendConfig.channels, email: e.target.checked } })}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <Mail className={`w-5 h-5 ${sendConfig.channels.email ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${sendConfig.channels.email ? 'text-blue-700' : 'text-gray-600'}`}>Email</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${sendConfig.channels.push ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={sendConfig.channels.push}
                          onChange={(e) => setSendConfig({ ...sendConfig, channels: { ...sendConfig.channels, push: e.target.checked } })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <Bell className={`w-5 h-5 ${sendConfig.channels.push ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${sendConfig.channels.push ? 'text-purple-700' : 'text-gray-600'}`}>Push</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${sendConfig.channels.whatsapp ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={sendConfig.channels.whatsapp}
                          onChange={(e) => setSendConfig({ ...sendConfig, channels: { ...sendConfig.channels, whatsapp: e.target.checked } })}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                        <MessageSquare className={`w-5 h-5 ${sendConfig.channels.whatsapp ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${sendConfig.channels.whatsapp ? 'text-green-700' : 'text-gray-600'}`}>WhatsApp</span>
                      </label>
                    </div>
                  </div>

                  {/* Variable Values */}
                  {sendingTemplate.variables?.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Variable Values</label>
                      <div className="space-y-3">
                        {sendingTemplate.variables.map(v => (
                          <div key={v}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{`{{${v}}}`}</label>
                            <input
                              type="text"
                              value={sendConfig.variableValues[v] || ''}
                              onChange={(e) => setSendConfig({
                                ...sendConfig,
                                variableValues: { ...sendConfig.variableValues, [v]: e.target.value }
                              })}
                              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 placeholder-gray-400 font-medium"
                              placeholder={`Enter value for ${v}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Preview</label>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Subject</p>
                        <p className="font-bold text-gray-900">{getSendPreview(sendingTemplate.subject)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Message</p>
                        <pre className="text-sm text-gray-600 whitespace-pre-wrap">{getSendPreview(sendingTemplate.body)}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendConfig.confirmed}
                        onChange={(e) => setSendConfig({ ...sendConfig, confirmed: e.target.checked })}
                        className="w-5 h-5 text-amber-600 rounded mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-amber-800">Confirm Send</p>
                        <p className="text-sm text-amber-700">
                          {sendConfig.targetType === 'specific'
                            ? `I understand this will send notifications to ${sendConfig.selectedUsers.length} selected user(s).`
                            : `I understand this will send notifications to ${sendConfig.targetType === 'all' ? 'all users' : sendConfig.targetType === 'agents' ? 'all agents' : 'all tenants'}.`
                          }
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Warning for specific without selection */}
                  {sendConfig.targetType === 'specific' && sendConfig.selectedUsers.length === 0 && (
                    <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-700">
                      <AlertCircle size={16} />
                      <span className="text-sm">Please select at least one user to send the notification to.</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" onClick={closeSendModal} variant="outline" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendNotification}
                      disabled={sendLoading || !sendConfig.confirmed}
                      className="bg-[#FE9200] hover:bg-[#E58300] text-white w-full sm:w-auto disabled:opacity-50"
                    >
                      {sendLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Notification
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
