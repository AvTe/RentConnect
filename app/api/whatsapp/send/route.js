import { NextResponse } from 'next/server';
import { sendWhatsApp } from '@/lib/twilio';

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    const result = await sendWhatsApp(phoneNumber, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
