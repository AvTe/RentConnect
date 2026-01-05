/**
 * Authentication Flow Test Script
 * Tests all authentication-related functionality
 * 
 * Run with: node scripts/test-auth.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔐 Yoombaa Authentication Test Suite\n');
console.log('='.repeat(50));

// Check environment variables
function checkEnvVars() {
  console.log('\n📋 Environment Variables Check:\n');

  const vars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: supabaseAnonKey },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey },
    { name: 'SENDGRID_API_KEY', value: process.env.SENDGRID_API_KEY },
    { name: 'NEXT_PUBLIC_SITE_URL', value: process.env.NEXT_PUBLIC_SITE_URL },
  ];

  let allSet = true;
  vars.forEach(v => {
    const isSet = !!v.value;
    console.log(`  ${isSet ? '✅' : '❌'} ${v.name}: ${isSet ? 'Configured' : 'MISSING'}`);
    if (!isSet) allSet = false;
  });

  return allSet;
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('\n🔌 Testing Supabase Connection:\n');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test basic query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && !error.message.includes('permission')) {
      console.log('  ❌ Connection failed:', error.message);
      return false;
    }

    console.log('  ✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log('  ❌ Connection error:', error.message);
    return false;
  }
}

// Test Admin API (service role)
async function testAdminAPI() {
  console.log('\n🔑 Testing Admin API (Service Role):\n');

  if (!supabaseServiceKey) {
    console.log('  ⚠️  Service role key not configured');
    return false;
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Test generating a password reset link
    const testEmail = 'test-no-send@example.com';
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: {
        redirectTo: 'http://localhost:5000/auth/reset-password'
      }
    });

    if (error) {
      // User not found is expected for test email
      if (error.message.includes('User not found')) {
        console.log('  ✅ Admin API working (test user not found - expected)');
        return true;
      }
      console.log('  ❌ Admin API error:', error.message);
      return false;
    }

    console.log('  ✅ Admin API working - can generate reset links');
    return true;
  } catch (error) {
    console.log('  ❌ Admin API error:', error.message);
    return false;
  }
}

// Test password reset for real user
async function testPasswordResetForRealUser(email) {
  console.log(`\n📧 Testing Password Reset for: ${email}\n`);

  if (!supabaseServiceKey) {
    console.log('  ⚠️  Service role key not configured - using standard flow');
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Check if user exists
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!userData) {
      console.log('  ⚠️  User not found in database');
      return false;
    }

    console.log(`  ✅ User found: ${userData.name || 'No name'}`);

    // Try to generate reset link with admin API
    if (supabaseServiceKey) {
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email.toLowerCase(),
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/auth/reset-password`
        }
      });

      if (resetError) {
        console.log('  ⚠️  Could not generate link via admin API:', resetError.message);

        // Try standard flow
        const { error: standardError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/auth/reset-password`
        });

        if (standardError) {
          console.log('  ❌ Standard reset also failed:', standardError.message);
          return false;
        }
        console.log('  ✅ Password reset initiated via standard flow');
        console.log('  ℹ️  Check if Supabase email settings are configured');
        return true;
      }

      if (resetData?.properties?.action_link) {
        console.log('  ✅ Reset link generated successfully!');
        console.log('  🔗 Link preview:', resetData.properties.action_link.substring(0, 80) + '...');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return false;
  }
}

// Check SendGrid configuration
async function testSendGrid() {
  console.log('\n📨 Testing SendGrid Configuration:\n');

  if (!process.env.SENDGRID_API_KEY) {
    console.log('  ❌ SENDGRID_API_KEY not configured');
    return false;
  }

  // Just validate the API key format
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey.startsWith('SG.')) {
    console.log('  ✅ SendGrid API key format valid');
    return true;
  } else {
    console.log('  ⚠️  SendGrid API key format may be incorrect (should start with SG.)');
    return false;
  }
}

// Main test runner
async function runTests() {
  const results = {
    envVars: false,
    supabaseConnection: false,
    adminAPI: false,
    sendGrid: false,
    passwordReset: false
  };

  // Run tests
  results.envVars = checkEnvVars();

  if (results.envVars) {
    results.supabaseConnection = await testSupabaseConnection();
    results.adminAPI = await testAdminAPI();
    results.sendGrid = await testSendGrid();

    // Test with real email if provided as argument
    const testEmail = process.argv[2];
    if (testEmail) {
      results.passwordReset = await testPasswordResetForRealUser(testEmail);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:\n');

  Object.entries(results).forEach(([test, passed]) => {
    if (test === 'passwordReset' && !process.argv[2]) {
      console.log(`  ⏭️  ${test}: Skipped (no email provided)`);
    } else {
      console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    }
  });

  console.log('\n💡 Tips:');
  console.log('  - To test password reset: node scripts/test-auth.js your@email.com');
  console.log('  - Check Supabase Dashboard > Authentication > Email Templates');
  console.log('  - Ensure SendGrid sender email is verified\n');

  // Production readiness check
  console.log('🚀 Production Readiness:\n');

  const prodChecks = [
    { name: 'Environment variables', pass: results.envVars },
    { name: 'Database connection', pass: results.supabaseConnection },
    { name: 'Admin API access', pass: results.adminAPI },
    { name: 'Email service', pass: results.sendGrid },
  ];

  const allPassed = prodChecks.every(c => c.pass);
  prodChecks.forEach(c => {
    console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  });

  console.log(`\n  ${allPassed ? '🎉 Ready for deployment!' : '⚠️  Fix issues before deploying'}\n`);
}

runTests().catch(console.error);
