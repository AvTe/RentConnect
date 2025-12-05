import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const sgMail = require('@sendgrid/mail');

// Create a Supabase admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Custom Password Reset Email API
 * Uses SendGrid to send password reset emails since Supabase's built-in 
 * email service may have limitations
 */
export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // For security, always return success even if user doesn't exist
    // But only send email if user exists
    if (!existingUser) {
      console.log('Password reset requested for non-existent user:', normalizedEmail);
      // Wait a bit to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'http://localhost:5000';
    
    let resetLink = null;
    let emailSentViaSupabase = false;

    // Try to use admin API to generate link (requires service role key)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: normalizedEmail,
          options: {
            redirectTo: `${baseUrl}/auth/reset-password`
          }
        });

        if (!resetError && resetData?.properties?.action_link) {
          resetLink = resetData.properties.action_link;
          console.log('Generated reset link via admin API');
        } else {
          console.log('Admin generateLink failed:', resetError?.message);
        }
      } catch (adminError) {
        console.log('Admin API not available:', adminError.message);
      }
    }

    // Fallback: Use standard resetPasswordForEmail
    if (!resetLink) {
      console.log('Using standard Supabase password reset');
      const { error: standardError } = await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${baseUrl}/auth/reset-password`
      });

      if (standardError) {
        console.error('Supabase reset error:', standardError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to initiate password reset. Please try again.' 
        }, { status: 500 });
      }
      
      emailSentViaSupabase = true;
    }

    // If we have a reset link and SendGrid is configured, send custom email
    if (resetLink && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const userName = existingUser.name || 'there';
      
      const htmlContent = generateEmailTemplate(userName, resetLink, baseUrl);

      try {
        await sgMail.send({
          to: normalizedEmail,
          from: {
            email: 'noreply@yoombaa.com',
            name: 'RentConnect'
          },
          subject: '🔐 Reset Your RentConnect Password',
          html: htmlContent
        });

        console.log('Password reset email sent via SendGrid to:', normalizedEmail);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Password reset email sent! Please check your inbox and spam folder.' 
        });
      } catch (emailError) {
        console.error('SendGrid email error:', emailError.response?.body || emailError.message);
        // Even if SendGrid fails, Supabase might still send the email
      }
    }

    // If Supabase handled the email
    if (emailSentViaSupabase) {
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset initiated. Please check your inbox and spam folder.' 
    });

  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred. Please try again.' 
    }, { status: 500 });
  }
}

function generateEmailTemplate(userName, resetLink, baseUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7A00AA 0%, #FE9200 100%); padding: 40px 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔐 Password Reset</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Hi <strong>${userName}</strong>,
                  </p>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    We received a request to reset your password for your RentConnect account. Click the button below to set a new password:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #7A00AA 0%, #9F2CC4 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(122, 0, 170, 0.3);">
                          Reset My Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 30px 0 20px;">
                    Or copy and paste this link into your browser:
                  </p>
                  
                  <p style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; word-break: break-all; color: #7A00AA; font-size: 13px; margin: 0 0 30px;">
                    ${resetLink}
                  </p>
                  
                  <!-- Security Notice -->
                  <div style="background-color: #fff8e6; border-left: 4px solid #FE9200; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                      <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #888888; font-size: 14px; margin: 0 0 10px;">
                    Need help? Contact us at <a href="mailto:support@yoombaa.com" style="color: #7A00AA;">support@yoombaa.com</a>
                  </p>
                  <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} RentConnect by Yoombaa. All rights reserved.
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
