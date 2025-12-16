/**
 * Twilio SMS & WhatsApp Service
 * Unified messaging service for all SMS and WhatsApp communications
 * Documentation: https://www.twilio.com/docs/sms
 *                https://www.twilio.com/docs/whatsapp
 */

const twilio = require('twilio');

/**
 * Get Twilio client instance
 * @returns {Object|null} Twilio client or null if not configured
 */
const getClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('[Twilio] Account SID or Auth Token not configured');
    return null;
  }

  return twilio(accountSid, authToken);
};

/**
 * Format phone number to E.164 format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Ensure it starts with +
  if (!formatted.startsWith('+')) {
    // Assume Kenya if no country code
    if (formatted.startsWith('254')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('0')) {
      formatted = '+254' + formatted.substring(1);
    } else if (formatted.length === 9) {
      // 9-digit Kenya number without leading 0
      formatted = '+254' + formatted;
    } else {
      formatted = '+' + formatted;
    }
  }
  
  return formatted;
};

/**
 * Send SMS using Twilio
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendSMS = async (to, message) => {
  try {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'SMS service not configured' };
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      console.error('[Twilio] TWILIO_PHONE_NUMBER not configured');
      return { success: false, error: 'SMS sender number not configured' };
    }

    const formattedTo = formatPhoneNumber(to);
    
    console.log(`[Twilio] Sending SMS to ${formattedTo}`);

    const result = await client.messages.create({
      from: fromNumber,
      to: formattedTo,
      body: message,
    });

    console.log(`[Twilio] SMS sent successfully. SID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('[Twilio] Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP SMS using Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - The OTP code to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOTP = async (phoneNumber, otp) => {
  const message = `Your RentConnect verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send WhatsApp message using Twilio
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - WhatsApp message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWhatsApp = async (to, message) => {
  try {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      console.error('[Twilio] TWILIO_WHATSAPP_NUMBER not configured');
      return { success: false, error: 'WhatsApp sender number not configured' };
    }

    const formattedTo = formatPhoneNumber(to);
    
    console.log(`[Twilio] Sending WhatsApp to ${formattedTo}`);

    const result = await client.messages.create({
      from: whatsappNumber.startsWith('whatsapp:') ? whatsappNumber : `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${formattedTo}`,
      body: message,
    });

    console.log(`[Twilio] WhatsApp sent successfully. SID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('[Twilio] Error sending WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP via WhatsApp using Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - The OTP code to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
  const message = `Your RentConnect verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendWhatsApp(phoneNumber, message);
};

const twilioService = {
  sendSMS,
  sendOTP,
  sendWhatsApp,
  sendWhatsAppOTP,
};

export default twilioService;

