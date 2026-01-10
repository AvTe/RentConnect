// Ticket Form Component
// Used by both Tenants and Agents to create support tickets

import React, { useState, useRef } from 'react';
import {
    X, Send, AlertCircle, HelpCircle,
    CreditCard, UserCheck, Zap, Settings,
    Loader2, Paperclip, Image, FileText, Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { createTicket } from '@/lib/ticket-service';
import { useToast } from '@/context/ToastContext';

const categories = [
    { id: 'general', label: 'General Inquiry', icon: HelpCircle, description: 'General questions' },
    { id: 'technical', label: 'Technical Issue', icon: Settings, description: 'Bugs or errors' },
    { id: 'account', label: 'Account & Profile', icon: UserCheck, description: 'Account issues' },
    { id: 'leads', label: 'Leads & Requests', icon: Zap, description: 'Lead issues' },
    { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Billing issues' },
    { id: 'verification', label: 'Verification', icon: AlertCircle, description: 'Documents' },
];

const priorities = [
    { id: 'low', label: 'Low', color: 'text-gray-500 bg-gray-100 border-gray-200' },
    { id: 'medium', label: 'Medium', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'high', label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200' },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const TicketForm = ({ user, userType = 'tenant', onClose, onSuccess }) => {
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        } else if (formData.subject.length < 5) {
            newErrors.subject = 'Subject must be at least 5 characters';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
            newErrors.description = 'Please provide more details (at least 20 characters)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        if (attachments.length + files.length > MAX_FILES) {
            toast.error(`Maximum ${MAX_FILES} files allowed`);
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });

        // Create preview URLs
        const newAttachments = validFiles.map(file => ({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));

        setAttachments(prev => [...prev, ...newAttachments]);
        e.target.value = ''; // Reset input
    };

    const removeAttachment = (index) => {
        setAttachments(prev => {
            const newAttachments = [...prev];
            if (newAttachments[index].preview) {
                URL.revokeObjectURL(newAttachments[index].preview);
            }
            newAttachments.splice(index, 1);
            return newAttachments;
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // Upload attachments first if any
            let uploadedAttachments = [];
            if (attachments.length > 0) {
                const { uploadTicketAttachment } = await import('@/lib/ticket-service');
                const tempId = `temp_${Date.now()}`;

                for (const attachment of attachments) {
                    const uploadResult = await uploadTicketAttachment(attachment.file, tempId);
                    if (uploadResult.success) {
                        uploadedAttachments.push({
                            name: attachment.name,
                            url: uploadResult.url,
                            type: attachment.type,
                            size: attachment.size
                        });
                    }
                }
            }

            const result = await createTicket({
                userId: user.id || user.uid,
                userType: userType,
                subject: formData.subject.trim(),
                description: formData.description.trim(),
                category: formData.category,
                priority: formData.priority,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
            });

            if (result.success) {
                toast.success('Ticket created successfully! We will respond soon.');
                onSuccess?.(result.data);
                onClose?.();
            } else {
                toast.error(result.error || 'Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full sm:rounded-2xl sm:max-w-xl sm:mx-4 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create Support Ticket</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">We usually respond within 24 hours</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
                    {/* Category Selection - Scrollable on mobile */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 sm:p-3 rounded-xl border-2 transition-all whitespace-nowrap ${formData.category === cat.id
                                        ? 'border-[#FE9200] bg-orange-50'
                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                        }`}
                                >
                                    <cat.icon size={16} className={formData.category === cat.id ? 'text-[#FE9200]' : 'text-gray-400'} />
                                    <span className={`text-sm font-medium ${formData.category === cat.id ? 'text-[#FE9200]' : 'text-gray-700'}`}>
                                        {cat.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Brief summary of your issue..."
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none text-sm sm:text-base ${errors.subject
                                ? 'border-red-300 focus:border-red-500 bg-red-50'
                                : 'border-gray-100 focus:border-[#FE9200]'
                                }`}
                        />
                        {errors.subject && (
                            <p className="text-xs sm:text-sm text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.subject}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Please describe your issue in detail..."
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none resize-none text-sm sm:text-base ${errors.description
                                ? 'border-red-300 focus:border-red-500 bg-red-50'
                                : 'border-gray-100 focus:border-[#FE9200]'
                                }`}
                        />
                        <div className="flex items-center justify-between mt-1">
                            {errors.description ? (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {errors.description}
                                </p>
                            ) : <span />}
                            <span className={`text-xs ${formData.description.length < 20 ? 'text-gray-400' : 'text-green-500'}`}>
                                {formData.description.length}/20
                            </span>
                        </div>
                    </div>

                    {/* File Attachments */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Attachments <span className="text-gray-400 font-normal">(optional)</span>
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* File Upload Button */}
                        {attachments.length < MAX_FILES && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#FE9200] hover:bg-orange-50/50 transition-all group"
                            >
                                <Paperclip size={18} className="text-gray-400 group-hover:text-[#FE9200]" />
                                <span className="text-sm text-gray-500 group-hover:text-[#FE9200] font-medium">
                                    Add files (max 5MB each)
                                </span>
                            </button>
                        )}

                        {/* Attached Files */}
                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        {file.preview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={file.preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                <FileText size={18} className="text-gray-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-xs text-gray-400 mt-1">{attachments.length}/{MAX_FILES} files</p>
                            </div>
                        )}
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                        <div className="grid grid-cols-4 gap-2">
                            {priorities.map(pri => (
                                <button
                                    key={pri.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: pri.id })}
                                    className={`py-2.5 px-2 rounded-xl border transition-all text-center ${formData.priority === pri.id
                                        ? `${pri.color} border-current`
                                        : 'border-gray-100 hover:border-gray-200 bg-white text-gray-600'
                                        }`}
                                >
                                    <span className="text-xs sm:text-sm font-semibold">{pri.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Info - Compact */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-[#FE9200] flex items-center justify-center text-white font-bold text-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${userType === 'agent' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {userType}
                        </span>
                    </div>
                </form>

                {/* Footer - Sticky */}
                <div className="sticky bottom-0 flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-gray-100 bg-white">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="hidden sm:flex"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none bg-[#FE9200] hover:bg-[#E58300] h-12 sm:h-11"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Submit Ticket
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
