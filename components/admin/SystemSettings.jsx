"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Settings, Save, RefreshCw, Loader2, AlertTriangle, CheckCircle,
    CreditCard, Users, Bell, Shield, Globe, Clock, DollarSign,
    Mail, MessageCircle, Zap, Lock, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getSystemConfig, updateSystemConfig } from '@/lib/database';

export const SystemSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({});
    const [originalConfig, setOriginalConfig] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Configuration sections
    const configSections = [
        {
            id: 'credits',
            title: 'Credit System',
            icon: CreditCard,
            description: 'Configure credit pricing and limits',
            fields: [
                { key: 'base_lead_price', label: 'Base Lead Price (Credits)', type: 'number', default: 250 },
                { key: 'exclusive_multiplier', label: 'Exclusive Multiplier', type: 'number', step: 0.1, default: 5.0 },
                { key: 'slot_multipliers', label: 'Slot Multipliers (comma-separated)', type: 'text', default: '1.0,1.5,2.5' },
                { key: 'max_slots_per_lead', label: 'Max Slots Per Lead', type: 'number', default: 3 },
                { key: 'referral_bonus_credits', label: 'Referral Bonus (Credits)', type: 'number', default: 100 }
            ]
        },
        {
            id: 'leads',
            title: 'Lead Settings',
            icon: Users,
            description: 'Configure lead visibility and expiration',
            fields: [
                { key: 'lead_expiry_hours', label: 'Lead Expiry (Hours)', type: 'number', default: 48 },
                { key: 'lead_boost_duration_hours', label: 'Boost Duration (Hours)', type: 'number', default: 24 },
                { key: 'max_lead_views_before_hide', label: 'Max Views Before Priority Drop', type: 'number', default: 100 },
                { key: 'auto_close_inactive_days', label: 'Auto-Close Inactive (Days)', type: 'number', default: 7 }
            ]
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: Bell,
            description: 'Email and push notification settings',
            fields: [
                { key: 'email_notifications_enabled', label: 'Email Notifications', type: 'toggle', default: true },
                { key: 'sms_notifications_enabled', label: 'SMS Notifications', type: 'toggle', default: false },
                { key: 'new_lead_email_delay_minutes', label: 'New Lead Email Delay (Mins)', type: 'number', default: 5 },
                { key: 'daily_digest_enabled', label: 'Daily Digest Emails', type: 'toggle', default: true },
                { key: 'daily_digest_hour', label: 'Digest Send Hour (24h)', type: 'number', default: 9 }
            ]
        },
        {
            id: 'verification',
            title: 'Agent Verification',
            icon: Shield,
            description: 'Verification requirements and limits',
            fields: [
                { key: 'require_id_verification', label: 'Require ID Verification', type: 'toggle', default: true },
                { key: 'allow_unverified_lead_view', label: 'Unverified Can View Leads', type: 'toggle', default: true },
                { key: 'allow_unverified_unlock', label: 'Unverified Can Unlock Leads', type: 'toggle', default: false },
                { key: 'auto_approve_agents', label: 'Auto-Approve New Agents', type: 'toggle', default: false },
                { key: 'verification_grace_days', label: 'Verification Grace Period (Days)', type: 'number', default: 7 }
            ]
        },
        {
            id: 'payments',
            title: 'Payment Settings',
            icon: DollarSign,
            description: 'Payment gateway configuration',
            fields: [
                { key: 'currency', label: 'Currency', type: 'text', default: 'KES' },
                { key: 'min_topup_amount', label: 'Minimum Top-up (Currency)', type: 'number', default: 500 },
                { key: 'max_topup_amount', label: 'Maximum Top-up (Currency)', type: 'number', default: 100000 },
                { key: 'credits_per_currency_unit', label: 'Credits per Currency Unit', type: 'number', step: 0.01, default: 1.0 },
                { key: 'payment_gateway', label: 'Payment Gateway', type: 'select', options: ['pesapal', 'mpesa', 'stripe'], default: 'pesapal' }
            ]
        },
        {
            id: 'platform',
            title: 'Platform Settings',
            icon: Globe,
            description: 'General platform configuration',
            fields: [
                { key: 'platform_name', label: 'Platform Name', type: 'text', default: 'Yoombaa' },
                { key: 'support_email', label: 'Support Email', type: 'text', default: 'support@yoombaa.com' },
                { key: 'support_phone', label: 'Support Phone', type: 'text', default: '' },
                { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle', default: false },
                { key: 'registration_open', label: 'Registration Open', type: 'toggle', default: true }
            ]
        }
    ];

    // Fetch configuration
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getSystemConfig();
            if (result.success) {
                const configData = result.data || {};
                setConfig(configData);
                setOriginalConfig(configData);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Check for changes
    useEffect(() => {
        setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
    }, [config, originalConfig]);

    // Get field value
    const getFieldValue = (key, defaultValue) => {
        return config[key] !== undefined ? config[key] : defaultValue;
    };

    // Update field
    const updateField = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setSaveSuccess(false);
    };

    // Save configuration
    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            const result = await updateSystemConfig(config);
            if (result.success) {
                setOriginalConfig({ ...config });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert('Error saving: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    // Reset changes
    const handleReset = () => {
        setConfig({ ...originalConfig });
    };

    // Render field based on type
    const renderField = (field) => {
        const value = getFieldValue(field.key, field.default);

        switch (field.type) {
            case 'toggle':
                return (
                    <button
                        onClick={() => updateField(field.key, !value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${value
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                            }`}
                    >
                        {value ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {value ? 'Enabled' : 'Disabled'}
                    </button>
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium bg-white"
                    >
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                    </select>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        step={field.step || 1}
                        value={value}
                        onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#FE9200] outline-none text-sm font-medium"
                    />
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">System Settings</h2>
                    <p className="text-sm text-gray-500 font-medium">Configure platform-wide settings</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={fetchConfig}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    {hasChanges && (
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            className="text-gray-600"
                        >
                            Reset
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 ${hasChanges
                            ? 'bg-[#FE9200] hover:bg-[#E58300] text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        size="sm"
                    >
                        {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : saveSuccess ? (
                            <CheckCircle size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        {saveSuccess ? 'Saved!' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasChanges && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        You have unsaved changes. Don&apos;t forget to save before leaving.
                    </p>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading configuration...</p>
                </div>
            ) : (
                /* Configuration Sections */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {configSections.map((section) => (
                        <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Section Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <section.icon size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{section.title}</h3>
                                    <p className="text-xs text-gray-400">{section.description}</p>
                                </div>
                            </div>

                            {/* Section Fields */}
                            <div className="p-6 space-y-5">
                                {section.fields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                            {field.label}
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <Lock size={18} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900">Danger Zone</h3>
                            <p className="text-xs text-red-500">Irreversible and destructive actions</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-900">Clear All Cache</p>
                            <p className="text-xs text-gray-500">Clear all cached data from the system</p>
                        </div>
                        <Button
                            variant="outline"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            size="sm"
                        >
                            Clear Cache
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-900">Export All Data</p>
                            <p className="text-xs text-gray-500">Download a complete backup of the database</p>
                        </div>
                        <Button
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            size="sm"
                        >
                            Export
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                        <div>
                            <p className="font-bold text-red-900">Reset to Defaults</p>
                            <p className="text-xs text-red-500">Reset all settings to factory defaults</p>
                        </div>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-100"
                            size="sm"
                        >
                            Reset All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
