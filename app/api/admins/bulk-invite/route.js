import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getAdminUserByEmail,
  createAdminUser,
  createAdminInvite,
  adminHasPermission
} from '@/lib/database';

/**
 * POST /api/admins/bulk-invite - Bulk invite admins from CSV data
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    
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

    // Parse request body
    const body = await request.json();
    const { admins, defaultRole = 'sub_admin', defaultPermissions = [], teamName } = body;

    if (!Array.isArray(admins) || admins.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide an array of admins to invite' 
      }, { status: 400 });
    }

    // Limit bulk invites
    if (admins.length > 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'Maximum 50 admins can be invited at once' 
      }, { status: 400 });
    }

    const results = {
      successful: [],
      failed: []
    };

    // Process each admin
    for (const adminData of admins) {
      const { name, email, role, permissions } = adminData;

      // Validation
      if (!name || !email) {
        results.failed.push({ 
          email: email || 'unknown', 
          error: 'Name and email are required' 
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        results.failed.push({ email, error: 'Invalid email format' });
        continue;
      }

      // Only super_admin can create main_admin or super_admin
      const finalRole = role || defaultRole;
      if (['super_admin', 'main_admin'].includes(finalRole) && currentAdmin.role !== 'super_admin') {
        results.failed.push({ 
          email, 
          error: 'Only Super Admins can create Main Admin or Super Admin accounts' 
        });
        continue;
      }

      try {
        // Create admin user
        const createResult = await createAdminUser({
          name,
          email,
          role: finalRole,
          permissions: permissions || defaultPermissions,
          teamName: teamName || null,
          parentAdminId: currentAdmin.role === 'main_admin' ? currentAdmin.id : null
        }, currentAdmin.id);

        if (!createResult.success) {
          results.failed.push({ email, error: createResult.error });
          continue;
        }

        // Create and send invite
        const inviteResult = await createAdminInvite(createResult.data.id, currentAdmin.id, {
          expiresInHours: 72
        });

        if (!inviteResult.success) {
          results.failed.push({ email, error: 'Created but failed to send invite' });
          continue;
        }

        // Send invite email
        const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/admin/accept-invite?token=${inviteResult.token}`;
        
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/admins/send-invite-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              name,
              role: finalRole,
              inviteUrl,
              invitedBy: currentAdmin.name
            })
          });
        } catch (emailError) {
          console.error('Error sending invite email:', emailError);
        }

        results.successful.push({ email, name, role: finalRole });
      } catch (error) {
        console.error(`Error processing admin ${email}:`, error);
        results.failed.push({ email, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully invited ${results.successful.length} admins`,
      results
    });
  } catch (error) {
    console.error('Error in POST /api/admins/bulk-invite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
