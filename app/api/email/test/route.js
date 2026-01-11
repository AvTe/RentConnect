import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    sendEmail,
    sendWelcomeAgentEmail,
    sendWelcomeTenantEmail,
    sendNewLeadNotification,
    sendLeadUnlockedEmail,
    sendVerificationApprovedEmail,
    sendVerificationRejectedEmail,
    sendCreditsPurchasedEmail,
    sendLowCreditsWarning,
    sendAgentInterestedEmail,
    sendCustomEmail
} from '@/lib/resend-email';

/**
 * Test endpoint for Resend email service
 * Tests all email types with sample data
 *
 * SECURITY: Requires admin authentication to prevent abuse
 *
 * GET /api/email/test?email=your@email.com
 */
export async function GET(request) {
    // Check for development mode OR admin authentication
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev) {
        // In production, require admin authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required. This endpoint is only available to admins in production.'
            }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const adminRoles = ['admin', 'super_admin', 'main_admin'];
        if (!userData || !adminRoles.includes(userData.role)) {
            return NextResponse.json({
                success: false,
                error: 'Admin access required. Only admins can use this test endpoint in production.'
            }, { status: 403 });
        }
    }

    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');
    const testType = searchParams.get('type') || 'all';

    if (!testEmail) {
        return NextResponse.json(
            {
                success: false,
                error: 'Please provide an email address: /api/email/test?email=your@email.com',
                availableTypes: [
                    'welcome_agent',
                    'welcome_tenant',
                    'new_lead',
                    'lead_unlocked',
                    'verification_approved',
                    'verification_rejected',
                    'credits_purchased',
                    'low_credits',
                    'agent_interested',
                    'custom',
                    'all'
                ]
            },
            { status: 400 }
        );
    }

    const results = [];

    try {
        // Sample data for tests
        const sampleLeadData = {
            location: 'Kilimani, Nairobi',
            budget: 50000,
            bedrooms: 2,
            propertyType: 'Apartment',
            urgency: 'immediate'
        };

        const sampleTenantContact = {
            name: 'Jane Doe',
            phone: '+254712345678',
            email: testEmail
        };

        // Test functions
        const tests = {
            welcome_agent: async () => {
                const result = await sendWelcomeAgentEmail(testEmail, 'Test Agent');
                return { type: 'welcome_agent', ...result };
            },

            welcome_tenant: async () => {
                const result = await sendWelcomeTenantEmail(testEmail, 'Test Tenant');
                return { type: 'welcome_tenant', ...result };
            },

            new_lead: async () => {
                const result = await sendNewLeadNotification(testEmail, 'Test Agent', sampleLeadData);
                return { type: 'new_lead', ...result };
            },

            lead_unlocked: async () => {
                const result = await sendLeadUnlockedEmail(testEmail, 'Test Agent', sampleLeadData, sampleTenantContact);
                return { type: 'lead_unlocked', ...result };
            },

            verification_approved: async () => {
                const result = await sendVerificationApprovedEmail(testEmail, 'Test Agent');
                return { type: 'verification_approved', ...result };
            },

            verification_rejected: async () => {
                const result = await sendVerificationRejectedEmail(testEmail, 'Test Agent', 'Documents were blurry. Please upload clearer images.');
                return { type: 'verification_rejected', ...result };
            },

            credits_purchased: async () => {
                const result = await sendCreditsPurchasedEmail(testEmail, 'Test Agent', 10, 500, 25);
                return { type: 'credits_purchased', ...result };
            },

            low_credits: async () => {
                const result = await sendLowCreditsWarning(testEmail, 'Test Agent', 3);
                return { type: 'low_credits', ...result };
            },

            agent_interested: async () => {
                const result = await sendAgentInterestedEmail(testEmail, 'Test Tenant', 'James Agent', '+254798765432');
                return { type: 'agent_interested', ...result };
            },

            custom: async () => {
                const content = `
          <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">
            Custom Email Test
          </h1>
          <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center;">
            This is a test of the custom email template with Yoombaa branding.
          </p>
          <p style="margin: 0; font-size: 14px; color: #fe9200; text-align: center; font-weight: 600;">
            If you're seeing this, the email service is working correctly!
          </p>
        `;
                const result = await sendCustomEmail(testEmail, 'Custom Email Test - Yoombaa', content);
                return { type: 'custom', ...result };
            }
        };

        // Run selected tests
        if (testType === 'all') {
            console.log(`Testing all email types to: ${testEmail}`);

            // Add delay between emails to avoid rate limiting
            for (const [name, testFn] of Object.entries(tests)) {
                console.log(`Sending ${name} email...`);
                const result = await testFn();
                results.push(result);

                // Small delay between emails
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else if (tests[testType]) {
            console.log(`Testing ${testType} email to: ${testEmail}`);
            const result = await tests[testType]();
            results.push(result);
        } else {
            return NextResponse.json(
                { success: false, error: `Unknown test type: ${testType}` },
                { status: 400 }
            );
        }

        // Summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: failed === 0,
            summary: {
                total: results.length,
                successful,
                failed,
                testEmail
            },
            results
        });

    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json(
            { success: false, error: error.message, results },
            { status: 500 }
        );
    }
}
