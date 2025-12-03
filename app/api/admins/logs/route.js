import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUserByEmail,
  getAdminActivityLogs,
  adminHasPermission
} from '@/lib/database';

/**
 * GET /api/admins/logs - Get admin activity logs
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status with view_audit_logs permission
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'view_audit_logs');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      adminUserId: searchParams.get('adminId') || '',
      action: searchParams.get('action') || '',
      actionCategory: searchParams.get('category') || '',
      targetType: searchParams.get('targetType') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || ''
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Get logs
    const result = await getAdminActivityLogs(filters, pagination);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error in GET /api/admins/logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
