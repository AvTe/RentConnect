import { NextResponse } from 'next/server';
import { getApiUrl, generateOrderId, signMetadata } from '@/lib/pesapal';
import { createClient } from '@supabase/supabase-js';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;
const PAYMENT_SIGNING_SECRET = process.env.PESAPAL_CONSUMER_SECRET || 'yoombaa-payment-secret';

// Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      console.error('Pesapal credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Payment service not configured. Please add Pesapal credentials.' },
        { status: 500 }
      );
    }

    if (!PESAPAL_IPN_ID) {
      console.error('Pesapal IPN ID not configured');
      return NextResponse.json(
        { success: false, error: 'Payment notifications not configured. Please register your IPN URL.' },
        { status: 500 }
      );
    }

    const { 
      email, 
      phone,
      amount, 
      description,
      firstName,
      lastName,
      metadata,
      callbackUrl 
    } = await request.json();

    if (!email || !amount) {
      return NextResponse.json(
        { success: false, error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Get auth token
    const token = await getValidToken();

    // Generate unique order ID
    const orderId = generateOrderId();

    // Create signed metadata payload
    const metadataWithTimestamp = {
      ...metadata,
      orderId,
      amount: parseFloat(amount),
      email,
      createdAt: Date.now()
    };
    
    const signature = await signMetadata(metadataWithTimestamp, PAYMENT_SIGNING_SECRET);

    // Store pending payment in Supabase for durable persistence
    try {
      const { error: dbError } = await supabase
        .from('pending_payments')
        .insert({
          order_id: orderId,
          metadata: metadataWithTimestamp,
          signature: signature,
          amount: parseFloat(amount),
          email: email,
          status: 'pending'
        });

      if (dbError) throw dbError;
      console.log('Pending payment stored:', orderId);
    } catch (dbError) {
      console.error('Failed to store pending payment:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to initialize payment. Please try again.' },
        { status: 500 }
      );
    }

    // Build callback URL with order reference
    const baseCallbackUrl = callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/payment/callback`;
    const callbackWithRef = `${baseCallbackUrl}?ref=${orderId}`;

    // Prepare order request
    const orderPayload = {
      id: orderId,
      currency: 'KES',
      amount: parseFloat(amount),
      description: description || 'Yoombaa Payment',
      callback_url: callbackWithRef,
      cancellation_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/payment/cancelled`,
      notification_id: PESAPAL_IPN_ID,
      billing_address: {
        email_address: email,
        phone_number: phone || '',
        country_code: 'KE',
        first_name: firstName || '',
        last_name: lastName || '',
        line_1: '',
        line_2: '',
        city: 'Nairobi',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    };

    // Submit order to Pesapal
    const response = await fetch(getApiUrl('submitOrder'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (data.redirect_url && data.order_tracking_id) {
      // Update with Pesapal tracking ID
      await supabase
        .from('pending_payments')
        .update({ order_tracking_id: data.order_tracking_id })
        .eq('order_id', orderId);

      return NextResponse.json({
        success: true,
        redirectUrl: data.redirect_url,
        orderTrackingId: data.order_tracking_id,
        merchantReference: orderId
      });
    }

    // Clean up failed payment record
    await supabase
      .from('pending_payments')
      .delete()
      .eq('order_id', orderId);

    console.error('Pesapal order submission failed:', data);
    return NextResponse.json(
      { success: false, error: data.error?.message || 'Payment initialization failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error initializing Pesapal payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
