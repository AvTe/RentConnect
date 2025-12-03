import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUser,
  getAdminUserByEmail,
  createAdminInvite,
  resendAdminInvite,
  adminHasPermission
} from '@/lib/database';

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

    // Send invite email
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/admin/accept-invite?token=${inviteResult.token}`;
    
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/admins/send-invite-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetAdmin.data.email,
          name: targetAdmin.data.name,
          role: targetAdmin.data.custom_role_name || targetAdmin.data.role,
          inviteUrl,
          customMessage,
          invitedBy: currentAdmin.name
        })
      });

      const emailResult = await emailResponse.json();
      
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
