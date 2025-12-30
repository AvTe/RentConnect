import React, { useState, useEffect } from 'react';
import {
    X,
    MapPin,
    Home,
    Calendar,
    Phone,
    MessageCircle,
    Lock,
    Users,
    CheckCircle,
    Briefcase,
    Star,
    ExternalLink,
    Loader2,
    Trash2
} from 'lucide-react';
import { Button } from './ui/Button';
import { getLead, getUser, unlockLead, checkAgentLeadConnection, incrementLeadViews } from '@/lib/database';

export const NotificationModal = ({ notification, onClose, currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);

    useEffect(() => {
        if (!notification) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (notification.type === 'new_lead') {
                    const leadId = notification.data?.leadId;
                    const result = await getLead(leadId);
                    if (result.success) {
                        setData(result.data);

                        // Check if agent already unlocked this lead
                        if (currentUser?.type === 'agent') {
                            const connResult = await checkAgentLeadConnection(leadId, currentUser.id);
                            setIsUnlocked(connResult.connected || false);

                            // Track view (Unique only)
                            incrementLeadViews(leadId, currentUser.id);
                        }
                    }
                } else if (notification.type === 'agent_contact' || notification.type === 'agent_interested') {
                    const agentId = notification.data?.agentId || notification.user_id; // Depends on how data is structured
                    // For tenant receiving notification about an agent, notification.data.agentId should be present
                    const targetId = notification.data?.agentId;
                    if (targetId) {
                        const result = await getUser(targetId);
                        if (result.success) {
                            setData(result.data);
                        }
                    }
                } else {
                    // General notification
                    setData(notification);
                }
            } catch (error) {
                console.error('Error fetching notification detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [notification, currentUser]);

    const handleUnlock = async () => {
        if (!data || unlocking) return;

        setUnlocking(true);
        try {
            const result = await unlockLead(currentUser.id, data.id);
            if (result.success) {
                setIsUnlocked(true);
            } else {
                alert(result.error || 'Failed to unlock lead');
            }
        } catch (error) {
            console.error('Error unlocking lead:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setUnlocking(false);
        }
    };

    if (!notification) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative h-14 flex items-center justify-between px-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Notification Detail</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading details...</p>
                        </div>
                    ) : !data ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Could not load details for this notification.</p>
                        </div>
                    ) : (
                        <>
                            {notification.type === 'new_lead' && (
                                <div className="space-y-6">
                                    {/* Lead Header */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-[#FFF5E6] text-[#E58300] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                New Lead
                                            </span>
                                            <span className="text-gray-400 text-xs">•</span>
                                            <span className="text-gray-400 text-xs">
                                                {new Date(data.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900">
                                            Looking for {data.property_type || data.type}
                                        </h2>
                                    </div>

                                    {/* Quick Info Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Budget</p>
                                            <p className="text-lg font-black text-[#FE9200]">
                                                KES {(data.budget || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Location</p>
                                            <p className="text-sm font-bold text-gray-900 flex items-center gap-1 min-w-0">
                                                <MapPin className="w-3 h-3 text-[#FE9200] flex-shrink-0" />
                                                <span className="truncate">{data.location}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Requirements List */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900 text-sm">Detailed Requirements</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Home className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {data.bedrooms || 1} Bedroom {data.property_type || data.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    Move-in: {data.move_in_date ? new Date(data.move_in_date).toLocaleDateString() : 'Immediate'}
                                                </span>
                                            </div>
                                        </div>

                                        {data.requirements?.additional_requirements && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                                <p className="text-xs text-blue-700 leading-relaxed">
                                                    &quot;{data.requirements.additional_requirements}&quot;
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tenant Info (If unlocked) */}
                                    {isUnlocked ? (
                                        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xl">
                                                    {(data.tenant_name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-green-600 uppercase">Tenant Contact Details</p>
                                                    <h4 className="font-bold text-gray-900 text-lg">{data.tenant_name}</h4>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <a
                                                    href={`tel:${data.tenant_phone || data.tenant_info?.phone}`}
                                                    className="flex items-center justify-center gap-2 py-3 bg-white border border-green-200 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                                                >
                                                    <Phone className="w-4 h-4" /> Call
                                                </a>
                                                <a
                                                    href={`https://wa.me/${data.tenant_phone || data.tenant_info?.whatsapp}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:bg-[#128C7E] transition-colors"
                                                >
                                                    <MessageCircle className="w-4 h-4" /> WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-4">
                                            <Button
                                                onClick={handleUnlock}
                                                disabled={unlocking}
                                                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                                            >
                                                {unlocking ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Lock className="w-5 h-5" />
                                                        Unlock Lead (1 Credit)
                                                    </>
                                                )}
                                            </Button>
                                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3">
                                                Unlock to see contact info and call the tenant
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(notification.type === 'agent_contact' || notification.type === 'agent_interested') && (
                                <div className="space-y-6 text-center">
                                    {/* Agent Profile */}
                                    <div className="relative inline-block mx-auto">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-[#FFF5E6] border-4 border-white shadow-lg flex items-center justify-center text-[#FE9200] text-4xl md:text-5xl font-black">
                                            {data.avatar ? (
                                                <img src={data.avatar} alt={data.name} className="w-full h-full rounded-[40px] object-cover" />
                                            ) : (
                                                (data.name || 'A').charAt(0)
                                            )}
                                        </div>
                                        {data.verificationStatus === 'verified' && (
                                            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-lg">
                                                <CheckCircle className="w-8 h-8 text-[#FE9200] fill-[#FE9200] border-4 border-white rounded-full" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 mb-1">{data.name}</h2>
                                        <p className="text-gray-500 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            {data.agencyName || 'Independent Agent'}
                                        </p>
                                    </div>

                                    {/* Bio */}
                                    {data.bio && (
                                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                                            &quot;{data.bio}&quot;
                                        </p>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                        <div className="bg-gray-50 p-3 rounded-2xl">
                                            <div className="flex items-center justify-center gap-1 text-[#FE9200] mb-0.5">
                                                <Star className="w-3.5 h-3.5 fill-[#FE9200]" />
                                                <span className="font-bold text-sm">4.8</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Rating</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-2xl">
                                            <p className="font-bold text-sm text-gray-900">{data.experience || '3+ years'}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Exp</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 pt-4">
                                        <Button
                                            onClick={() => window.open(`tel:${data.phone}`, '_self')}
                                            className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" /> Call Agent
                                        </Button>
                                        <Button
                                            onClick={() => window.open(`https://wa.me/${data.phone}`, '_blank')}
                                            variant="outline"
                                            className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> WhatsApp Message
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Default fallback for other notification types */}
                            {notification.type !== 'new_lead' &&
                                notification.type !== 'agent_contact' &&
                                notification.type !== 'agent_interested' && (
                                    <div className="space-y-6">
                                        <div className="w-20 h-20 bg-[#FFF5E6] rounded-3xl flex items-center justify-center mx-auto text-[#FE9200]">
                                            <Users className="w-10 h-10" />
                                        </div>
                                        <div className="text-center">
                                            <h2 className="text-xl font-black text-gray-900 mb-2">{notification.title}</h2>
                                            <p className="text-gray-500 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={onClose}
                                            className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold"
                                        >
                                            Got it
                                        </Button>
                                    </div>
                                )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
