import { NextResponse } from 'next/server';
import { getApiUrl, getPaymentStatusLabel, calculateSubscriptionEndDate, verifyMetadataSignature } from '@/lib/pesapal';
import { 
  createUserSubscription, 
  addAgentCredits 
} from '@/lib/database';
import pg from 'pg';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PAYMENT_SIGNING_SECRET = process.env.PESAPAL_CONSUMER_SECRET || 'yoombaa-payment-secret';

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

export async function POST(request) {
  try {
    const { orderTrackingId, orderRef } = await request.json();

    if (!orderTrackingId && !orderRef) {
      return NextResponse.json(
        { success: false, error: 'Missing order reference' },
        { status: 400 }
      );
    }

    // Find the payment record in PostgreSQL
    let paymentResult;
    if (orderTrackingId) {
      paymentResult = await pool.query(
        `SELECT * FROM pending_payments WHERE order_tracking_id = $1`,
        [orderTrackingId]
      );
    }
    if ((!paymentResult || paymentResult.rows.length === 0) && orderRef) {
      paymentResult = await pool.query(
        `SELECT * FROM pending_payments WHERE order_id = $1`,
        [orderRef]
      );
    }

    if (!paymentResult || paymentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      );
    }

    const paymentRecord = paymentResult.rows[0];
    const metadata = typeof paymentRecord.metadata === 'string' 
      ? JSON.parse(paymentRecord.metadata) 
      : paymentRecord.metadata;

    // Check if already fulfilled
    if (paymentRecord.fulfillment_status === 'fulfilled') {
      return NextResponse.json({
        success: true,
        message: 'Payment already fulfilled',
        alreadyProcessed: true
      });
    }

    // Verify the stored signature
    const isValid = await verifyMetadataSignature(metadata, paymentRecord.signature, PAYMENT_SIGNING_SECRET);
    if (!isValid) {
      console.error('Signature verification failed for:', paymentRecord.order_id);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 403 }
      );
    }

    // If payment is not yet marked as completed, verify with Pesapal
    if (paymentRecord.status !== 'completed' && paymentRecord.status !== 'fulfilled') {
      const trackingId = orderTrackingId || paymentRecord.order_tracking_id;
      
      if (!trackingId) {
        return NextResponse.json({
          success: false,
          error: 'Payment not yet processed',
          status: 'pending'
        });
      }

      const token = await getValidToken();
      
      const statusResponse = await fetch(
        `${getApiUrl('getStatus')}?orderTrackingId=${encodeURIComponent(trackingId)}`,
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
      console.log('Payment verification status:', statusData);

      if (statusData.status_code !== 1) {
        return NextResponse.json({
          success: false,
          error: 'Payment not completed',
          status: getPaymentStatusLabel(statusData.status_code),
          statusCode: statusData.status_code
        });
      }

      // Verify amount matches
      if (statusData.amount && Math.abs(statusData.amount - metadata.amount) > 0.01) {
        console.error('Amount mismatch:', { expected: metadata.amount, received: statusData.amount });
        return NextResponse.json(
          { success: false, error: 'Payment amount mismatch' },
          { status: 400 }
        );
      }

      // Update payment status to completed
      await pool.query(
        `UPDATE pending_payments 
         SET status = 'completed', 
             completed_at = NOW(), 
             pesapal_status = $1,
             order_tracking_id = COALESCE(order_tracking_id, $2)
         WHERE order_id = $3`,
        [JSON.stringify(statusData), trackingId, paymentRecord.order_id]
      );
    }

    // Get the pesapal status data
    const pesapalStatus = paymentRecord.pesapal_status 
      ? (typeof paymentRecord.pesapal_status === 'string' 
          ? JSON.parse(paymentRecord.pesapal_status) 
          : paymentRecord.pesapal_status)
      : null;

    // Calculate subscription dates if applicable
    let subscriptionDetails = null;
    if (metadata.type === 'agent_subscription' || metadata.type === 'user_subscription') {
      const startDate = new Date();
      const endDate = calculateSubscriptionEndDate(startDate, metadata.planType || 'monthly');
      subscriptionDetails = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }

    // Server-side fulfillment for subscriptions and credits
    let serverFulfillmentDone = false;
    if (paymentRecord.fulfillment_status !== 'fulfilled') {
      try {
        const subscriptionData = {
          startDate: subscriptionDetails ? new Date(subscriptionDetails.startDate) : new Date(),
          endDate: subscriptionDetails ? new Date(subscriptionDetails.endDate) : new Date(),
          paymentReference: paymentRecord.order_id,
          trackingId: paymentRecord.order_tracking_id || orderTrackingId,
          amount: pesapalStatus?.amount || metadata.amount,
          paymentMethod: pesapalStatus?.payment_method || 'M-Pesa',
          confirmationCode: pesapalStatus?.confirmation_code,
          planType: metadata.planType
        };

        let fulfillmentResult = null;

        if ((metadata.type === 'agent_subscription' || metadata.type === 'user_subscription') && (metadata.agentId || metadata.userId)) {
          const userId = metadata.agentId || metadata.userId;
          fulfillmentResult = await createUserSubscription(userId, subscriptionData);
        } else if (metadata.type === 'credit_purchase' && metadata.agentId && metadata.credits > 0) {
          fulfillmentResult = await addAgentCredits(metadata.agentId, metadata.credits, subscriptionData);
        }

        if (fulfillmentResult && fulfillmentResult.success) {
          await pool.query(
            `UPDATE pending_payments 
             SET fulfillment_status = 'fulfilled',
                 fulfilled_at = NOW(),
                 fulfillment_receipt = $1
             WHERE order_id = $2`,
            [JSON.stringify(fulfillmentResult), paymentRecord.order_id]
          );
          serverFulfillmentDone = true;
          console.log('Server-side fulfillment completed:', fulfillmentResult);
        }
      } catch (fulfillError) {
        console.error('Server-side fulfillment failed:', fulfillError);
        // Continue - client can still fulfill
      }
    }

    // Prepare the verified payment result
    const paymentResultData = {
      success: true,
      verified: true,
      serverFulfillmentDone,
      metadata: {
        type: metadata.type,
        agentId: metadata.agentId,
        userId: metadata.userId,
        planType: metadata.planType,
        credits: metadata.credits,
        amount: metadata.amount,
        email: metadata.email,
        orderId: metadata.orderId || paymentRecord.order_id
      },
      pesapalData: {
        trackingId: paymentRecord.order_tracking_id || orderTrackingId,
        merchantReference: paymentRecord.order_id,
        amount: pesapalStatus?.amount || metadata.amount,
        paymentMethod: pesapalStatus?.payment_method || 'M-Pesa',
        confirmationCode: pesapalStatus?.confirmation_code,
        status: 'COMPLETED'
      },
      subscriptionDetails
    };

    console.log('Payment verified:', paymentResultData);

    return NextResponse.json(paymentResultData);

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
