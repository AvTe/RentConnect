// Simple seeding script - creates user via Auth API then adds leads
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

console.log('✓ Service key loaded');
console.log('✓ Supabase URL:', supabaseUrl);

// Service role bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedData() {
  console.log('🌱 Seeding test data...\n');
  
  try {
    // Step 1: Create or get test user via Auth Admin API
    console.log('👤 Creating test user via Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'testuser@rentconnect.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        phone: '+254700000000'
      }
    });

    let userId;

    if (authError) {
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        console.log('ℹ️  User already exists, fetching...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === 'testuser@rentconnect.com');
        userId = existingUser.id;
        console.log('✅ Found user:', existingUser.email);
      } else {
        throw authError;
      }
    } else {
      userId = authData.user.id;
      console.log('✅ Auth user created:', authData.user.email);
    }

    // Step 2: Ensure user record exists in users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!userRecord) {
      console.log('📝 Creating user record...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: 'testuser@rentconnect.com',
          name: 'Test User',
          phone: '+254700000000',
          role: 'tenant',
          wallet_balance: 0
        });
        
      if (insertError) {
        console.error('❌ Error creating user record:', insertError.message);
        throw insertError;
      }
      console.log('✅ User record created');
    }

    // Step 3: Check if leads already exist
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId);
      
    if (existingLeads && existingLeads.length > 0) {
      console.log(`\n✅ ${existingLeads.length} leads already exist for this user`);
      console.log('🌐 Go to http://localhost:5000 to view them\n');
      return;
    }

    // Step 4: Create test leads
    console.log('\n📋 Creating test leads...');
    
    const testLeads = [
      {
        user_id: userId,
        tenant_name: 'John Doe',
        tenant_email: 'john@example.com',
        tenant_phone: '+254712345678',
        location: 'Westlands, Nairobi',
        property_type: 'Apartment',
        bedrooms: 2,
        budget: 50000,
        move_in_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: 'Modern 2BR apartment with parking and gym',
          amenities: ['Parking', 'Gym', 'Security']
        },
        status: 'active',
        views: 0,
        contacts: 0
      },
      {
        user_id: userId,
        tenant_name: 'Jane Smith',
        tenant_email: 'jane@example.com',
        tenant_phone: '+254723456789',
        location: 'Kilimani, Nairobi',
        property_type: 'Studio',
        bedrooms: 1,
        budget: 35000,
        move_in_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: 'Studio close to CBD, furnished preferred',
          amenities: ['Furnished', 'WiFi']
        },
        status: 'active',
        views: 0,
        contacts: 0
      },
      {
        user_id: userId,
        tenant_name: 'Mike Johnson',
        tenant_email: 'mike@example.com',
        tenant_phone: '+254734567890',
        location: 'Karen, Nairobi',
        property_type: 'House',
        bedrooms: 4,
        budget: 150000,
        move_in_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: 'Spacious house with garden and DSQ',
          amenities: ['Garden', 'DSQ', 'Garage']
        },
        status: 'active',
        views: 0,
        contacts: 0
      },
      {
        user_id: userId,
        tenant_name: 'Sarah Williams',
        tenant_email: 'sarah@example.com',
        tenant_phone: '+254745678901',
        location: 'Lavington, Nairobi',
        property_type: 'Apartment',
        bedrooms: 3,
        budget: 85000,
        move_in_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: 'Family-friendly 3BR with security',
          amenities: ['Security', 'Playground', 'Parking']
        },
        status: 'active',
        views: 0,
        contacts: 0
      },
      {
        user_id: userId,
        tenant_name: 'David Brown',
        tenant_email: 'david@example.com',
        tenant_phone: '+254756789012',
        location: 'Kileleshwa, Nairobi',
        property_type: 'Apartment',
        bedrooms: 2,
        budget: 60000,
        move_in_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: 'Quiet neighborhood, balcony preferred',
          amenities: ['Balcony', 'Parking']
        },
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
      throw leadsError;
    }

    console.log(`✅ Created ${leads.length} test leads:\n`);
    leads.forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.tenant_name} - ${lead.location}`);
      console.log(`      ${lead.property_type}, ${lead.bedrooms} BR, KES ${lead.budget.toLocaleString()}/month\n`);
    });

    console.log('🎉 Test data seeded successfully!');
    console.log('🌐 Visit http://localhost:5000 to see the leads\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

seedData().catch(console.error);
