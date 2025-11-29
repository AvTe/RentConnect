import { NextResponse } from 'next/server';

// Force dynamic rendering for this route (uses request.url)
export const dynamic = 'force-dynamic';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      return NextResponse.json({
        success: true,
        data: {
          amount: data.data.amount,
          currency: data.data.currency,
          reference: data.data.reference,
          paidAt: data.data.paid_at,
          customer: data.data.customer,
          metadata: data.data.metadata
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

