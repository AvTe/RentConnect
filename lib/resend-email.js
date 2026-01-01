import { Resend } from 'resend';

// ============================================
// RESEND EMAIL SERVICE
// For transactional & notification emails
// ============================================

// Lazy-initialize Resend client to ensure API key is available
let resend = null;

const getResendClient = () => {
    if (!resend) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        resend = new Resend(apiKey);
    }
    return resend;
};

// Default sender - Use Resend's dev email for testing, update to your verified domain for production
// For production: 'Yoombaa <noreply@yoombaa.com>'
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Yoombaa <onboarding@resend.dev>';
const SUPPORT_FROM = process.env.RESEND_SUPPORT_EMAIL || 'Yoombaa Support <onboarding@resend.dev>';

// Brand colors
const BRAND_COLOR = '#fe9200';
const TEXT_COLOR = '#18181b';
const MUTED_COLOR = '#52525b';
const LIGHT_GRAY = '#f4f4f5';

// ============================================
// EMAIL TEMPLATE GENERATOR
// ============================================

/**
 * Generate the base email wrapper with Yoombaa branding
 */
const generateEmailWrapper = (content, title = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${LIGHT_GRAY}; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${LIGHT_GRAY};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px;">
              <span style="font-size: 28px; font-weight: 700; color: ${BRAND_COLOR}; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.<br>
                <a href="https://yoombaa.com" style="color: ${BRAND_COLOR}; text-decoration: none;">yoombaa.com</a>
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

/**
 * Generate a styled button
 */
const generateButton = (text, url, color = BRAND_COLOR) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="background-color: ${color}; border-radius: 6px;">
            <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
              ${text}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

/**
 * Generate an info box
 */
const generateInfoBox = (content, bgColor = '#f0f9ff', borderColor = '#3b82f6') => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
  <tr>
    <td style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px; border-radius: 4px;">
      ${content}
    </td>
  </tr>
</table>
`;

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Welcome email for new agents
 */
export const welcomeAgentEmail = (agentName) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      Welcome to Yoombaa, ${agentName}!
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Congratulations! Your agent account has been created. You're now part of Kenya's premier real estate lead platform.
    </p>
    
    ${generateInfoBox(`
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${TEXT_COLOR};">Next Steps:</p>
      <p style="margin: 0; font-size: 13px; color: ${MUTED_COLOR}; line-height: 1.6;">
        1. Complete your profile with your agency details<br>
        2. Upload your verification documents<br>
        3. Add credits to start unlocking leads<br>
        4. Start connecting with tenants!
      </p>
    `, '#fef3c7', BRAND_COLOR)}
    
    ${generateButton('Go to Dashboard', 'https://yoombaa.com/dashboard')}
    
    <p style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
      Need help? Contact us at support@yoombaa.com
    </p>
  `;

    return {
        subject: 'Welcome to Yoombaa - Get Started!',
        html: generateEmailWrapper(content, 'Welcome to Yoombaa')
    };
};

/**
 * Welcome email for new tenants
 */
