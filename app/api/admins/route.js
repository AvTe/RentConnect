import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUsers,
  createAdminUser,
  getAdminUserByEmail,
  getAdminUser,
  createAdminInvite,
  getAdminStats,
  adminHasPermission,
  logAdminActivity
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
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🏠 RentConnect</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Admin Dashboard Invitation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px;">Hi ${name},</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have been invited to the <strong>RentConnect Admin Dashboard</strong> with the role:
              </p>
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px 20px; margin: 0 0 20px;">
                <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;">${displayRole}</p>
              </div>
              ${customMessage ? `
              <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 15px 20px; margin: 0 0 20px;">
                <p style="margin: 0; color: #854d0e; font-size: 14px; font-style: italic;">"${customMessage}"</p>
                <p style="margin: 10px 0 0; color: #a16207; font-size: 12px;">— ${invitedBy || 'Admin'}</p>
              </div>
              ` : ''}
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to set your password and complete your account setup:
              </p>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">Or copy this link: <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a></p>
              <div style="margin-top: 30px; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-size: 13px;">⏰ <strong>This invitation expires in 72 hours.</strong></p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} RentConnect. All rights reserved.</p>
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
 * GET /api/admins - List all admin users
 * Supports search, filtering, and pagination
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data || !['super_admin', 'main_admin'].includes(adminResult.data.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;

    // Check permission
    const hasPermission = await adminHasPermission(currentAdmin.id, 'manage_admins');
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      status: searchParams.get('status') || '',
      parentAdminId: searchParams.get('parentAdminId') || '',
      teamName: searchParams.get('team') || ''
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Get admins
    const result = await getAdminUsers(filters, pagination);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Get stats
    const statsResult = await getAdminStats();

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats: statsResult.data || {}
    });
  } catch (error) {
    console.error('Error in GET /api/admins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admins - Create new admin user
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify super admin or main admin with manage_admins permission
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'manage_admins');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, role, customRoleName, permissions, parentAdminId, teamName, sendInvite, customMessage } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    // Only super_admin can create main_admin or super_admin
    if (['super_admin', 'main_admin'].includes(role) && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only Super Admins can create Main Admin or Super Admin accounts' 
      }, { status: 403 });
    }

    // Create admin user
    const createResult = await createAdminUser({
      name,
      email,
      role: role || 'sub_admin',
      customRoleName,
      permissions: permissions || [],
      parentAdminId,
      teamName
    }, currentAdmin.id);

    if (!createResult.success) {
      return NextResponse.json({ success: false, error: createResult.error }, { status: 400 });
    }

    // Send invite if requested
    let inviteResult = null;
    if (sendInvite) {
      inviteResult = await createAdminInvite(createResult.data.id, currentAdmin.id, {
        customMessage,
        expiresInHours: 72
      });

      if (inviteResult.success && inviteResult.token) {
        // Send invite email directly
        const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/admin/accept-invite?token=${inviteResult.token}`;
        
        try {
          const emailResult = await sendAdminInviteEmail({
            to: email,
            name,
            role: role || 'sub_admin',
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
      }
    }

    return NextResponse.json({
      success: true,
      data: createResult.data,
      invite: inviteResult?.success ? { sent: true, expiresAt: inviteResult.data?.expires_at } : null
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
