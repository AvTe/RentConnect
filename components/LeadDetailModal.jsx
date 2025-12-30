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
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { unlockLead, checkAgentLeadConnection, incrementLeadViews } from '@/lib/database';

export const LeadDetailModal = ({ lead, onClose, currentUser, onUnlock }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lead || !currentUser) return;

        const checkConnection = async () => {
            setLoading(true);
            try {
                if (currentUser.type === 'agent') {
                    const connResult = await checkAgentLeadConnection(lead.id, currentUser.id);
                    setIsUnlocked(connResult.connected || false);

                    // Increment view count when opening detail (Unique only)
                    incrementLeadViews(lead.id, currentUser.id);
                }
            } catch (error) {
                console.error('Error checking lead connection:', error);
            } finally {
                setLoading(false);
            }
        };

        checkConnection();
    }, [lead, currentUser]);

    const handleUnlock = async () => {
        if (!lead || unlocking) return;

        setUnlocking(true);
        try {
            const result = await unlockLead(currentUser.id, lead.id);
            if (result.success) {
                setIsUnlocked(true);
                if (onUnlock) onUnlock(lead);
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

    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative h-14 flex items-center justify-between px-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Lead Details</h3>
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
                            <p className="text-gray-500 font-medium">Checking connection status...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Lead Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-[#FFF5E6] text-[#E58300] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {lead.status || 'Active'}
                                    </span>
                                    <span className="text-gray-400 text-xs">•</span>
                                    <span className="text-gray-400 text-xs">
                                        Posted {new Date(lead.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                    Looking for {lead.property_type || lead.type}
                                </h2>
                            </div>

                            {/* Quick Info Grid - Premium Style */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#F9FAFB] p-5 rounded-[24px] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Budget</p>
                                    <p className="text-xl font-black text-[#FE9200]">
                                        KES {(lead.budget || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-[#F9FAFB] p-5 rounded-[24px] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Location</p>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 min-w-0">
                                        <MapPin className="w-3.5 h-3.5 text-[#FE9200] flex-shrink-0" />
                                        <span className="truncate">{lead.location}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Specs */}
                            <div className="space-y-4">
                                <h4 className="font-black text-gray-900 text-xs uppercase tracking-[0.15em]">Requirements</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Home className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Configuration</p>
                                            <p className="text-sm font-bold text-gray-900">{lead.bedrooms || 1} Bedroom</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Timeline</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {lead.move_in_date ? new Date(lead.move_in_date).toLocaleDateString() : 'Immediate'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {lead.requirements?.additional_requirements && (
                                    <div className="bg-[#FFF9F2] border border-[#FE9200]/10 rounded-2xl p-5">
                                        <p className="text-[10px] font-bold text-[#E58300] uppercase tracking-widest mb-2">Special Notes</p>
                                        <p className="text-sm text-gray-700 leading-relaxed italic">
                                            "{lead.requirements.additional_requirements}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            {isUnlocked ? (
                                <div className="bg-[#E7F7EF] border border-[#2EB170]/20 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#2EB170]/20 flex items-center justify-center text-[#2EB170] font-black text-2xl shadow-sm">
                                            {(lead.tenant_name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="w-2 h-2 rounded-full bg-[#2EB170] animate-pulse"></span>
                                                <p className="text-[10px] font-black text-[#2EB170] uppercase tracking-widest">Contact Unlocked</p>
                                            </div>
                                            <h4 className="font-black text-gray-900 text-xl">{lead.tenant_name}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <Button
                                            onClick={() => window.open(`tel:${lead.tenant_phone || lead.tenant_info?.phone}`, '_self')}
                                            className="flex items-center justify-center gap-2 h-14 bg-white border-2 border-[#2EB170] text-[#2EB170] rounded-2xl font-black text-sm hover:bg-[#E7F7EF] transition-all"
                                        >
                                            <Phone className="w-5 h-5" /> Call Now
                                        </Button>
                                        <Button
                                            onClick={() => window.open(`https://wa.me/${lead.tenant_phone || lead.tenant_info?.whatsapp}`, '_blank')}
                                            className="flex items-center justify-center gap-2 h-14 bg-[#25D366] text-white rounded-2xl font-black text-sm hover:bg-[#128C7E] transition-all"
                                        >
                                            <MessageCircle className="w-5 h-5" /> WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <Button
                                        onClick={handleUnlock}
                                        disabled={unlocking}
                                        className="w-full h-16 bg-gray-900 border-0 hover:bg-black text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 active:scale-95"
                                    >
                                        {unlocking ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        ) : (
                                            <>
                                                <Lock className="w-5 h-5" />
                                                <span>Unlock Lead (1 Credit)</span>
                                            </>
                                        )}
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                            Tenant details will be revealed instantly
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
