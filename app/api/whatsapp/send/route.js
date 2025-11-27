import { NextResponse } from 'next/server';
const twilio = require('twilio');

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not set');
      return NextResponse.json({ success: false, error: 'SMS service not configured' }, { status: 500 });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
