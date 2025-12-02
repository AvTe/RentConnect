// Check if users exist in Supabase Auth
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase Auth Users\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsers() {
  try {
    // List all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error listing users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users in Supabase Auth:\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in Supabase Auth!');
      console.log('\nThis means password reset won\'t work because there are no registered users.');
      console.log('\n📝 To fix this, you need to:');
      console.log('   1. Sign up a user through your app');
      console.log('   2. Or manually create a user in Supabase Dashboard');
      console.log('   3. Then you can use password reset for that user\n');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log('✅ You can send password reset to any of these emails');
    console.log('💡 The email must match exactly what\'s shown above\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAuthUsers();
