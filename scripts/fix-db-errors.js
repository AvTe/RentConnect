import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
    console.error('❌ SUPABASE_DB_PASSWORD not found');
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

async function migrate() {
    try {
        await client.connect();
        console.log('✅ Connected to DB');

        console.log('🔄 Updating contact_history check constraint...');

        // We need to drop the existing constraint and add a new one
        // First, find the constraint name. It's usually 'contact_history_contact_type_check'
        await client.query(`
      ALTER TABLE contact_history 
      DROP CONSTRAINT IF EXISTS contact_history_contact_type_check;
    `);

        await client.query(`
      ALTER TABLE contact_history 
      ADD CONSTRAINT contact_history_contact_type_check 
      CHECK (contact_type IN ('phone', 'email', 'whatsapp', 'view', 'browse'));
    `);

        console.log('✅ Updated contact_history constraint to allow "browse"');

        // Also fix lead_agent_connections if it's missing columns or something?
        // The user saw 406 on lead_agent_connections?select=*
        // Let's check if that table even exists.
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lead_agent_connections'
      );
    `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ table lead_agent_connections exists');
        } else {
            console.log('⚠️ table lead_agent_connections MISSING. Creating it...');
            await client.query(`
        CREATE TABLE IF NOT EXISTS lead_agent_connections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
          agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
          unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(lead_id, agent_id)
        );
      `);
            console.log('✅ Created lead_agent_connections table');
        }

        console.log('🎉 Migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.end();
    }
}

migrate();
