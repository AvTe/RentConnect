import { NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const { email, amount, metadata, callbackUrl } = await request.json();

    if (!email || !amount) {
      return NextResponse.json(
        { success: false, error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // Amount in cents
        currency: 'KES',
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Agent Name",
              variable_name: "agent_name",
              value: metadata?.agentName || ''
            },
            {
              display_name: "Plan",
              variable_name: "plan",
              value: metadata?.plan || 'Premium'
            }
          ]
        },
        callback_url: callbackUrl,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      })
    });

    const data = await response.json();

    if (data.status) {
      return NextResponse.json({
        success: true,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference
      });
    }

    return NextResponse.json(
      { success: false, error: data.message || 'Payment initialization failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

