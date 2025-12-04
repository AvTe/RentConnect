import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUser,
  getAdminUserByEmail,
  createAdminInvite,
  resendAdminInvite,
  adminHasPermission
} from '@/lib/database';

const sgMail = require('@sendgrid/mail');

// Helper function to send admin invite email
const sendAdminInviteEmail = async ({ to, name, role, inviteUrl, customMessage, invitedBy }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY is not set');
    return { success: false, error: 'Email service not configured' };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const displayRole = role === 'super_admin' ? 'Super Admin' 
    : role === 'main_admin' ? 'Main Admin' 
    : role === 'sub_admin' ? 'Sub Admin'
    : role || 'Admin';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🏠 RentConnect</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Admin Dashboard Invitation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937;">Hi ${name},</h2>
              <p style="margin: 0 0 20px; color: #4b5563;">You have been invited as: <strong>${displayRole}</strong></p>
              ${customMessage ? `<p style="color: #854d0e; font-style: italic;">"${customMessage}" — ${invitedBy}</p>` : ''}
              <p style="margin: 0 0 30px; color: #4b5563;">Click the button below to complete setup:</p>
              <table width="100%"><tr><td align="center">
                <a href="${inviteUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">Accept Invitation</a>
              </td></tr></table>
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">Link: <a href="${inviteUrl}">${inviteUrl}</a></p>
              <p style="margin: 20px 0 0; padding: 15px; background-color: #fef2f2; border-radius: 8px; color: #991b1b; font-size: 13px;">⏰ Expires in 72 hours</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await sgMail.send({
      to,
      from: 'noreply@Yoombaa.com',
      subject: `You've been invited to the RentConnect Admin Dashboard`,
      html: htmlContent
    });
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
