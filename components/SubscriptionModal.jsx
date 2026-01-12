import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Zap, Shield, Coins, Star, Lock, Smartphone, ArrowRight, Loader2, ShieldCheck, Globe, CreditCard, Gift, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { getAllCreditBundles } from '@/lib/database';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

const ACCEPTED_LOGOS = [
    { name: 'M-Pesa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/256px-M-PESA_LOGO-01.svg.png', h: 'h-5 sm:h-6' },
    { name: 'Visa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Visa_2021.svg/256px-Visa_2021.svg.png', h: 'h-3 sm:h-4' },
    { name: 'Mastercard', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/256px-Mastercard-logo.svg.png', h: 'h-5 sm:h-6' },
    { name: 'Airtel', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Airtel_logo.svg/256px-Airtel_logo.svg.png', h: 'h-5 sm:h-6' }
];

export const SubscriptionModal = ({ isOpen, onClose, onBuyCredits, currentUser }) => {
    const { toast } = useToast();
    const [step, setStep] = useState('selection'); // 'selection' | 'payment-method' | 'mpesa-phone' | 'processing'
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [merchants, setMerchants] = useState([]);
    const [merchantsLoading, setMerchantsLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setStep('selection');
            fetchBundles();
            fetchMerchants();
        } else {
            setMounted(false);
        }
    }, [isOpen]);

    // Fetch GiftPesa merchants dynamically
    const fetchMerchants = async () => {
        setMerchantsLoading(true);
        try {
            const response = await fetch('/api/giftpesa/merchants');
            const result = await response.json();
            if (result.success && result.data) {
                setMerchants(result.data);
            }
        } catch (error) {
            console.error('Error fetching merchants:', error);
        } finally {
            setMerchantsLoading(false);
        }
    };

    const fetchBundles = async () => {
        setLoading(true);
        try {
            const result = await getAllCreditBundles();
            if (result.success && result.data.length > 0) {
                // Parse features if they are strings
                const parsedBundles = result.data.map(b => ({
                    ...b,
                    features: Array.isArray(b.features) ? b.features : (b.features ? b.features.split(',') : [])
                }));
                // Sort by sort_order first, then by price as fallback
                const sorted = parsedBundles.sort((a, b) => {
                    // If both have sort_order, compare by sort_order
                    const aOrder = a.sort_order !== undefined && a.sort_order !== null ? a.sort_order : 9999;
                    const bOrder = b.sort_order !== undefined && b.sort_order !== null ? b.sort_order : 9999;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    // Fallback to price ascending
                    return parseInt(a.price || 0) - parseInt(b.price || 0);
                });

                setBundles(sorted);
                // Default to first 'popular' plan or the middle one
                const defaultPlan = sorted.find(b => b.popular) || sorted[Math.min(1, sorted.length - 1)];
                setSelectedPlan(defaultPlan);
            }
        } catch (error) {
            console.error('Error loading bundles:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
    };

    const handleContinue = () => {
        if (!selectedPlan) return;
        setStep('payment-method');
    };

    const validatePhone = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('254')) return cleaned.length === 12;
        if (cleaned.startsWith('0')) return cleaned.length === 10;
        if (cleaned.startsWith('7') || cleaned.startsWith('1')) return cleaned.length === 9;
        return false;
    };

    const handleMpesaPayment = async () => {
        if (!validatePhone(phoneNumber)) {
            setPhoneError('Please enter a valid M-Pesa phone number (e.g., 0712345678)');
            return;
        }
        setPhoneError('');
        setStep('processing');

        try {
            const response = await fetch('/api/mpesa/stk-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    amount: parseInt(selectedPlan.price),
                    metadata: {
                        type: 'credit_purchase',
                        agentId: currentUser?.uid || currentUser?.id,
                        credits: selectedPlan.credits,
                        description: `${selectedPlan.credits} Credits Bundle`,
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('M-Pesa payment request sent! Check your phone.');
                pollPaymentStatus(result.checkoutRequestId, result.orderId);
            } else {
                toast.error(result.error || 'Failed to initiate M-Pesa payment');
                setStep('payment-method');
            }
        } catch (error) {
            console.error('M-Pesa payment error:', error);
            toast.error('Failed to process M-Pesa payment');
            setStep('payment-method');
        }
    };

    const handlePesapalPayment = () => {
        setStep('processing');
        setTimeout(() => {
            onBuyCredits(selectedPlan);
        }, 1500);
    };

    const pollPaymentStatus = async (checkoutRequestId, orderId) => {
        let attempts = 0;
        const maxAttempts = 30;

        const poll = async () => {
            try {
                const response = await fetch(`/api/mpesa/query?orderId=${orderId}`);
                const result = await response.json();

                if (result.status === 'completed') {
                    toast.success('Payment successful! Credits added to your wallet.');
                    onClose();
                    return;
                } else if (result.status === 'failed') {
                    toast.error(result.error || 'Payment failed. Please try again.');
                    setStep('payment-method');
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 2000);
                } else {
                    toast.info('Payment is still processing. We\'ll update you once confirmed.');
                    onClose();
                }
            } catch (error) {
                console.error('Error polling payment status:', error);
            }
        };

        poll();
    };

    const SelectionStep = () => (
        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-white">
            {/* Left Sidebar: Brand & Benefits - Hidden on mobile */}
            <div className="hidden md:flex w-[320px] bg-[#0F172A] p-6 sm:p-8 flex flex-col justify-between text-white relative flex-shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-[#FE9200] via-transparent to-transparent rounded-full filter blur-[80px]"></div>
                </div>

                <div className="relative z-10 space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 mb-6">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#FE9200]" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FE9200]">Verified Checkout</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight tracking-tight mb-3">Scale Your Reach.</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Connect with verified tenants actively looking for their next home.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {[
                            { icon: Shield, title: "Secure Payments", desc: "Bank-level encryption protected" },
                            { icon: Globe, title: "Instant Access", desc: "Unlock leads 24/7 immediately" },
                            { icon: CreditCard, title: "Fair Credits", desc: "Refunds for invalid contact info" }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group items-center animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-[#FE9200]/30 transition-colors">
                                    <item.icon className="w-4 h-4 text-[#FE9200]" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-slate-200 tracking-tight">{item.title}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Voucher Reward Section */}
                <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#FE9200] to-[#FF6B00]">
                            <Gift className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-[#FE9200] uppercase tracking-[0.15em]">Bonus Reward</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mb-4">Purchase a bundle & get a chance to win <span className="text-[#FE9200] font-bold">FREE vouchers!</span></p>

                    {/* Animated Brand Logos Carousel */}
                    <div className="overflow-hidden">
                        {merchantsLoading ? (
                            // Loading skeleton
                            <div className="flex gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex-shrink-0 w-11 h-11 bg-white/10 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : merchants.length > 0 ? (
                            <div className="flex gap-2 animate-scroll">
                                {/* Duplicate merchants for infinite scroll effect */}
                                {[...merchants.slice(0, 5), ...merchants.slice(0, 5)].map((merchant, i) => (
                                    <div
                                        key={`${merchant.id}-${i}`}
                                        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                        style={{ backgroundColor: merchant.color || '#FE9200' }}
                                        title={merchant.name}
                                    >
                                        <span className="text-white font-black text-xs">
                                            {merchant.name?.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 text-center">Loading brands...</p>
                        )}
                    </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0F172A] bg-slate-800 overflow-hidden ring-1 ring-white/5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={`https://i.pravatar.cc/100?u=${i + 40}`} alt="Agent" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <span className="text-white">Active Agents</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Section: Plan Selection */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-5 bg-white border-b border-slate-100 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#FE9200]" />
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Secure Checkout</span>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8 lg:px-12 pb-36 md:pb-8">
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Lead Credits</h3>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em]">Select a bundle to top up your wallet</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-2.5 max-w-3xl mx-auto">
                            {bundles.map((bundle, i) => {
                                const isSelected = selectedPlan && selectedPlan.id === bundle.id;
                                const displayTag = bundle.tag || (bundle.popular ? 'Popular' : null);

                                return (
                                    <div
                                        key={bundle.id}
                                        onClick={() => handlePlanSelect(bundle)}
                                        className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${isSelected
                                            ? 'border-[#FE9200] bg-white ring-4 ring-[#FE9200]/5 z-10 shadow-lg shadow-[#FE9200]/10'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                            }`}
                                        style={{ animationDelay: `${(i + 1) * 100}ms` }}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-[#FE9200]/5 rounded-full pointer-events-none"></div>
                                        )}

                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected
                                            ? 'border-[#FE9200] bg-[#FE9200]'
                                            : 'border-slate-200 group-hover:border-slate-300'
                                            }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                <h4 className="font-extrabold text-slate-900 text-[15px] sm:text-[17px] tracking-tight">{bundle.name}</h4>
                                                {displayTag && (
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${displayTag === 'Popular' || bundle.popular ? 'bg-[#FE9200] text-white' : 'bg-slate-900 text-white'
                                                        }`}>
                                                        {displayTag}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-[12px] font-medium leading-none">{bundle.credits} lead unlocks • No expiry</p>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <div className="text-[17px] sm:text-[20px] font-black text-slate-900 tracking-tighter leading-none mb-0.5">KSh {parseInt(bundle.price).toLocaleString()}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{bundle.per_lead || 'Top-up'}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Section: Trust & CTA - Sticky on Mobile */}
                <div className="absolute bottom-0 left-0 right-0 md:relative bg-white/95 backdrop-blur-md border-t border-slate-100 p-6 md:px-10 md:py-6 lg:px-12 z-40">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
                        <div className="hidden lg:flex flex-col sm:flex-row items-center gap-4 sm:gap-8 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4 grayscale brightness-125">
                                {ACCEPTED_LOGOS.map((logo, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={logo.url} alt={logo.name} className={`${logo.h} object-contain`} />
                                ))}
                            </div>
                            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                <Lock className="w-3 h-3" />
                                256-Bit SSL Secure
                            </div>
                        </div>

                        <Button
                            onClick={handleContinue}
                            disabled={!selectedPlan || loading}
                            className="w-full lg:w-auto h-14 min-w-[240px] px-10 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#FE9200]/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Complete Purchase
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Close Button Desktop */}
            <button
                onClick={onClose}
                className="hidden md:flex absolute top-6 right-6 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 transition-all z-[120]"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );

    // Payment Method Selection Step
    const PaymentMethodStep = () => (
        <div className="flex flex-col items-center justify-center py-8 px-6 bg-white h-full min-h-[500px] animate-in fade-in duration-300">
            <button
                onClick={() => setStep('selection')}
                className="absolute top-6 left-6 p-2 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 text-slate-500"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
            </button>

            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Choose Payment Method</h3>
                <p className="text-slate-500">
                    <span className="font-bold">{selectedPlan?.credits} Credits</span> • KSh {selectedPlan ? parseInt(selectedPlan.price).toLocaleString() : '0'}
                </p>
            </div>

            <div className="w-full max-w-md space-y-4">
                {/* M-Pesa Direct Option */}
                <button
                    onClick={() => setStep('mpesa-phone')}
                    className="w-full p-5 rounded-2xl border-2 border-slate-200 hover:border-[#00A84D] hover:bg-[#00A84D]/5 transition-all flex items-center gap-4 group"
                >
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-sm p-2">
                        <Image
                            src="/mpesa-logo.png"
                            alt="M-Pesa"
                            width={56}
                            height={56}
                            className="object-contain"
                        />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-lg">M-Pesa</span>
                            <span className="text-[10px] bg-[#00A84D] text-white px-2 py-0.5 rounded-full font-bold">INSTANT</span>
                        </div>
                        <p className="text-sm text-slate-500">Pay directly via STK Push</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Pesapal Option */}
                <button
                    onClick={handlePesapalPayment}
                    className="w-full p-5 rounded-2xl border-2 border-slate-200 hover:border-[#00529B] hover:bg-[#00529B]/5 transition-all flex items-center gap-4 group"
                >
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-sm p-2">
                        <Image
                            src="/pesapal-logo.png"
                            alt="Pesapal"
                            width={56}
                            height={56}
                            className="object-contain"
                        />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 text-lg">Pesapal</span>
                        <p className="text-sm text-slate-500">M-Pesa, Visa, Mastercard, Airtel</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 pt-3 text-slate-400 text-xs">
                    <Shield className="w-4 h-4" />
                    <span>256-bit SSL encrypted payments</span>
                </div>
            </div>
        </div>
    );

    // M-Pesa Phone Input Step
    const MpesaPhoneStep = () => (
        <div className="flex flex-col items-center justify-center py-8 px-6 bg-white h-full min-h-[500px] animate-in fade-in duration-300">
            <button
                onClick={() => setStep('payment-method')}
                className="absolute top-6 left-6 p-2 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 text-slate-500"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
            </button>

            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm p-3">
                <Image
                    src="/mpesa-logo.png"
                    alt="M-Pesa"
                    width={72}
                    height={72}
                    className="object-contain"
                />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">Enter M-Pesa Number</h3>
            <p className="text-slate-500 mb-6">You will receive an STK Push on this number</p>

            <div className="w-full max-w-sm">
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                    placeholder="e.g., 0712345678"
                    className={`w-full px-4 py-4 rounded-xl border-2 ${phoneError ? 'border-red-400' : 'border-slate-200'} focus:border-[#00A84D] focus:outline-none text-xl font-medium text-center tracking-wider`}
                />
                {phoneError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {phoneError}
                    </p>
                )}

                <Button
                    onClick={handleMpesaPayment}
                    className="w-full h-14 mt-6 bg-[#00A84D] hover:bg-[#008C41] text-white rounded-xl font-bold text-lg"
                >
                    Send STK Push
                </Button>
            </div>
        </div>
    );

    const ProcessingStep = () => (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-6 sm:px-10 text-center animate-in fade-in duration-500 bg-white h-full min-h-[500px] overflow-y-auto">
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-[#FE9200]/5 rounded-full animate-pulse"></div>
                <div className="relative bg-white w-24 h-24 rounded-[32px] shadow-2xl flex items-center justify-center border border-slate-50 ring-1 ring-slate-100">
                    <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin stroke-[2.5]" />
                </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Securing Transaction</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-10 font-bold text-sm">
                Sending STK Push to your phone. Please keep this window open and check your mobile.
            </p>

            <div className="bg-slate-900 rounded-[32px] p-8 text-left max-w-md w-full shadow-2xl shadow-indigo-900/10">
                <div className="flex items-start gap-4">
                    <div className="bg-[#FE9200] p-2.5 rounded-xl shadow-lg shadow-[#FE9200]/20">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">M-Pesa Instructions</h4>
                        <ol className="text-sm text-slate-200 space-y-4 font-bold tracking-tight">
                            <li className="flex gap-3 items-center">
                                <span className="w-5 h-5 bg-white/10 text-white rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black border border-white/10">1</span>
                                Unlock your phone display
                            </li>
                            <li className="flex gap-3 items-center">
                                <span className="w-5 h-5 bg-white/10 text-white rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black border border-white/10">2</span>
                                Enter M-Pesa PIN & Send
                            </li>
                            <li className="flex gap-3 items-center text-[#FE9200]">
                                <span className="w-5 h-5 bg-[#FE9200] text-white rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black">3</span>
                                KSh {selectedPlan ? parseInt(selectedPlan.price).toLocaleString() : '0'} will be charged
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 'selection': return <SelectionStep />;
            case 'payment-method': return <PaymentMethodStep />;
            case 'mpesa-phone': return <MpesaPhoneStep />;
            case 'processing': return <ProcessingStep />;
            default: return <SelectionStep />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-12 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300 font-sans">
            <div
                className="relative w-full h-full md:h-auto md:max-h-[850px] max-w-[1100px] bg-white md:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-12 duration-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-hidden">
                    {renderStep()}
                </div>

                {/* Desktop Micro-Footer */}
                <div className="hidden md:flex bg-slate-50 px-12 py-3 border-t border-slate-100 items-center justify-between text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] opacity-50">
                    <div className="flex items-center gap-3">
                        <Shield className="w-3 h-3" />
                        AES-256 BANK-LEVEL SECURED
                    </div>
                    <div className="flex items-center gap-8">
                        <span>PCI DSS COMPLIANT</span>
                        <span>MPESA CERTIFIED</span>
                        <span>PESAPAL VERIFIED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
