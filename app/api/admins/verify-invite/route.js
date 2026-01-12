import { NextResponse } from 'next/server';
import { verifyAdminInvite, acceptAdminInvite } from '@/lib/database';

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

// In-memory rate limiting store (use Redis in production for multi-instance)
const rateLimitStore = new Map();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour window
  maxAttempts: 5, // Max 5 attempts per hour
  blockDuration: 15 * 60 * 1000 // Block for 15 minutes after exceeding limit
};

/**
 * Get client IP from request headers
 */
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
}

/**
 * Check and update rate limit for an IP
 * @returns {{ allowed: boolean, retryAfter?: number }}
 */
function checkRateLimit(ip, action = 'verify') {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up old entries periodically (simple cleanup on access)
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.firstAttempt > RATE_LIMIT.windowMs * 2) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record) {
    // First attempt
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, blocked: false });
    return { allowed: true };
  }

  // Check if currently blocked
  if (record.blocked && now - record.blockedAt < RATE_LIMIT.blockDuration) {
    const retryAfter = Math.ceil((RATE_LIMIT.blockDuration - (now - record.blockedAt)) / 1000);
    return { allowed: false, retryAfter };
  }

  // Reset if window has passed
  if (now - record.firstAttempt > RATE_LIMIT.windowMs) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, blocked: false });
    return { allowed: true };
  }

  // Increment attempts
  record.attempts += 1;

  // Check if limit exceeded
  if (record.attempts > RATE_LIMIT.maxAttempts) {
    record.blocked = true;
    record.blockedAt = now;
    rateLimitStore.set(key, record);
    return { allowed: false, retryAfter: Math.ceil(RATE_LIMIT.blockDuration / 1000) };
  }

  rateLimitStore.set(key, record);
  return { allowed: true };
}

/**
 * GET /api/admins/verify-invite - Verify invite token
 */
export async function GET(request) {
  try {
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(clientIP, 'verify');

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfter) }
        }
      );
    }

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
    return NextResponse.json(
      { success: false, error: 'An error occurred while verifying the invite' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admins/verify-invite - Accept invite and set password
 */
export async function POST(request) {
  try {
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(clientIP, 'accept');

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfter) }
        }
      );
    }

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

    // Additional password strength requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
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
    return NextResponse.json(
      { success: false, error: 'An error occurred while activating your account' },
      { status: 500 }
    );
  }
}
