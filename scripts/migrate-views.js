import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createViewsTable() {
    console.log('Attempting to create lead_views_log table...');
    const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
      CREATE TABLE IF NOT EXISTS lead_views_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(lead_id, agent_id)
      );
    `
    });

    if (error) {
        console.error('Error creating table:', error);
        // If exec_sql RPC doesn't exist, we might have to try another way or assume the user will handle it.
        // But usually in these environments, we can try to just insert into it and see if it works, 
        // or use a more direct approach if available.
    } else {
        console.log('Table created successfully or already exists.');
    }
}

createViewsTable();
