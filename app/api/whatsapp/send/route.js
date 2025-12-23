import { NextResponse } from 'next/server';
// ============================================================================
// Africa's Talking SMS Service
// Note: Africa's Talking doesn't support WhatsApp, so we send via SMS instead
// ============================================================================
import { sendSMS, isConfigured } from '@/lib/africastalking';

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Check if Africa's Talking is configured
    if (!isConfigured()) {
      console.warn("[Africa's Talking] SMS service not configured");
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    // Send via SMS (Africa's Talking doesn't support WhatsApp)
    console.log(`[Africa's Talking] Sending message to ${phoneNumber} via SMS (WhatsApp not supported)`);
    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        channel: 'sms', // Indicate it was sent via SMS
        cost: result.cost,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
