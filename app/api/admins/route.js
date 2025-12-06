import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  getAdminUsers,
  createAdminUser,
  getAdminUserByEmail,
  getAdminUser,
  createAdminInvite,
  getAdminStats,
  adminHasPermission,
  logAdminActivity
} from '@/lib/database';

// Create Supabase admin client for sending invites
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to send admin invite email via Supabase Auth
const sendAdminInviteEmail = async ({ to, name, role, inviteUrl, customMessage, invitedBy }) => {
  try {
    const displayRole = role === 'super_admin' ? 'Super Admin'
      : role === 'main_admin' ? 'Main Admin'
      : role === 'sub_admin' ? 'Sub Admin'
      : role || 'Admin';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';

    // Use Supabase Auth to invite user
    console.log(`Sending admin invite to ${to} via Supabase Auth`);

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(to, {
      data: {
        name: name,
        role: role || 'sub_admin',
        display_role: displayRole,
        invited_by: invitedBy || 'Admin',
        custom_message: customMessage || '',
        invite_url: inviteUrl,
        user_type: 'admin'
      },
      redirectTo: `${baseUrl}/admin/accept-invite`
    });

    if (error) {
      console.error('Supabase invite error:', error);
      // If user already exists, invite was still sent in concept
      if (error.message?.includes('already registered')) {
        return { success: true, message: 'User already exists' };
      }
      return { success: false, error: error.message };
    }

    console.log('Admin invite sent successfully via Supabase to:', to);
    return { success: true };
  } catch (error) {
    console.error('Error sending admin invite email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * GET /api/admins - List all admin users
 * Supports search, filtering, and pagination
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data || !['super_admin', 'main_admin'].includes(adminResult.data.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;

    // Check permission
    const hasPermission = await adminHasPermission(currentAdmin.id, 'manage_admins');
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      status: searchParams.get('status') || '',
      parentAdminId: searchParams.get('parentAdminId') || '',
      teamName: searchParams.get('team') || ''
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Get admins
    const result = await getAdminUsers(filters, pagination);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Get stats
    const statsResult = await getAdminStats();

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats: statsResult.data || {}
    });
  } catch (error) {
    console.error('Error in GET /api/admins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admins - Create new admin user
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify super admin or main admin with manage_admins permission
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'manage_admins');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, role, customRoleName, permissions, parentAdminId, teamName, sendInvite, customMessage } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    // Only super_admin can create main_admin or super_admin
    if (['super_admin', 'main_admin'].includes(role) && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only Super Admins can create Main Admin or Super Admin accounts' 
      }, { status: 403 });
    }

    // Create admin user
    const createResult = await createAdminUser({
      name,
      email,
      role: role || 'sub_admin',
      customRoleName,
      permissions: permissions || [],
      parentAdminId,
      teamName
    }, currentAdmin.id);

    if (!createResult.success) {
      return NextResponse.json({ success: false, error: createResult.error }, { status: 400 });
    }

    // Send invite if requested
    let inviteResult = null;
    if (sendInvite) {
      inviteResult = await createAdminInvite(createResult.data.id, currentAdmin.id, {
        customMessage,
        expiresInHours: 72
      });

      if (inviteResult.success && inviteResult.token) {
        // Send invite email directly
        const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/admin/accept-invite?token=${inviteResult.token}`;
        
        try {
          const emailResult = await sendAdminInviteEmail({
            to: email,
            name,
            role: role || 'sub_admin',
            inviteUrl,
            customMessage,
            invitedBy: currentAdmin.name
          });
          
          if (!emailResult.success) {
            console.error('Failed to send invite email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending invite email:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: createResult.data,
      invite: inviteResult?.success ? { sent: true, expiresAt: inviteResult.data?.expires_at } : null
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
