import { NextResponse } from 'next/server';
import { getApiUrl, getPaymentStatusLabel, calculateSubscriptionEndDate } from '@/lib/pesapal';
import { createSubscription, createUserSubscription, addCredits, updateLead } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// Token cache
let tokenCache = {
  token: null,
  expiryDate: null
};

async function getValidToken() {
  if (tokenCache.token && tokenCache.expiryDate) {
    const expiryTime = new Date(tokenCache.expiryDate).getTime();
    const now = Date.now();
    if (expiryTime - now > 60000) {
      return tokenCache.token;
    }
  }

  const response = await fetch(getApiUrl('auth'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET
    })
  });

  const data = await response.json();

  if (data.token) {
    tokenCache = {
      token: data.token,
      expiryDate: data.expiryDate
    };
    return data.token;
  }

  throw new Error('Failed to authenticate with Pesapal');
}

// Handle both GET and POST IPN notifications
export async function GET(request) {
  return handleIPN(request, 'GET');
}

export async function POST(request) {
  return handleIPN(request, 'POST');
}

async function handleIPN(request, method) {
  try {
    let orderTrackingId, orderMerchantReference, orderNotificationType;

    if (method === 'GET') {
      const { searchParams } = new URL(request.url);
      orderTrackingId = searchParams.get('OrderTrackingId');
      orderMerchantReference = searchParams.get('OrderMerchantReference');
      orderNotificationType = searchParams.get('OrderNotificationType');
    } else {
      const body = await request.json();
      orderTrackingId = body.OrderTrackingId;
      orderMerchantReference = body.OrderMerchantReference;
      orderNotificationType = body.OrderNotificationType;
    }

    console.log('IPN received:', { orderTrackingId, orderMerchantReference, orderNotificationType });

    if (!orderTrackingId) {
      return NextResponse.json(
        { success: false, error: 'Missing order tracking ID' },
        { status: 400 }
      );
    }

    // Get transaction status from Pesapal
    const token = await getValidToken();
    
    const statusResponse = await fetch(
      `${getApiUrl('getStatus')}?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const statusData = await statusResponse.json();
    console.log('Transaction status:', statusData);

    // Check if payment was successful (status_code 1 = COMPLETED)
    if (statusData.status_code === 1) {
      // Get stored payment metadata
      const paymentRef = doc(db, 'pending_payments', orderMerchantReference);
      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        const paymentData = paymentDoc.data();
        const metadata = paymentData.metadata || {};

        // Handle different payment types
        if (metadata.type === 'agent_subscription') {
          // Agent subscription
          const startDate = new Date();
          const endDate = calculateSubscriptionEndDate(startDate, 'monthly');

          await createSubscription({
            agentId: metadata.agentId,
            status: 'active',
            startDate,
            endDate,
            paymentReference: orderMerchantReference,
            pesapalTrackingId: orderTrackingId,
            amount: statusData.amount,
            paymentMethod: statusData.payment_method
          });

          console.log('Agent subscription created for:', metadata.agentId);

        } else if (metadata.type === 'user_subscription') {
          // User subscription
          const startDate = new Date();
          const endDate = calculateSubscriptionEndDate(startDate, metadata.planType || 'monthly');

          await createUserSubscription({
            userId: metadata.userId,
            planType: metadata.planType,
            status: 'active',
            startDate,
            endDate,
            paymentReference: orderMerchantReference,
            pesapalTrackingId: orderTrackingId,
            amount: statusData.amount,
            paymentMethod: statusData.payment_method
          });

          console.log('User subscription created for:', metadata.userId);

        } else if (metadata.type === 'credit_purchase') {
          // Credit purchase
          const credits = metadata.credits || 0;
          if (credits > 0 && metadata.agentId) {
            await addCredits(metadata.agentId, credits, `Credit purchase via M-Pesa (${statusData.payment_method})`);
            console.log('Credits added for agent:', metadata.agentId, 'Credits:', credits);
          }
        }

        // Mark payment as completed
        await setDoc(paymentRef, {
          ...paymentData,
          status: 'completed',
          completedAt: new Date(),
          pesapalStatus: statusData
        }, { merge: true });
      }
    } else if (statusData.status_code === 2) {
      // Payment failed
      console.log('Payment failed for:', orderMerchantReference);
      
      const paymentRef = doc(db, 'pending_payments', orderMerchantReference);
      await setDoc(paymentRef, {
        status: 'failed',
        failedAt: new Date(),
        pesapalStatus: statusData
      }, { merge: true });
    }

    // Return success to acknowledge IPN receipt
    return NextResponse.json({
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference,
      status: getPaymentStatusLabel(statusData.status_code)
    });

  } catch (error) {
    console.error('IPN processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
