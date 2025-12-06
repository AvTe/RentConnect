import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Password Reset API using Supabase Auth
 * Uses Supabase's built-in email system for password reset
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in our database (for security logging only)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // For security, always return success even if user doesn't exist
    if (!existingUser) {
      console.log('Password reset requested for non-existent user:', normalizedEmail);
      // Wait a bit to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                    process.env.NEXT_PUBLIC_APP_URL ||
                    'http://localhost:5000';

    // Use Supabase's built-in password reset email
    console.log('Sending password reset via Supabase Auth to:', normalizedEmail);

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${baseUrl}/auth/reset-password`
    });

    if (resetError) {
      console.error('Supabase password reset error:', resetError);
      return NextResponse.json({
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      }, { status: 500 });
    }

    console.log('Password reset email sent via Supabase to:', normalizedEmail);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent! Please check your inbox and spam folder.'
    });

  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred. Please try again.'
    }, { status: 500 });
  }
}
