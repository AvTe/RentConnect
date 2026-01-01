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
    AlertCircle,
    Clock,
    Flag,
    PhoneOff,
    UserX,
    HelpCircle,
    Eye,
    Zap,
    Crown,
    Coins,
    FileText
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { Button } from './ui/Button';
import { unlockLead, checkAgentLeadConnection, incrementLeadViews, reportBadLead } from '@/lib/database';
import { useToast } from '@/context/ToastContext';

export const LeadDetailModal = ({ lead, onClose, currentUser, onUnlock, walletBalance, isVerified, onOpenSubscription }) => {
    const { toast, showConfirm } = useToast();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Bad Lead Reporting state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    const reportReasons = [
        { id: 'unreachable', label: 'Number Unreachable', icon: PhoneOff, description: 'Phone is switched off or not answering' },
        { id: 'fake_number', label: 'Fake/Wrong Number', icon: UserX, description: 'Number does not exist or belongs to someone else' },
        { id: 'already_closed', label: 'Already Found House', icon: Home, description: 'Tenant already found accommodation' },
        { id: 'wrong_info', label: 'Incorrect Details', icon: AlertCircle, description: 'Budget, location, or requirements are wrong' },
        { id: 'other', label: 'Other Issue', icon: HelpCircle, description: 'Another problem not listed above' }
    ];

    const handleSubmitReport = async () => {
        if (!reportReason) {
            toast.error('Please select a reason for your report.');
            return;
        }

        setSubmittingReport(true);
        try {
            const userId = currentUser.uid || currentUser.id;
            const result = await reportBadLead(userId, lead.id, reportReason, reportDetails);

            if (result.success) {
                toast.success(result.message || 'Report submitted successfully. Our team will review it.');
                setShowReportModal(false);
                setReportReason('');
                setReportDetails('');
            } else {
                toast.error(result.error || 'Failed to submit report.');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setSubmittingReport(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getRemainingTime = (createdAt) => {
        const expiry = new Date(createdAt).getTime() + (48 * 60 * 60 * 1000);
        const diff = expiry - currentTime.getTime();
        if (diff <= 0) return "EXPIRED";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    useEffect(() => {
        if (!lead || !currentUser) return;

        const checkConnection = async () => {
            setLoading(true);
            try {
                const userId = currentUser.uid || currentUser.id;
                if (currentUser.type === 'agent' || currentUser.role === 'agent') {
                    const connResult = await checkAgentLeadConnection(lead.id, userId);
                    setIsUnlocked(connResult.connected || false);
                    incrementLeadViews(lead.id, userId);
                }
            } catch (error) {
                console.error('Error checking lead connection:', error);
            } finally {
                setLoading(false);
            }
        };

        checkConnection();
    }, [lead, currentUser]);

    const handleUnlock = async (isExclusive = false) => {
        if (!lead || unlocking) return;

        if (!isVerified) {
            toast.error("Your account is pending verification. You cannot unlock leads yet.");
            return;
        }

        const userId = currentUser.uid || currentUser.id;
        const basePrice = lead.base_price || 250;
        const multipliers = [1.0, 1.5, 2.5];
        const currentCost = isExclusive
            ? Math.round(basePrice * 5.0 * 0.85)
            : Math.round(basePrice * (multipliers[lead.claimed_slots || 0] || 2.5));

        if (walletBalance < currentCost) {
            showConfirm(
                `Insufficient credits. You need ${currentCost} credits. Top up now?`,
                () => { if (onOpenSubscription) onOpenSubscription(); }
            );
            return;
        }

        const confirmMsg = isExclusive
            ? `Buy exclusive access for ${currentCost} credits?`
            : `Unlock this lead for ${currentCost} credits?`;

        showConfirm(confirmMsg, async () => {
            setUnlocking(true);
            try {
                const result = await unlockLead(userId, lead.id, isExclusive);
                if (result.success) {
                    setIsUnlocked(true);
                    toast.success(isExclusive ? 'Exclusive access purchased!' : 'Lead unlocked successfully!');
                    if (onUnlock) onUnlock(lead);
                } else {
                    toast.error(result.error || 'Failed to unlock lead');
                }
            } catch (error) {
                console.error('Error unlocking lead:', error);
                toast.error('An error occurred. Please try again.');
            } finally {
                setUnlocking(false);
            }
        });
    };

    if (!lead) return null;

    const timeLeft = getRemainingTime(lead.created_at);
    const isExpired = timeLeft === "EXPIRED";
    const basePrice = lead.base_price || 250;
    const multipliers = [1.0, 1.5, 2.5];
    const currentCost = Math.round(basePrice * (multipliers[lead.claimed_slots || 0] || 2.5));
    const exclusiveCost = Math.round(basePrice * 5.0 * 0.85);

    const propertyType = (lead.property_type || lead.requirements?.property_type || 'Property')
        .toString()
        .replace(/\bBed\b/gi, 'Bedroom')
        .replace(/\bBHK\b/gi, 'Bedroom');

    // Info Row Component
    const InfoRow = ({ icon: Icon, label, value, valueColor = 'text-gray-900' }) => (
        <div className="flex items-start gap-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-sm font-bold ${valueColor} break-words`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isExpired ? 'bg-gray-300' : 'bg-emerald-500 animate-pulse'}`} />
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">Lead Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mb-4" />
                            <p className="text-gray-400 font-medium text-sm">Loading lead details...</p>
                        </div>
                    ) : (
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            {/* Status Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${lead.status === 'paused'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {lead.status === 'paused' ? 'Paused' : 'Active'}
                                </span>
                                {!isExpired && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                                        <Clock size={10} />
                                        {timeLeft} left
                                    </span>
                                )}
                                {isExpired && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500">
                                        Expired
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 leading-tight">
                                Looking for {propertyType}
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Posted {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                            </p>

                            {/* Main Details Section */}
                            <div className="bg-gray-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 border border-gray-100">
                                <div className="divide-y divide-gray-100">
                                    <InfoRow
                                        icon={Coins}
                                        label="Monthly Budget"
                                        value={lead.budget ? `KSh ${parseInt(lead.budget).toLocaleString()}` : 'Not specified'}
                                        valueColor="text-[#FE9200]"
                                    />
                                    <InfoRow
                                        icon={MapPin}
                                        label="Preferred Location"
                                        value={lead.location || 'Not specified'}
                                    />
                                    <InfoRow
                                        icon={Home}
                                        label="Property Type"
                                        value={propertyType}
                                    />
                                    <InfoRow
                                        icon={Calendar}
                                        label="Move-in Timeline"
                                        value={lead.move_in_date ? new Date(lead.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate / Flexible'}
                                    />
                                </div>
                            </div>

                            {/* Statistics Row */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                                        <Eye size={14} />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide">Views</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-black text-gray-900">{lead.views || 0}</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                                        <Users size={14} />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide">Unlocks</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-black text-gray-900">{lead.contacts || 0}</p>
                                </div>
                            </div>

                            {/* Slots Indicator */}
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-gray-100 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Slots</span>
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${i <= (lead.claimed_slots || 0)
                                                    ? 'bg-[#FE9200] text-white'
                                                    : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                {i}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-emerald-600">{lead.claimed_slots || 0}/3</span>
                                    <span className="text-xs text-gray-400 ml-1">filled</span>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            {lead.requirements?.additional_requirements && (
                                <div className="bg-orange-50/50 rounded-xl p-3 sm:p-4 border border-orange-100 mb-4">
                                    <div className="flex items-start gap-2">
                                        <FileText size={16} className="text-[#FE9200] flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Additional Notes</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                &ldquo;{lead.requirements.additional_requirements}&rdquo;
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tenant Section */}
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Posted By</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0 ${isUnlocked
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {(lead.tenant_name || 'T').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                            {isUnlocked ? (lead.tenant_name || 'Tenant') : (lead.tenant_name?.split(' ')[0] || 'Tenant')}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle size={12} className="text-emerald-500" />
                                            <span className="text-[11px] font-medium text-gray-500">Verified Renter</span>
                                        </div>
                                    </div>
                                    {isUnlocked && (
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                                                <Lock size={10} /> Unlocked
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!loading && (
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
                        {isUnlocked ? (
                            <div className="space-y-3">
                                {/* Contact Info */}
                                <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
                                    <Phone size={16} className="text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm font-bold text-gray-900 flex-1">{lead.tenant_phone || lead.phone || 'Contact available'}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => window.open(`tel:${lead.tenant_phone || lead.phone || ''}`, '_self')}
                                        className="h-11 sm:h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-200 transition-all border-0 flex items-center justify-center gap-2"
                                    >
                                        <Phone size={16} /> Call
                                    </Button>
                                    <Button
                                        onClick={() => window.open(`https://wa.me/${(lead.tenant_phone || lead.phone || '').replace(/[^0-9]/g, '')}`, '_blank')}
                                        className="h-11 sm:h-12 bg-[#25D366] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#20BD5A] transition-all border-0 flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={16} /> WhatsApp
                                    </Button>
                                </div>

                                {/* Report Link */}
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="w-full text-center text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors py-2 flex items-center justify-center gap-1.5"
                                >
                                    <Flag size={12} /> Report an issue with this lead
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Primary Unlock Button */}
                                <Button
                                    onClick={() => handleUnlock(false)}
                                    disabled={unlocking || isExpired}
                                    className={`w-full h-12 sm:h-14 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 ${isExpired
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-0'
                                        : 'bg-[#FE9200] text-white hover:bg-[#E68200] border-0 shadow-lg shadow-orange-200/50'
                                        }`}
                                >
                                    {unlocking ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : isExpired ? (
                                        <span>Lead Expired</span>
                                    ) : (
                                        <>
                                            <Zap size={18} />
                                            <span>Unlock · {currentCost} Credits</span>
                                        </>
                                    )}
                                </Button>

                                {/* Secondary Exclusive Button */}
                                {!isExpired && (
                                    <button
                                        onClick={() => handleUnlock(true)}
                                        disabled={unlocking}
                                        className="w-full h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm bg-white text-[#FE9200] border-2 border-[#FE9200] hover:bg-orange-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Crown size={16} className="text-[#FE9200]" />
                                        <span className="text-[#FE9200]">Buy Exclusive Access · {exclusiveCost} Credits</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bad Lead Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                                    <Flag className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Report Bad Lead</h3>
                                    <p className="text-[10px] text-gray-400">Get a refund if verified</p>
                                </div>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                            <p className="text-xs text-gray-500">
                                Select the issue you experienced. If approved, credits will be refunded.
                            </p>

                            <div className="space-y-2">
                                {reportReasons.map((reason) => {
                                    const IconComponent = reason.icon;
                                    return (
                                        <button
                                            key={reason.id}
                                            onClick={() => setReportReason(reason.id)}
                                            className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${reportReason === reason.id
                                                ? 'border-[#FE9200] bg-orange-50/50'
                                                : 'border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${reportReason === reason.id ? 'bg-[#FE9200]/10' : 'bg-gray-50'
                                                }`}>
                                                <IconComponent className={`w-4 h-4 ${reportReason === reason.id ? 'text-[#FE9200]' : 'text-gray-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold ${reportReason === reason.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {reason.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400 truncate">{reason.description}</p>
                                            </div>
                                            {reportReason === reason.id && (
                                                <CheckCircle className="w-4 h-4 text-[#FE9200] flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <textarea
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                placeholder="Additional details (optional)..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FE9200] focus:outline-none focus:ring-2 focus:ring-[#FE9200]/10 text-sm text-gray-700 placeholder-gray-300 resize-none transition-all"
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-4 sm:px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                            <Button
                                onClick={() => setShowReportModal(false)}
                                className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-200 border-0"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitReport}
                                disabled={!reportReason || submittingReport}
                                className={`flex-1 h-11 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-0 ${!reportReason || submittingReport
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                            >
                                {submittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flag className="w-3 h-3" /> Submit</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
