import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/pesapal';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// Token cache
let tokenCache = {
  token: null,
  expiryDate: null
};

async function getValidToken() {
  if (tokenCache.token && tokenCache.expiryDate) {
    const expiryTime = new Date(tokenCache.expiryDate).getTime();
    const now = Date.now();
    if (expiryTime - now > 60000) {
      return tokenCache.token;
    }
  }

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

  throw new Error('Failed to authenticate with Pesapal');
}

export async function POST(request) {
  try {
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Pesapal credentials not configured' },
        { status: 500 }
      );
    }

    const { ipnUrl, notificationType = 'POST' } = await request.json();

    if (!ipnUrl) {
      return NextResponse.json(
        { success: false, error: 'IPN URL is required' },
        { status: 400 }
      );
    }

    // Get auth token
    const token = await getValidToken();

    // Register IPN URL
    const response = await fetch(getApiUrl('registerIPN'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: notificationType
      })
    });

    const data = await response.json();

    if (data.ipn_id) {
      return NextResponse.json({
        success: true,
        ipnId: data.ipn_id,
        url: data.url,
        status: data.ipn_status_description
      });
    }

    return NextResponse.json(
      { success: false, error: data.error?.message || 'Failed to register IPN URL' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error registering IPN URL:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Get list of registered IPN URLs
export async function GET() {
  try {
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Pesapal credentials not configured' },
        { status: 500 }
      );
    }

    const token = await getValidToken();

    const response = await fetch(getApiUrl('getIPNList'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ipnList: data
    });
  } catch (error) {
    console.error('Error getting IPN list:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
