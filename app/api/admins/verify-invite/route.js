import { NextResponse } from 'next/server';
import { verifyAdminInvite, acceptAdminInvite } from '@/lib/database';

/**
 * GET /api/admins/verify-invite - Verify invite token
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invite token is required' 
      }, { status: 400 });
    }

    const result = await verifyAdminInvite(token);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }

    // Return invite details (excluding sensitive data)
    const { admin_user } = result.data;
    
    return NextResponse.json({
      success: true,
      data: {
        name: admin_user?.name,
        email: admin_user?.email,
        role: admin_user?.role,
        customRoleName: admin_user?.custom_role_name,
        expiresAt: result.data.expires_at
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admins/verify-invite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admins/verify-invite - Accept invite and set password
 */
export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token and password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    const result = await acceptAdminInvite(token, password);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully. You can now sign in.'
    });
  } catch (error) {
    console.error('Error in POST /api/admins/verify-invite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
