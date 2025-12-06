import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  getAdminUser,
  getAdminUserByEmail,
  createAdminInvite,
  resendAdminInvite,
  adminHasPermission
} from '@/lib/database';

// Create Supabase admin client for sending invites
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to send admin invite email via Supabase Auth
const sendAdminInviteEmail = async ({ to, name, role, inviteUrl, customMessage, invitedBy }) => {
  try {
    const displayRole = role === 'super_admin' ? 'Super Admin'
      : role === 'main_admin' ? 'Main Admin'
      : role === 'sub_admin' ? 'Sub Admin'
      : role || 'Admin';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';

    // Use Supabase Auth to invite user
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
      // If user already exists, invite was still sent in concept
      if (error.message?.includes('already registered')) {
        return { success: true, message: 'User already exists' };
      }
      return { success: false, error: error.message };
    }

    console.log('Admin invite sent successfully via Supabase to:', to);
    return { success: true };
  } catch (error) {
    console.error('Error sending admin invite email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * POST /api/admins/[id]/invite - Send or resend invite to admin
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status with send_invites permission
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'send_invites');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get target admin
    const targetAdmin = await getAdminUser(id);
    if (!targetAdmin.success) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Can only invite admins with status 'invited'
    if (targetAdmin.data.status !== 'invited') {
      return NextResponse.json({ 
        success: false, 
        error: 'Can only send invites to admins with Invited status' 
      }, { status: 400 });
    }

    // Parse request body for custom message
    const body = await request.json().catch(() => ({}));
    const { customMessage } = body;

    // Resend invite (creates new token, invalidates old one)
    const inviteResult = await resendAdminInvite(id, currentAdmin.id);

    if (!inviteResult.success) {
      return NextResponse.json({ success: false, error: inviteResult.error }, { status: 400 });
    }

    // Send invite email directly
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/admin/accept-invite?token=${inviteResult.token}`;
    
    try {
      const emailResult = await sendAdminInviteEmail({
        to: targetAdmin.data.email,
        name: targetAdmin.data.name,
        role: targetAdmin.data.custom_role_name || targetAdmin.data.role,
        inviteUrl,
        customMessage,
        invitedBy: currentAdmin.name
      });
      
      if (!emailResult.success) {
        console.error('Failed to send invite email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending invite email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Invite sent successfully',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error in POST /api/admins/[id]/invite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
