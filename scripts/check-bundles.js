
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreditBundles() {
    try {
        const { data, error } = await supabase
            .from('credit_bundles')
            .select('*');

        if (error) {
            console.error('Error fetching bundles:', error);
            return;
        }

        console.log('Credit Bundles in Database:');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkCreditBundles();