export const welcomeTenantEmail = (tenantName) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      Welcome to Yoombaa, ${tenantName}!
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      We're excited to help you find your perfect home. Verified agents will reach out to you with properties matching your requirements.
    </p>
    
    ${generateInfoBox(`
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${TEXT_COLOR};">What's Next:</p>
      <p style="margin: 0; font-size: 13px; color: ${MUTED_COLOR}; line-height: 1.6;">
        • Agents will contact you via WhatsApp or call<br>
        • You can rate agents after each interaction<br>
        • Your information is shared only with verified agents
      </p>
    `, '#ecfdf5', '#10b981')}
    
    <p style="margin: 24px 0 0; font-size: 13px; color: #a1a1aa; text-align: center;">
      Questions? Reply to this email or contact support@yoombaa.com
    </p>
  `;

    return {
        subject: 'Welcome to Yoombaa - Your Home Search Starts Now!',
        html: generateEmailWrapper(content, 'Welcome to Yoombaa')
    };
};

/**
 * New lead notification for agents
 */
export const newLeadNotificationEmail = (agentName, leadData) => {
    const { location, budget, bedrooms, propertyType, urgency } = leadData;

    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      New Lead Available!
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Hi ${agentName}, a new lead matching your area is now available.
    </p>
    
    ${generateInfoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Location:</span>
            <span style="font-size: 13px; color: ${TEXT_COLOR}; font-weight: 500; float: right;">${location || 'N/A'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Budget:</span>
            <span style="font-size: 13px; color: ${TEXT_COLOR}; font-weight: 500; float: right;">KES ${budget?.toLocaleString() || 'N/A'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Property:</span>
            <span style="font-size: 13px; color: ${TEXT_COLOR}; font-weight: 500; float: right;">${bedrooms || 'Any'} BR ${propertyType || 'Any'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Urgency:</span>
            <span style="font-size: 13px; color: ${urgency === 'immediate' ? '#ef4444' : BRAND_COLOR}; font-weight: 500; float: right;">${urgency || 'Normal'}</span>
          </td>
        </tr>
      </table>
    `, '#fff7ed', BRAND_COLOR)}
    
    ${generateButton('View Lead Details', 'https://yoombaa.com/dashboard/leads')}
    
    <p style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
      Unlock this lead to see contact details and connect with the tenant.
    </p>
  `;

    return {
        subject: `New Lead in ${location || 'Your Area'} - Yoombaa`,
        html: generateEmailWrapper(content, 'New Lead Available')
    };
};

/**
 * Lead unlocked confirmation for agents
 */
export const leadUnlockedEmail = (agentName, leadData, tenantContact) => {
    const { name, phone, email } = tenantContact;

    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      Lead Unlocked Successfully!
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Hi ${agentName}, you've successfully unlocked this lead. Here are the tenant's contact details:
    </p>
    
    ${generateInfoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Name:</span>
            <span style="font-size: 14px; color: ${TEXT_COLOR}; font-weight: 600; float: right;">${name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Phone:</span>
            <span style="font-size: 14px; color: ${TEXT_COLOR}; font-weight: 600; float: right;">${phone}</span>
          </td>
        </tr>
        ${email ? `
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Email:</span>
            <span style="font-size: 14px; color: ${TEXT_COLOR}; font-weight: 600; float: right;">${email}</span>
          </td>
        </tr>
        ` : ''}
      </table>
    `, '#ecfdf5', '#10b981')}
    
    <p style="margin: 24px 0; font-size: 14px; color: ${MUTED_COLOR}; text-align: center; line-height: 1.6;">
      <strong>Pro Tip:</strong> Contact the tenant within 30 minutes for the best response rate!
    </p>
    
    ${generateButton('View Lead', 'https://yoombaa.com/dashboard/leads')}
  `;

    return {
        subject: 'Lead Contact Details - Yoombaa',
        html: generateEmailWrapper(content, 'Lead Unlocked')
    };
};

/**
 * Verification approved notification for agents
 */
export const verificationApprovedEmail = (agentName) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      You're Verified! ✓
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Congratulations ${agentName}! Your account has been verified. You can now unlock leads and connect with tenants.
    </p>
    
    ${generateInfoBox(`
      <p style="margin: 0; font-size: 13px; color: ${MUTED_COLOR}; line-height: 1.6;">
        As a verified agent, you'll receive a badge on your profile, priority in search results, and access to premium leads.
      </p>
    `, '#ecfdf5', '#10b981')}
    
    ${generateButton('Start Finding Leads', 'https://yoombaa.com/dashboard')}
  `;

    return {
        subject: 'Account Verified - Welcome to Yoombaa!',
        html: generateEmailWrapper(content, 'Account Verified')
    };
};

/**
 * Verification rejected notification for agents
 */
export const verificationRejectedEmail = (agentName, reason) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      Verification Update
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Hi ${agentName}, unfortunately we couldn't verify your account at this time.
    </p>
    
    ${generateInfoBox(`
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">Reason:</p>
      <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6;">${reason || 'Documents could not be verified. Please resubmit with clearer documents.'}</p>
    `, '#fef2f2', '#ef4444')}
    
    <p style="margin: 24px 0; font-size: 14px; color: ${MUTED_COLOR}; text-align: center; line-height: 1.6;">
      Please update your documents and resubmit for verification.
    </p>
    
    ${generateButton('Update Documents', 'https://yoombaa.com/dashboard/settings')}
  `;

    return {
        subject: 'Verification Update - Action Required',
        html: generateEmailWrapper(content, 'Verification Update')
    };
};

/**
 * Credits purchased confirmation
 */
export const creditsPurchasedEmail = (agentName, credits, amount, newBalance) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      Payment Successful!
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Hi ${agentName}, your credit purchase was successful.
    </p>
    
    ${generateInfoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Credits Purchased:</span>
            <span style="font-size: 14px; color: ${TEXT_COLOR}; font-weight: 600; float: right;">${credits} credits</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <span style="font-size: 13px; color: ${MUTED_COLOR};">Amount Paid:</span>
            <span style="font-size: 14px; color: ${TEXT_COLOR}; font-weight: 600; float: right;">KES ${amount?.toLocaleString()}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 12px;">
            <span style="font-size: 14px; color: ${TEXT_COLOR}; font-weight: 600;">New Balance:</span>
            <span style="font-size: 16px; color: ${BRAND_COLOR}; font-weight: 700; float: right;">${newBalance} credits</span>
          </td>
        </tr>
      </table>
    `, '#ecfdf5', '#10b981')}
    
    ${generateButton('View Dashboard', 'https://yoombaa.com/dashboard')}
    
    <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
      Transaction ID will be sent in a separate receipt email.
    </p>
  `;

    return {
        subject: 'Payment Successful - Yoombaa',
        html: generateEmailWrapper(content, 'Payment Successful')
    };
};

/**
 * Low credits warning
 */
export const lowCreditsWarningEmail = (agentName, currentBalance) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      Low Credit Balance
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Hi ${agentName}, your credit balance is running low.
    </p>
    
    ${generateInfoBox(`
      <p style="margin: 0; font-size: 14px; color: #92400e; text-align: center;">
        Current Balance: <strong style="font-size: 18px; color: #b45309;">${currentBalance} credits</strong>
      </p>
    `, '#fef3c7', BRAND_COLOR)}
    
    <p style="margin: 24px 0; font-size: 14px; color: ${MUTED_COLOR}; text-align: center; line-height: 1.6;">
      Top up now to keep unlocking leads and connecting with tenants.
    </p>
    
    ${generateButton('Top Up Credits', 'https://yoombaa.com/dashboard/wallet')}
  `;

    return {
        subject: 'Low Credit Balance - Top Up Now',
        html: generateEmailWrapper(content, 'Low Credits')
    };
};

