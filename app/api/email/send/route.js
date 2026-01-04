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

  lead_unlocked: (agentName, tenantContact) => ({
    subject: 'Lead Contact Details - Yoombaa',
    html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        Lead Unlocked Successfully!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Hi ${agentName}, here are the tenant's contact details:
      </p>
      <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Name:</strong> ${tenantContact?.name || 'N/A'}</p>
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Phone:</strong> ${tenantContact?.phone || 'N/A'}</p>
        ${tenantContact?.email ? `<p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${tenantContact.email}</p>` : ''}
      </div>
      <p style="margin: 24px 0; font-size: 14px; color: ${MUTED_COLOR}; text-align: center;">
        <strong>Pro Tip:</strong> Contact the tenant within 30 minutes for the best response rate!
      </p>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Lead
        </a>
      </div>
    `, 'Lead Unlocked')
  }),

  verification_approved: (name) => ({
    subject: 'Account Verified - Welcome to Yoombaa!',
    html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        You're Verified! ✓
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Congratulations ${name}! Your account has been verified. You can now unlock leads and connect with tenants.
      </p>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Start Finding Leads
        </a>
      </div>
    `, 'Account Verified')
  }),

  verification_rejected: (name, reason) => ({
    subject: 'Verification Update - Action Required',
    html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        Verification Update
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Hi ${name}, unfortunately we couldn't verify your account at this time.
      </p>
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">Reason:</p>
        <p style="margin: 0; font-size: 13px; color: #991b1b;">${reason || 'Documents could not be verified.'}</p>
      </div>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard/settings" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Update Documents
        </a>
      </div>
    `, 'Verification Update')
  }),

  credits_purchased: (name, credits, amount, newBalance) => ({
    subject: 'Payment Successful - Yoombaa',
    html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        Payment Successful!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Hi ${name}, your credit purchase was successful.
      </p>
      <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Credits:</strong> ${credits}</p>
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Amount:</strong> KES ${amount?.toLocaleString() || 'N/A'}</p>
        <p style="margin: 0; font-size: 16px; color: ${BRAND_COLOR}; font-weight: 700;"><strong>New Balance:</strong> ${newBalance}</p>
      </div>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Dashboard
        </a>
      </div>
    `, 'Payment Successful')
  }),

  low_credits: (name, balance) => ({
    subject: 'Low Credit Balance - Top Up Now',
    html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        Low Credit Balance
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Hi ${name}, your credit balance is running low.
      </p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid ${BRAND_COLOR}; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          Current Balance: <strong style="font-size: 18px; color: #b45309;">${balance} credits</strong>
        </p>
      </div>
      <div style="text-align: center; padding: 24px 0;">
        <a href="https://yoombaa.com/dashboard/wallet" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Top Up Credits
        </a>
      </div>
    `, 'Low Credits')
  }),

  agent_interested: (tenantName, agentName, agentPhone) => ({
    subject: 'A Verified Agent is Interested - Yoombaa',
    html: generateEmailWrapper(`
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
        An Agent is Interested!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; text-align: center;">
        Hi ${tenantName}, a verified agent is interested in helping you find a home.
      </p>
      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">Agent Details:</p>
        <p style="margin: 0; font-size: 13px; color: ${MUTED_COLOR};">
          <strong>${agentName}</strong> will contact you at <strong>${agentPhone}</strong> soon.
        </p>
      </div>
    `, 'Agent Interested')
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
      case 'lead_unlocked':
        emailContent = templates.lead_unlocked(data?.agentName || 'Agent', data?.tenantContact || {});
        break;
      case 'verification_approved':
        emailContent = templates.verification_approved(data?.name || 'Agent');
        break;
      case 'verification_rejected':
        emailContent = templates.verification_rejected(data?.name || 'Agent', data?.reason);
        break;
      case 'credits_purchased':
        emailContent = templates.credits_purchased(data?.name || 'Agent', data?.credits, data?.amount, data?.newBalance);
        break;
      case 'low_credits':
        emailContent = templates.low_credits(data?.name || 'Agent', data?.balance);
        break;
      case 'agent_interested':
        emailContent = templates.agent_interested(data?.tenantName || 'Tenant', data?.agentName, data?.agentPhone);
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
        // For unknown types, use a generic template
        console.warn('Unknown email type:', type);
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

    // Send email using Resend with verified domain
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Yoombaa <noreply@yoombaa.com>';
    console.log('Sending email to:', to, 'from:', fromEmail);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
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
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Yoombaa <noreply@yoombaa.com>';

  return NextResponse.json({
    success: true,
    status: hasApiKey ? 'configured' : 'not_configured',
    message: hasApiKey
      ? 'Email service is configured and ready'
      : 'RESEND_API_KEY is not set in environment variables',
    from: fromEmail,
    availableTypes: [
      'welcome_agent',
      'welcome_tenant',
      'new_lead',
      'lead_unlocked',
      'verification_approved',
      'verification_rejected',
      'credits_purchased',
      'low_credits',
      'agent_interested',
      'custom'
    ]
  });
}
