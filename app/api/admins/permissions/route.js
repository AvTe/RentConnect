import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminPermissions } from '@/lib/database';

/**
 * GET /api/admins/permissions - Get all available permissions
 * Requires authentication and admin role
 */
export async function GET() {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin (check both users table and admin_users table)
    const [{ data: userData }, { data: adminData }] = await Promise.all([
      supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('admin_users').select('id, role, status').eq('user_id', user.id).maybeSingle()
    ]);

    const isAdminRole = ['admin', 'super_admin', 'main_admin', 'sub_admin'].includes(userData?.role);
    const isActiveAdmin = adminData?.status === 'active';

    if (!isAdminRole && !isActiveAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const result = await getAdminPermissions();

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      grouped: result.grouped
    });
  } catch (error) {
    console.error('Error in GET /api/admins/permissions:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching permissions' },
      { status: 500 }
    );
  }
}
