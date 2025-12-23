/**
 * Infobip WhatsApp Business API Service
 * Unified WhatsApp messaging service for Kenya/Africa
 * Documentation: https://www.infobip.com/docs/whatsapp
 * Portal: https://portal.infobip.com
 */

/**
 * Get Infobip configuration
 * @returns {Object|null} Configuration object or null if not configured
 */
const getConfig = () => {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_BASE_URL;
  const sender = process.env.INFOBIP_WHATSAPP_SENDER;

  if (!apiKey || !baseUrl || !sender) {
    console.error("[Infobip] API Key, Base URL, or Sender not configured");
    return null;
  }

  return { apiKey, baseUrl, sender };
};

/**
 * Format phone number for Infobip (E.164 without + prefix)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number (e.g., 254712345678)
 */
export const formatPhoneNumber = (phoneNumber) => {
  let formatted = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  
  // Handle Kenya numbers
  if (formatted.startsWith('0') && formatted.length === 10) {
    // Kenyan local format: 0712345678 -> 254712345678
    formatted = '254' + formatted.substring(1);
  } else if (formatted.length === 9 && !formatted.startsWith('254')) {
    // 9-digit Kenya number without leading 0
    formatted = '254' + formatted;
  }
  
  return formatted;
};

/**
 * Check if Infobip is configured
 * @returns {boolean} Whether Infobip is properly configured
 */
export const isConfigured = () => {
  return !!process.env.INFOBIP_API_KEY && 
         !!process.env.INFOBIP_BASE_URL && 
         !!process.env.INFOBIP_WHATSAPP_SENDER;
};

/**
 * Send WhatsApp text message using Infobip
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWhatsApp = async (to, message) => {
  try {
    const config = getConfig();
    if (!config) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const formattedTo = formatPhoneNumber(to);
    const url = `${config.baseUrl}/whatsapp/1/message/text`;

    console.log(`[Infobip] Sending WhatsApp to ${formattedTo}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        from: config.sender,
        to: formattedTo,
        content: {
          text: message,
        },
      }),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages.length > 0) {
      const msg = data.messages[0];
      console.log(`[Infobip] WhatsApp sent successfully. MessageId: ${msg.messageId}`);
      return {
        success: true,
        messageId: msg.messageId,
        status: msg.status?.name || 'sent',
      };
    } else {
      const errorMsg = data.requestError?.serviceException?.text || 
                       data.messages?.[0]?.status?.description || 
                       'Failed to send WhatsApp message';
      console.error(`[Infobip] WhatsApp failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("[Infobip] Error sending WhatsApp:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp template message using Infobip
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Template name registered with WhatsApp
 * @param {string} templateNamespace - Template namespace
 * @param {Array} templateData - Template placeholder values
 * @param {string} language - Template language code (default: 'en')
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWhatsAppTemplate = async (to, templateName, templateNamespace, templateData = [], language = 'en') => {
  try {
    const config = getConfig();
    if (!config) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const formattedTo = formatPhoneNumber(to);
    const url = `${config.baseUrl}/whatsapp/1/message/template`;

    console.log(`[Infobip] Sending WhatsApp template "${templateName}" to ${formattedTo}`);

    const body = {
      messages: [{
        from: config.sender,
        to: formattedTo,
        content: {
          templateName: templateName,
          templateData: {
            body: {
              placeholders: templateData,
            },
          },
          language: language,
        },
      }],
    };

    // Add namespace if provided
    if (templateNamespace) {
      body.messages[0].content.templateNamespace = templateNamespace;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages.length > 0) {
      const msg = data.messages[0];
      console.log(`[Infobip] WhatsApp template sent successfully. MessageId: ${msg.messageId}`);
      return {
        success: true,
        messageId: msg.messageId,
        status: msg.status?.name || 'sent',
      };
    } else {
      const errorMsg = data.requestError?.serviceException?.text ||
                       data.messages?.[0]?.status?.description ||
                       'Failed to send WhatsApp template';
      console.error(`[Infobip] WhatsApp template failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("[Infobip] Error sending WhatsApp template:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp OTP message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - The OTP code to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
  const message = `Your Yoombaa verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendWhatsApp(phoneNumber, message);
};

/**
 * Validate Infobip webhook signature (if webhook secret is configured)
 * @param {string} signature - The signature from the webhook header
 * @param {string} payload - The raw request body
 * @returns {boolean} Whether the signature is valid
 */
export const validateWebhookSignature = (signature, payload) => {
  const secret = process.env.INFOBIP_WEBHOOK_SECRET;

  if (!secret) {
    // No secret configured, skip validation
    console.warn('[Infobip] Webhook secret not configured, skipping signature validation');
    return true;
  }

  // Infobip uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
};

/**
 * Parse Infobip webhook event
 * @param {Object} body - The webhook request body
 * @returns {Object} Parsed event data
 */
export const parseWebhookEvent = (body) => {
  try {
    const results = body.results || [];

    return results.map(result => ({
      messageId: result.messageId,
      from: result.from,
      to: result.to,
      receivedAt: result.receivedAt,
      status: result.status?.name,
      statusDescription: result.status?.description,
      errorCode: result.error?.id,
      errorDescription: result.error?.description,
      // For incoming messages
      text: result.message?.text,
      type: result.message?.type,
    }));
  } catch (error) {
    console.error('[Infobip] Error parsing webhook:', error.message);
    return [];
  }
};

/**
 * Get message delivery status
 * @param {string} messageId - The message ID to check
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export const getMessageStatus = async (messageId) => {
  try {
    const config = getConfig();
    if (!config) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const url = `${config.baseUrl}/whatsapp/1/reports?messageId=${messageId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        messageId: result.messageId,
        status: result.status?.name,
        sentAt: result.sentAt,
        doneAt: result.doneAt,
      };
    } else {
      return { success: false, error: 'Message not found' };
    }
  } catch (error) {
    console.error("[Infobip] Error getting message status:", error.message);
    return { success: false, error: error.message };
  }
};

const infobipService = {
  sendWhatsApp,
  sendWhatsAppTemplate,
  sendWhatsAppOTP,
  isConfigured,
  formatPhoneNumber,
  validateWebhookSignature,
  parseWebhookEvent,
  getMessageStatus,
};

export default infobipService;

