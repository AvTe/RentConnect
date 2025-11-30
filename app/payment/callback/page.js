'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { db, isFirebaseReady } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, increment, serverTimestamp } from 'firebase/firestore';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
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
        // Call the secure server-side process-payment API
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
            setStatus('success');
            setPaymentData({ message: 'Payment was already processed successfully' });
          } else {
            setStatus('failed');
            setError(result.error || 'Payment verification failed');
          }
          return;
        }

        // Payment verified successfully
        const { metadata, pesapalData, subscriptionDetails, serverFulfillmentDone } = result;

        // Only do client-side Firebase updates if server-side fulfillment didn't happen
        if (!serverFulfillmentDone && isFirebaseReady && metadata) {
          try {
            if (metadata.type === 'agent_subscription' && metadata.agentId) {
              // Create subscription record
              await addDoc(collection(db, 'subscriptions'), {
                agentId: metadata.agentId,
                status: 'active',
                startDate: new Date(subscriptionDetails.startDate),
                endDate: new Date(subscriptionDetails.endDate),
                paymentReference: pesapalData.merchantReference,
                pesapalTrackingId: pesapalData.trackingId,
                amount: pesapalData.amount,
                paymentMethod: pesapalData.paymentMethod,
                confirmationCode: pesapalData.confirmationCode,
                createdAt: serverTimestamp()
              });

              // Update agent's premium status
              await updateDoc(doc(db, 'users', metadata.agentId), {
                isPremium: true,
                subscriptionEndDate: new Date(subscriptionDetails.endDate)
              });

              console.log('Agent subscription activated for:', metadata.agentId);

            } else if (metadata.type === 'user_subscription' && metadata.userId) {
              // Create user subscription record
              await addDoc(collection(db, 'user_subscriptions'), {
                userId: metadata.userId,
                planType: metadata.planType,
                status: 'active',
                startDate: new Date(subscriptionDetails.startDate),
                endDate: new Date(subscriptionDetails.endDate),
                paymentReference: pesapalData.merchantReference,
                pesapalTrackingId: pesapalData.trackingId,
                amount: pesapalData.amount,
                paymentMethod: pesapalData.paymentMethod,
                confirmationCode: pesapalData.confirmationCode,
                createdAt: serverTimestamp()
              });

              // Update user's subscription status
              await updateDoc(doc(db, 'users', metadata.userId), {
                hasActiveSubscription: true,
                subscriptionPlan: metadata.planType,
                subscriptionEndDate: new Date(subscriptionDetails.endDate)
              });

              console.log('User subscription activated for:', metadata.userId);

            } else if (metadata.type === 'credit_purchase' && metadata.agentId) {
              const credits = metadata.credits || 0;
              if (credits > 0) {
                // Add credits to agent's wallet
                await updateDoc(doc(db, 'users', metadata.agentId), {
                  walletBalance: increment(credits)
                });

                // Log transaction
                await addDoc(collection(db, 'transactions'), {
                  userId: metadata.agentId,
                  type: 'credit_purchase',
                  credits: credits,
                  amount: pesapalData.amount,
                  paymentMethod: pesapalData.paymentMethod,
                  paymentReference: pesapalData.merchantReference,
                  confirmationCode: pesapalData.confirmationCode,
                  description: `Credit purchase via ${pesapalData.paymentMethod || 'M-Pesa'}`,
                  createdAt: serverTimestamp()
                });

                console.log('Credits added for agent:', metadata.agentId, 'Credits:', credits);
              }
            }
          } catch (dbError) {
            console.error('Database update error:', dbError);
            // Payment was successful, but DB update failed - still show success
            // The IPN should have handled it, or admin can reconcile
          }
        } else if (serverFulfillmentDone) {
          console.log('Server-side fulfillment already completed');
        }

        setStatus('success');
        setPaymentData({
          amount: pesapalData.amount,
          confirmationCode: pesapalData.confirmationCode,
          paymentMethod: pesapalData.paymentMethod
        });

      } catch (error) {
        console.error('Error processing payment:', error);
        setStatus('error');
        setError(error.message);
      }
    };

    verifyAndProcessPayment();
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Verifying Payment</h1>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              {paymentData?.amount 
                ? `Your payment of KSh ${paymentData.amount.toLocaleString()} has been confirmed.`
                : paymentData?.message || 'Your payment has been processed successfully.'}
            </p>
            {paymentData?.confirmationCode && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 inline-block">
                <p className="text-sm text-gray-500">Confirmation Code</p>
                <p className="text-lg font-mono font-bold text-gray-900">{paymentData.confirmationCode}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </Link>
            </div>
          </div>
        );
      
      case 'pending':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Processing</h1>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. This may take a few moments.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will receive a confirmation via SMS once the payment is complete.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Return Home
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        );
      
      case 'failed':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              Unfortunately, your payment could not be processed. Please try again.
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-6">{error}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FE9200] text-white rounded-lg hover:bg-[#E58300] transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      
      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Something Went Wrong</h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t verify your payment status. Please contact support if you believe this is an error.
            </p>
            {error && (
              <p className="text-sm text-gray-500 mb-4">Error: {error}</p>
            )}
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {renderContent()}
      </div>
    </div>
  );
}
