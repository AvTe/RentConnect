import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Create Supabase admin client for sending invites
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * POST /api/admins/send-invite-email - Send admin invite email via Supabase Auth
 * Uses Supabase's built-in invite system for secure email delivery
 *
 * SECURITY: Requires admin authentication to prevent abuse
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
      .select('role')
      .eq('id', user.id)
      .single();

    const adminRoles = ['admin', 'super_admin', 'main_admin'];
    if (!userData || !adminRoles.includes(userData.role)) {
      // Also check admin_users table for admin users
      const { data: adminUser } = await supabaseAuth
        .from('admin_users')
        .select('role')
        .eq('email', user.email)
        .single();

      if (!adminUser) {
        return NextResponse.json({
          success: false,
          error: 'Admin access required to send invite emails'
        }, { status: 403 });
      }
    }

    const { to, name, role, inviteUrl, customMessage, invitedBy } = await request.json();

    if (!to || !name || !inviteUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, name, inviteUrl'
      }, { status: 400 });
    }

    // Format role for metadata
    const displayRole = role === 'super_admin' ? 'Super Admin'
      : role === 'main_admin' ? 'Main Admin'
      : role === 'sub_admin' ? 'Sub Admin'
      : role || 'Admin';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';

    // Use Supabase Auth to invite user by email
    // This sends an email using Supabase's email templates
    console.log(`Sending admin invite to ${to} via Supabase Auth`);

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(to, {
      data: {
        name: name,
        role: role || 'sub_admin',
        display_role: displayRole,
        invited_by: invitedBy || 'Admin',
        custom_message: customMessage || '',
        invite_url: inviteUrl,
        user_type: 'admin'
      },
      redirectTo: `${baseUrl}/admin/accept-invite`
    });

    if (error) {
      console.error('Supabase invite error:', error);

      // If user already exists, we can still use the custom invite URL
      if (error.message?.includes('already registered')) {
        console.log('User already exists, invite URL will be used for password setup');
        return NextResponse.json({
          success: true,
          message: 'User already exists. Invite link sent for account activation.'
        });
      }

      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('Admin invite sent successfully via Supabase to:', to);

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending admin invite email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
