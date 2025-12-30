import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Shield, Coins, Star, Lock, Smartphone, ArrowRight, Loader2, ShieldCheck, Globe, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';
import { CREDIT_PACKAGES } from '@/lib/pesapal';

const ACCEPTED_LOGOS = [
    { name: 'M-Pesa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/256px-M-PESA_LOGO-01.svg.png', h: 'h-5 sm:h-6' },
    { name: 'Visa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Visa_2021.svg/256px-Visa_2021.svg.png', h: 'h-3 sm:h-4' },
    { name: 'Mastercard', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/256px-Mastercard-logo.svg.png', h: 'h-5 sm:h-6' },
    { name: 'Airtel', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Airtel_logo.svg/256px-Airtel_logo.svg.png', h: 'h-5 sm:h-6' }
];

export const SubscriptionModal = ({ isOpen, onClose, onBuyCredits, currentUser }) => {
    const [step, setStep] = useState('selection'); // 'selection' | 'processing'
    const [selectedPlan, setSelectedPlan] = useState(CREDIT_PACKAGES[2]); // Default to Premium
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setStep('selection');
        } else {
            setMounted(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
    };

    const handleContinue = () => {
        setStep('processing');
        setTimeout(() => {
            onBuyCredits(selectedPlan);
        }, 1500);
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

                <div className="relative z-10 pt-6 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0F172A] bg-slate-800 overflow-hidden ring-1 ring-white/5">
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

                    <div className="grid gap-2.5 max-w-3xl mx-auto">
                        {CREDIT_PACKAGES.map((bundle, i) => (
                            <div
                                key={bundle.id}
                                onClick={() => handlePlanSelect(bundle)}
                                className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${selectedPlan.id === bundle.id
                                    ? 'border-[#FE9200] bg-white ring-4 ring-[#FE9200]/5 z-10 shadow-lg shadow-[#FE9200]/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                    }`}
                                style={{ animationDelay: `${(i + 2) * 100}ms` }}
                            >
                                {selectedPlan.id === bundle.id && (
                                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-[#FE9200]/5 rounded-full pointer-events-none"></div>
                                )}

                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedPlan.id === bundle.id
                                    ? 'border-[#FE9200] bg-[#FE9200]'
                                    : 'border-slate-200 group-hover:border-slate-300'
                                    }`}>
                                    {selectedPlan.id === bundle.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                        <h4 className="font-extrabold text-slate-900 text-[15px] sm:text-[17px] tracking-tight">{bundle.name}</h4>
                                        {(bundle.popular || bundle.isMain) && (
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${bundle.popular ? 'bg-[#FE9200] text-white' : 'bg-slate-900 text-white'
                                                }`}>
                                                {bundle.popular ? 'Popular' : 'Best Scaling'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-500 text-[12px] font-medium leading-none">{bundle.credits} lead unlocks • No expiry</p>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <div className="text-[17px] sm:text-[20px] font-black text-slate-900 tracking-tighter leading-none mb-0.5">KSh {bundle.price.toLocaleString()}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Instant Top-up</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Section: Trust & CTA - Sticky on Mobile */}
                <div className="absolute bottom-0 left-0 right-0 md:relative bg-white/95 backdrop-blur-md border-t border-slate-100 p-6 md:px-10 md:py-6 lg:px-12 z-40">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
                        <div className="hidden lg:flex flex-col sm:flex-row items-center gap-4 sm:gap-8 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4 grayscale brightness-125">
                                {ACCEPTED_LOGOS.map((logo, i) => (
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
                            className="w-full lg:w-auto h-14 min-w-[240px] px-10 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#FE9200]/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                                KSh {selectedPlan.price.toLocaleString()} will be charged
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-12 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300 font-sans">
            <div
                className="relative w-full h-full md:h-auto md:max-h-[850px] max-w-[1100px] bg-white md:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-12 duration-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-hidden">
                    {step === 'selection' ? <SelectionStep /> : <ProcessingStep />}
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
