'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Loader2, Check, AlertCircle, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import Image from 'next/image';

export const PaymentMethodModal = ({ 
  isOpen, 
  onClose, 
  onSelectMpesa, 
  onSelectPesapal,
  paymentData,
  userPhone,
  loading = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(userPhone || '');
  const [phoneError, setPhoneError] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'phone' | 'processing'

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setStep('select');
      setPhoneNumber(userPhone || '');
      setPhoneError('');
    }
  }, [isOpen, userPhone]);

  if (!isOpen) return null;

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return cleaned.length === 12;
    if (cleaned.startsWith('0')) return cleaned.length === 10;
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) return cleaned.length === 9;
    return false;
  };

  const handleMpesaSelect = () => {
    setSelectedMethod('mpesa');
    setStep('phone');
  };

  const handlePesapalSelect = () => {
    setSelectedMethod('pesapal');
    onSelectPesapal(paymentData);
  };

  const handleMpesaContinue = () => {
    if (!validatePhone(phoneNumber)) {
      setPhoneError('Please enter a valid M-Pesa phone number (e.g., 0712345678)');
      return;
    }
    setPhoneError('');
    setStep('processing');
    onSelectMpesa({ ...paymentData, phoneNumber });
  };

  const formatAmount = (amount) => {
    return `KSh ${parseInt(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== 'select' && (
                <button 
                  onClick={() => setStep('select')} 
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="font-bold text-lg">Choose Payment Method</h3>
                <p className="text-slate-400 text-sm">{formatAmount(paymentData?.amount || paymentData?.price)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-4">
              {/* M-Pesa Option */}
              <button
                onClick={handleMpesaSelect}
                disabled={loading}
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
                  <p className="text-sm text-slate-500">Pay directly from your phone via STK Push</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Pesapal Option */}
              <button
                onClick={handlePesapalSelect}
                disabled={loading}
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
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-lg">Pesapal</span>
                  </div>
                  <p className="text-sm text-slate-500">M-Pesa, Visa, Mastercard, Airtel Money</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 pt-3 text-slate-400 text-xs">
                <Shield className="w-4 h-4" />
                <span>256-bit SSL encrypted payments</span>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100 shadow-sm p-2">
                  <Image
                    src="/mpesa-logo.png"
                    alt="M-Pesa"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <h4 className="font-bold text-lg text-slate-900">Enter M-Pesa Number</h4>
                <p className="text-sm text-slate-500">You will receive an STK Push on this number</p>
              </div>
              
              <div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                  placeholder="e.g., 0712345678"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${phoneError ? 'border-red-400' : 'border-slate-200'} focus:border-[#00A84D] focus:outline-none text-lg font-medium text-center tracking-wider`}
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {phoneError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleMpesaContinue}
                disabled={loading || !phoneNumber}
                className="w-full h-14 bg-[#00A84D] hover:bg-[#008C41] text-white rounded-xl font-bold text-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send STK Push'}
              </Button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#00A84D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-[#00A84D] animate-spin" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Check Your Phone</h4>
              <p className="text-slate-500 mb-4">An M-Pesa payment prompt has been sent to <span className="font-bold">{phoneNumber}</span></p>
              <p className="text-sm text-slate-400">Enter your M-Pesa PIN to complete payment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

