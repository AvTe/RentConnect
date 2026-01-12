/**
 * M-Pesa Callback API Route
 * Handles payment confirmation callbacks from M-Pesa
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUserSubscription, addAgentCredits } from '@/lib/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate subscription end date based on plan type
function calculateSubscriptionEndDate(startDate, planType) {
  const endDate = new Date(startDate);
  switch (planType?.toLowerCase()) {
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      endDate.setMonth(endDate.getMonth() + 1);
      break;
  }
  return endDate;
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    if (!Body?.stkCallback) {
      return NextResponse.json({ success: false, error: 'Invalid callback format' }, { status: 400 });
    }

    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find the pending payment by checkout request ID
    const { data: payment, error: findError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('order_tracking_id', CheckoutRequestID)
      .single();

    if (findError || !payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const metadata = payment.metadata || {};

    // ResultCode 0 means success
    if (ResultCode === 0) {
      // Extract callback metadata
      let amount = 0, mpesaReceiptNumber = '', transactionDate = '', phoneNumber = '';
      
      if (CallbackMetadata?.Item) {
        CallbackMetadata.Item.forEach(item => {
          switch (item.Name) {
            case 'Amount': amount = item.Value; break;
            case 'MpesaReceiptNumber': mpesaReceiptNumber = item.Value; break;
            case 'TransactionDate': transactionDate = item.Value; break;
            case 'PhoneNumber': phoneNumber = item.Value; break;
          }
        });
      }

      // Update payment status to completed
      await supabase
        .from('pending_payments')
        .update({
          status: 'completed',
          fulfillment_status: 'pending',
          metadata: {
            ...metadata,
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
          }
        })
        .eq('order_id', payment.order_id);

      // Fulfill the payment (create subscription or add credits)
      const startDate = new Date();
      const endDate = calculateSubscriptionEndDate(startDate, metadata.planType);

      const subscriptionData = {
        startDate,
        endDate,
        paymentReference: payment.order_id,
        trackingId: CheckoutRequestID,
        amount: amount || payment.amount,
        paymentMethod: 'M-Pesa STK',
        confirmationCode: mpesaReceiptNumber,
        planType: metadata.planType,
      };

      let fulfillmentResult = null;

      if ((metadata.type === 'agent_subscription' || metadata.type === 'user_subscription') && 
          (metadata.agentId || metadata.userId)) {
        const userId = metadata.agentId || metadata.userId;
        subscriptionData.planType = metadata.planType;
        fulfillmentResult = await createUserSubscription(userId, subscriptionData);
        console.log('Subscription created via M-Pesa callback:', fulfillmentResult);
      } else if (metadata.type === 'credit_purchase' && metadata.agentId && metadata.credits > 0) {
        fulfillmentResult = await addAgentCredits(metadata.agentId, metadata.credits, subscriptionData);
        console.log('Credits added via M-Pesa callback:', fulfillmentResult);
      }

      // Update fulfillment status
      if (fulfillmentResult?.success) {
        await supabase
          .from('pending_payments')
          .update({ fulfillment_status: 'fulfilled' })
          .eq('order_id', payment.order_id);
      }

      return NextResponse.json({ success: true, message: 'Payment processed successfully' });
    } else {
      // Payment failed or cancelled
      await supabase
        .from('pending_payments')
        .update({
          status: 'failed',
          metadata: {
            ...metadata,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
          }
        })
        .eq('order_id', payment.order_id);

      console.log('M-Pesa payment failed:', ResultDesc);
      return NextResponse.json({ success: false, message: ResultDesc });
    }
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// M-Pesa sends GET requests for validation (optional)
export async function GET() {
  return NextResponse.json({ success: true, message: 'M-Pesa callback endpoint active' });
}

