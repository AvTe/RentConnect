import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  getAdminUser,
  getAdminUserByEmail,
  createAdminInvite,
  resendAdminInvite,
  adminHasPermission
} from '@/lib/database';

// Create Supabase admin client lazily (only when needed at runtime)
// SECURITY: Require service role key - do not fall back to anon key
const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey
  );
};

// Helper function to send admin invite email via Supabase Auth
const sendAdminInviteEmail = async ({ to, name, role, inviteUrl, customMessage, invitedBy }) => {
  try {
    const displayRole = role === 'super_admin' ? 'Super Admin'
      : role === 'main_admin' ? 'Main Admin'
      : role === 'sub_admin' ? 'Sub Admin'
      : role || 'Admin';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_SITE_URL is not set, using localhost as fallback');
    }
    const siteUrl = baseUrl || 'http://localhost:3000';

    const { data, error } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(to, {
      data: {
        name: name,
        role: role || 'sub_admin',
        display_role: displayRole,
        invited_by: invitedBy || 'Admin',
        custom_message: customMessage || '',
        invite_url: inviteUrl,
        user_type: 'admin'
      },
      redirectTo: `${siteUrl}/admin/accept-invite`
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
 * Validate request origin for CSRF protection
 * Uses URL origin comparison to prevent subdomain attacks
 * @param {Request} request - Incoming request
 * @returns {{ valid: boolean, error?: string }}
 */
function validateOrigin(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Get allowed origin from environment
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const allowedOrigins = [
    siteUrl,
    `https://${host}`,
    `http://${host}`,
  ].filter(Boolean);

  // In development, also allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5000');
  }

  // Helper to check if URL matches allowed origin (prevents subdomain attacks)
  const isValidOrigin = (url) => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return allowedOrigins.some(allowed => {
        try {
          const allowedObj = new URL(allowed);
          return urlObj.origin === allowedObj.origin;
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  };

  // Check origin header first
  if (origin && !isValidOrigin(origin)) {
    return { valid: false, error: 'Invalid origin' };
  }

  // Check referer if origin is not present
  if (!origin && referer) {
    if (!isValidOrigin(referer)) {
      return { valid: false, error: 'Invalid referer' };
    }
  }

  return { valid: true };
}

/**
 * POST /api/admins/[id]/invite - Send or resend invite to admin
 */
export async function POST(request, { params }) {
  try {
    // SECURITY: CSRF protection - validate origin
    const originCheck = validateOrigin(request);
    if (!originCheck.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status with send_invites permission
    const adminResult = await getAdminUserByEmail(user.email);
    if (!adminResult.data) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 403 });
    }

    const currentAdmin = adminResult.data;
    const hasPermission = await adminHasPermission(currentAdmin.id, 'send_invites');
    
    if (!hasPermission && currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get target admin
    const targetAdmin = await getAdminUser(id);
    if (!targetAdmin.success) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Can only invite admins with status 'invited'
    if (targetAdmin.data.status !== 'invited') {
      return NextResponse.json({ 
        success: false, 
        error: 'Can only send invites to admins with Invited status' 
      }, { status: 400 });
    }

    // Parse request body for custom message
    const body = await request.json().catch(() => ({}));
    const { customMessage } = body;

    // Resend invite (creates new token, invalidates old one)
    const inviteResult = await resendAdminInvite(id, currentAdmin.id);

    if (!inviteResult.success) {
      return NextResponse.json({ success: false, error: inviteResult.error }, { status: 400 });
    }

    // Send invite email directly
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/admin/accept-invite?token=${inviteResult.token}`;
    
    try {
      const emailResult = await sendAdminInviteEmail({
        to: targetAdmin.data.email,
        name: targetAdmin.data.name,
        role: targetAdmin.data.custom_role_name || targetAdmin.data.role,
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

    return NextResponse.json({
      success: true,
      message: 'Invite sent successfully',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error in POST /api/admins/[id]/invite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
