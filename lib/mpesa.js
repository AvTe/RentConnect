/**
 * M-Pesa Daraja API Integration
 * Handles STK Push (Lipa Na M-Pesa Online) for direct payments
 * 
 * Documentation: https://developer.safaricom.co.ke/
 */

// Environment configuration
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// API URLs
const API_URLS = {
  sandbox: {
    auth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
  },
  production: {
    auth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
  }
};

// Get the correct URL based on environment
const getApiUrl = (endpoint) => API_URLS[MPESA_ENV]?.[endpoint] || API_URLS.sandbox[endpoint];

// Token cache
let tokenCache = {
  token: null,
  expiresAt: null
};

/**
 * Get OAuth access token from M-Pesa
 */
export async function getAccessToken() {
  // Check if we have a valid cached token
  if (tokenCache.token && tokenCache.expiresAt && new Date() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  
  const response = await fetch(getApiUrl('auth'), {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa token: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token (expires in 1 hour, but refresh at 50 minutes for safety)
  tokenCache = {
    token: data.access_token,
    expiresAt: new Date(Date.now() + 50 * 60 * 1000) // 50 minutes
  };

  return data.access_token;
}

/**
 * Generate the password for STK Push
 * Password = Base64(Shortcode + Passkey + Timestamp)
 */
export function generatePassword(timestamp) {
  return Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
}

/**
 * Generate timestamp in the format YYYYMMDDHHmmss
 */
export function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Format phone number for M-Pesa (254XXXXXXXXX format)
 */
export function formatPhoneNumber(phone) {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
  } else if (cleaned.length === 9) {
    // Assume it's a Kenyan number without prefix
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 */
export async function initiateSTKPush({
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl
}) {
  const accessToken = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount), // M-Pesa requires whole numbers
    PartyA: formattedPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl || MPESA_CALLBACK_URL,
    AccountReference: accountReference?.substring(0, 12) || 'Yoombaa',
    TransactionDesc: transactionDesc?.substring(0, 13) || 'Payment'
  };

  const response = await fetch(getApiUrl('stkPush'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return data;
}

/**
 * Query STK Push transaction status
 */
export async function querySTKStatus(checkoutRequestId) {
  const accessToken = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  };

  const response = await fetch(getApiUrl('stkQuery'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return data;
}

// Export configuration check
export function isMpesaConfigured() {
  return !!(MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET && MPESA_PASSKEY);
}

export { MPESA_SHORTCODE, MPESA_ENV };

