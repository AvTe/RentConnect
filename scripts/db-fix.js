import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

const dbPassword = process.env.SUPABASE_DB_PASSWORD;

async function run() {
    const client = new Client({
        host: `aws-0-ap-southeast-1.pooler.supabase.com`,
        port: 5432,
        database: 'postgres',
        user: 'postgres.yydwhwkvrvgkqnmirbrr',
        password: dbPassword,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected');
        await client.query('ALTER TABLE contact_history DROP CONSTRAINT IF EXISTS contact_history_contact_type_check');
        await client.query("ALTER TABLE contact_history ADD CONSTRAINT contact_history_contact_type_check CHECK (contact_type IN ('phone', 'email', 'whatsapp', 'view', 'browse'))");
        console.log('Success');
    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
