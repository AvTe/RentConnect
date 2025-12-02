// Seed using direct SQL - completely bypasses RLS
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ SUPABASE_DB_PASSWORD not found in .env.local');
  console.log('\n📝 To get your database password:');
  console.log('   1. Go to https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/settings/database');
  console.log('   2. Copy the database password');
  console.log('   3. Add to .env.local: SUPABASE_DB_PASSWORD=your_password\n');
  process.exit(1);
}

const client = new Client({
  host: `aws-0-ap-southeast-1.pooler.supabase.com`,
  port: 5432,
  database: 'postgres',
  user: 'postgres.yydwhwkvrvgkqnmirbrr',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function seedData() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('🌱 Seeding test data...\n');
    
    // Check if test user exists
    const userCheck = await client.query(
      "SELECT id, email FROM users WHERE email = 'testuser@rentconnect.com'"
    );
    
    let userId;
    
    if (userCheck.rows.length > 0) {
      console.log('✅ Test user already exists:', userCheck.rows[0].email);
      userId = userCheck.rows[0].id;
    } else {
      // Insert test user
      userId = crypto.randomUUID();
      await client.query(`
        INSERT INTO users (id, email, name, phone, role, type, wallet_balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, 'testuser@rentconnect.com', 'Test User', '+254700000000', 'tenant', 'tenant', 0]);
      
      console.log('✅ Created test user: testuser@rentconnect.com');
    }
    
    // Check if leads exist
    const leadsCheck = await client.query(
      'SELECT COUNT(*) FROM leads WHERE user_id = $1',
      [userId]
    );
    
    if (parseInt(leadsCheck.rows[0].count) > 0) {
      console.log(`\n✅ ${leadsCheck.rows[0].count} leads already exist for this user`);
      console.log('🌐 Go to http://localhost:5000 to view them\n');
      return;
    }
    
    // Insert test leads
    const leads = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254712345678',
        location: 'Westlands, Nairobi',
        type: 'Apartment',
        bedrooms: 2,
        budget: 50000,
        days: 30,
        requirements: 'Modern 2BR apartment with parking'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+254723456789',
        location: 'Kilimani, Nairobi',
        type: 'Studio',
        bedrooms: 1,
        budget: 35000,
        days: 15,
        requirements: 'Studio close to CBD'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+254734567890',
        location: 'Karen, Nairobi',
        type: 'House',
        bedrooms: 4,
        budget: 150000,
        days: 60,
        requirements: 'Spacious house with garden'
      }
    ];
    
    console.log('\n📋 Creating test leads...');
    
    for (const lead of leads) {
      const moveInDate = new Date(Date.now() + lead.days * 24 * 60 * 60 * 1000);
      const requirements = JSON.stringify({ additional_requirements: lead.requirements });
      
      await client.query(`
        INSERT INTO leads (
          id, user_id, tenant_name, tenant_email, tenant_phone, 
          location, property_type, bedrooms, budget, move_in_date, 
          requirements, status, views, contacts
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        crypto.randomUUID(),
        userId,
        lead.name,
        lead.email,
        lead.phone,
        lead.location,
        lead.type,
        lead.bedrooms,
        lead.budget,
        moveInDate.toISOString().split('T')[0],
        requirements,
        'active',
        0,
        0
      ]);
      
      console.log(`   ✅ ${lead.name} - ${lead.location} (KES ${lead.budget.toLocaleString()}/month)`);
    }
    
    console.log('\n🎉 Test data seeded successfully!');
    console.log('🌐 Go to http://localhost:5000 to see the leads\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

seedData();
