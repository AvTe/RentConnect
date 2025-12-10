/**
 * ============================================================================
 * DEPRECATED: AuthKey Messaging Service
 * ============================================================================
 * This file has been replaced by Africa's Talking (lib/africastalking.js)
 * AuthKey was deprecated due to:
 * - Sender ID registration issues for international SMS
 * - WhatsApp template requirements
 * - Limited support for Kenya (+254) numbers
 *
 * Original Documentation: https://authkey.io/sms-api-docs
 *                         https://authkey.io/whatsapp-api-docs
 * ============================================================================
 */

// ============================================================================
// COMMENTED OUT - AuthKey code replaced by Africa's Talking
// ============================================================================

/*
const AUTHKEY_SMS_API_URL = 'https://api.authkey.io/request';
const AUTHKEY_WHATSAPP_API_URL = 'https://console.authkey.io/restapi/request.php';

export const sendSMS = async (mobile, message, countryCode = '91') => {
  try {
    const authKey = process.env.AUTHKEY_API_KEY;
    const senderId = process.env.AUTHKEY_SENDER_ID || 'RENTCO';

    if (!authKey) {
      console.error('AuthKey API key not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    const cleanMobile = mobile.replace(/[\+\s\-]/g, '');

    let mobileWithoutCode = cleanMobile;
    if (cleanMobile.startsWith(countryCode)) {
      mobileWithoutCode = cleanMobile.substring(countryCode.length);
    }

    const params = new URLSearchParams({
      authkey: authKey,
      mobile: mobileWithoutCode,
      country_code: countryCode,
      sms: message,
      sender: senderId,
    });

    if (process.env.AUTHKEY_DLT_ENTITY_ID) {
      params.append('pe_id', process.env.AUTHKEY_DLT_ENTITY_ID);
    }
    if (process.env.AUTHKEY_DLT_TEMPLATE_ID) {
      params.append('template_id', process.env.AUTHKEY_DLT_TEMPLATE_ID);
    }

    const url = `${AUTHKEY_SMS_API_URL}?${params.toString()}`;

    console.log(`[AuthKey] Sending SMS to +${countryCode}${mobileWithoutCode}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.Message === 'Submitted' || data.status === 'success' || data.msgid) {
      console.log(`[AuthKey] SMS sent successfully. Message ID: ${data.msgid || 'N/A'}`);
      return {
        success: true,
        messageId: data.msgid || data.Message,
        response: data
      };
    }

    console.error('[AuthKey] SMS failed:', data);
    return {
      success: false,
      error: data.Message || data.error || 'Failed to send SMS',
      response: data
    };

  } catch (error) {
    console.error('[AuthKey] Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

export const sendOTP = async (phoneNumber, otp) => {
  let countryCode = process.env.AUTHKEY_DEFAULT_COUNTRY_CODE || '91';
  let mobile = phoneNumber;

  if (mobile.startsWith('+')) {
    mobile = mobile.substring(1);
  }

  if (mobile.startsWith('91') && mobile.length >= 12) {
    countryCode = '91';
    mobile = mobile.substring(2);
  } else if (mobile.startsWith('254') && mobile.length >= 12) {
    countryCode = '254';
    mobile = mobile.substring(3);
  } else if (mobile.startsWith('1') && mobile.length >= 11) {
    countryCode = '1';
    mobile = mobile.substring(1);
  }

  const message = `Your RentConnect verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;

  return sendSMS(mobile, message, countryCode);
};
*/

