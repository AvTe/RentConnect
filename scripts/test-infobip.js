/**
 * Infobip WhatsApp Test Script
 * 
 * Usage: node scripts/test-infobip.js [phone_number]
 * Example: node scripts/test-infobip.js +254712345678
 * 
 * This script tests:
 * 1. Infobip credentials configuration
 * 2. WhatsApp message sending capability
 * 3. Message status retrieval
 */

require('dotenv').config({ path: '.env.local' });

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

/**
 * Format phone number for Infobip (without + prefix)
 */
function formatPhoneNumber(phoneNumber) {
  let formatted = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  
  if (formatted.startsWith('0') && formatted.length === 10) {
    formatted = '254' + formatted.substring(1);
  } else if (formatted.length === 9 && !formatted.startsWith('254')) {
    formatted = '254' + formatted;
  }
  
  return formatted;
}

async function testInfobipConfig() {
  logSection("📋 INFOBIP CONFIGURATION CHECK");
  
  const config = {
    apiKey: process.env.INFOBIP_API_KEY,
    baseUrl: process.env.INFOBIP_BASE_URL,
    sender: process.env.INFOBIP_WHATSAPP_SENDER,
    webhookSecret: process.env.INFOBIP_WEBHOOK_SECRET || '(not configured)',
  };

  let allConfigured = true;

  for (const [key, value] of Object.entries(config)) {
    if (value && value !== '(not configured)') {
      const masked = key === 'apiKey' 
        ? value.substring(0, 8) + '****' + value.substring(value.length - 4)
        : value;
      log(`  ✅ ${key}: ${masked}`, 'green');
    } else if (key === 'webhookSecret') {
      log(`  ⚠️  ${key}: ${value} (optional)`, 'yellow');
    } else {
      log(`  ❌ ${key}: NOT CONFIGURED`, 'red');
      allConfigured = false;
    }
  }

  return allConfigured ? config : null;
}

async function testWhatsApp(config, toNumber) {
  logSection('📱 WHATSAPP MESSAGE TEST');
  
  try {
    const formattedTo = formatPhoneNumber(toNumber);
    log(`Sending test WhatsApp to ${formattedTo}...`, 'yellow');
    
    const url = `${config.baseUrl}/whatsapp/1/message/text`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        from: config.sender,
        to: formattedTo,
        content: {
          text: `[Yoombaa Test] WhatsApp test successful at ${new Date().toLocaleTimeString()}. Infobip integration is working!`,
        },
      }),
    });

    const data = await response.json();
    
    console.log('\nAPI Response:', JSON.stringify(data, null, 2));

    // Check for single message response format (text messages)
    if (response.ok && data.messageId) {
      const status = data.status;

      if (status?.groupName === 'PENDING') {
        log(`  ✅ WhatsApp message queued successfully!`, 'green');
        log(`  📧 Message ID: ${data.messageId}`, 'blue');
        log(`  📊 Status: ${status?.name} (${status?.description})`, 'blue');
        return { success: true, messageId: data.messageId };
      } else if (status?.groupName === 'REJECTED') {
        log(`  ❌ WhatsApp rejected: ${status?.description}`, 'red');
        log(`  📧 Message ID: ${data.messageId}`, 'blue');
        if (status?.name === 'REJECTED_DESTINATION_NOT_REGISTERED') {
          log(`  💡 This means the recipient doesn't have WhatsApp or hasn't opted in.`, 'yellow');
        }
        return { success: false, messageId: data.messageId };
      } else {
        log(`  ⚠️  WhatsApp status: ${status?.name}`, 'yellow');
        log(`  📧 Message ID: ${data.messageId}`, 'blue');
        return { success: true, messageId: data.messageId };
      }
    }

    // Check for messages array format (template messages)
    if (response.ok && data.messages && data.messages.length > 0) {
      const msg = data.messages[0];
      log(`  ✅ WhatsApp message sent!`, 'green');
      log(`  📧 Message ID: ${msg.messageId}`, 'blue');
      log(`  📊 Status: ${msg.status?.name}`, 'blue');
      return { success: true, messageId: msg.messageId };
    }

    const errorMsg = data.requestError?.serviceException?.text ||
                     data.status?.description ||
                     data.messages?.[0]?.status?.description ||
                     'Unknown error';
    log(`  ❌ WhatsApp failed: ${errorMsg}`, 'red');
    return { success: false };
  } catch (error) {
    log(`  ❌ WhatsApp failed: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testMessageStatus(config, messageId) {
  logSection('📊 MESSAGE STATUS CHECK');
  
  if (!messageId) {
    log('  ⚠️  No message ID to check', 'yellow');
    return null;
  }
  
  try {
    log(`Checking status for message ${messageId}...`, 'yellow');
    
    const url = `${config.baseUrl}/whatsapp/1/reports?messageId=${messageId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.results && data.results.length > 0) {
      const result = data.results[0];
      log(`  ✅ Status retrieved successfully`, 'green');
      log(`  📧 Message ID: ${result.messageId}`, 'blue');
      log(`  📊 Status: ${result.status?.name}`, 'blue');
      log(`  ⏰ Sent At: ${result.sentAt}`, 'blue');
      if (result.doneAt) {
        log(`  ✅ Done At: ${result.doneAt}`, 'blue');
      }
      return true;
    }

    log(`  ⚠️  Could not retrieve status (message may still be processing)`, 'yellow');
    return null;
  } catch (error) {
    log(`  ❌ Status check failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  console.log('\n');
  log("🔧 INFOBIP WHATSAPP TEST SCRIPT", 'cyan');
  log('━'.repeat(60), 'cyan');

  // Get phone number from command line or use default test number
  const testPhoneNumber = process.argv[2] || '+254712345678';
  log(`\nTest recipient: ${testPhoneNumber}`, 'blue');

  // Check configuration
  const config = await testInfobipConfig();

  if (!config) {
    log("\n❌ Infobip is not properly configured. Please check your .env.local file.", 'red');
    log('\nRequired environment variables:', 'yellow');
    log('  INFOBIP_API_KEY=your_infobip_api_key', 'yellow');
    log('  INFOBIP_BASE_URL=https://xxxxx.api.infobip.com', 'yellow');
    log('  INFOBIP_WHATSAPP_SENDER=254700000000', 'yellow');
    process.exit(1);
  }

  // Test WhatsApp
  const whatsappResult = await testWhatsApp(config, testPhoneNumber);

  // Wait a moment then check status
  if (whatsappResult.success && whatsappResult.messageId) {
    log('\nWaiting 3 seconds before checking message status...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await testMessageStatus(config, whatsappResult.messageId);
  }

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`  WhatsApp: ${whatsappResult.success ? '✅ PASSED' : '❌ FAILED'}`, whatsappResult.success ? 'green' : 'red');

  if (whatsappResult.success) {
    log('\n💡 Note: WhatsApp Business API requires the recipient to have', 'yellow');
    log('   messaged your business number first (opt-in) within 24 hours,', 'yellow');
    log('   OR you must use an approved template message.', 'yellow');
  }

  console.log('\n');
}

main().catch(console.error);

