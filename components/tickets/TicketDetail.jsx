// Ticket Detail Component
// Clean, modern conversation-style ticket view

import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Send, Clock, Calendar, Tag, User, Flag,
    CheckCircle, XCircle, Loader2, AlertTriangle,
    MessageCircle, Paperclip, MoreHorizontal, Copy,
    RefreshCw, Image, FileText, X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getTicketById, addTicketReply, updateTicket, subscribeToTicketReplies } from '@/lib/ticket-service';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/utils/supabase/client';

const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', icon: AlertTriangle },
    in_progress: { label: 'In Progress', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700', icon: Clock },
    pending: { label: 'Pending', color: 'bg-violet-500', bgColor: 'bg-violet-50', textColor: 'text-violet-700', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-400', bgColor: 'bg-gray-50', textColor: 'text-gray-600', icon: XCircle }
};

const priorityConfig = {
    low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    medium: { label: 'Medium', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-50' },
    urgent: { label: 'Urgent', color: 'text-red-700', bgColor: 'bg-red-50' }
};

const categoryLabels = {
    general: 'General',
    technical: 'Technical',
    account: 'Account',
    leads: 'Leads',
    payments: 'Payments',
    verification: 'Verification'
};

// Message Bubble Component
const MessageBubble = ({ message, isStaff, isCurrentUser }) => {
    const formatTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const attachments = message.attachments || [];

    return (
        <div className={`flex gap-3 ${isStaff ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar - Only show on left for non-staff */}
            {!isStaff && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
                    {message.user?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={message.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        message.user?.name?.charAt(0) || 'U'
                    )}
                </div>
            )}

            {/* Message Content */}
            <div className={`max-w-[70%] ${isStaff ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 ${isStaff
                    ? 'bg-gradient-to-br from-[#FE9200] to-[#FF6B00] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                    {message.message && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-left">
                            {message.message}
                        </p>
                    )}
                    {/* Display attachments */}
                    {attachments.length > 0 && (
                        <div className={`mt-2 space-y-2 ${message.message ? 'pt-2 border-t border-white/20' : ''}`}>
                            {attachments.map((att, idx) => (
                                <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    {att.type?.startsWith('image/') ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={att.url}
                                            alt={att.name}
                                            className="max-w-full rounded-lg max-h-48 object-cover"
                                        />
                                    ) : (
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isStaff ? 'bg-white/20' : 'bg-gray-200'}`}>
                                            <FileText size={16} />
                                            <span className="text-xs truncate">{att.name}</span>
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                <div className={`flex items-center gap-2 mt-1.5 text-xs text-gray-400 ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-medium">{message.user?.name || 'Unknown'}</span>
                    {isStaff && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-100 text-[#FE9200] text-[10px] font-bold">
                            STAFF
                        </span>
                    )}
                    <span>•</span>
                    <span>{formatTime(message.created_at)}</span>
                </div>
            </div>

            {/* Avatar - Only show on right for staff */}
            {isStaff && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-[#FE9200] to-[#FF6B00] text-white">
                    {message.user?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={message.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        message.user?.name?.charAt(0) || 'S'
                    )}
                </div>
            )}
        </div>
    );
};

// Quick Status Actions
const StatusActions = ({ status, onStatusChange, disabled }) => {
    const actions = [
        { status: 'in_progress', label: 'In Progress', icon: Clock, show: ['open', 'pending'] },
        { status: 'pending', label: 'Pending', icon: Clock, show: ['open', 'in_progress'] },
        { status: 'resolved', label: 'Resolved', icon: CheckCircle, show: ['open', 'in_progress', 'pending'] },
        { status: 'open', label: 'Reopen', icon: AlertTriangle, show: ['resolved', 'closed'] }
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {actions.filter(a => a.show.includes(status)).map(action => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.status}
                        onClick={() => onStatusChange(action.status)}
                        disabled={disabled}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${action.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : action.status === 'open'
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } disabled:opacity-50`}
                    >
                        <Icon size={14} />
                        {action.label}
                    </button>
                );
            })}
        </div>
    );
};

export const TicketDetail = ({ ticket: initialTicket, onBack, currentUser, isAdmin = false }) => {
    const { toast } = useToast();
    const messagesEndRef = useRef(null);
    const [ticket, setTicket] = useState(initialTicket);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    const status = statusConfig[ticket?.status] || statusConfig.open;
    const priority = priorityConfig[ticket?.priority] || priorityConfig.medium;
    const StatusIcon = status.icon;
    const fileInputRef = useRef(null);
    const [attachments, setAttachments] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);

    const fetchTicket = async () => {
        if (!initialTicket?.id) return;
        setLoading(true);
        const result = await getTicketById(initialTicket.id);
        if (result.success) {
            setTicket(result.data);
        }
        setLoading(false);
    };

    // Real-time subscription for live updates
    useEffect(() => {
        if (!initialTicket?.id) return;

        // Subscribe to real-time updates
        const unsubscribe = subscribeToTicketReplies(initialTicket.id, (updatedTicket) => {
            setTicket(updatedTicket);
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, [initialTicket?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.replies]);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingFile(true);
        const newAttachments = [];

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                continue;
            }

            // Create preview for images
            const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
            newAttachments.push({
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                preview
            });
        }

        setAttachments(prev => [...prev, ...newAttachments]);
        setUploadingFile(false);
        e.target.value = '';
    };

    const removeAttachment = (index) => {
        setAttachments(prev => {
            const newArr = [...prev];
            if (newArr[index].preview) {
                URL.revokeObjectURL(newArr[index].preview);
            }
            newArr.splice(index, 1);
            return newArr;
        });
    };

    const handleSendReply = async () => {
        if (!newMessage.trim() && attachments.length === 0) return;

        setSending(true);

        // Upload attachments first
        let uploadedAttachments = [];
        if (attachments.length > 0) {
            const { uploadTicketAttachment } = await import('@/lib/ticket-service');
            for (const attachment of attachments) {
                const uploadResult = await uploadTicketAttachment(attachment.file, ticket.id);
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

        const result = await addTicketReply(ticket.id, {
            userId: currentUser?.id || currentUser?.uid,
            message: newMessage.trim(),
            isStaff: isAdmin,
            attachments: uploadedAttachments
        });

        if (result.success) {
            setNewMessage('');
            setAttachments([]);
            toast.success('Reply sent');
        } else {
            toast.error(result.error || 'Failed to send reply');
        }
        setSending(false);
    };

    const handleStatusChange = async (newStatus) => {
        const result = await updateTicket(ticket.id, { status: newStatus });
        if (result.success) {
            setTicket(prev => ({ ...prev, status: newStatus }));
            toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
        } else {
            toast.error('Failed to update status');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (!ticket) return null;

    const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{ticket.subject}</h1>
                        <p className="text-xs text-gray-500">Ticket #{ticket.id?.slice(-8)?.toUpperCase()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchTicket}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${status.bgColor} ${status.textColor}`}>
                            <StatusIcon size={14} />
                            {status.label}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
                {/* Ticket Info Card */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Meta Info */}
                    <div className="p-4 md:p-5 border-b border-gray-50">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <Calendar size={14} />
                                <span>{formatDate(ticket.created_at)}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <Tag size={14} />
                                <span>{categoryLabels[ticket.category] || 'General'}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${priority.bgColor} ${priority.color}`}>
                                <Flag size={12} />
                                <span className="font-semibold text-xs">{priority.label}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <User size={14} />
                                <span>{ticket.user?.name || 'Unknown'}</span>
                                {ticket.user?.role && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${ticket.user.role === 'agent' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {ticket.user.role === 'agent' ? 'Agent' : 'Tenant'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Original Message */}
                    <div className="p-4 md:p-5 bg-gradient-to-br from-gray-50 to-white">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Original Request
                        </p>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {ticket.message}
                        </p>
                    </div>

                    {/* Quick Actions for Admin */}
                    {isAdmin && (
                        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Quick Actions
                            </p>
                            <StatusActions
                                status={ticket.status}
                                onStatusChange={handleStatusChange}
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-900">
                                Conversation
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                                {ticket.replies?.length || 0}
                            </span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="p-4 md:p-5 space-y-4 max-h-[400px] overflow-y-auto">
                        {(!ticket.replies || ticket.replies.length === 0) ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                    <MessageCircle size={20} className="text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500">No replies yet</p>
                                <p className="text-xs text-gray-400 mt-1">Be the first to respond</p>
                            </div>
                        ) : (
                            ticket.replies.map((reply, index) => (
                                <MessageBubble
                                    key={reply.id || index}
                                    message={reply}
                                    isStaff={reply.is_staff}
                                    isCurrentUser={reply.user_id === (currentUser?.id || currentUser?.uid)}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Input */}
                    {!isResolved ? (
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#FE9200] to-[#FF6B00] flex items-center justify-center text-white text-xs font-bold">
                                    {currentUser?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Write your reply..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-[#FE9200] focus:ring-2 focus:ring-[#FE9200]/20 outline-none transition-all resize-none text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                handleSendReply();
                                            }
                                        }}
                                    />

                                    {/* Attachment preview */}
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {attachments.map((att, idx) => (
                                                <div key={idx} className="relative group">
                                                    {att.preview ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={att.preview} alt={att.name} className="w-16 h-16 rounded-lg object-cover border" />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center">
                                                            <FileText size={20} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => removeAttachment(idx)}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf,.doc,.docx"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingFile}
                                                className="p-2 text-gray-400 hover:text-[#FE9200] hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Attach file"
                                            >
                                                {uploadingFile ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Paperclip size={18} />
                                                )}
                                            </button>
                                            <p className="text-xs text-gray-400">
                                                Ctrl+Enter to send
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleSendReply}
                                            disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                                            className="bg-[#FE9200] hover:bg-[#E58300]"
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    Send Reply
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 border-t border-gray-100 bg-emerald-50/50 text-center">
                            <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
                                <CheckCircle size={18} />
                                <span className="font-semibold">This ticket has been resolved</span>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => handleStatusChange('open')}
                                    className="text-sm font-medium text-[#FE9200] hover:underline"
                                >
                                    Reopen Ticket
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
