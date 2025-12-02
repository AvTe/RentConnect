// Quick test script to verify Supabase connection and data fetching
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yydwhwkvrvgkqnmirbrr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHdod2t2cnZna3FubWlyYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjY4OTcsImV4cCI6MjA4MDE0Mjg5N30.l5TXQLRz1JI9GXoY6jbhe6bdVpekJDRBlETrHWW-0Y4';

async function testConnection() {
  console.log('🔧 Testing Supabase Connection...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test 1: Check connection
  console.log('1️⃣  Testing connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connection successful!\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return;
  }
  
  // Test 2: Fetch leads
  console.log('2️⃣  Fetching leads...');
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) throw error;
    console.log(`✅ Found ${leads?.length || 0} leads`);
    if (leads && leads.length > 0) {
      console.log('   Sample lead:', leads[0]);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to fetch leads:', error.message, '\n');
  }
  
  // Test 3: Check tables exist
  console.log('3️⃣  Checking if tables exist...');
  const tables = ['users', 'leads', 'properties', 'subscriptions', 'notifications'];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) throw error;
      console.log(`✅ Table '${table}' exists`);
    } catch (error) {
      console.error(`❌ Table '${table}' missing or error:`, error.message);
    }
  }
  
  console.log('\n✨ Test complete!');
}

testConnection().catch(console.error);
