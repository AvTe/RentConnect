import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createNotification } from '@/lib/database';

/**
 * API endpoint to send notifications to users
 * 
 * SECURITY: Requires admin authentication
 * 
 * POST /api/admin/notifications/send
 * Body: {
 *   templateId: string (optional - use template),
 *   subject: string,
 *   body: string,
 *   channels: { email: boolean, push: boolean, whatsapp: boolean },
 *   targetType: 'all' | 'agents' | 'tenants' | 'specific',
 *   specificUserIds: string[] (when targetType is 'specific'),
 *   variables: { [key]: value } (for template variable substitution),
 *   confirm: boolean (required - must be true)
 * }
 */
export async function POST(request) {
    try {
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
        const { data: userData } = await supabaseAuth
            .from('users')
            .select('role, name, email')
            .eq('id', user.id)
            .single();

        const adminRoles = ['admin', 'super_admin', 'main_admin'];
        let isAdmin = userData && adminRoles.includes(userData.role);

        // Also check admin_users table
        if (!isAdmin) {
            const { data: adminUser } = await supabaseAuth
                .from('admin_users')
                .select('role, name')
                .eq('email', user.email)
                .single();

            isAdmin = !!adminUser;
        }

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: 'Admin access required'
            }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const {
            subject,
            body: messageBody,
            channels = { email: true, push: true, whatsapp: false },
            targetType = 'all',
            specificUserIds = [],
            variables = {},
            confirm
        } = body;

        if (confirm !== true) {
            return NextResponse.json({
                success: false,
                error: 'Confirmation required. Set confirm: true to send notifications.'
            }, { status: 400 });
        }

        if (!subject || !messageBody) {
            return NextResponse.json({
                success: false,
                error: 'Subject and body are required'
            }, { status: 400 });
        }

        // Get Supabase client with service role
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get target users based on targetType
        let usersQuery = supabase.from('users').select('id, name, email, phone, role');

        if (targetType === 'agents') {
            usersQuery = usersQuery.eq('role', 'agent');
        } else if (targetType === 'tenants') {
            usersQuery = usersQuery.eq('role', 'tenant');
        } else if (targetType === 'specific' && specificUserIds.length > 0) {
            usersQuery = usersQuery.in('id', specificUserIds);
        }
        // 'all' doesn't need a filter

        const { data: users, error: usersError } = await usersQuery;

        if (usersError) {
            return NextResponse.json({
                success: false,
                error: usersError.message
            }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No users found matching criteria',
                stats: { total: 0, sent: 0, failed: 0 }
            });
        }

        const results = { push: [], email: [], whatsapp: [] };
        let sentCount = 0;
        let failedCount = 0;

        // Process variable substitution helper
        // SECURITY: Use string replacement instead of dynamic regex to prevent ReDoS
        const substituteVariables = (text, userData) => {
            let result = text;
            // Replace template variables using safe string split/join instead of regex
            Object.entries(variables).forEach(([key, value]) => {
                // Use split/join instead of regex to avoid ReDoS
                result = result.split(`{{${key}}}`).join(String(value || ''));
            });
            // Replace user-specific variables
            result = result.split('{{user_name}}').join(userData.name || 'User');
            result = result.split('{{user_email}}').join(userData.email || '');
            return result;
        };

        // Send notifications to each user
        for (const targetUser of users) {
            const personalizedSubject = substituteVariables(subject, targetUser);
            const personalizedBody = substituteVariables(messageBody, targetUser);

            try {
                // Send push notification (in-app)
                if (channels.push) {
                    const pushResult = await createNotification({
                        user_id: targetUser.id,
                        type: 'system',
                        title: personalizedSubject,
                        message: personalizedBody,
                        data: { sentBy: user.email, bulk: true }
                    });
                    if (pushResult.success) sentCount++;
                    else failedCount++;
                    results.push.push({ userId: targetUser.id, success: pushResult.success });
                }

                // Send email notification
                if (channels.email && targetUser.email) {
                    try {
                        const { Resend } = await import('resend');
                        const resend = new Resend(process.env.RESEND_API_KEY);
                        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Yoombaa <noreply@yoombaa.com>';

                        const { data, error: emailError } = await resend.emails.send({
                            from: fromEmail,
                            to: targetUser.email,
                            subject: personalizedSubject,
                            html: generateEmailHtml(personalizedSubject, personalizedBody)
                        });

                        results.email.push({
                            userId: targetUser.id,
                            email: targetUser.email,
                            success: !emailError,
                            error: emailError?.message
                        });
                    } catch (emailErr) {
                        results.email.push({
                            userId: targetUser.id,
                            email: targetUser.email,
                            success: false,
                            error: emailErr.message
                        });
                    }
                }

                // WhatsApp would be sent here (placeholder for future implementation)
                if (channels.whatsapp && targetUser.phone) {
                    results.whatsapp.push({
                        userId: targetUser.id,
                        phone: targetUser.phone,
                        success: false,
                        error: 'WhatsApp sending not yet implemented'
                    });
                }

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (userError) {
                failedCount++;
                console.error(`Error sending to user ${targetUser.id}:`, userError);
            }
        }

        // Log the action
        console.log(`[BULK NOTIFICATION] Admin ${user.email} sent notification to ${sentCount} users`);

        return NextResponse.json({
            success: true,
            message: `Notification sent to ${users.length} users`,
            stats: {
                total: users.length,
                push: results.push.filter(r => r.success).length,
                email: results.email.filter(r => r.success).length,
                whatsapp: results.whatsapp.filter(r => r.success).length
            },
            triggeredBy: user.email,
            results
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

/**
 * HTML-encode a string to prevent XSS attacks
 * @param {string} str - Input string
 * @returns {string} - HTML-encoded string
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Helper function to generate email HTML
// SECURITY: All user-provided content is HTML-encoded to prevent XSS
function generateEmailHtml(subject, body) {
    const safeSubject = escapeHtml(subject);
    const safeBody = escapeHtml(body);

    return `
<!DOCTYPE html>
<html>
<head><title>${safeSubject}</title></head>
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
                ${safeSubject}
              </h1>
              <p style="margin: 0; font-size: 15px; color: #52525b; line-height: 1.6; white-space: pre-wrap;">
                ${safeBody}
              </p>
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
    `;
}

