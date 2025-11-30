import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/pesapal';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// Token cache (in production, use Redis or similar)
let tokenCache = {
  token: null,
  expiryDate: null
};

export async function POST() {
  try {
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      console.error('Pesapal credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Check if we have a valid cached token
    if (tokenCache.token && tokenCache.expiryDate) {
      const expiryTime = new Date(tokenCache.expiryDate).getTime();
      const now = Date.now();
      // Use token if it has more than 1 minute validity
      if (expiryTime - now > 60000) {
        return NextResponse.json({
          success: true,
          token: tokenCache.token,
          expiryDate: tokenCache.expiryDate
        });
      }
    }

    // Request new token
    const response = await fetch(getApiUrl('auth'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      })
    });

    const data = await response.json();

    if (data.token) {
      // Cache the token
      tokenCache = {
        token: data.token,
        expiryDate: data.expiryDate
      };

      return NextResponse.json({
        success: true,
        token: data.token,
        expiryDate: data.expiryDate
      });
    }

    return NextResponse.json(
      { success: false, error: data.error?.message || 'Authentication failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Pesapal auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get valid token (for internal use by other routes)
export async function getValidToken() {
  // Check cached token
  if (tokenCache.token && tokenCache.expiryDate) {
    const expiryTime = new Date(tokenCache.expiryDate).getTime();
    const now = Date.now();
    if (expiryTime - now > 60000) {
      return tokenCache.token;
    }
  }

  // Request new token
  const response = await fetch(getApiUrl('auth'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET
    })
  });

  const data = await response.json();

  if (data.token) {
    tokenCache = {
      token: data.token,
      expiryDate: data.expiryDate
    };
    return data.token;
  }

  throw new Error('Failed to get Pesapal auth token');
}
