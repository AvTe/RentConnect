import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Email API Route
 * Handles sending various notification emails through Resend
 * 
 * This route creates the Resend client directly instead of importing
 * to ensure the API key is available at runtime.
 */

// Brand colors for email templates
const BRAND_COLOR = '#fe9200';
const TEXT_COLOR = '#18181b';
const MUTED_COLOR = '#52525b';
const LIGHT_GRAY = '#f4f4f5';

// Email wrapper template
const generateEmailWrapper = (content, title = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${LIGHT_GRAY}; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${LIGHT_GRAY};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 24px;">
              <span style="font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">Yoombaa</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © 2025 Yoombaa. All rights reserved.<br>
                <a href="https://yoombaa.com" style="color: ${BRAND_COLOR};">yoombaa.com</a>
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

// Simple email templates
const templates = {
    welcome_agent: (name) => ({
        subject: 'Welcome to Yoombaa - Get Started!',
        html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        Welcome to Yoombaa, ${name}!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Your agent account has been created. Start connecting with tenants today.
      </p>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Go to Dashboard
        </a>
      </div>
    `, 'Welcome to Yoombaa')
    }),

    welcome_tenant: (name) => ({
        subject: 'Welcome to Yoombaa!',
        html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        Welcome, ${name}!
      </h1>
      <p style="margin: 0; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Verified agents will contact you with properties matching your requirements.
      </p>
    `, 'Welcome to Yoombaa')
    }),

    new_lead: (agentName, leadData) => ({
        subject: `New Lead in ${leadData?.location || 'Your Area'} - Yoombaa`,
        html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        New Lead Available!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Hi ${agentName}, a new lead matching your area is available.
      </p>
      <div style="background: #fff7ed; padding: 16px; border-radius: 8px; border-left: 4px solid ${BRAND_COLOR}; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${MUTED_COLOR};">
          <strong>Location:</strong> ${leadData?.location || 'N/A'}
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: ${MUTED_COLOR};">
          <strong>Budget:</strong> KES ${leadData?.budget?.toLocaleString() || 'N/A'}
        </p>
        <p style="margin: 0; font-size: 14px; color: ${MUTED_COLOR};">
          <strong>Property:</strong> ${leadData?.bedrooms || 'Any'} BR ${leadData?.propertyType || ''}
        </p>
      </div>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Lead
        </a>
      </div>
    `, 'New Lead Available')
    }),

    custom: (subject, content) => ({
        subject,
        html: generateEmailWrapper(content, subject)
    })
};

export async function POST(request) {
    // Log for debugging
    console.log('Email API called');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY prefix:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

    try {
        // Check if RESEND_API_KEY is configured
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('RESEND_API_KEY is not configured');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email service not configured',
                    debug: 'RESEND_API_KEY environment variable is missing'
                },
                { status: 503 }
            );
        }

        // Initialize Resend client
        const resend = new Resend(apiKey);

        // Parse request body
        const body = await request.json();
        const { type, to, data } = body;

        console.log('Email request:', { type, to, dataKeys: Object.keys(data || {}) });

        if (!type || !to) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: type and to' },
                { status: 400 }
            );
        }

        // Generate email based on type
        let emailContent;
        switch (type) {
            case 'welcome_agent':
                emailContent = templates.welcome_agent(data?.name || 'Agent');
                break;
            case 'welcome_tenant':
                emailContent = templates.welcome_tenant(data?.name || 'Tenant');
                break;
            case 'new_lead':
                emailContent = templates.new_lead(data?.agentName || 'Agent', data?.leadData || {});
                break;
            case 'custom':
                if (!data?.subject || !data?.content) {
                    return NextResponse.json(
                        { success: false, error: 'Custom emails require subject and content' },
                        { status: 400 }
                    );
                }
                emailContent = templates.custom(data.subject, data.content);
                break;
            default:
                // For other types, use a generic template
                emailContent = {
                    subject: `Notification from Yoombaa`,
                    html: generateEmailWrapper(`
            <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
              Notification
            </h1>
            <p style="margin: 0; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
              ${JSON.stringify(data)}
            </p>
          `, 'Yoombaa Notification')
                };
        }

        // Send email using Resend
        console.log('Sending email to:', to);
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Yoombaa <onboarding@resend.dev>',
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        });

        if (emailError) {
            console.error('Resend API error:', emailError);
            return NextResponse.json(
                { success: false, error: emailError.message, details: emailError },
                { status: 500 }
            );
        }

        console.log('Email sent successfully:', emailData?.id);
        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            data: emailData
        });

    } catch (error) {
        console.error('Email API error:', error.message, error.stack);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to send email',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    const hasApiKey = !!process.env.RESEND_API_KEY;

    return NextResponse.json({
        success: true,
        status: hasApiKey ? 'configured' : 'not_configured',
        message: hasApiKey
            ? 'Email service is configured and ready'
            : 'RESEND_API_KEY is not set in environment variables',
        availableTypes: ['welcome_agent', 'welcome_tenant', 'new_lead', 'custom']
    });
}
