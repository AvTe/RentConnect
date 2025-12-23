/**
 * Africa's Talking SMS Service
 * Unified messaging service for SMS communications in Kenya/Africa
 * Documentation: https://developers.africastalking.com/docs/sms/overview
 * Dashboard: https://account.africastalking.com
 */

const AfricasTalking = require('africastalking');

/**
 * Get Africa's Talking client instance
 * @returns {Object|null} Africa's Talking client or null if not configured
 */
const getClient = () => {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    console.error("[Africa's Talking] API Key or Username not configured");
    return null;
  }

  const options = {
    apiKey,
    username,
  };

  return AfricasTalking(options);
};

/**
 * Format phone number to E.164 format for Kenya
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
 * Send SMS using Africa's Talking
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, cost?: string, error?: string}>}
 */
export const sendSMS = async (to, message) => {
  try {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'SMS service not configured' };
    }

    const sms = client.SMS;
    const formattedTo = formatPhoneNumber(to);
    
    console.log(`[Africa's Talking] Sending SMS to ${formattedTo}`);

    const options = {
      to: [formattedTo],
      message: message,
    };

    // Add sender ID if configured (requires approval for production)
    if (process.env.AT_SENDER_ID) {
      options.from = process.env.AT_SENDER_ID;
    }

    const result = await sms.send(options);
    
    console.log(`[Africa's Talking] SMS Response:`, JSON.stringify(result, null, 2));

    // Check if message was sent successfully
    if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
      const recipient = result.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success' || recipient.statusCode === 101) {
        console.log(`[Africa's Talking] SMS sent successfully. MessageId: ${recipient.messageId}`);
        return {
          success: true,
          messageId: recipient.messageId,
          cost: recipient.cost,
          status: recipient.status,
        };
      } else {
        console.error(`[Africa's Talking] SMS failed: ${recipient.status}`);
        return { success: false, error: recipient.status || 'Failed to send SMS' };
      }
    }

    return { success: false, error: 'No recipients in response' };
  } catch (error) {
    console.error("[Africa's Talking] Error sending SMS:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP SMS using Africa's Talking
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - The OTP code to send
 * @returns {Promise<{success: boolean, messageId?: string, cost?: string, error?: string}>}
 */
export const sendOTP = async (phoneNumber, otp) => {
  const message = `Your Yoombaa verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
};

/**
 * Check if Africa's Talking is configured
 * @returns {boolean} Whether Africa's Talking is properly configured
 */
export const isConfigured = () => {
  return !!process.env.AT_API_KEY && !!process.env.AT_USERNAME;
};

const africasTalkingService = {
  sendSMS,
  sendOTP,
  isConfigured,
  formatPhoneNumber,
};

export default africasTalkingService;