/*
export const sendWhatsApp = async (mobile, message, countryCode = '254', templateId = null, templateVars = {}) => {
  try {
    const authKey = process.env.AUTHKEY_API_KEY;

    if (!authKey) {
      console.error('AuthKey API key not configured');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const cleanMobile = mobile.replace(/[\+\s\-]/g, '');

    let mobileWithoutCode = cleanMobile;
    if (cleanMobile.startsWith(countryCode)) {
      mobileWithoutCode = cleanMobile.substring(countryCode.length);
    }

    const params = new URLSearchParams({
      authkey: authKey,
      mobile: mobileWithoutCode,
      country_code: countryCode,
    });

    if (templateId) {
      params.append('wid', templateId);
      Object.entries(templateVars).forEach(([key, value]) => {
        params.append(key, value);
      });
    } else {
      params.append('message', message);
    }

    const url = `${AUTHKEY_WHATSAPP_API_URL}?${params.toString()}`;

    console.log(`[AuthKey WhatsApp] Sending to +${countryCode}${mobileWithoutCode}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (data.Message === 'Submitted' || data.status === 'success' || data.msgid ||
        (typeof data === 'string' && data.includes('success'))) {
      console.log(`[AuthKey WhatsApp] Message sent successfully. Response:`, data);
      return {
        success: true,
        messageId: data.msgid || data.Message || 'sent',
        response: data
      };
    }

    console.error('[AuthKey WhatsApp] Failed:', data);
    return {
      success: false,
      error: data.Message || data.error || data.message || 'Failed to send WhatsApp message',
      response: data
    };

  } catch (error) {
    console.error('[AuthKey WhatsApp] Error:', error);
    return { success: false, error: error.message };
  }
};

export const sendWhatsAppOTP = async (phoneNumber, otp, templateId = null) => {
  let countryCode = process.env.AUTHKEY_DEFAULT_COUNTRY_CODE || '254';
  let mobile = phoneNumber;

  if (mobile.startsWith('+')) {
    mobile = mobile.substring(1);
  }

  if (mobile.startsWith('254') && mobile.length >= 12) {
    countryCode = '254';
    mobile = mobile.substring(3);
  } else if (mobile.startsWith('91') && mobile.length >= 12) {
    countryCode = '91';
    mobile = mobile.substring(2);
  } else if (mobile.startsWith('1') && mobile.length >= 11) {
    countryCode = '1';
    mobile = mobile.substring(1);
  }

  const whatsappTemplateId = templateId || process.env.AUTHKEY_WHATSAPP_OTP_TEMPLATE_ID;

  if (whatsappTemplateId) {
    return sendWhatsApp(mobile, '', countryCode, whatsappTemplateId, { otp });
  }

  const message = `Your RentConnect verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendWhatsApp(mobile, message, countryCode);
};

export const checkBalance = async () => {
  try {
    const authKey = process.env.AUTHKEY_API_KEY;

    if (!authKey) {
      return { success: false, error: 'AuthKey API key not configured' };
    }

    const url = `https://console.authkey.io/restapi/getbalance.php?authkey=${authKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Balance !== undefined) {
      return { success: true, balance: parseFloat(data.Balance) };
    }

    return { success: false, error: data.Message || 'Failed to get balance' };
  } catch (error) {
    console.error('[AuthKey] Error checking balance:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendSMS,
  sendOTP,
  sendWhatsApp,
  sendWhatsAppOTP,
  checkBalance,
};
*/

// ============================================================================
// Stub exports to prevent import errors - Use lib/africastalking.js instead
// ============================================================================

export const sendSMS = async () => {
  console.warn('[AuthKey] DEPRECATED: Use lib/africastalking.js instead');
  return { success: false, error: 'AuthKey is deprecated. Use Africa\'s Talking.' };
};

export const sendOTP = async () => {
  console.warn('[AuthKey] DEPRECATED: Use lib/africastalking.js instead');
  return { success: false, error: 'AuthKey is deprecated. Use Africa\'s Talking.' };
};

export const sendWhatsApp = async () => {
  console.warn('[AuthKey] DEPRECATED: Use lib/africastalking.js instead');
  return { success: false, error: 'AuthKey is deprecated. Use Africa\'s Talking.' };
};

export const sendWhatsAppOTP = async () => {
  console.warn('[AuthKey] DEPRECATED: Use lib/africastalking.js instead');
  return { success: false, error: 'AuthKey is deprecated. Use Africa\'s Talking.' };
};

export const checkBalance = async () => {
  console.warn('[AuthKey] DEPRECATED: Use lib/africastalking.js instead');
  return { success: false, error: 'AuthKey is deprecated. Use Africa\'s Talking.' };
};

const authkey = {
  sendSMS,
  sendOTP,
  sendWhatsApp,
  sendWhatsAppOTP,
  checkBalance,
};

export default authkey;