/**
 * Agent inquiry notification to tenant
 */
export const agentInterestedEmail = (tenantName, agentName, agentPhone) => {
    const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center; line-height: 1.3;">
      An Agent is Interested!
    </h1>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: ${MUTED_COLOR}; line-height: 1.6; text-align: center;">
      Hi ${tenantName}, great news! A verified agent is interested in helping you find a home.
    </p>
    
    ${generateInfoBox(`
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${TEXT_COLOR};">Agent Details:</p>
      <p style="margin: 0; font-size: 13px; color: ${MUTED_COLOR};">
        <strong>${agentName}</strong> will contact you at <strong>${agentPhone}</strong> soon.
      </p>
    `, '#f0f9ff', '#3b82f6')}
    
    <p style="margin: 24px 0 0; font-size: 13px; color: #a1a1aa; text-align: center;">
      After your interaction, please rate the agent to help other tenants.
    </p>
  `;

    return {
        subject: 'A Verified Agent is Interested - Yoombaa',
        html: generateEmailWrapper(content, 'Agent Interested')
    };
};

// ============================================
// SEND EMAIL FUNCTIONS
// ============================================

/**
 * Send an email using Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string} from - Sender email (optional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendEmail = async (to, subject, html, from = DEFAULT_FROM) => {
    try {
        const client = getResendClient();

        const { data, error } = await client.emails.send({
            from,
            to,
            subject,
            html
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        console.log('Email sent successfully:', data?.id);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email to new agent
 */
export const sendWelcomeAgentEmail = async (email, agentName) => {
    const template = welcomeAgentEmail(agentName);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send welcome email to new tenant
 */
export const sendWelcomeTenantEmail = async (email, tenantName) => {
    const template = welcomeTenantEmail(tenantName);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send new lead notification to agent
 */
export const sendNewLeadNotification = async (email, agentName, leadData) => {
    const template = newLeadNotificationEmail(agentName, leadData);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send lead unlocked confirmation to agent
 */
export const sendLeadUnlockedEmail = async (email, agentName, leadData, tenantContact) => {
    const template = leadUnlockedEmail(agentName, leadData, tenantContact);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send verification approved email to agent
 */
export const sendVerificationApprovedEmail = async (email, agentName) => {
    const template = verificationApprovedEmail(agentName);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send verification rejected email to agent
 */
export const sendVerificationRejectedEmail = async (email, agentName, reason) => {
    const template = verificationRejectedEmail(agentName, reason);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send credits purchased confirmation to agent
 */
export const sendCreditsPurchasedEmail = async (email, agentName, credits, amount, newBalance) => {
    const template = creditsPurchasedEmail(agentName, credits, amount, newBalance);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send low credits warning to agent
 */
export const sendLowCreditsWarning = async (email, agentName, currentBalance) => {
    const template = lowCreditsWarningEmail(agentName, currentBalance);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send agent interested notification to tenant
 */
export const sendAgentInterestedEmail = async (email, tenantName, agentName, agentPhone) => {
    const template = agentInterestedEmail(tenantName, agentName, agentPhone);
    return sendEmail(email, template.subject, template.html);
};

/**
 * Send a custom email with the Yoombaa template wrapper
 */
export const sendCustomEmail = async (to, subject, content) => {
    const html = generateEmailWrapper(content, subject);
    return sendEmail(to, subject, html);
};

// ============================================
// BATCH EMAIL FUNCTIONS
// ============================================

/**
 * Send new lead notification to multiple agents
 */
export const notifyAgentsAboutLead = async (agents, leadData) => {
    const results = [];

    for (const agent of agents) {
        if (agent.email) {
            const result = await sendNewLeadNotification(agent.email, agent.name, leadData);
            results.push({ agentId: agent.id, ...result });
        }
    }

    return results;
};

const resendEmailService = {
    sendEmail,
    sendWelcomeAgentEmail,
    sendWelcomeTenantEmail,
    sendNewLeadNotification,
    sendLeadUnlockedEmail,
    sendVerificationApprovedEmail,
    sendVerificationRejectedEmail,
    sendCreditsPurchasedEmail,
    sendLowCreditsWarning,
    sendAgentInterestedEmail,
    sendCustomEmail,
    notifyAgentsAboutLead
};

export default resendEmailService;
