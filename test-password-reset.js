// Test password reset email functionality
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Password Reset Email\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✓ Present' : '✗ Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  const testEmail = 'kartikamit171@gmail.com'; // Use your actual email
  
  console.log(`\n📧 Sending password reset to: ${testEmail}`);
  console.log('Redirect URL: http://localhost:5000/auth/reset-password\n');

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5000/auth/reset-password'
    });

    if (error) {
      console.error('❌ Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      
      // Check for common issues
      if (error.message.includes('SMTP')) {
        console.log('\n⚠️  SMTP Configuration Issue:');
        console.log('   Supabase might not have email configured properly.');
        console.log('   Go to: https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/settings/auth');
        console.log('   Check "SMTP Settings" section');
      }
      
      if (error.message.includes('rate limit')) {
        console.log('\n⚠️  Rate Limit Hit:');
        console.log('   Too many requests. Wait a few minutes and try again.');
      }
      
      return;
    }

    console.log('✅ Password reset email request sent successfully!');
    console.log('Response data:', data);
    
    console.log('\n📨 What to check:');
    console.log('   1. Check inbox for:', testEmail);
    console.log('   2. Check spam/junk folder');
    console.log('   3. Wait up to 2-5 minutes for email delivery');
    console.log('   4. Check Supabase dashboard logs:');
    console.log('      https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/logs/edge-logs');
    
    // Check if user exists
    console.log('\n🔍 Checking if user exists...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', testEmail)
      .single();
      
    if (userError) {
      console.log('⚠️  User not found in users table');
    } else {
      console.log('✅ User exists:', userData.email);
    }
    
    // Check auth users
    console.log('\n🔍 Checking Supabase Auth...');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('Current auth state:', authUser ? 'Logged in' : 'Not logged in');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testPasswordReset();
