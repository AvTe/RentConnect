// Paystack Integration for RentConnect
// Note: Install paystack package: npm install paystack

// ============================================
// PAYSTACK CONFIGURATION
// ============================================

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxx';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxx';

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    name: 'Premium Agent',
    amount: 1500000, // Amount in kobo (₦15,000)
    currency: 'NGN',
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
// INITIALIZE PAYMENT
// ============================================

export const initializePayment = async (email, amount, metadata = {}) => {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // Amount in kobo
        currency: 'NGN',
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Agent Name",
              variable_name: "agent_name",
              value: metadata.agentName || ''
            },
            {
              display_name: "Plan",
              variable_name: "plan",
              value: metadata.plan || 'Premium'
            }
          ]
        },
        callback_url: `${window.location.origin}/payment/callback`,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      })
    });

    const data = await response.json();
    
    if (data.status) {
      return {
        success: true,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference
      };
    }
    
    return { success: false, error: data.message };
  } catch (error) {
    console.error('Error initializing payment:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// VERIFY PAYMENT
// ============================================

export const verifyPayment = async (reference) => {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (data.status && data.data.status === 'success') {
      return {
        success: true,
        data: {
          amount: data.data.amount,
          currency: data.data.currency,
          reference: data.data.reference,
          paidAt: data.data.paid_at,
          customer: data.data.customer,
          metadata: data.data.metadata
        }
      };
    }
    
    return { success: false, error: 'Payment verification failed' };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CLIENT-SIDE PAYMENT POPUP
// ============================================

export const openPaystackPopup = (config) => {
  if (typeof window === 'undefined') return;

  // Load Paystack inline script
  const script = document.createElement('script');
  script.src = 'https://js.paystack.co/v1/inline.js';
  script.async = true;
  
  script.onload = () => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount,
      currency: 'NGN',
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
  };

  document.head.appendChild(script);
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

export const formatAmount = (amountInKobo) => {
  const amount = amountInKobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

// ============================================
// WEBHOOK VERIFICATION (Server-side)
// ============================================

export const verifyWebhookSignature = (requestBody, signature) => {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(requestBody))
    .digest('hex');
  
  return hash === signature;
};
