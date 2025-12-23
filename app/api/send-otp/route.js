import { NextResponse } from 'next/server';
// ============================================================================
// Africa's Talking SMS Service - Primary SMS provider for Kenya/Africa
// ============================================================================
import { sendOTP as sendAfricasTalkingOTP, isConfigured as isATConfigured } from '@/lib/africastalking';

// ============================================================================
// Global OTP Store - uses globalThis to persist across serverless invocations
// In production, use Redis, database, or Vercel KV for multi-instance deployments
// ============================================================================
if (!globalThis.otpStore) {
  globalThis.otpStore = new Map();
}
const otpStore = globalThis.otpStore;

// Rate limiting: max 3 OTP requests per phone number per 10 minutes
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt + RATE_LIMIT_WINDOW) {
      otpStore.delete(phone);
    }
  }
}

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (E.164 or 10-digit mobile)
    const phoneRegex = /^(\+[1-9]\d{1,14}|\d{10,15})$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-]/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Use international format (e.g., +919876543210) or 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Check if Africa's Talking is configured
    const africasTalkingConfigured = isATConfigured();
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Clean expired OTPs periodically
    cleanExpiredOTPs();

    const now = Date.now();
    const existingData = otpStore.get(phoneNumber);

    // Rate limiting check
    if (existingData) {
      const timeSinceLastSent = now - existingData.lastSent;

      // Must wait at least 30 seconds between requests
      if (timeSinceLastSent < 30000) {
        const waitTime = Math.ceil((30000 - timeSinceLastSent) / 1000);
        return NextResponse.json(
          { success: false, error: `Please wait ${waitTime} seconds before requesting another code` },
          { status: 429 }
        );
      }

      // Check if exceeded max requests in window
      if (existingData.attempts >= MAX_REQUESTS_PER_WINDOW &&
          now - existingData.lastSent < RATE_LIMIT_WINDOW) {
        return NextResponse.json(
          { success: false, error: 'Too many OTP requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = now + OTP_EXPIRY;

    // Store OTP
    otpStore.set(phoneNumber, {
      otp,
      expiresAt,
      attempts: (existingData?.attempts || 0) + 1,
      lastSent: now,
      verifyAttempts: 0
    });

    // In development mode or if SMS not configured, just log the OTP
    if (isDevelopment && !africasTalkingConfigured) {
      console.log('='.repeat(60));
      console.log('🔐 DEVELOPMENT MODE - OTP VERIFICATION CODE');
      console.log('='.repeat(60));
      console.log(`📱 Phone: ${phoneNumber}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log(`⏰ Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
      console.log('='.repeat(60));

      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        expiresIn: OTP_EXPIRY / 1000,
        // Include OTP in response for development only
        devOtp: otp
      });
    }

    // Send OTP via Africa's Talking SMS
    if (africasTalkingConfigured) {
      try {
        console.log(`[Africa's Talking] Sending SMS OTP to ${phoneNumber}...`);
        const smsResult = await sendAfricasTalkingOTP(phoneNumber, otp);

        if (smsResult.success) {
          console.log(`[Africa's Talking] OTP sent to ${phoneNumber} successfully`);
          console.log(`[Africa's Talking] Message ID: ${smsResult.messageId}, Cost: ${smsResult.cost || 'N/A'}`);

          return NextResponse.json({
            success: true,
            message: 'Verification code sent via SMS',
            channel: 'sms',
            expiresIn: OTP_EXPIRY / 1000,
            // Include OTP in development for testing
            ...(isDevelopment && { devOtp: otp })
          });
        } else {
          console.error("[Africa's Talking] Failed to send OTP:", smsResult.error);
          // Fall through to fallback
        }
      } catch (smsError) {
        console.error("[Africa's Talking] Error sending OTP:", smsError);
        // Fall through to fallback
      }
    }

    // Fallback: Log OTP if SMS sending fails
    console.log('='.repeat(60));
    console.log('📱 SMS FALLBACK - OTP VERIFICATION CODE');
    console.log('='.repeat(60));
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
    console.log('='.repeat(60));

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: OTP_EXPIRY / 1000,
      // Include OTP in development for testing
      ...(isDevelopment && { devOtp: otp })
    });

  } catch (error) {
    console.error('Error sending OTP:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

// Export the otpStore for use in verify-otp route (in production, use shared storage)
export { otpStore };

