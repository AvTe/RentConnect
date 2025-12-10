/**
 * Africa's Talking SMS Service
 * Provides SMS OTP functionality using Africa's Talking API
 * Documentation: https://developers.africastalking.com/docs/sms/overview
 * 
 * Endpoints:
 * - Live: https://api.africastalking.com/version1/messaging
 * - Sandbox: https://api.sandbox.africastalking.com/version1/messaging
 */

// Use sandbox for testing, live for production
const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging';
const AT_LIVE_URL = 'https://api.africastalking.com/version1/messaging';

/**
 * Get the appropriate API URL based on environment
 * @returns {string} API URL
 */
const getApiUrl = () => {
  const useSandbox = process.env.AT_USE_SANDBOX === 'true';
  return useSandbox ? AT_SANDBOX_URL : AT_LIVE_URL;
};

/**
 * Send SMS using Africa's Talking API
 * @param {string|string[]} recipients - Phone number(s) with country code (e.g., +254731840804)
 * @param {string} message - SMS message content
 * @param {string} from - Sender ID (optional, defaults to AFRICASTKNG)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, response?: object}>}
 */
export const sendSMS = async (recipients, message, from = null) => {
  try {
    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME;

    if (!apiKey || !username) {
      console.error('[Africa\'s Talking] API key or username not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    // Format recipients as comma-separated string
    const to = Array.isArray(recipients) ? recipients.join(',') : recipients;

    // Build request body (application/x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('to', to);
    formData.append('message', message);
    
    // Add sender ID if provided
    if (from || process.env.AT_SENDER_ID) {
      formData.append('from', from || process.env.AT_SENDER_ID);
    }

    const url = getApiUrl();
    
    console.log(`[Africa's Talking] Sending SMS to ${to}`);
    console.log(`[Africa's Talking] Using ${url.includes('sandbox') ? 'SANDBOX' : 'LIVE'} environment`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'ApiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // Parse Africa's Talking response
    // Success response: { SMSMessageData: { Recipients: [...], Message: "Sent to X/X..." } }
    if (data.SMSMessageData && data.SMSMessageData.Recipients) {
      const recipients = data.SMSMessageData.Recipients;
      const successCount = recipients.filter(r => r.status === 'Success' || r.statusCode === 101).length;
      
      if (successCount > 0) {
        const firstRecipient = recipients[0];
        console.log(`[Africa's Talking] SMS sent successfully. Message ID: ${firstRecipient.messageId}`);
        console.log(`[Africa's Talking] Cost: ${firstRecipient.cost}, Status: ${firstRecipient.status}`);
        
        return {
          success: true,
          messageId: firstRecipient.messageId,
          cost: firstRecipient.cost,
          recipients: recipients,
          response: data
        };
      } else {
        // All recipients failed
        const firstRecipient = recipients[0];
        console.error('[Africa\'s Talking] SMS failed:', firstRecipient.status);
        return {
          success: false,
          error: firstRecipient.status || 'Failed to send SMS',
          recipients: recipients,
          response: data
        };
      }
    }

    // Handle error responses
    console.error('[Africa\'s Talking] Unexpected response:', data);
    return {
      success: false,
      error: data.message || data.error || 'Failed to send SMS',
      response: data
    };

  } catch (error) {
    console.error('[Africa\'s Talking] Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP SMS using Africa's Talking
 * @param {string} phoneNumber - Phone number with country code (e.g., +254731840804)
 * @param {string} otp - The OTP code to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOTP = async (phoneNumber, otp) => {
  // Ensure phone number starts with + for international format
  let formattedPhone = phoneNumber;
  if (!formattedPhone.startsWith('+')) {
    // Assume Kenya if no country code
    if (formattedPhone.startsWith('254')) {
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else {
      formattedPhone = '+254' + formattedPhone;
    }
  }

  // Create the OTP message
  const message = `Your RentConnect verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;

  return sendSMS(formattedPhone, message);
};

/**
 * Check Africa's Talking account balance (not directly available via simple API)
 * This is a placeholder - balance check requires different endpoint
 */
export const checkBalance = async () => {
  // Africa's Talking doesn't have a simple balance check endpoint
  // Balance is available in the dashboard
  return { 
    success: false, 
    error: 'Balance check not available via API. Check dashboard at https://account.africastalking.com' 
  };
};

const africasTalking = {
  sendSMS,
  sendOTP,
  checkBalance,
};

export default africasTalking;

