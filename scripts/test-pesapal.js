/**
 * Pesapal Integration Test Script
 * Run with: node scripts/test-pesapal.js
 * 
 * Tests:
 * 1. Authentication (get token)
 * 2. IPN registration check
 * 3. Payment initialization (sandbox)
 */

require('dotenv').config({ path: '.env.local' });

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_ENV = process.env.PESAPAL_ENV || 'sandbox';
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;

// API URLs
const API_URLS = {
  sandbox: {
    auth: 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken',
    getIPNList: 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/GetIpnList',
    submitOrder: 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest',
  },
  production: {
    auth: 'https://pay.pesapal.com/v3/api/Auth/RequestToken',
    getIPNList: 'https://pay.pesapal.com/v3/api/URLSetup/GetIpnList',
    submitOrder: 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest',
  }
};

const getApiUrl = (endpoint) => API_URLS[PESAPAL_ENV === 'production' ? 'production' : 'sandbox'][endpoint];

console.log('\n🔵 PESAPAL INTEGRATION TEST');
console.log('='.repeat(50));
console.log(`Environment: ${PESAPAL_ENV.toUpperCase()}`);
console.log(`Consumer Key: ${PESAPAL_CONSUMER_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`Consumer Secret: ${PESAPAL_CONSUMER_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`IPN ID: ${PESAPAL_IPN_ID || '❌ Missing'}`);
console.log('='.repeat(50));

async function testAuthentication() {
  console.log('\n📝 Test 1: Authentication');
  console.log('-'.repeat(30));
  
  try {
    const response = await fetch(getApiUrl('auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      })
    });

    const data = await response.json();

    if (data.token) {
      console.log('✅ Authentication successful!');
      console.log(`   Token expires: ${data.expiryDate}`);
      return data.token;
    } else {
      console.log('❌ Authentication failed:', data.error || data);
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return null;
  }
}

async function testIPNList(token) {
  console.log('\n📝 Test 2: IPN Registration Check');
  console.log('-'.repeat(30));
  
  try {
    const response = await fetch(getApiUrl('getIPNList'), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      console.log('✅ IPN URLs registered:');
      data.forEach(ipn => {
        const isActive = ipn.ipn_id === PESAPAL_IPN_ID ? ' 👈 ACTIVE' : '';
        console.log(`   - ${ipn.url} (ID: ${ipn.ipn_id})${isActive}`);
      });
    } else {
      console.log('⚠️  No IPN URLs registered. Register one at /api/pesapal/register-ipn');
    }
    return true;
  } catch (error) {
    console.log('❌ IPN list error:', error.message);
    return false;
  }
}

async function testPaymentInit(token) {
  console.log('\n📝 Test 3: Payment Initialization (Dry Run)');
  console.log('-'.repeat(30));
  
  if (PESAPAL_ENV === 'production') {
    console.log('⚠️  Skipping in production mode (would create real payment)');
    console.log('   Switch to PESAPAL_ENV=sandbox to test payment initialization');
    return true;
  }

  try {
    const testOrderId = `TEST-${Date.now()}`;
    const response = await fetch(getApiUrl('submitOrder'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: testOrderId,
        currency: 'KES',
        amount: 1,
        description: 'Test Payment - Yoombaa',
        callback_url: 'https://yoombaa.com/payment/callback',
        notification_id: PESAPAL_IPN_ID,
        billing_address: {
          email_address: 'test@yoombaa.com',
          phone_number: '254700000000',
          country_code: 'KE',
          first_name: 'Test',
          last_name: 'User'
        }
      })
    });

    const data = await response.json();

    if (data.redirect_url) {
      console.log('✅ Payment initialization successful!');
      console.log(`   Order ID: ${testOrderId}`);
      console.log(`   Tracking ID: ${data.order_tracking_id}`);
      console.log(`   Redirect URL: ${data.redirect_url.substring(0, 60)}...`);
    } else {
      console.log('❌ Payment init failed:', data.error?.message || JSON.stringify(data));
    }
    return !!data.redirect_url;
  } catch (error) {
    console.log('❌ Payment init error:', error.message);
    return false;
  }
}

async function runTests() {
  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    console.log('\n❌ Missing Pesapal credentials. Set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET');
    process.exit(1);
  }

  const token = await testAuthentication();
  if (!token) { console.log('\n❌ Cannot continue without valid token'); process.exit(1); }

  await testIPNList(token);
  await testPaymentInit(token);

  console.log('\n' + '='.repeat(50));
  console.log('🏁 PESAPAL TEST COMPLETE');
  console.log('='.repeat(50) + '\n');
}

runTests().catch(console.error);

