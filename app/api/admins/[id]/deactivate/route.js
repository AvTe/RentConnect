import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUser,
  getAdminUserByEmail,
  deactivateAdminUser,
  reactivateAdminUser,
  adminHasPermission
} from '@/lib/database';

/**
 * POST /api/admins/[id]/deactivate - Deactivate or reactivate admin
 */
export async function POST(request, { params }) {
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

    // Prevent self-deactivation
    if (id === currentAdmin.id) {
      return NextResponse.json({ success: false, error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    // Get target admin
    const targetAdmin = await getAdminUser(id);
    if (!targetAdmin.success) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Prevent non-super admins from deactivating super admins
    if (targetAdmin.data.role === 'super_admin' && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only Super Admins can deactivate Super Admin accounts' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { action = 'deactivate', reason } = body;

    let result;
    if (action === 'reactivate') {
      if (!['inactive', 'suspended'].includes(targetAdmin.data.status)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Can only reactivate inactive or suspended admins' 
        }, { status: 400 });
      }
      result = await reactivateAdminUser(id, currentAdmin.id);
    } else {
      if (targetAdmin.data.status !== 'active') {
        return NextResponse.json({ 
          success: false, 
          error: 'Can only deactivate active admins' 
        }, { status: 400 });
      }
      result = await deactivateAdminUser(id, currentAdmin.id, reason);
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'reactivate' 
        ? 'Admin account reactivated successfully' 
        : 'Admin account deactivated successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admins/[id]/deactivate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
