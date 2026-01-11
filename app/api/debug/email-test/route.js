import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering since this uses cookies
export const dynamic = 'force-dynamic';

/**
 * Debug API Route - Check database state for email delivery testing
 *
 * SECURITY: This endpoint exposes sensitive user data and is restricted to:
 * - Development mode only, OR
 * - Admin users in production
 *
 * GET /api/debug/email-test
 */
export async function GET(request) {
    try {
        const supabase = await createClient();
        const isDev = process.env.NODE_ENV === 'development';

        // In production, require admin authentication
        if (!isDev) {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                return NextResponse.json({
                    success: false,
                    error: 'Authentication required. This debug endpoint is only available to admins.'
                }, { status: 401 });
            }

            // Check if user is admin
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            const adminRoles = ['admin', 'super_admin', 'main_admin'];
            if (!userData || !adminRoles.includes(userData.role)) {
                return NextResponse.json({
                    success: false,
                    error: 'Admin access required. Debug endpoints are restricted to admins.'
                }, { status: 403 });
            }
        }

        // Get all agents
        const { data: agents, error: agentsError } = await supabase
            .from('users')
            .select('id, name, email, role, verification_status, location, phone, created_at')
            .eq('role', 'agent')
            .order('created_at', { ascending: false });

        if (agentsError) {
            console.error('Error fetching agents:', agentsError);
        }

        // Get verified agents only
        const verifiedAgents = agents?.filter(a => a.verification_status === 'verified') || [];

        // Get all tenants
        const { data: tenants, error: tenantsError } = await supabase
            .from('users')
            .select('id, name, email, role, phone, created_at')
            .eq('role', 'tenant')
            .order('created_at', { ascending: false })
            .limit(10);

        if (tenantsError) {
            console.error('Error fetching tenants:', tenantsError);
        }

        // Get recent leads
        const { data: recentLeads, error: leadsError } = await supabase
            .from('leads')
            .select('id, location, budget, property_type, tenant_name, tenant_email, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (leadsError) {
            console.error('Error fetching leads:', leadsError);
        }

        // Get recent notifications
        const { data: recentNotifications, error: notifError } = await supabase
            .from('notifications')
            .select('id, user_id, type, title, message, read, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (notifError) {
            console.error('Error fetching notifications:', notifError);
        }

        // Check email API configuration
        const emailConfigured = !!process.env.RESEND_API_KEY;

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            emailConfiguration: {
                resendApiKeyConfigured: emailConfigured,
                resendApiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...'
            },
            agents: {
                total: agents?.length || 0,
                verified: verifiedAgents.length,
                list: agents?.map(a => ({
                    id: a.id,
                    name: a.name || 'No name',
                    email: a.email || 'No email',
                    verificationStatus: a.verification_status || 'unknown',
                    location: a.location || 'No location',
                    phone: a.phone ? 'Set' : 'Not set'
                })) || []
            },
            tenants: {
                total: tenants?.length || 0,
                list: tenants?.map(t => ({
                    id: t.id,
                    name: t.name || 'No name',
                    email: t.email || 'No email'
                })) || []
            },
            recentLeads: {
                total: recentLeads?.length || 0,
                list: recentLeads?.map(l => ({
                    id: l.id,
                    location: l.location,
                    budget: l.budget,
                    propertyType: l.property_type,
                    tenantName: l.tenant_name,
                    tenantEmail: l.tenant_email,
                    status: l.status,
                    createdAt: l.created_at
                })) || []
            },
            recentNotifications: {
                total: recentNotifications?.length || 0,
                newLeadNotifications: recentNotifications?.filter(n => n.type === 'new_lead').length || 0,
                list: recentNotifications?.slice(0, 10).map(n => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    userId: n.user_id,
                    read: n.read,
                    createdAt: n.created_at
                })) || []
            },
            analysis: {
                issue: verifiedAgents.length === 0
                    ? 'NO_VERIFIED_AGENTS - No agents have verification_status = "verified". Emails will not be sent.'
                    : verifiedAgents.every(a => !a.email)
                        ? 'NO_AGENT_EMAILS - Verified agents exist but none have email addresses.'
                        : 'OK - Verified agents with emails exist.',
                recommendation: verifiedAgents.length === 0
                    ? 'Run this SQL to verify an agent: UPDATE users SET verification_status = \'verified\' WHERE role = \'agent\' AND email = \'your-agent-email@example.com\';'
                    : null
            }
        });

    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
