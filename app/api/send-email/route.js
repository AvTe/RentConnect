import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Generic email sending endpoint
 *
 * SECURITY: Requires authentication to prevent abuse
 *
 * NOTE: This endpoint is deprecated. For transactional emails, use:
 * - Password reset: Supabase Auth resetPasswordForEmail()
 * - Email verification: Supabase Auth resend()
 * - Admin invites: Supabase Auth inviteUserByEmail()
 *
 * For custom notifications, use in-app notifications instead.
 */
export async function POST(request) {
  try {
    // Verify user is authenticated
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { to, subject, htmlContent, type } = await request.json();

    if (!to || !subject) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject'
      }, { status: 400 });
    }

    // For specific email types, use Supabase Auth methods
    if (type === 'password_reset') {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(to, {
        redirectTo: `${baseUrl}/auth/reset-password`
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Password reset email sent via Supabase' });
    }

    if (type === 'verification') {
      const { error } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email: to
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Verification email sent via Supabase' });
    }

    if (type === 'invite') {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(to, {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Invite email sent via Supabase' });
    }

    // For generic emails without a specific type
    // Log warning and suggest using in-app notifications
    console.warn('Generic email requested. Consider using in-app notifications instead.');
    console.log('Email would be sent to:', to, 'Subject:', subject);

    // Since SendGrid is removed, we can only handle auth-related emails via Supabase
    // For other transactional emails, you would need to:
    // 1. Set up Supabase Edge Functions with a custom email provider
    // 2. Or use in-app notifications as an alternative

    return NextResponse.json({
      success: false,
      error: 'Generic email sending not available. Use in-app notifications or specific email types (password_reset, verification, invite).'
    }, { status: 501 });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
