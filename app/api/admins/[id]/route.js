import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUser,
  getAdminUserByEmail,
  updateAdminUser,
  deactivateAdminUser,
  reactivateAdminUser,
  deleteAdminUser,
  getAdminActivityLogs,
  adminHasPermission
} from '@/lib/database';

/**
 * GET /api/admins/[id] - Get admin user details
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    
    // Get the requested admin
    const result = await getAdminUser(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    // Get recent activity logs for this admin
    const logsResult = await getAdminActivityLogs(
      { adminUserId: id },
      { page: 1, limit: 10 }
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        recentActivity: logsResult.data || []
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admins/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admins/[id] - Update admin user
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'manage_admins');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get target admin
    const targetAdmin = await getAdminUser(id);
    if (!targetAdmin.success) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Prevent non-super admins from editing super admins
    if (targetAdmin.data.role === 'super_admin' && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only Super Admins can edit Super Admin accounts' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, role, customRoleName, permissions, parentAdminId, teamName, status } = body;

    // Only super_admin can change role to main_admin or super_admin
    if (['super_admin', 'main_admin'].includes(role) && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only Super Admins can assign Main Admin or Super Admin roles' 
      }, { status: 403 });
    }

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (customRoleName !== undefined) updates.custom_role_name = customRoleName;
    if (permissions !== undefined) updates.permissions = permissions;
    if (parentAdminId !== undefined) updates.parent_admin_id = parentAdminId;
    if (teamName !== undefined) updates.team_name = teamName;
    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      updates.status = status;
    }

    // Update admin
    const updateResult = await updateAdminUser(id, updates, currentAdmin.id);

    if (!updateResult.success) {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 400 });
    }

    // Get updated admin
    const updatedAdmin = await getAdminUser(id);

    return NextResponse.json({
      success: true,
      data: updatedAdmin.data
    });
  } catch (error) {
    console.error('Error in PUT /api/admins/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admins/[id] - Delete (soft) admin user
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify super admin only
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data || adminResult.data.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Only Super Admins can delete admin accounts' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;

    // Prevent self-deletion
    if (id === currentAdmin.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get target admin
    const targetAdmin = await getAdminUser(id);
    if (!targetAdmin.success) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Soft delete
    const deleteResult = await deleteAdminUser(id, currentAdmin.id);

    if (!deleteResult.success) {
      return NextResponse.json({ success: false, error: deleteResult.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Admin account deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admins/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
