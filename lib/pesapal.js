// Pesapal Payment Integration for RentConnect (Yoombaa)
// API 3.0 - REST/JSON with M-Pesa Support
// Documentation: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/

// ============================================
// PESAPAL CONFIGURATION
// ============================================

const PESAPAL_ENV = process.env.PESAPAL_ENV || 'sandbox';

// API URLs based on environment
const API_URLS = {
  sandbox: {
    auth: 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken',
    registerIPN: 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN',
    getIPNList: 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/GetIpnList',
    submitOrder: 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest',
    getStatus: 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus'
  },
  production: {
    auth: 'https://pay.pesapal.com/v3/api/Auth/RequestToken',
    registerIPN: 'https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN',
    getIPNList: 'https://pay.pesapal.com/v3/api/URLSetup/GetIpnList',
    submitOrder: 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest',
    getStatus: 'https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus'
  }
};

export const getApiUrl = (endpoint) => {
  const env = PESAPAL_ENV === 'production' ? 'production' : 'sandbox';
  return API_URLS[env][endpoint];
};

// Subscription Plans (amounts in KES - not cents, Pesapal uses actual amounts)
export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    name: 'Premium Agent',
    amount: 1500, // KSh 1,500
    currency: 'KES',
    interval: 'monthly',
    description: 'Unlimited access to tenant contacts, WhatsApp & Phone integration',
    features: [
      'Unlimited access to tenant contacts',
      'Direct WhatsApp & Phone integration',
      'Real-time lead notifications',
      'Verified Agent badge',
      'Priority support'
    ]
  }
};

// Credit Packages for agents
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 5,
    price: 250,
    label: 'KSh 250',
    description: 'Unlock 5 leads',
    features: ['5 Lead Credits', 'Instant Unlock', 'Email Notifications']
  },
  {
    id: 'basic',
    name: 'Basic Bundle',
    credits: 10,
    price: 500,
    label: 'KSh 500',
    description: 'Unlock 10 leads',
    features: ['10 Lead Credits', 'Instant Unlock', 'Verified Badge']
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    credits: 50,
    price: 1500,
    label: 'KSh 1,500',
    popular: true,
    description: 'Unlock 50 leads',
    features: ['50 Lead Credits', 'Priority Support', 'Full Agent Profile', 'Pro Feed Status']
  },
  {
    id: 'elite',
    name: 'Elite Pack',
    credits: 150,
    price: 3000,
    label: 'KSh 3,000',
    isMain: true,
    description: 'Unlock 150 leads',
    features: ['150 Lead Credits', 'Dedicated Account Manager', 'Custom Profile Branding', 'Priority Verification']
  }
];

// ============================================
// INITIALIZE PAYMENT (via API route for security)
// ============================================

export const initializePayment = async (paymentData) => {
  try {
    const response = await fetch('/api/pesapal/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initializing payment:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// VERIFY PAYMENT (via API route for security)
// ============================================

export const verifyPayment = async (orderTrackingId) => {
  try {
    const response = await fetch(`/api/pesapal/verify?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const calculateSubscriptionEndDate = (startDate, interval = 'monthly') => {
  const date = new Date(startDate);

  switch (interval) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date;
};

export const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount);
};

// Generate unique order ID
export const generateOrderId = (prefix = 'YMB') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Payment status mapping
export const PAYMENT_STATUS = {
  0: 'INVALID',
  1: 'COMPLETED',
  2: 'FAILED',
  3: 'REVERSED'
};

export const getPaymentStatusLabel = (statusCode) => {
  return PAYMENT_STATUS[statusCode] || 'UNKNOWN';
};

// ============================================
// SECURE METADATA SIGNING (Server-side only)
// ============================================

// Helper to sort object keys recursively for consistent JSON stringification
const sortObjectKeys = (obj) => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key]);
      return acc;
    }, {});
};

// Simple HMAC-like signature using Web Crypto API
export const signMetadata = async (metadata, secret) => {
  const encoder = new TextEncoder();
  // Sort keys to ensure consistent stringification regardless of DB field order
  const sortedMetadata = sortObjectKeys(metadata);
  const data = encoder.encode(JSON.stringify(sortedMetadata));
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyMetadataSignature = async (metadata, signature, secret) => {
  const expectedSignature = await signMetadata(metadata, secret);
  return expectedSignature === signature;
};
