// Paystack Integration for RentConnect
// Client-side utilities - API calls are made through secure API routes

// ============================================
// PAYSTACK CONFIGURATION
// ============================================

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxx';

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    name: 'Premium Agent',
    amount: 150000, // Amount in cents (KSh 1,500)
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

// ============================================
// INITIALIZE PAYMENT (via API route for security)
// ============================================

export const initializePayment = async (email, amount, metadata = {}) => {
  try {
    const callbackUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/payment/callback`
      : '';

    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        metadata,
        callbackUrl
      })
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

export const verifyPayment = async (reference) => {
  try {
    const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, {
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
// CLIENT-SIDE PAYMENT POPUP
// ============================================

// Track if Paystack script is already loaded
let paystackScriptLoaded = false;
let paystackScriptLoading = false;
const paystackLoadCallbacks = [];

const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    if (paystackScriptLoaded && window.PaystackPop) {
      resolve();
      return;
    }

    if (paystackScriptLoading) {
      paystackLoadCallbacks.push({ resolve, reject });
      return;
    }

    paystackScriptLoading = true;

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existingScript && window.PaystackPop) {
      paystackScriptLoaded = true;
      paystackScriptLoading = false;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;

    script.onload = () => {
      paystackScriptLoaded = true;
      paystackScriptLoading = false;
      resolve();
      paystackLoadCallbacks.forEach(cb => cb.resolve());
      paystackLoadCallbacks.length = 0;
    };

    script.onerror = (error) => {
      paystackScriptLoading = false;
      reject(error);
      paystackLoadCallbacks.forEach(cb => cb.reject(error));
      paystackLoadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
};

export const openPaystackPopup = async (config) => {
  if (typeof window === 'undefined') return;

  try {
    await loadPaystackScript();

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount,
      currency: 'KES',
      ref: config.reference || '' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: config.metadata || {},
      callback: (response) => {
        if (config.onSuccess) {
          config.onSuccess(response);
        }
      },
      onClose: () => {
        if (config.onClose) {
          config.onClose();
        }
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Error loading Paystack:', error);
    if (config.onClose) {
      config.onClose();
    }
  }
};

// ============================================
// SUBSCRIPTION HELPERS
// ============================================

export const calculateSubscriptionEndDate = (startDate, interval = 'monthly') => {
  const date = new Date(startDate);
  
  switch (interval) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date;
};

export const formatAmount = (amountInCents) => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount);
};

// Note: Webhook signature verification is now handled server-side in app/api/paystack/webhook/route.js
