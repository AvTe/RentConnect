import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminUsers, getAdminUserByEmail, adminHasPermission } from '@/lib/database';

// Force dynamic rendering - this route uses cookies for auth
export const dynamic = 'force-dynamic';

/**
 * GET /api/admins/export - Export admin list as CSV
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status with export_data permission
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'export_data');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all admins (no pagination for export)
    const result = await getAdminUsers({}, { page: 1, limit: 1000 });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Generate CSV
    const headers = [
      'Name',
      'Email',
      'Role',
      'Custom Role',
      'Team',
      'Status',
      'Last Login',
      'Created At'
    ];

    const rows = result.data.map(admin => [
      admin.name || '',
      admin.email || '',
      admin.role || '',
      admin.custom_role_name || '',
      admin.team_name || '',
      admin.status || '',
      admin.last_login_at ? new Date(admin.last_login_at).toISOString() : 'Never',
      admin.created_at ? new Date(admin.created_at).toISOString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="admins-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admins/export:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
