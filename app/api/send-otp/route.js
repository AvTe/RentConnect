import { NextResponse } from 'next/server';
import twilio from 'twilio';

// In-memory OTP store (for production, use Redis or a database)
// Map<phoneNumber, { otp: string, expiresAt: number, attempts: number, lastSent: number }>
const otpStore = new Map();

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

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Use international format (e.g., +2348012345678)' },
        { status: 400 }
      );
    }

    // Check Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not configured');
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 500 }
      );
    }

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

    // Send SMS via Twilio
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: `Your Yoombaa verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`OTP sent to ${phoneNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: OTP_EXPIRY / 1000 // seconds
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }
    if (error.code === 21608) {
      return NextResponse.json(
        { success: false, error: 'SMS sending not available for this region' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

// Export the otpStore for use in verify-otp route (in production, use shared storage)
export { otpStore };

