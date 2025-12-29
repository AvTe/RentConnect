'use client';

import React from 'react';
import { XCircle, Home, RefreshCw, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 max-w-md w-full border border-gray-100 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-gray-100">
          <XCircle className="w-12 h-12 text-gray-400 stroke-[2.5]" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Payment Cancelled</h1>
        <p className="text-gray-500 font-medium mb-10 leading-relaxed">
          You decided to cancel the payment process. Your account hasn&apos;t been charged, and no credits were added.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.history.go(-2)}
            className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-gray-900/10"
          >
            <RefreshCw className="w-5 h-5" />
            Restart Purchase
          </button>

          <Link
            href="/"
            className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          <Shield className="w-4 h-4" />
          100% Secure Transaction Layer
        </div>
      </div>
    </div>
  );
}
