'use client';

import React, { useState } from 'react';
import { X, Loader2, Upload, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const BulkInviteModal = ({ isOpen, onClose, onSuccess, currentAdminRole }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedAdmins, setParsedAdmins] = useState([]);
  const [defaultRole, setDefaultRole] = useState('sub_admin');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [step, setStep] = useState(1); // 1: Input, 2: Preview, 3: Results

  // Parse CSV text
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const admins = [];
    const errors = [];

    lines.forEach((line, index) => {
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      if (parts.length < 2) {
        if (line.trim()) {
          errors.push(`Line ${index + 1}: Invalid format (need at least name and email)`);
        }
        return;
      }

      const [name, email, role] = parts;
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Line ${index + 1}: Invalid email "${email}"`);
        return;
      }

      admins.push({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: role || defaultRole
      });
    });

    return { admins, errors };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    const { admins, errors } = parseCSV(csvText);
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (admins.length === 0) {
      setError('No valid entries found. Please check the format.');
      return;
    }

    if (admins.length > 50) {
      setError('Maximum 50 admins can be invited at once.');
      return;
    }

    // Check for duplicates
    const emails = admins.map(a => a.email);
    const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);
    if (duplicates.length > 0) {
      setError(`Duplicate emails found: ${[...new Set(duplicates)].join(', ')}`);
      return;
    }

    setParsedAdmins(admins);
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admins/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admins: parsedAdmins,
          defaultRole,
          teamName: teamName || null
        })
      });

      const data = await response.json();

      if (!data.success && !data.results) {
        throw new Error(data.error);
      }

      setResults(data.results);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCsvText('');
    setParsedAdmins([]);
    setError('');
    setResults(null);
    setStep(1);
    onClose();
  };

  const handleDone = () => {
    handleClose();
    if (results?.successful?.length > 0) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bulk Invite Admins</h2>
              <p className="text-sm text-gray-500">
                {step === 1 && 'Upload CSV or paste admin list'}
                {step === 2 && `Preview ${parsedAdmins.length} admins`}
                {step === 3 && 'Invite results'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 whitespace-pre-wrap">
                  {error}
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      CSV or TXT file
                    </p>
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or paste data</span>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Admin List
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Name, Email, Role (optional)&#10;John Doe, john@example.com&#10;Jane Smith, jane@example.com, sub_admin"
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format: Name, Email, Role (one per line). Role is optional.
                </p>
              </div>

              {/* Default Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Role
                  </label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                  >
                    <option value="sub_admin">Sub Admin</option>
                    {currentAdminRole === 'super_admin' && (
                      <option value="main_admin">Main Admin</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team / Department (optional)
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g., Support Team"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                {parsedAdmins.length} admin(s) will be invited. They will receive an email to set their password.
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedAdmins.map((admin, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{admin.name}</td>
                        <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {admin.role.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{results.successful?.length || 0}</p>
                  <p className="text-sm text-green-600">Successful</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">{results.failed?.length || 0}</p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {/* Successful */}
              {results.successful?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Successfully Invited
                  </h4>
                  <div className="bg-green-50 rounded-lg p-3 space-y-1">
                    {results.successful.map((admin, index) => (
                      <div key={index} className="text-sm text-green-700">
                        {admin.name} ({admin.email})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed */}
              {results.failed?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Failed
                  </h4>
                  <div className="bg-red-50 rounded-lg p-3 space-y-1">
                    {results.failed.map((item, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {item.email}: {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          {step === 1 && (
            <>
              <p className="text-xs text-gray-500">Max 50 admins per batch</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePreview}
                  disabled={!csvText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Preview
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send {parsedAdmins.length} Invites
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div />
              <Button onClick={handleDone} className="bg-blue-600 hover:bg-blue-700 text-white">
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkInviteModal;
