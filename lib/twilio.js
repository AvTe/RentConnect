/**
 * @deprecated This module is DEPRECATED and will be removed in a future version.
 *
 * Twilio SMS & WhatsApp Service (DEPRECATED)
 * ============================================
 * This service has been replaced by:
 * - SMS: Africa's Talking (lib/africastalking.js)
 * - WhatsApp: Infobip (lib/infobip.js)
 *
 * DO NOT USE THIS MODULE FOR NEW CODE.
 */

console.warn("[DEPRECATED] lib/twilio.js is deprecated. Use lib/africastalking.js for SMS and lib/infobip.js for WhatsApp.");

/**
 * @deprecated Use Africa's Talking sendSMS instead
 */
export const sendSMS = async (to, message) => {
  console.error('[DEPRECATED] Twilio sendSMS is deprecated. Use Africa\'s Talking instead.');
  return { success: false, error: 'Twilio is deprecated. Use Africa\'s Talking for SMS.' };
};

/**
 * @deprecated Use Africa's Talking sendOTP instead
 */
export const sendOTP = async (phoneNumber, otp) => {
  console.error('[DEPRECATED] Twilio sendOTP is deprecated. Use Africa\'s Talking instead.');
  return { success: false, error: 'Twilio is deprecated. Use Africa\'s Talking for OTP.' };
};

/**
 * @deprecated Use Infobip sendWhatsApp instead
 */
export const sendWhatsApp = async (to, message) => {
  console.error('[DEPRECATED] Twilio sendWhatsApp is deprecated. Use Infobip instead.');
  return { success: false, error: 'Twilio is deprecated. Use Infobip for WhatsApp.' };
};

/**
 * @deprecated Use Infobip for WhatsApp messages
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
  console.error('[DEPRECATED] Twilio sendWhatsAppOTP is deprecated. Use Infobip instead.');
  return { success: false, error: 'Twilio is deprecated. Use Infobip for WhatsApp OTP.' };
};

const twilioService = {
  sendSMS,
  sendOTP,
  sendWhatsApp,
  sendWhatsAppOTP,
};

export default twilioService;

