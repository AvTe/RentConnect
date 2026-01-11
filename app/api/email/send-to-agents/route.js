import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * API endpoint to send welcome emails to all agents
 *
 * SECURITY: This endpoint is protected and requires:
 * 1. POST method (prevents accidental triggering by crawlers/bots)
 * 2. Admin authentication (only admins can trigger bulk emails)
 * 3. Confirmation parameter (prevents accidental triggering)
 * 4. Tracks sent emails to prevent duplicates
 *
 * POST /api/email/send-to-agents
 * Body: { confirm: true, skipAlreadySent: true }
 */

// GET method - returns info about the endpoint (no emails sent)
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'This endpoint sends welcome emails to all agents. Use POST method with admin authentication.',
        usage: {
            method: 'POST',
            body: {
                confirm: 'boolean (required) - must be true to send emails',
                skipAlreadySent: 'boolean (optional, default: true) - skip agents who already received welcome email'
            },
            authentication: 'Requires admin role (admin, super_admin, main_admin)'
        }
    });
}

export async function POST(request) {
    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON body'
            }, { status: 400 });
        }

        const { confirm, skipAlreadySent = true } = body;

        // Require explicit confirmation
        if (confirm !== true) {
            return NextResponse.json({
                success: false,
                error: 'Confirmation required. Set confirm: true in request body to send emails.',
                hint: 'This is a safety measure to prevent accidental bulk email sending.'
            }, { status: 400 });
        }

        // Verify admin authentication
        const supabaseAuth = await createServerClient();
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData, error: userError } = await supabaseAuth
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 401 });
        }

        const adminRoles = ['admin', 'super_admin', 'main_admin'];
        if (!adminRoles.includes(userData.role)) {
            return NextResponse.json({
                success: false,
                error: 'Admin access required. Only admins can send bulk emails.'
            }, { status: 403 });
        }

        // Get Supabase client with service role for full access
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: false,
                error: 'Supabase credentials not configured'
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch all agents, optionally filtering out those who already received welcome email
        let query = supabase
            .from('users')
            .select('id, name, email, role, welcome_email_sent')
            .eq('role', 'agent');

        if (skipAlreadySent) {
            query = query.or('welcome_email_sent.is.null,welcome_email_sent.eq.false');
        }

        const { data: agents, error } = await query;

        if (error) {
            console.error('Error fetching agents:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        console.log(`Found ${agents?.length || 0} agents to send welcome emails`);

        if (!agents || agents.length === 0) {
            return NextResponse.json({
                success: true,
                message: skipAlreadySent
                    ? 'No agents found who haven\'t received welcome email yet'
                    : 'No agents found in database',
                agentCount: 0,
                results: []
            });
        }

        // Import Resend
        const { Resend } = await import('resend');
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'RESEND_API_KEY not configured'
            }, { status: 500 });
        }

        const resend = new Resend(apiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Yoombaa <noreply@yoombaa.com>';

        const results = [];

        for (const agent of agents) {
            if (!agent.email) {
                results.push({
                    agentId: agent.id,
                    name: agent.name,
                    success: false,
                    error: 'No email address'
                });
                continue;
            }

            try {
                const { data, error: emailError } = await resend.emails.send({
                    from: fromEmail,
                    to: agent.email,
                    subject: 'Welcome to Yoombaa - Get Started!',
                    html: `
<!DOCTYPE html>
<html>
<head><title>Welcome to Yoombaa</title></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="520" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 24px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200;">Yoombaa</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">
                Welcome to Yoombaa, ${agent.name || 'Agent'}!
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; text-align: center;">
                Your agent account is ready. Start connecting with tenants looking for their perfect home.
              </p>
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #fe9200; margin: 16px 0;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #18181b;">Next Steps:</p>
                <p style="margin: 0; font-size: 13px; color: #52525b; line-height: 1.6;">
                  1. Complete your profile with your agency details<br>
                  2. Upload your verification documents<br>
                  3. Add credits to start unlocking leads<br>
                  4. Start connecting with tenants!
                </p>
              </div>
              <div style="text-align: center; padding: 24px 0;">
                <a href="https://yoombaa.com/dashboard" style="background-color: #fe9200; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Go to Dashboard
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © 2025 Yoombaa. All rights reserved.<br>
                <a href="https://yoombaa.com" style="color: #fe9200;">yoombaa.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
                    `
                });

                if (emailError) {
                    results.push({
                        agentId: agent.id,
                        name: agent.name,
                        email: agent.email,
                        success: false,
                        error: emailError.message
                    });
                } else {
                    // Mark agent as having received welcome email
                    await supabase
                        .from('users')
                        .update({
                            welcome_email_sent: true,
                            welcome_email_sent_at: new Date().toISOString()
                        })
                        .eq('id', agent.id);

                    results.push({
                        agentId: agent.id,
                        name: agent.name,
                        email: agent.email,
                        success: true,
                        emailId: data?.id
                    });
                }
            } catch (err) {
                results.push({
                    agentId: agent.id,
                    name: agent.name,
                    email: agent.email,
                    success: false,
                    error: err.message
                });
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        // Log the action for audit purposes
        console.log(`[BULK EMAIL] Admin ${user.email} sent welcome emails to ${successCount}/${agents.length} agents`);

        return NextResponse.json({
            success: true,
            message: `Sent welcome emails to ${successCount}/${agents.length} agents`,
            triggeredBy: user.email,
            agentCount: agents.length,
            successCount,
            failedCount,
            results
        });

    } catch (error) {
        console.error('Error in send-to-agents:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
