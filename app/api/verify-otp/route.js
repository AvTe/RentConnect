import { NextResponse } from 'next/server';

// ============================================================================
// Global OTP Store - uses globalThis to persist across serverless invocations
// This must match the store in send-otp/route.js
// ============================================================================
if (!globalThis.otpStore) {
  globalThis.otpStore = new Map();
}
const otpStore = globalThis.otpStore;

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. Enter 6 digits.' },
        { status: 400 }
      );
    }

    // Get stored OTP data from the global store
    const storedData = otpStore.get(phoneNumber);

    // Debug logging
    console.log(`[verify-otp] Verifying OTP for ${phoneNumber}`);
    console.log(`[verify-otp] Store has ${otpStore.size} entries`);
    console.log(`[verify-otp] Found stored data: ${!!storedData}`);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check verify attempts (prevent brute force)
    if (storedData.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      otpStore.delete(phoneNumber);
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      // Increment failed attempts
      storedData.verifyAttempts = (storedData.verifyAttempts || 0) + 1;
      otpStore.set(phoneNumber, storedData);

      const attemptsLeft = MAX_VERIFY_ATTEMPTS - storedData.verifyAttempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`
        },
        { status: 400 }
      );
    }

    // OTP verified successfully - clean up
    otpStore.delete(phoneNumber);

    console.log(`[verify-otp] Phone number ${phoneNumber} verified successfully`);

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}

