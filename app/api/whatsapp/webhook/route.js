import { NextResponse } from 'next/server';
// ============================================================================
// Infobip WhatsApp Webhook Handler
// Handles delivery reports and incoming messages from Infobip
// Documentation: https://www.infobip.com/docs/whatsapp/webhooks
// ============================================================================
import { validateWebhookSignature, parseWebhookEvent } from '@/lib/infobip';

/**
 * Handle incoming webhook events from Infobip
 * This endpoint receives:
 * - Delivery status reports (DELIVERED, SEEN, FAILED, etc.)
 * - Incoming messages from users
 */
export async function POST(request) {
  try {
    // Get raw body for signature validation
    const rawBody = await request.text();
    
    // Validate webhook signature if secret is configured
    const signature = request.headers.get('x-hub-signature') || 
                      request.headers.get('x-infobip-signature') || '';
    
    if (process.env.INFOBIP_WEBHOOK_SECRET && !validateWebhookSignature(signature, rawBody)) {
      console.error('[Infobip Webhook] Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('[Infobip Webhook] Invalid JSON payload');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Parse and process events
    const events = parseWebhookEvent(body);
    
    console.log(`[Infobip Webhook] Received ${events.length} event(s)`);

    for (const event of events) {
      // Log the event
      console.log(`[Infobip Webhook] Event:`, {
        messageId: event.messageId,
        from: event.from,
        to: event.to,
        status: event.status,
        text: event.text ? `${event.text.substring(0, 50)}...` : undefined,
      });

      // Handle different event types
      if (event.status) {
        // This is a delivery report
        await handleDeliveryReport(event);
      } else if (event.text) {
        // This is an incoming message
        await handleIncomingMessage(event);
      }
    }

    // Acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      processed: events.length 
    });

  } catch (error) {
    console.error('[Infobip Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle delivery status reports
 * @param {Object} event - Parsed delivery report event
 */
async function handleDeliveryReport(event) {
  const { messageId, status, statusDescription, errorCode, errorDescription } = event;
  
  console.log(`[Infobip Webhook] Delivery report: ${messageId} -> ${status}`);
  
  // TODO: Update message status in database
  // Example: await updateMessageStatus(messageId, status);
  
  if (status === 'DELIVERED') {
    console.log(`[Infobip Webhook] Message ${messageId} delivered successfully`);
  } else if (status === 'SEEN') {
    console.log(`[Infobip Webhook] Message ${messageId} was read`);
  } else if (status === 'FAILED' || status === 'REJECTED') {
    console.error(`[Infobip Webhook] Message ${messageId} failed: ${errorDescription || statusDescription}`);
    // TODO: Handle failed messages (retry, notify admin, etc.)
  }
}

/**
 * Handle incoming WhatsApp messages from users
 * @param {Object} event - Parsed incoming message event
 */
async function handleIncomingMessage(event) {
  const { from, text, receivedAt } = event;
  
  console.log(`[Infobip Webhook] Incoming message from ${from}: ${text}`);
  
  // TODO: Process incoming message
  // Examples:
  // - Auto-reply to common queries
  // - Forward to support team
  // - Store in database for agent review
  // - Trigger automated workflows
  
  // For now, just log the message
  // In production, you would:
  // 1. Store the message in database
  // 2. Notify relevant agents
  // 3. Send auto-reply if configured
}

/**
 * Handle GET requests (for webhook verification)
 * Some webhook systems require GET verification
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge');
  
  if (challenge) {
    // Return the challenge for webhook verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'Infobip WhatsApp webhook endpoint',
    timestamp: new Date().toISOString(),
  });
}

