export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { escapeIlikePattern } from '@/lib/database';

// Helper to get admin supabase client
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

/**
 * API endpoint to fetch users for notification targeting
 *
 * GET /api/admin/users/list?role=agent|tenant|all&search=query&limit=50
 *
 * SECURITY: Requires admin authentication
 */
export async function GET(request) {
    try {
        // Verify admin authentication
        let supabaseAuth;
        try {
            supabaseAuth = await createServerClient();
        } catch (cookieError) {
            console.error('Cookie error creating server client:', cookieError);
            return NextResponse.json({
                success: false,
                error: 'Server configuration error'
            }, { status: 500 });
        }

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        // Check if user is admin - check in users table first
        const { data: userData, error: userDataError } = await supabaseAuth
            .from('users')
            .select('role, name, email')
            .eq('id', user.id)
            .single();

        if (userDataError) {
            console.error('Error fetching user data:', userDataError);
        }

        const adminRoles = ['admin', 'super_admin', 'main_admin'];
        let isAdmin = userData && adminRoles.includes(userData.role);

        // Also check admin_users table - must have active status
        if (!isAdmin) {
            const { data: adminUser, error: adminUserError } = await supabaseAuth
                .from('admin_users')
                .select('role, name, status')
                .eq('email', user.email)
                .eq('status', 'active')  // SECURITY: Only allow active admins
                .single();

            if (adminUserError && adminUserError.code !== 'PGRST116') {
                console.error('Error checking admin_users:', adminUserError);
            }

            isAdmin = !!adminUser;
        }

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: 'Admin access required'
            }, { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'all';
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        // Build query using admin client
        const supabaseAdmin = getSupabaseAdmin();
        let query = supabaseAdmin
            .from('users')
            .select('id, name, email, phone, role, verification_status, created_at')
            .order('name', { ascending: true, nullsFirst: false })
            .limit(limit);

        // Filter by role
        if (role === 'agent') {
            query = query.eq('role', 'agent');
        } else if (role === 'tenant') {
            query = query.eq('role', 'tenant');
        } else {
            // 'all' - get both agents and tenants, exclude admins
            query = query.in('role', ['agent', 'tenant']);
        }

        // Search by name or email (only if search is not empty)
        // Escape special characters to prevent SQL injection
        if (search && search.trim()) {
            const escapedSearch = escapeIlikePattern(search.trim());
            query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) {
            console.error('Error querying users:', usersError);
            return NextResponse.json({
                success: false,
                error: usersError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: users || [],
            count: users?.length || 0,
            filters: { role, search, limit }
        });

    } catch (error) {
        console.error('Error in /api/admin/users/list:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

