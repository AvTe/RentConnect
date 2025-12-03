import { NextResponse } from 'next/server';
const sgMail = require('@sendgrid/mail');

/**
 * POST /api/admins/send-invite-email - Send admin invite email
 */
export async function POST(request) {
  try {
    const { to, name, role, inviteUrl, customMessage, invitedBy } = await request.json();

    if (!to || !name || !inviteUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: to, name, inviteUrl' 
      }, { status: 400 });
    }

    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY is not set');
      return NextResponse.json({ 
        success: false, 
        error: 'Email service not configured' 
      }, { status: 500 });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Format role for display
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
  <title>Admin Invitation - RentConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🏠 RentConnect
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Admin Dashboard Invitation
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; font-weight: 600;">
                Hi ${name},
              </h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have been invited to the <strong>RentConnect Admin Dashboard</strong> with the role:
              </p>
              
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px 20px; margin: 0 0 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                  ${displayRole}
                </p>
              </div>
              
              ${customMessage ? `
              <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 15px 20px; margin: 0 0 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #854d0e; font-size: 14px; font-style: italic;">
                  "${customMessage}"
                </p>
                <p style="margin: 10px 0 0; color: #a16207; font-size: 12px;">
                  — ${invitedBy || 'Admin'}
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to set your password and complete your account setup:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #2563eb; font-size: 13px;">${inviteUrl}</a>
              </p>
              
              <!-- Warning -->
              <div style="margin-top: 30px; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-size: 13px;">
                  ⏰ <strong>This invitation expires in 72 hours.</strong><br>
                  If you didn't expect this email, please contact your administrator.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} RentConnect. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                Connecting tenants with verified agents in Kenya.
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

    await sgMail.send({
      to,
      from: 'noreply@Yoombaa.com',
      subject: `You've been invited to the RentConnect Admin Dashboard`,
      html: htmlContent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending admin invite email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
