import { NextResponse } from 'next/server';
import { verifyWebhookSignature, calculateSubscriptionEndDate } from '@/lib/paystack';
import { updateSubscription, createUserSubscription } from '@/lib/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const event = body.event;
    const data = body.data;

    if (event === 'charge.success') {
      // Handle successful payment
      const metadata = data.metadata || {};
      
      if (metadata.plan === 'premium') {
        // Agent subscription
        const startDate = new Date();
        const endDate = calculateSubscriptionEndDate(startDate, 'monthly');
        
        await updateSubscription(metadata.agentId, {
          status: 'active',
          startDate,
          endDate,
          paymentReference: data.reference,
          amount: data.amount,
          updatedAt: new Date()
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
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
