import { NextResponse } from 'next/server';
// ============================================================================
// Infobip WhatsApp Business API
// Primary WhatsApp messaging provider
// ============================================================================
import { sendWhatsApp, sendWhatsAppTemplate, isConfigured } from '@/lib/infobip';
// Fallback to SMS via Africa's Talking if WhatsApp fails
import { sendSMS, isConfigured as isSMSConfigured } from '@/lib/africastalking';

export async function POST(request) {
  try {
    const { phoneNumber, message, templateName, templateNamespace, templateData, language, fallbackToSMS = true } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!message && !templateName) {
      return NextResponse.json(
        { success: false, error: 'Either message or templateName is required' },
        { status: 400 }
      );
    }

    // Check if Infobip is configured
    if (!isConfigured()) {
      console.warn("[Infobip] WhatsApp service not configured");

      // Fallback to SMS if enabled and configured
      if (fallbackToSMS && isSMSConfigured() && message) {
        console.log(`[Fallback] Sending via SMS instead of WhatsApp to ${phoneNumber}`);
        const smsResult = await sendSMS(phoneNumber, message);

        if (smsResult.success) {
          return NextResponse.json({
            success: true,
            messageId: smsResult.messageId,
            channel: 'sms',
            fallback: true,
            cost: smsResult.cost,
          });
        }
      }

      return NextResponse.json(
        { success: false, error: 'WhatsApp service not configured' },
        { status: 500 }
      );
    }

    let result;

    // Send template message if templateName is provided
    if (templateName) {
      console.log(`[Infobip] Sending WhatsApp template "${templateName}" to ${phoneNumber}`);
      result = await sendWhatsAppTemplate(
        phoneNumber,
        templateName,
        templateNamespace,
        templateData || [],
        language || 'en'
      );
    } else {
      // Send regular text message
      console.log(`[Infobip] Sending WhatsApp message to ${phoneNumber}`);
      result = await sendWhatsApp(phoneNumber, message);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        channel: 'whatsapp',
        status: result.status,
      });
    } else {
      // Attempt SMS fallback if WhatsApp fails
      if (fallbackToSMS && isSMSConfigured() && message) {
        console.log(`[Fallback] WhatsApp failed, sending via SMS to ${phoneNumber}`);
        const smsResult = await sendSMS(phoneNumber, message);

        if (smsResult.success) {
          return NextResponse.json({
            success: true,
            messageId: smsResult.messageId,
            channel: 'sms',
            fallback: true,
            whatsappError: result.error,
            cost: smsResult.cost,
          });
        }
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
