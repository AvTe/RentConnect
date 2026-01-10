import { NextResponse } from 'next/server';
import resendEmailService from '@/lib/resend-email';

// Brand colors
const BRAND_COLOR = '#fe9200';
const TEXT_COLOR = '#18181b';
const MUTED_COLOR = '#52525b';
const LIGHT_GRAY = '#f4f4f5';

const priorityLabels = {
    low: { label: 'Low', color: '#6b7280' },
    medium: { label: 'Medium', color: '#3b82f6' },
    high: { label: 'High', color: '#f97316' },
    urgent: { label: 'Urgent', color: '#ef4444' }
};

const statusLabels = {
    open: 'Open',
    in_progress: 'In Progress',
    pending: 'Pending',
    resolved: 'Resolved',
    closed: 'Closed'
};

// Generate email wrapper
const generateEmailWrapper = (content, title = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${LIGHT_GRAY}; font-family: 'DM Sans', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${LIGHT_GRAY};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 40px 20px;">
              <span style="font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">Yoombaa</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e4e4e7; background-color: ${LIGHT_GRAY}; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © 2025 Yoombaa. All rights reserved.
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

// Generate new ticket admin notification email
function generateNewTicketAdminEmail(adminName, ticket, user) {
    const priority = priorityLabels[ticket.priority] || priorityLabels.medium;

    return {
        subject: `🎫 New Support Ticket: ${ticket.subject}`,
        html: generateEmailWrapper(`
            <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
                New Support Ticket
            </h1>
            
            <p style="margin: 0 0 20px; font-size: 14px; color: ${MUTED_COLOR}; text-align: center;">
                Hi ${adminName}, a new support ticket has been submitted.
            </p>
            
            <table style="width: 100%; background-color: #fff7ed; border-radius: 8px; border-left: 4px solid ${BRAND_COLOR}; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 16px;">
                        <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: ${TEXT_COLOR};">
                            ${ticket.subject}
                        </p>
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: ${MUTED_COLOR};">From:</td>
                                <td style="padding: 4px 0; font-size: 13px; color: ${TEXT_COLOR}; font-weight: 500; text-align: right;">${user?.name || 'Unknown'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: ${MUTED_COLOR};">Email:</td>
                                <td style="padding: 4px 0; font-size: 13px; color: ${TEXT_COLOR}; text-align: right;">${user?.email || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: ${MUTED_COLOR};">Category:</td>
                                <td style="padding: 4px 0; font-size: 13px; color: ${TEXT_COLOR}; text-align: right;">${ticket.category || 'General'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: ${MUTED_COLOR};">Priority:</td>
                                <td style="padding: 4px 0; font-size: 13px; color: ${priority.color}; font-weight: 600; text-align: right;">${priority.label}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 12px 0;">
                        <a href="https://yoombaa.com/admin/tickets" style="display: inline-block; padding: 12px 28px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                            View Ticket
                        </a>
                    </td>
                </tr>
            </table>
        `, 'New Support Ticket')
    };
}

// Generate ticket update email for user
function generateTicketUpdateEmail(userName, ticket, newStatus) {
    const statusText = statusLabels[newStatus] || newStatus;
    const isResolved = newStatus === 'resolved' || newStatus === 'closed';
    const statusColor = isResolved ? '#10b981' : BRAND_COLOR;

    return {
        subject: `Ticket Update: ${ticket.subject}`,
        html: generateEmailWrapper(`
            <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
                Ticket Status Updated
            </h1>
            
            <p style="margin: 0 0 20px; font-size: 14px; color: ${MUTED_COLOR}; text-align: center;">
                Hi ${userName}, your support ticket status has been updated.
            </p>
            
            <table style="width: 100%; background-color: ${isResolved ? '#ecfdf5' : '#f0f9ff'}; border-radius: 8px; border-left: 4px solid ${statusColor}; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 16px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: ${MUTED_COLOR};">Ticket:</p>
                        <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${TEXT_COLOR};">
                            "${ticket.subject}"
                        </p>
                        <p style="margin: 0;">
                            <span style="font-size: 13px; color: ${MUTED_COLOR};">New Status: </span>
                            <span style="display: inline-block; padding: 4px 12px; background-color: ${statusColor}; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                ${statusText}
                            </span>
                        </p>
                    </td>
                </tr>
            </table>
            
            ${isResolved ? `
                <p style="margin: 0 0 20px; font-size: 13px; color: ${MUTED_COLOR}; text-align: center;">
                    If you have any more questions, feel free to open a new ticket.
                </p>
            ` : `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                        <td align="center" style="padding: 12px 0;">
                            <a href="https://yoombaa.com/dashboard/support" style="display: inline-block; padding: 12px 28px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                                View Ticket
                            </a>
                        </td>
                    </tr>
                </table>
            `}
        `, 'Ticket Update')
    };
}

// Generate new reply email
function generateNewReplyEmail(userName, ticket, preview) {
    return {
        subject: `New Reply: ${ticket.subject}`,
        html: generateEmailWrapper(`
            <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${TEXT_COLOR}; text-align: center;">
                New Reply on Your Ticket
            </h1>
            
            <p style="margin: 0 0 20px; font-size: 14px; color: ${MUTED_COLOR}; text-align: center;">
                Hi ${userName}, our support team has replied to your ticket.
            </p>
            
            <table style="width: 100%; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 16px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: ${MUTED_COLOR};">Re: ${ticket.subject}</p>
                        <p style="margin: 0; font-size: 14px; color: ${TEXT_COLOR}; line-height: 1.6;">
                            "${preview}${preview && preview.length >= 200 ? '...' : ''}"
                        </p>
                    </td>
                </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 12px 0;">
                        <a href="https://yoombaa.com/dashboard/support" style="display: inline-block; padding: 12px 28px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                            View Full Reply
                        </a>
                    </td>
                </tr>
            </table>
        `, 'New Reply')
    };
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { type } = data;

        let results = [];

        switch (type) {
            case 'new_ticket': {
                const { admins, ticket, user } = data;

                for (const admin of admins || []) {
                    if (admin.email) {
                        const email = generateNewTicketAdminEmail(admin.name, ticket, user);
                        const result = await resendEmailService.sendEmail(
                            admin.email,
                            email.subject,
                            email.html
                        );
                        results.push({ email: admin.email, ...result });
                    }
                }
                break;
            }

            case 'ticket_update': {
                const { recipient, ticket, newStatus } = data;

                if (recipient?.email) {
                    const email = generateTicketUpdateEmail(recipient.name, ticket, newStatus);
                    const result = await resendEmailService.sendEmail(
                        recipient.email,
                        email.subject,
                        email.html
                    );
                    results.push({ email: recipient.email, ...result });
                }
                break;
            }

            case 'new_reply': {
                const { recipient, ticket, preview } = data;

                if (recipient?.email) {
                    const email = generateNewReplyEmail(recipient.name, ticket, preview);
                    const result = await resendEmailService.sendEmail(
                        recipient.email,
                        email.subject,
                        email.html
                    );
                    results.push({ email: recipient.email, ...result });
                }
                break;
            }

            default:
                return NextResponse.json(
                    { error: 'Unknown notification type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Ticket notification API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
