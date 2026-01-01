import { NextResponse } from 'next/server';
import {
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
    sendCustomEmail
} from '@/lib/resend-email';

/**
 * Email API Route
 * Handles sending various notification emails through Resend
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, to, data } = body;

        if (!type || !to) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: type and to' },
                { status: 400 }
            );
        }

        let result;

        switch (type) {
            case 'welcome_agent':
                result = await sendWelcomeAgentEmail(to, data?.name || 'Agent');
                break;

            case 'welcome_tenant':
                result = await sendWelcomeTenantEmail(to, data?.name || 'Tenant');
                break;

            case 'new_lead':
                result = await sendNewLeadNotification(to, data?.agentName, data?.leadData);
                break;

            case 'lead_unlocked':
                result = await sendLeadUnlockedEmail(to, data?.agentName, data?.leadData, data?.tenantContact);
                break;

            case 'verification_approved':
                result = await sendVerificationApprovedEmail(to, data?.name);
                break;

            case 'verification_rejected':
                result = await sendVerificationRejectedEmail(to, data?.name, data?.reason);
                break;

            case 'credits_purchased':
                result = await sendCreditsPurchasedEmail(
                    to,
                    data?.name,
                    data?.credits,
                    data?.amount,
                    data?.newBalance
                );
                break;

            case 'low_credits':
                result = await sendLowCreditsWarning(to, data?.name, data?.balance);
                break;

            case 'agent_interested':
                result = await sendAgentInterestedEmail(
                    to,
                    data?.tenantName,
                    data?.agentName,
                    data?.agentPhone
                );
                break;

            case 'custom':
                if (!data?.subject || !data?.content) {
                    return NextResponse.json(
                        { success: false, error: 'Custom emails require subject and content' },
                        { status: 400 }
                    );
                }
                result = await sendCustomEmail(to, data.subject, data.content);
                break;

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown email type: ${type}` },
                    { status: 400 }
                );
        }

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send email' },
            { status: 500 }
        );
    }
}

/**
 * GET handler - Return available email types
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        availableTypes: [
            { type: 'welcome_agent', description: 'Welcome email for new agents', requiredData: ['name'] },
            { type: 'welcome_tenant', description: 'Welcome email for new tenants', requiredData: ['name'] },
            { type: 'new_lead', description: 'New lead notification for agents', requiredData: ['agentName', 'leadData'] },
            { type: 'lead_unlocked', description: 'Lead unlocked confirmation', requiredData: ['agentName', 'leadData', 'tenantContact'] },
            { type: 'verification_approved', description: 'Agent verification approved', requiredData: ['name'] },
            { type: 'verification_rejected', description: 'Agent verification rejected', requiredData: ['name', 'reason'] },
            { type: 'credits_purchased', description: 'Credits purchase confirmation', requiredData: ['name', 'credits', 'amount', 'newBalance'] },
            { type: 'low_credits', description: 'Low credits warning', requiredData: ['name', 'balance'] },
            { type: 'agent_interested', description: 'Agent interested notification to tenant', requiredData: ['tenantName', 'agentName', 'agentPhone'] },
            { type: 'custom', description: 'Custom email with Yoombaa branding', requiredData: ['subject', 'content'] }
        ]
    });
}
