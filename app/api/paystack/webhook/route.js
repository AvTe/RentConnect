import { NextResponse } from 'next/server';
import { calculateSubscriptionEndDate } from '@/lib/paystack';
import { createSubscription, createUserSubscription, addCredits } from '@/lib/firestore';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Server-side webhook signature verification
function verifyWebhookSignature(requestBody, signature) {
  if (!PAYSTACK_SECRET_KEY || !signature) {
    return false;
  }
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(requestBody))
    .digest('hex');

  return hash === signature;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyWebhookSignature(body, signature)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const event = body.event;
    const data = body.data;

    if (event === 'charge.success') {
      // Handle successful payment
      const metadata = data.metadata || {};

      if (metadata.plan === 'premium') {
        // Agent subscription - CREATE new subscription record
        const startDate = new Date();
        const endDate = calculateSubscriptionEndDate(startDate, 'monthly');

        await createSubscription({
          agentId: metadata.agentId,
          status: 'active',
          startDate,
          endDate,
          paymentReference: data.reference,
          amount: data.amount
        });
      } else if (metadata.subscriptionType === 'user') {
        // User subscription
        const startDate = new Date();
        const endDate = calculateSubscriptionEndDate(startDate, 'monthly');

        await createUserSubscription({
          userId: metadata.userId,
          planType: metadata.planType,
          status: 'active',
          startDate,
          endDate,
          paymentReference: data.reference,
          amount: data.amount
        });
      } else if (metadata.type === 'credit_purchase') {
        // Credit purchase for agent
        const credits = metadata.credits || 0;
        if (credits > 0 && metadata.agentId) {
          await addCredits(metadata.agentId, credits, 'Credit Purchase via Paystack');
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
