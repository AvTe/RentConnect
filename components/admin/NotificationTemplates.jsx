'use client';
import React, { useState, useEffect } from 'react';
import { 
  Mail, Bell, MessageSquare, Plus, Edit2, Trash2, Save, X, 
  Check, AlertCircle, Eye, Copy, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate
} from '@/lib/database';

const NOTIFICATION_TYPES = [
  { value: 'welcome', label: 'Welcome', icon: '👋' },
  { value: 'new_lead', label: 'New Lead', icon: '🎯' },
  { value: 'agent_contact', label: 'Agent Contact', icon: '📞' },
  { value: 'subscription_expiry', label: 'Subscription Expiry', icon: '⏰' },
  { value: 'payment', label: 'Payment', icon: '💳' },
  { value: 'verification_approved', label: 'Verification Approved', icon: '✅' },
  { value: 'verification_rejected', label: 'Verification Rejected', icon: '❌' },
  { value: 'new_inquiry', label: 'New Inquiry', icon: '❓' },
  { value: 'support', label: 'Support', icon: '🎧' },
  { value: 'system', label: 'System', icon: '⚙️' }
];

export const NotificationTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getPreviewBody = () => {
    let preview = formData.body;
    formData.variables.forEach(v => {
      preview = preview.replace(new RegExp(`{{${v}}}`, 'g'), `<span class="bg-yellow-200 px-1 rounded">[${v}]</span>`);
    });
    return preview;
  };

  const getTypeInfo = (type) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || { label: type, icon: '📧' };
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Notification Templates</h2>
          <p className="text-sm text-gray-600 mt-1">Manage email, push, and WhatsApp templates</p>
        </div>
        <Button onClick={() => openModal()} className="bg-blue-600 text-white w-full sm:w-auto" size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg">
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{templates.length}</p>
              <p className="text-xs md:text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-50 rounded-lg">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{templates.filter(t => t.is_active).length}</p>
              <p className="text-xs md:text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-purple-50 rounded-lg">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{templates.filter(t => t.send_push).length}</p>
              <p className="text-xs md:text-sm text-gray-500">Push</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-50 rounded-lg">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{templates.filter(t => t.send_whatsapp).length}</p>
              <p className="text-xs md:text-sm text-gray-500">WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Template</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map(template => {
                const typeInfo = getTypeInfo(template.type);
                const isExpanded = expandedId === template.id;

                return (
                  <React.Fragment key={template.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : template.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <div>
                            <p className="font-medium text-gray-900">{template.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{template.subject}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {template.send_email && (
                            <span className="p-1 bg-blue-100 rounded" title="Email">
                              <Mail className="w-4 h-4 text-blue-600" />
                            </span>
                          )}
                          {template.send_push && (
                            <span className="p-1 bg-purple-100 rounded" title="Push">
                              <Bell className="w-4 h-4 text-purple-600" />
                            </span>
                          )}
                          {template.send_whatsapp && (
                            <span className="p-1 bg-green-100 rounded" title="WhatsApp">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleActive(template)}>
                          <Badge variant={template.is_active ? 'success' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal(template)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Subject:</p>
                              <p className="text-sm text-gray-600">{template.subject}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Body:</p>
                              <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded-lg border">
                                {template.body}
                              </pre>
                            </div>
                            {template.variables?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Variables:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {template.variables.map(v => (
                                    <code key={v} className="px-2 py-1 bg-yellow-100 rounded text-xs">
                                      {`{{${v}}}`}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No notification templates found. Create your first template!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No templates found. Create your first template!</p>
            </div>
          ) : (
            templates.map(template => {
              const typeInfo = getTypeInfo(template.type);
              const isExpanded = expandedId === template.id;

              return (
                <div key={template.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      className="flex items-start gap-2 text-left flex-1 min-w-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 mt-1 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 mt-1 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{template.name}</p>
                        <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openModal(template)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs">
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </span>
                    <div className="flex gap-1">
                      {template.send_email && (
                        <span className="p-1 bg-blue-100 rounded">
                          <Mail className="w-3 h-3 text-blue-600" />
                        </span>
                      )}
                      {template.send_push && (
                        <span className="p-1 bg-purple-100 rounded">
                          <Bell className="w-3 h-3 text-purple-600" />
                        </span>
                      )}
                      {template.send_whatsapp && (
                        <span className="p-1 bg-green-100 rounded">
                          <MessageSquare className="w-3 h-3 text-green-600" />
                        </span>
                      )}
                    </div>
                    <button onClick={() => toggleActive(template)}>
                      <Badge variant={template.is_active ? 'success' : 'secondary'} className="text-xs">
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Subject:</p>
                        <p className="text-sm text-gray-700">{template.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Body:</p>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded-lg mt-1 max-h-32 overflow-y-auto">
                          {template.body}
                        </pre>
                      </div>
                      {template.variables?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Variables:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.variables.map(v => (
                              <code key={v} className="px-1.5 py-0.5 bg-yellow-100 rounded text-xs">
                                {`{{${v}}}`}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-2 rounded-lg ${previewMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
              {previewMode ? (
                /* Preview Mode */
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <p className="text-xs md:text-sm font-medium text-gray-500 mb-1">Subject</p>
                    <p className="text-base md:text-lg font-semibold text-gray-900">{formData.subject || '(No subject)'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <p className="text-xs md:text-sm font-medium text-gray-500 mb-2">Body Preview</p>
                    <div
                      className="prose prose-sm max-w-none whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{ __html: getPreviewBody() || '(No content)' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Variables shown in yellow will be replaced with actual values when sent</span>
                  </p>
                </div>
              ) : (
                /* Edit Mode */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Welcome Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        required
                      >
                        {NOTIFICATION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="Email subject line"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Body *</label>
                    <textarea
                      id="template-body"
                      value={formData.body}
                      onChange={(e) => setFormData({...formData, body: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 md:h-40 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="Enter the notification message. Use {{variable}} for dynamic content."
                      required
                    />
                    {formData.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500">Click to insert:</span>
                        {formData.variables.map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="px-2 py-0.5 bg-yellow-100 hover:bg-yellow-200 rounded text-xs"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variables</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newVariable}
                        onChange={(e) => setNewVariable(e.target.value.replace(/[^a-z_]/gi, '').toLowerCase())}
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                        placeholder="variable_name"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                      />
                      <Button type="button" onClick={addVariable} className="bg-gray-100 text-gray-700 px-3">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.variables.map(v => (
                          <span key={v} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs md:text-sm">
                            {v}
                            <button type="button" onClick={() => removeVariable(v)} className="hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Channels</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.sendEmail}
                          onChange={(e) => setFormData({...formData, sendEmail: e.target.checked})}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.sendPush}
                          onChange={(e) => setFormData({...formData, sendPush: e.target.checked})}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <Bell className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Push</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.sendWhatsapp}
                          onChange={(e) => setFormData({...formData, sendWhatsapp: e.target.checked})}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">WhatsApp</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Template is active</span>
                    </label>
                  </div>
                </>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <Button type="button" onClick={closeModal} className="bg-gray-100 text-gray-700 w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 text-white w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
