import React, { useState } from 'react';
import { X, Check, Zap, Shield, Coins, Star, Lock, Smartphone, ArrowRight, Loader2, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { CREDIT_PACKAGES } from '@/lib/pesapal';

const ACCEPTED_LOGOS = [
    { name: 'M-Pesa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/256px-M-PESA_LOGO-01.svg.png', h: 'h-6 sm:h-8' },
    { name: 'Airtel Money', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Airtel_logo.svg/256px-Airtel_logo.svg.png', h: 'h-6 sm:h-8' },
    { name: 'Visa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Visa_2021.svg/256px-Visa_2021.svg.png', h: 'h-4 sm:h-5' },
    { name: 'Mastercard', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/256px-Mastercard-logo.svg.png', h: 'h-6 sm:h-8' },
    { name: 'Amex', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/American_Express_logo.svg/256px-American_Express_logo.svg.png', h: 'h-6 sm:h-8' }
];

export const SubscriptionModal = ({ isOpen, onClose, onBuyCredits, currentUser }) => {
    const [step, setStep] = useState('selection'); // 'selection' | 'processing'
    const [selectedPlan, setSelectedPlan] = useState(CREDIT_PACKAGES[1]); // Default to Pro

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
        <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-hidden">
            {/* Left/Top Side: Value Proposition & Trust */}
            <div className="w-full md:w-[320px] bg-[#111827] p-6 sm:p-8 md:p-10 flex flex-col justify-between text-white relative overflow-hidden flex-shrink-0 border-b md:border-b-0 md:border-r border-white/5">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-[#FE9200] to-transparent rounded-full filter blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 mb-6 sm:mb-8 font-mono tracking-tighter">
                        <Star className="w-3.5 h-3.5 text-[#FE9200] fill-[#FE9200]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FE9200]">Verified Service</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-4 tracking-tight">
                        Grow Your Agency Business
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 sm:mb-10 font-medium">
                        Join 2,500+ active agents closing deals faster with verified tenant leads.
                    </p>

                    <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-start gap-4 group">
                            <div className="mt-1 bg-[#FE9200]/20 p-2 rounded-xl group-hover:bg-[#FE9200]/30 transition-colors">
                                <Shield className="w-5 h-5 text-[#FE9200]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight">100% Refund Guarantee</p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Credits refunded if lead details are invalid.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="mt-1 bg-green-500/20 p-2 rounded-xl group-hover:bg-green-500/30 transition-colors">
                                <Lock className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight">Secure Payment Gateway</p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Bank-level 256-bit encryption active.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-8 border-t border-white/10 mt-8 md:mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 overflow-hidden shadow-xl">
                                    <img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                            <span className="text-[#FE9200]">50+ agents</span> bought credits today
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Plan Selection */}
            <div className="flex-1 p-6 sm:p-8 md:p-12 bg-white flex flex-col md:overflow-y-auto">
                <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Get Lead Credits</h3>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest text-[10px]">Instant wallet top-up 24/7</p>
                </div>

                <div className="space-y-4 mb-10">
                    {CREDIT_PACKAGES.map((bundle) => (
                        <div
                            key={bundle.id}
                            onClick={() => handlePlanSelect(bundle)}
                            className={`p-5 sm:p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between group relative ${selectedPlan.id === bundle.id
                                ? 'border-[#FE9200] bg-[#FE9200]/5 shadow-2xl shadow-[#FE9200]/5 scale-[1.02]'
                                : 'border-gray-100 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan.id === bundle.id
                                    ? 'border-[#FE9200] bg-[#FE9200] shadow-lg shadow-[#FE9200]/30'
                                    : 'border-gray-200 group-hover:border-gray-400'
                                    }`}>
                                    {selectedPlan.id === bundle.id && <Check className="w-5 h-5 text-white stroke-[4]" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <h4 className="font-black text-gray-900 text-lg sm:text-xl tracking-tight">{bundle.name}</h4>
                                        {(bundle.popular || bundle.isMain) && (
                                            <span className={`text-[9px] sm:text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm ${bundle.popular ? 'bg-gradient-to-r from-[#FE9200] to-[#E58300] text-white' : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white'
                                                }`}>
                                                {bundle.popular ? 'Best Value' : 'Pro Choice'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 font-bold">{bundle.credits} premium lead unlocks</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter">KSh {bundle.price.toLocaleString()}</div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Single Payment</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TRUST ROW: ACCEPTED PAYMENT METHODS - REPLACES CHOOSE GRID */}
                <div className="mt-auto pt-8 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-3 w-full sm:w-auto text-center sm:text-left">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supported Gateways</h4>
                            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 opacity-80 hover:opacity-100 transition-opacity duration-300 flex-wrap">
                                {ACCEPTED_LOGOS.map((logo, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <img
                                            src={logo.url}
                                            alt={logo.name}
                                            className={`${logo.h} object-contain transition-all cursor-pointer`}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <span className="hidden text-[10px] font-black text-gray-900">{logo.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleContinue}
                            className="w-full sm:w-auto h-16 sm:h-20 px-10 sm:px-14 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-[24px] sm:rounded-[32px] font-black text-xl sm:text-2xl shadow-2xl shadow-[#FE9200]/30 flex items-center justify-center gap-4 group transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                        >
                            Proceed to Pay
                            <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    const ProcessingStep = () => (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-6 sm:px-10 text-center animate-fade-in bg-white h-full min-h-[500px] overflow-y-auto">
            <div className="relative mb-8 sm:mb-12 scale-110 sm:scale-125">
                <div className="absolute inset-0 bg-[#FE9200]/10 rounded-[40px] animate-ping duration-1000"></div>
                <div className="relative bg-white w-24 h-24 sm:w-32 sm:h-32 rounded-[36px] shadow-2xl flex items-center justify-center border border-gray-50">
                    <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-[#FE9200] animate-spin stroke-[3]" />
                </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">Authenticating Secure Link</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-10 font-bold text-sm sm:text-base">
                Connecting to PesaPal. Please have your phone ready for the M-Pesa STK push notification.
            </p>

            <div className="bg-[#1e1b4b] border border-[#312e81] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 text-left max-w-lg w-full shadow-2xl shadow-indigo-900/20">
                <div className="flex items-start gap-5 sm:gap-6">
                    <div className="bg-indigo-600 p-3 sm:p-4 rounded-2xl shadow-lg ring-4 ring-indigo-500/10">
                        <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-black text-white mb-3 tracking-tight uppercase text-[12px] opacity-70">Payment Instructions:</h4>
                        <ol className="text-sm sm:text-base text-indigo-100/90 space-y-4 font-bold tracking-tight">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black">1</span>
                                Unlock your phone and wait for the POP-UP
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black">2</span>
                                Enter M-Pesa PIN and click SEND
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black">3</span>
                                Confirm the KSh {selectedPlan.price.toLocaleString()} payment amount
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
            <div
                className="relative w-full h-full md:h-auto max-w-[1200px] bg-white md:rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-in-up flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header for Mobile only - provides close button and context */}
                <div className="md:hidden flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-[120]">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SECURE CHECKOUT</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl bg-gray-50 text-gray-900 border border-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Close Button Desktop only */}
                {step === 'selection' && (
                    <button
                        onClick={onClose}
                        className="hidden md:flex absolute top-8 right-8 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all z-[110] border border-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <div className="flex-1 overflow-hidden">
                    {step === 'selection' ? <SelectionStep /> : <ProcessingStep />}
                </div>

                {/* Desktop Global Security Footer */}
                <div className="hidden md:flex bg-gray-50 px-12 py-6 border-t border-gray-100 items-center justify-between text-[11px] text-gray-400 font-black uppercase tracking-[0.25em]">
                    <div className="flex items-center gap-4">
                        <Lock className="w-4 h-4 text-[#FE9200]" />
                        AES-256 BANK-LEVEL SECURED
                    </div>
                    <div className="flex items-center gap-10">
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> PCI DSS COMPLIANT</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> MPESA CERTIFIED</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> PESAPAL VERIFIED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
