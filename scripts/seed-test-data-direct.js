// Direct seeding script - creates test user and leads
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = 'https://yydwhwkvrvgkqnmirbrr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need this from Supabase dashboard

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('\n📝 To use this script:');
  console.log('   1. Go to https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/settings/api');
  console.log('   2. Copy the "service_role" key (secret)');
  console.log('   3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key');
  console.log('   4. Run: node scripts/seed-test-data-direct.js\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedData() {
  console.log('🌱 Seeding test data...\n');
  
  // Create test user via Auth API (bypasses RLS)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'testuser@rentconnect.com',
    password: 'Test123!@#',
    email_confirm: true,
    user_metadata: {
      name: 'Test User',
      phone: '+254700000000'
    }
  });
  
  if (authError) {
    console.error('❌ Error creating auth user:', authError.message);
    return;
  }
  
  console.log('✅ Created auth user:', authData.user.email);
  
  // Create corresponding user profile (service role bypasses RLS)
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email,
      name: 'Test User',
      phone: '+254700000000',
      role: 'tenant',
      type: 'tenant'
    })
    .select()
    .single();
    
  if (userError) {
    console.error('❌ Error creating user profile:', userError.message);
    return;
  }
  
  console.log('✅ Created user profile:', user.email);
  
  // Create test leads
  const testLeads = [
    {
      user_id: user.id,
      name: 'John Doe',
      email: 'john@example.com',
      whatsapp: '+254712345678',
      location: 'Westlands, Nairobi',
      property_type: 'Apartment',
      bedrooms: 2,
      budget: 50000,
      move_in_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      additional_requirements: 'Modern 2BR apartment with parking',
      status: 'active',
      views: 0,
      contacts: 0
    },
    {
      user_id: user.id,
      name: 'Jane Smith',
      email: 'jane@example.com',
      whatsapp: '+254723456789',
      location: 'Kilimani, Nairobi',
      property_type: 'Studio',
      bedrooms: 1,
      budget: 35000,
      move_in_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      additional_requirements: 'Studio close to CBD',
      status: 'active',
      views: 0,
      contacts: 0
    },
    {
      user_id: user.id,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      whatsapp: '+254734567890',
      location: 'Karen, Nairobi',
      property_type: 'House',
      bedrooms: 4,
      budget: 150000,
      move_in_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      additional_requirements: 'Spacious house with garden',
      status: 'active',
      views: 0,
      contacts: 0
    }
  ];
  
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .insert(testLeads)
    .select();
    
  if (leadsError) {
    console.error('❌ Error creating leads:', leadsError.message);
    return;
  }
  
  console.log(`✅ Created ${leads.length} test leads\n`);
  
  leads.forEach(lead => {
    console.log(`   📋 ${lead.name} - ${lead.location} (KES ${lead.budget}/month)`);
  });
  
  console.log('\n🎉 Test data seeded successfully!');
  console.log('🌐 Refresh http://localhost:5000 to see the leads');
}

seedData().catch(console.error);
