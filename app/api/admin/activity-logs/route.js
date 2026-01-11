import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper to get admin supabase client
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

/**
 * GET /api/admin/activity-logs - Fetch comprehensive activity logs
 */
export async function GET(request) {
    try {
        // Verify admin authentication
        let supabaseAuth;
        try {
            supabaseAuth = await createServerClient();
        } catch (cookieError) {
            console.error('Cookie error:', cookieError);
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData } = await supabaseAuth.from('users').select('role').eq('id', user.id).single();
        const adminRoles = ['admin', 'super_admin', 'main_admin'];
        let isAdmin = userData && adminRoles.includes(userData.role);

        if (!isAdmin) {
            const { data: adminUser } = await supabaseAuth.from('admin_users').select('role').eq('email', user.email).single();
            isAdmin = !!adminUser;
        }

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';
        const days = parseInt(searchParams.get('days') || '7', 10);
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        const supabase = getSupabaseAdmin();
        const activities = [];
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        const dateFilter = daysAgo.toISOString();

        // Fetch agent approvals/rejections (users with verification status changes)
        if (type === 'all' || type === 'agent_approved' || type === 'agent_rejected') {
            const { data: verifiedAgents } = await supabase
                .from('users')
                .select('id, name, email, role, verification_status, created_at, updated_at')
                .eq('role', 'agent')
                .in('verification_status', ['verified', 'rejected'])
                .gte('updated_at', dateFilter)
                .order('updated_at', { ascending: false })
                .limit(50);

            verifiedAgents?.forEach(agent => {
                activities.push({
                    id: `agent-${agent.id}`,
                    type: agent.verification_status === 'verified' ? 'agent_approved' : 'agent_rejected',
                    description: `Agent ${agent.name || agent.email} was ${agent.verification_status}`,
                    created_at: agent.updated_at,
                    actor: { name: 'Admin', email: 'system' },
                    metadata: { agentId: agent.id, email: agent.email }
                });
            });
        }

        // Fetch lead activities
        if (type === 'all' || type === 'lead_created') {
            const { data: leads } = await supabase
                .from('leads')
                .select('id, property_type, location, budget, created_at')
                .gte('created_at', dateFilter)
                .order('created_at', { ascending: false })
                .limit(50);

            leads?.forEach(lead => {
                activities.push({
                    id: `lead-${lead.id}`,
                    type: 'lead_created',
                    description: `New lead: ${lead.property_type} in ${lead.location} (KES ${lead.budget?.toLocaleString() || 'N/A'})`,
                    created_at: lead.created_at,
                    actor: { name: 'System', email: 'system' },
                    metadata: { leadId: lead.id, propertyType: lead.property_type, location: lead.location }
                });
            });
        }

        // Fetch lead unlocks
        if (type === 'all' || type === 'lead_unlocked') {
            const { data: unlocks } = await supabase
                .from('lead_unlocks')
                .select('id, lead_id, agent_id, credits_used, created_at, users!lead_unlocks_agent_id_fkey(name, email)')
                .gte('created_at', dateFilter)
                .order('created_at', { ascending: false })
                .limit(50);

            unlocks?.forEach(unlock => {
                activities.push({
                    id: `unlock-${unlock.id}`,
                    type: 'lead_unlocked',
                    description: `Lead unlocked for ${unlock.credits_used || 1} credits`,
                    created_at: unlock.created_at,
                    actor: { name: unlock.users?.name || 'Agent', email: unlock.users?.email || 'unknown' },
                    metadata: { leadId: unlock.lead_id, agentId: unlock.agent_id, credits: unlock.credits_used }
                });
            });
        }

        // Fetch credit purchases
        if (type === 'all' || type === 'credit_purchase') {
            const { data: purchases } = await supabase
                .from('credit_transactions')
                .select('id, user_id, amount, type, reason, created_at, users(name, email)')
                .eq('type', 'credit')
                .gte('created_at', dateFilter)
                .order('created_at', { ascending: false })
                .limit(50);

            purchases?.forEach(tx => {
                activities.push({
                    id: `tx-${tx.id}`,
                    type: 'credit_purchase',
                    description: `${tx.amount} credits purchased - ${tx.reason || 'Credit purchase'}`,
                    created_at: tx.created_at,
                    actor: { name: tx.users?.name || 'User', email: tx.users?.email || 'unknown' },
                    metadata: { amount: tx.amount, userId: tx.user_id }
                });
            });
        }

        // Fetch user registrations
        if (type === 'all' || type === 'user_registered') {
            const { data: newUsers } = await supabase
                .from('users')
                .select('id, name, email, role, created_at')
                .gte('created_at', dateFilter)
                .order('created_at', { ascending: false })
                .limit(50);

            newUsers?.forEach(u => {
                activities.push({
                    id: `user-${u.id}`,
                    type: 'user_registered',
                    description: `New ${u.role}: ${u.name || u.email} registered`,
                    created_at: u.created_at,
                    actor: { name: u.name || 'User', email: u.email },
                    metadata: { role: u.role, userId: u.id }
                });
            });
        }

        // Fetch bad lead reports
        if (type === 'all' || type === 'bad_lead_reported' || type === 'bad_lead_approved' || type === 'bad_lead_rejected') {
            const { data: badReports } = await supabase
                .from('bad_lead_reports')
                .select('id, agent_id, lead_id, reason, status, created_at, resolved_at, users!bad_lead_reports_agent_id_fkey(name, email)')
                .gte('created_at', dateFilter)
                .order('created_at', { ascending: false })
                .limit(50);

            badReports?.forEach(report => {
                let reportType = 'bad_lead_reported';
                if (report.status === 'approved') reportType = 'bad_lead_approved';
                else if (report.status === 'rejected') reportType = 'bad_lead_rejected';

                activities.push({
                    id: `report-${report.id}`,
                    type: reportType,
                    description: `Bad lead report: ${report.reason} - ${report.status}`,
                    created_at: report.resolved_at || report.created_at,
                    actor: { name: report.users?.name || 'Agent', email: report.users?.email || 'unknown' },
                    metadata: { leadId: report.lead_id, reason: report.reason, status: report.status }
                });
            });
        }

        // Sort all activities by date
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Apply limit
        const limitedActivities = activities.slice(0, limit);

        // Calculate stats
        const stats = {
            total: limitedActivities.length,
            approvals: limitedActivities.filter(a => a.type === 'agent_approved').length,
            unlocks: limitedActivities.filter(a => a.type === 'lead_unlocked').length,
            purchases: limitedActivities.filter(a => a.type === 'credit_purchase').length
        };

        return NextResponse.json({
            success: true,
            data: limitedActivities,
            stats,
            filters: { type, days, limit }
        });

    } catch (error) {
        console.error('Error in /api/admin/activity-logs:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

