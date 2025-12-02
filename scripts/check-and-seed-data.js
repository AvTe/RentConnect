// Script to check database and insert test data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yydwhwkvrvgkqnmirbrr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHdod2t2cnZna3FubWlyYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjY4OTcsImV4cCI6MjA4MDE0Mjg5N30.l5TXQLRz1JI9GXoY6jbhe6bdVpekJDRBlETrHWW-0Y4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndSeedData() {
  console.log('🔍 Checking database state...\n');
  
  // Check users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);
    
  console.log(`👥 Users: ${users?.length || 0} found`);
  if (usersError) console.error('  Error:', usersError.message);
  
  // Check leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .limit(5);
    
  console.log(`🏠 Leads: ${leads?.length || 0} found`);
  if (leadsError) console.error('  Error:', leadsError.message);
  
  // Check properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .limit(5);
    
  console.log(`🏘️  Properties: ${properties?.length || 0} found\n`);
  if (propertiesError) console.error('  Error:', propertiesError.message);
  
  // If no users, we can't create test data (need user_id)
  if (!users || users.length === 0) {
    console.log('⚠️  No users found. Please sign up first to create test data.\n');
    console.log('📝 Steps to add test data:');
    console.log('   1. Go to http://localhost:5000');
    console.log('   2. Click "I Need a Place to Rent"');
    console.log('   3. Sign up with email/password');
    console.log('   4. Fill out the rental request form');
    console.log('   5. Your lead will appear on the landing page\n');
    return;
  }
  
  // If we have users but no leads, offer to create test leads
  if (leads.length === 0 && users.length > 0) {
    console.log('📋 Would you like to create test leads? (Y/n)');
    console.log('   This will create 3 sample rental requests\n');
    
    // Create test leads automatically
    const testUserId = users[0].id;
    console.log(`✨ Creating test leads for user: ${users[0].email || users[0].name}\n`);
    
    const testLeads = [
      {
        user_id: testUserId,
        name: 'John Doe',
        email: 'john@example.com',
        whatsapp: '+254712345678',
        location: 'Westlands, Nairobi',
        property_type: 'Apartment',
        bedrooms: 2,
        budget: 50000,
        move_in_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        additional_requirements: 'Looking for a modern 2-bedroom apartment with parking',
        status: 'active',
        views: 0,
        contacts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: testUserId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        whatsapp: '+254723456789',
        location: 'Kilimani, Nairobi',
        property_type: 'Studio',
        bedrooms: 1,
        budget: 35000,
        move_in_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        additional_requirements: 'Need a studio apartment close to CBD',
        status: 'active',
        views: 0,
        contacts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: testUserId,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        whatsapp: '+254734567890',
        location: 'Karen, Nairobi',
        property_type: 'House',
        bedrooms: 4,
        budget: 150000,
        move_in_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        additional_requirements: 'Looking for a spacious house with garden',
        status: 'active',
        views: 0,
        contacts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (const lead of testLeads) {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select();
        
      if (error) {
        console.error(`❌ Error creating lead for ${lead.name}:`, error.message);
      } else {
        console.log(`✅ Created lead: ${lead.name} - ${lead.location}`);
      }
    }
    
    console.log('\n🎉 Test data created! Refresh your browser to see the leads.');
  } else if (leads.length > 0) {
    console.log('✅ Leads already exist in database:');
    leads.forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.name} - ${lead.location} (Budget: KES ${lead.budget})`);
    });
    console.log('\n💡 If leads are not showing in the UI, check browser console for errors.');
  }
}

checkAndSeedData().catch(console.error);
