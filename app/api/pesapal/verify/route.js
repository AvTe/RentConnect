import { NextResponse } from 'next/server';
import { getApiUrl, getPaymentStatusLabel } from '@/lib/pesapal';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

export async function GET(request) {
  try {
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderTrackingId = searchParams.get('orderTrackingId');

    if (!orderTrackingId) {
      return NextResponse.json(
        { success: false, error: 'Order tracking ID is required' },
        { status: 400 }
      );
    }

    // Get auth token
    const token = await getValidToken();

    // Get transaction status
    const response = await fetch(
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

    const data = await response.json();

    // Pesapal status codes: 0=INVALID, 1=COMPLETED, 2=FAILED, 3=REVERSED
    if (data.status_code !== undefined) {
      const isSuccess = data.status_code === 1;
      
      return NextResponse.json({
        success: isSuccess,
        data: {
          statusCode: data.status_code,
          statusLabel: getPaymentStatusLabel(data.status_code),
          paymentMethod: data.payment_method,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          merchantReference: data.merchant_reference,
          orderTrackingId: orderTrackingId,
          confirmationCode: data.confirmation_code,
          paymentAccount: data.payment_account,
          paymentStatusDescription: data.payment_status_description,
          message: data.message
        }
      });
    }

    return NextResponse.json(
      { success: false, error: data.error?.message || 'Failed to get payment status' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error verifying Pesapal payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
