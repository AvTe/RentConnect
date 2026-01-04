/**
 * Email Service Test Script
 * Tests all email types and sends welcome emails to all agents
 * 
 * Usage: node scripts/test-email-service.js
 */

const TEST_EMAIL = 'nancybannapure.sirt@gmail.com';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';

// Helper function to send email via API
async function sendEmail(type, to, data) {
    try {
        const response = await fetch(`${BASE_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, data })
        });

        const result = await response.json();
        return { type, to, success: result.success, error: result.error, emailId: result.data?.id };
    } catch (error) {
        return { type, to, success: false, error: error.message };
    }
}

// Test all email types
async function testAllEmailTypes() {
    console.log('\n========================================');
    console.log('TESTING ALL EMAIL TYPES');
    console.log('Sending to:', TEST_EMAIL);
    console.log('========================================\n');

    const tests = [
        {
            type: 'welcome_agent',
            data: { name: 'Test Agent' }
        },
        {
            type: 'welcome_tenant',
            data: { name: 'Test Tenant' }
        },
        {
            type: 'new_lead',
            data: {
                agentName: 'Test Agent',
                leadData: {
                    location: 'Nairobi, Westlands',
                    budget: 50000,
                    bedrooms: '2',
                    propertyType: 'Apartment'
                }
            }
        },
        {
            type: 'lead_unlocked',
            data: {
                agentName: 'Test Agent',
                tenantContact: {
                    name: 'John Doe',
                    phone: '+254712345678',
                    email: 'john.doe@example.com'
                }
            }
        },
        {
            type: 'verification_approved',
            data: { name: 'Test Agent' }
        },
        {
            type: 'verification_rejected',
            data: {
                name: 'Test Agent',
                reason: 'ID document was not clear. Please upload a clearer image.'
            }
        },
        {
            type: 'credits_purchased',
            data: {
                name: 'Test Agent',
                credits: 500,
                amount: 5000,
                newBalance: 750
            }
        },
        {
            type: 'low_credits',
            data: {
                name: 'Test Agent',
                balance: 50
            }
        },
        {
            type: 'agent_interested',
            data: {
                tenantName: 'Test Tenant',
                agentName: 'James Mwangi',
                agentPhone: '+254712345678'
            }
        }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`Testing: ${test.type}...`);
        const result = await sendEmail(test.type, TEST_EMAIL, test.data);
        results.push(result);

        if (result.success) {
            console.log(`  ✅ SUCCESS - Email ID: ${result.emailId}`);
        } else {
            console.log(`  ❌ FAILED - ${result.error}`);
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n========================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('========================================');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${results.length}`);

    return results;
}

// Get all agents from database and send welcome emails
async function sendWelcomeToAllAgents() {
    console.log('\n========================================');
    console.log('SENDING WELCOME EMAILS TO ALL AGENTS');
    console.log('========================================\n');

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Supabase credentials not found in environment');
        return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all agents
    const { data: agents, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', 'agent');

    if (error) {
        console.log('❌ Error fetching agents:', error.message);
        return [];
    }

    console.log(`Found ${agents?.length || 0} agents\n`);

    if (!agents || agents.length === 0) {
        console.log('No agents found in database');
        return [];
    }

    const results = [];

    for (const agent of agents) {
        if (!agent.email) {
            console.log(`⚠️  ${agent.name} - No email address`);
            continue;
        }

        console.log(`Sending to: ${agent.name} (${agent.email})...`);
        const result = await sendEmail('welcome_agent', agent.email, { name: agent.name || 'Agent' });
        results.push({ ...result, agentName: agent.name });

        if (result.success) {
            console.log(`  ✅ SUCCESS`);
        } else {
            console.log(`  ❌ FAILED - ${result.error}`);
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n========================================');
    console.log('WELCOME EMAIL RESULTS');
    console.log('========================================');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Sent: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total agents: ${agents.length}`);

    return results;
}

// Main execution
async function main() {
    console.log('=========================================');
    console.log('  YOOMBAA EMAIL SERVICE TEST');
    console.log('  ' + new Date().toISOString());
    console.log('=========================================');

    // First check if API is accessible
    console.log('\n📡 Checking email API status...');
    try {
        const statusResponse = await fetch(`${BASE_URL}/api/email/send`);
        const status = await statusResponse.json();
        console.log('API Status:', status.status);
        console.log('From Address:', status.from);
        console.log('Available Types:', status.availableTypes?.join(', '));

        if (status.status !== 'configured') {
            console.log('\n❌ Email service is not configured!');
            console.log('Please add RESEND_API_KEY to your .env.local file');
            process.exit(1);
        }
    } catch (error) {
        console.log('❌ Could not connect to email API:', error.message);
        console.log('Make sure the dev server is running: npm run dev');
        process.exit(1);
    }

    // Run tests
    const testResults = await testAllEmailTypes();

    // Send welcome emails to all agents
    const agentResults = await sendWelcomeToAllAgents();

    console.log('\n=========================================');
    console.log('  ALL TESTS COMPLETE');
    console.log('=========================================\n');
}

main().catch(console.error);
