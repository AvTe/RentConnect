/**
 * Twilio SMS & WhatsApp Test Script
 * 
 * Usage: node scripts/test-twilio.js [phone_number]
 * Example: node scripts/test-twilio.js +254712345678
 * 
 * This script tests:
 * 1. Twilio credentials configuration
 * 2. SMS sending capability
 * 3. WhatsApp sending capability (if configured)
 */

require('dotenv').config({ path: '.env.local' });

const twilio = require('twilio');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testTwilioConfig() {
  logSection('📋 TWILIO CONFIGURATION CHECK');

  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  };

  let allConfigured = true;

  for (const [key, value] of Object.entries(config)) {
    if (value) {
      const masked = key === 'authToken'
        ? value.substring(0, 4) + '****' + value.substring(value.length - 4)
        : value;
      log(`  ✅ ${key}: ${masked}`, 'green');
    } else {
      log(`  ❌ ${key}: NOT CONFIGURED`, 'red');
      allConfigured = false;
    }
  }

  return allConfigured ? config : null;
}

async function testSMS(client, fromNumber, toNumber) {
  logSection('📱 SMS TEST');

  try {
    log(`Sending test SMS to ${toNumber}...`, 'yellow');

    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: `[Yoombaa Test] SMS test successful at ${new Date().toLocaleTimeString()}. Twilio integration is working!`,
    });

    log(`  ✅ SMS sent successfully!`, 'green');
    log(`  📧 Message SID: ${message.sid}`, 'blue');
    log(`  📊 Status: ${message.status}`, 'blue');

    return true;
  } catch (error) {
    log(`  ❌ SMS failed: ${error.message}`, 'red');
    if (error.code) {
      log(`  📛 Error code: ${error.code}`, 'red');
    }
    return false;
  }
}

async function testWhatsApp(client, fromNumber, toNumber) {
  logSection('💬 WHATSAPP TEST');

  if (!fromNumber) {
    log('  ⚠️ WhatsApp number not configured, skipping...', 'yellow');
    return null;
  }

  try {
    const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const whatsappTo = `whatsapp:${toNumber}`;

    log(`Sending test WhatsApp to ${toNumber}...`, 'yellow');

    const message = await client.messages.create({
      from: whatsappFrom,
      to: whatsappTo,
      body: `[Yoombaa Test] WhatsApp test successful at ${new Date().toLocaleTimeString()}. Twilio integration is working!`,
    });

    log(`  ✅ WhatsApp sent successfully!`, 'green');
    log(`  📧 Message SID: ${message.sid}`, 'blue');
    log(`  📊 Status: ${message.status}`, 'blue');

    return true;
  } catch (error) {
    log(`  ❌ WhatsApp failed: ${error.message}`, 'red');
    if (error.code === 21608) {
      log(`  ℹ️  Note: WhatsApp requires the recipient to have messaged your sandbox number first`, 'yellow');
      log(`     Send "join <sandbox-keyword>" to your Twilio WhatsApp number to enable`, 'yellow');
    }
    return false;
  }
}

async function main() {
  console.log('\n');
  log('🔧 TWILIO SMS & WHATSAPP TEST SCRIPT', 'cyan');
  log('━'.repeat(60), 'cyan');

  // Get phone number from command line or use default test number
  const testPhoneNumber = process.argv[2] || '+254712345678';
  log(`\nTest recipient: ${testPhoneNumber}`, 'blue');

  // Check configuration
  const config = await testTwilioConfig();

  if (!config) {
    log('\n❌ Twilio is not properly configured. Please check your .env.local file.', 'red');
    process.exit(1);
  }

  // Create Twilio client
  const client = twilio(config.accountSid, config.authToken);

  // Test SMS
  const smsResult = await testSMS(client, config.phoneNumber, testPhoneNumber);

  // Test WhatsApp
  const whatsappResult = await testWhatsApp(client, config.whatsappNumber, testPhoneNumber);

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`  SMS:      ${smsResult ? '✅ PASSED' : '❌ FAILED'}`, smsResult ? 'green' : 'red');
  log(`  WhatsApp: ${whatsappResult === null ? '⚠️ SKIPPED' : (whatsappResult ? '✅ PASSED' : '❌ FAILED')}`,
    whatsappResult === null ? 'yellow' : (whatsappResult ? 'green' : 'red'));

  console.log('\n');
}

main().catch(console.error);

