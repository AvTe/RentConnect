'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Home, ArrowRight, Smartphone, ShieldCheck, Zap, Star, Gift, Share2, Receipt } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { createUserSubscription, updateUser, addAgentCredits } from '@/lib/database';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const verifyAndProcessPayment = async () => {
      // Prevent double processing
      if (processedRef.current) return;

      const orderTrackingId = searchParams.get('OrderTrackingId');
      const orderRef = searchParams.get('ref');

      if (!orderTrackingId && !orderRef) {
        setStatus('error');
        setError('Missing payment reference');
        return;
      }

      processedRef.current = true;

      try {
        const response = await fetch('/api/pesapal/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderTrackingId,
            orderRef
          })
        });

        const result = await response.json();

        if (!result.success) {
          if (result.status === 'pending' || result.statusCode === 0) {
            setStatus('pending');
          } else if (result.alreadyProcessed) {
            triggerSuccess();
            setPaymentData({ message: 'Payment confirmed and credited.' });
          } else {
            setStatus('failed');
            setError(result.error || 'Payment verification failed');
          }
          return;
        }

        // Payment verified successfully
        const { metadata, pesapalData, subscriptionDetails, serverFulfillmentDone } = result;

        if (!serverFulfillmentDone && metadata) {
          try {
            if ((metadata.type === 'agent_subscription' || metadata.type === 'user_subscription') && (metadata.agentId || metadata.userId)) {
              const userId = metadata.agentId || metadata.userId;
              const subscriptionData = {
                userId,
                startDate: new Date(subscriptionDetails.startDate),
                endDate: new Date(subscriptionDetails.endDate),
                paymentReference: pesapalData.merchantReference,
                trackingId: pesapalData.trackingId,
                amount: pesapalData.amount,
                paymentMethod: pesapalData.paymentMethod,
                confirmationCode: pesapalData.confirmationCode,
                planType: metadata.planType
              };

              await createUserSubscription(subscriptionData);
            } else if (metadata.type === 'credit_purchase' && metadata.agentId) {
              const credits = metadata.credits || 0;
              if (credits > 0) {
                const transactionData = {
                  amount: pesapalData.amount,
                  paymentMethod: pesapalData.paymentMethod,
                  paymentReference: pesapalData.merchantReference,
                  confirmationCode: pesapalData.confirmationCode
                };
                await addAgentCredits(metadata.agentId, credits, transactionData);
              }
            }
          } catch (dbError) {
            console.error('Database update error:', dbError);
          }
        }

        triggerSuccess();
        setPaymentData({
          amount: pesapalData.amount,
          confirmationCode: pesapalData.confirmationCode,
          paymentMethod: pesapalData.paymentMethod,
          credits: metadata?.credits
        });

      } catch (err) {
        console.error('Error processing payment:', err);
        setStatus('error');
        setError(err.message);
      }
    };

    const triggerSuccess = () => {
      setStatus('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FE9200', '#E58300', '#2E7D32', '#ffffff']
      });
    };

    verifyAndProcessPayment();
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center py-12 px-6">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-indigo-100 rounded-[32px] animate-pulse"></div>
              <div className="relative bg-white w-full h-full rounded-[32px] shadow-lg flex items-center justify-center border border-indigo-50">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin stroke-[2.5]" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Securing Your Transaction</h1>
            <p className="text-gray-500 font-medium max-w-xs mx-auto">Please stay on this page while we verify your payment with PesaPal.</p>

            <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Durable Verification in progress
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="animate-fade-in">
            {/* Header Card */}
            <div className="text-center mb-8 pt-4">
              <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 relative">
                <CheckCircle className="w-14 h-14 text-green-600 stroke-[2.5]" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Payment Captured!</h1>
              <p className="text-gray-500 font-bold uppercase text-[12px] tracking-widest bg-gray-50 px-4 py-2 rounded-full inline-block">
                Receipt #{paymentData?.confirmationCode || '0000'}
              </p>
            </div>

            {/* Main Success Container - Inspired by Image 4 */}
            <div className="bg-white rounded-[32px] border-2 border-gray-100 p-8 mb-6 shadow-xl shadow-gray-200/50">
              <div className="bg-indigo-50/50 rounded-2xl p-6 mb-8 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Status</span>
                  <h3 className="text-xl font-black text-indigo-900">Wallet Updated</h3>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-indigo-600">+{paymentData?.credits || '0'}</span>
                  <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Credits Added</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Star className="w-6 h-6 text-[#FE9200] fill-[#FE9200]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">Premium Advantage</h4>
                    <p className="text-xs text-gray-500">You now have access to verified property requirements.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">Refer & Earn</h4>
                    <p className="text-xs text-gray-500">Share your link and get 5 free credits on their first buy.</p>
                  </div>
                  <Share2 className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div className="mt-10">
                <Link
                  href="/"
                  className="w-full h-16 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-[20px] font-black text-xl shadow-2xl shadow-[#FE9200]/30 flex items-center justify-center gap-3 group transition-all transform active:scale-95"
                >
                  Start Unlocking Leads
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
                <button className="w-full mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                  <Receipt className="w-3 h-3" />
                  Download PDF Receipt
                </button>
              </div>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center py-12 px-6">
            <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-amber-100">
              <Smartphone className="w-12 h-12 text-amber-600 animate-bounce" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Awating Confirmation</h1>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10">
              We&apos;re waiting for the SMS confirmation from M-Pesa. This typically takes 30-60 seconds.
            </p>
            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 text-left mb-10">
              <p className="text-xs text-amber-900 font-bold mb-2 uppercase tracking-tight">Need help?</p>
              <ul className="text-[11px] text-amber-800 space-y-2 font-medium">
                <li>• Ensure your phone has active signal</li>
                <li>• Check if you received an M-Pesa message</li>
                <li>• If you entered PIN, your credits will appear soon</li>
              </ul>
            </div>
            <Link
              href="/"
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
            >
              Return to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        );

      case 'failed':
      case 'error':
      default:
        return (
          <div className="text-center py-12 px-6">
            <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-red-100">
              <XCircle className="w-12 h-12 text-red-600 stroke-[2.5]" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Transaction Failed</h1>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
              {error || 'Unfortunately, your payment could not be processed. No charges were made.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-600/20 transition-all active:scale-95"
              >
                <Smartphone className="w-5 h-5" />
                Try Payment Again
              </button>
              <Link
                href="/"
                className="w-full h-14 bg-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
              >
                <Home className="w-5 h-5" />
                Cancel and Go Home
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Technical Support</p>
              <p className="text-xs text-gray-500 font-bold tracking-tight">Ref: {searchParams.get('ref') || 'N/A'}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-4 max-w-xl w-full border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
