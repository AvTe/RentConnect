/**
 * Africa's Talking SMS Test Script
 * 
 * Usage: node scripts/test-africastalking.js [phone_number]
 * Example: node scripts/test-africastalking.js +254712345678
 * 
 * This script tests:
 * 1. Africa's Talking credentials configuration
 * 2. SMS sending capability
 */

require('dotenv').config({ path: '.env.local' });

const AfricasTalking = require('africastalking');

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

async function testAfricasTalkingConfig() {
  logSection("📋 AFRICA'S TALKING CONFIGURATION CHECK");
  
  const config = {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
    useSandbox: process.env.AT_USE_SANDBOX === 'true',
    senderId: process.env.AT_SENDER_ID || '(not configured)',
  };

  let allConfigured = true;

  for (const [key, value] of Object.entries(config)) {
    if (value && value !== '(not configured)') {
      const masked = key === 'apiKey' 
        ? value.substring(0, 8) + '****' + value.substring(value.length - 4)
        : value;
      log(`  ✅ ${key}: ${masked}`, 'green');
    } else if (key === 'senderId') {
      log(`  ⚠️  ${key}: ${value} (optional)`, 'yellow');
    } else {
      log(`  ❌ ${key}: NOT CONFIGURED`, 'red');
      allConfigured = false;
    }
  }

  return allConfigured ? config : null;
}

async function testSMS(client, toNumber, senderId) {
  logSection('📱 SMS TEST');
  
  try {
    log(`Sending test SMS to ${toNumber}...`, 'yellow');
    
    const sms = client.SMS;
    const options = {
      to: [toNumber],
      message: `[Yoombaa Test] SMS test successful at ${new Date().toLocaleTimeString()}. Africa's Talking integration is working!`,
    };

    // Add sender ID if configured
    if (senderId && senderId !== '(not configured)') {
      options.from = senderId;
    }

    const result = await sms.send(options);
    
    console.log('\nAPI Response:', JSON.stringify(result, null, 2));

    if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
      const recipient = result.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success' || recipient.statusCode === 101) {
        log(`  ✅ SMS sent successfully!`, 'green');
        log(`  📧 Message ID: ${recipient.messageId}`, 'blue');
        log(`  💰 Cost: ${recipient.cost}`, 'blue');
        log(`  📊 Status: ${recipient.status}`, 'blue');
        return true;
      } else {
        log(`  ❌ SMS failed: ${recipient.status}`, 'red');
        return false;
      }
    }
    
    log(`  ❌ SMS failed: No recipients in response`, 'red');
    return false;
  } catch (error) {
    log(`  ❌ SMS failed: ${error.message}`, 'red');
    if (error.code) {
      log(`  📛 Error code: ${error.code}`, 'red');
    }
    return false;
  }
}

async function main() {
  console.log('\n');
  log("🔧 AFRICA'S TALKING SMS TEST SCRIPT", 'cyan');
  log('━'.repeat(60), 'cyan');

  // Get phone number from command line or use default test number
  const testPhoneNumber = process.argv[2] || '+254712345678';
  log(`\nTest recipient: ${testPhoneNumber}`, 'blue');

  // Check configuration
  const config = await testAfricasTalkingConfig();
  
  if (!config) {
    log("\n❌ Africa's Talking is not properly configured. Please check your .env.local file.", 'red');
    log('\nRequired environment variables:', 'yellow');
    log('  AT_API_KEY=your_africastalking_api_key', 'yellow');
    log('  AT_USERNAME=sandbox (or your production username)', 'yellow');
    log('  AT_USE_SANDBOX=true (or false for production)', 'yellow');
    process.exit(1);
  }

  // Create Africa's Talking client
  const client = AfricasTalking({
    apiKey: config.apiKey,
    username: config.username,
  });

  // Test SMS
  const smsResult = await testSMS(client, testPhoneNumber, config.senderId);

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`  SMS: ${smsResult ? '✅ PASSED' : '❌ FAILED'}`, smsResult ? 'green' : 'red');
  
  console.log('\n');
}

main().catch(console.error);

