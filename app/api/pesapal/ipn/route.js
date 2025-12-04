import { NextResponse } from 'next/server';
import { getApiUrl, getPaymentStatusLabel, calculateSubscriptionEndDate } from '@/lib/pesapal';
import { 
  createUserSubscription, 
  addAgentCredits 
} from '@/lib/database';
import pg from 'pg';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// PostgreSQL connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

// Fulfill payment by updating Supabase database
async function fulfillPayment(metadata, pesapalData, orderId) {
  const startDate = new Date();
  const endDate = calculateSubscriptionEndDate(startDate, metadata.planType || 'monthly');

  const subscriptionData = {
    startDate,
    endDate,
    paymentReference: orderId,
    trackingId: pesapalData.order_tracking_id,
    amount: pesapalData.amount,
    paymentMethod: pesapalData.payment_method,
    confirmationCode: pesapalData.confirmation_code
  };

  let fulfillmentResult = null;

  if ((metadata.type === 'agent_subscription' || metadata.type === 'user_subscription') && (metadata.agentId || metadata.userId)) {
    const userId = metadata.agentId || metadata.userId;
    subscriptionData.planType = metadata.planType;
    fulfillmentResult = await createUserSubscription(userId, subscriptionData);
    console.log('Subscription created via IPN:', fulfillmentResult);

  } else if (metadata.type === 'credit_purchase' && metadata.agentId && metadata.credits > 0) {
    fulfillmentResult = await addAgentCredits(metadata.agentId, metadata.credits, {
      amount: pesapalData.amount,
      paymentMethod: pesapalData.payment_method,
      paymentReference: orderId,
      confirmationCode: pesapalData.confirmation_code
    });
    console.log('Credits added via IPN:', fulfillmentResult);
  }

  return fulfillmentResult;
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

    // Find the pending payment record
    const merchantRef = orderMerchantReference || statusData.merchant_reference;
    
    // Try to find by tracking ID first, then by merchant reference
    let paymentResult = await pool.query(
      `SELECT * FROM pending_payments WHERE order_tracking_id = $1`,
      [orderTrackingId]
    );
    
    if (paymentResult.rows.length === 0 && merchantRef) {
      paymentResult = await pool.query(
        `SELECT * FROM pending_payments WHERE order_id = $1`,
        [merchantRef]
      );
    }

    if (paymentResult.rows.length === 0) {
      console.log('Payment record not found for:', { orderTrackingId, merchantRef });
      return NextResponse.json({
        orderNotificationType,
        orderTrackingId,
        orderMerchantReference: merchantRef,
        status: 'RECORD_NOT_FOUND'
      });
    }

    const paymentRecord = paymentResult.rows[0];

    // Check if already fulfilled (idempotency)
    if (paymentRecord.fulfillment_status === 'fulfilled') {
      console.log('Payment already fulfilled:', paymentRecord.order_id);
      return NextResponse.json({
        orderNotificationType,
        orderTrackingId,
        orderMerchantReference: paymentRecord.order_id,
        status: 'ALREADY_FULFILLED'
      });
    }

    // Check if payment was successful (status_code 1 = COMPLETED)
    if (statusData.status_code === 1) {
      const metadata = typeof paymentRecord.metadata === 'string' 
        ? JSON.parse(paymentRecord.metadata) 
        : paymentRecord.metadata;

      // Mark payment as completed
      await pool.query(
        `UPDATE pending_payments 
         SET status = 'completed', 
             completed_at = NOW(), 
             pesapal_status = $1,
             order_tracking_id = COALESCE(order_tracking_id, $2)
         WHERE order_id = $3 AND status NOT IN ('completed', 'fulfilled')`,
        [JSON.stringify(statusData), orderTrackingId, paymentRecord.order_id]
      );

      // Attempt server-side fulfillment
      try {
        const fulfillmentResult = await fulfillPayment(metadata, statusData, paymentRecord.order_id);
        
        if (fulfillmentResult && fulfillmentResult.success) {
          // Mark as fulfilled with receipt
          await pool.query(
            `UPDATE pending_payments 
             SET fulfillment_status = 'fulfilled',
                 fulfilled_at = NOW(),
                 fulfillment_receipt = $1
             WHERE order_id = $2`,
            [JSON.stringify(fulfillmentResult), paymentRecord.order_id]
          );
          
          console.log('Payment fulfilled via IPN:', paymentRecord.order_id);
        }
      } catch (fulfillError) {
        console.error('Fulfillment error (will retry via callback):', fulfillError);
        // Don't fail the IPN - fulfillment can be retried via callback
        await pool.query(
          `UPDATE pending_payments 
           SET fulfillment_status = 'pending',
               fulfillment_receipt = $1
           WHERE order_id = $2`,
          [JSON.stringify({ error: fulfillError.message, attemptedAt: new Date() }), paymentRecord.order_id]
        );
      }

    } else if (statusData.status_code === 2) {
      // Payment failed
      console.log('Payment failed for:', paymentRecord.order_id);
      
      await pool.query(
        `UPDATE pending_payments 
         SET status = 'failed', 
             pesapal_status = $1,
             fulfillment_status = 'not_applicable'
         WHERE order_id = $2`,
        [JSON.stringify(statusData), paymentRecord.order_id]
      );
    }

    // Return success to acknowledge IPN receipt
    return NextResponse.json({
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference: paymentRecord.order_id,
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
