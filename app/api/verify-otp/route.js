import { NextResponse } from 'next/server';

// Import the shared OTP store
// Note: In production, use Redis or database for shared state across serverless functions
// For development, we'll use a simple approach with module-level state
const otpStore = new Map();

// Re-export for send-otp to use
export { otpStore };

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

    // Get stored OTP data
    // In serverless, we need to use the same store - for now importing from send-otp
    const { otpStore: sharedStore } = await import('../send-otp/route.js');
    const storedData = sharedStore.get(phoneNumber);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      sharedStore.delete(phoneNumber);
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check verify attempts (prevent brute force)
    if (storedData.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      sharedStore.delete(phoneNumber);
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      // Increment failed attempts
      storedData.verifyAttempts = (storedData.verifyAttempts || 0) + 1;
      sharedStore.set(phoneNumber, storedData);

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
    sharedStore.delete(phoneNumber);

    console.log(`Phone number ${phoneNumber} verified successfully`);

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

