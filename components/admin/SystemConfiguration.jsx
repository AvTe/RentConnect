import React, { useState, useEffect } from 'react';
import { 
  Bell, Activity, Plus, Trash2, Edit, Save, X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  getNotificationTemplates, 
  createNotificationTemplate, 
  updateNotificationTemplate, 
  deleteNotificationTemplate,
  getAllActivityLogs
} from '@/lib/database';

export const SystemConfiguration = () => {
  const [activeTab, setActiveTab] = useState('notifications'); // notifications, logs
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Template Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    body: '',
    type: 'email' // email, push, sms
  });

  useEffect(() => {
    if (activeTab === 'notifications') fetchTemplates();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const fetchTemplates = async () => {
    setLoading(true);
    const result = await getNotificationTemplates();
    if (result.success) setTemplates(result.data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    const result = await getAllActivityLogs();
    if (result.success) setLogs(result.data);
    setLoading(false);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (currentTemplate) {
        await updateNotificationTemplate(currentTemplate.id, templateForm);
      } else {
        await createNotificationTemplate(templateForm);
      }
      setIsEditing(false);
      setCurrentTemplate(null);
      setTemplateForm({ name: '', title: '', body: '', type: 'email' });
      fetchTemplates();
    } catch (error) {
      console.error(error);
      alert('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    await deleteNotificationTemplate(id);
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'notifications' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('notifications')}
            className={activeTab === 'notifications' ? 'bg-blue-600 text-white' : ''}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button 
            variant={activeTab === 'logs' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('logs')}
            className={activeTab === 'logs' ? 'bg-blue-600 text-white' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            Activity Logs
          </Button>
        </div>
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCurrentTemplate(null);
              setTemplateForm({ name: '', title: '', body: '', type: 'email' });
              setIsEditing(true);
            }} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Template
            </Button>
          </div>

          {isEditing && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="font-bold mb-4">{currentTemplate ? 'Edit Template' : 'New Template'}</h3>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <input 
                      className="w-full border rounded p-2" 
                      value={templateForm.name}
                      onChange={e => setTemplateForm({...templateForm, name: e.target.value})}
                      placeholder="e.g. Welcome Email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select 
                      className="w-full border rounded p-2"
                      value={templateForm.type}
                      onChange={e => setTemplateForm({...templateForm, type: e.target.value})}
                    >
                      <option value="email">Email</option>
                      <option value="push">Push Notification</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject / Title</label>
                  <input 
                    className="w-full border rounded p-2" 
                    value={templateForm.title}
                    onChange={e => setTemplateForm({...templateForm, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Body Content</label>
                  <textarea 
                    className="w-full border rounded p-2 font-mono text-sm" 
                    value={templateForm.body}
                    onChange={e => setTemplateForm({...templateForm, body: e.target.value})}
                    rows="6"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{{variable}}'} for dynamic content.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 text-white">Save Template</Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{template.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase font-medium">
                      {template.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setCurrentTemplate(template);
                        setTemplateForm({
                          name: template.name,
                          title: template.title,
                          body: template.body,
                          type: template.type
                        });
                        setIsEditing(true);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Subject: {template.title}</p>
                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 font-mono whitespace-pre-wrap">
                    {template.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">System Activity Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center">No logs found</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.user}</td>
                      <td className="px-6 py-4 text-gray-600">{log.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
