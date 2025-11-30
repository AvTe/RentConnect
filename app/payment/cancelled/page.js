'use client';

import React from 'react';
import { XCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          You cancelled the payment process. No charges have been made to your account.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button 
            onClick={() => window.history.go(-2)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
