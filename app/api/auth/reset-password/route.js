import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Create Supabase client - use service role if available, otherwise anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists in our database (for security logging only)
    const { data: existingUser } = await supabase
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

    // For password reset, we need to use the admin API if service role is available
    // Otherwise fall back to client-side method
    let resetError = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Use admin API with service role
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: {
          redirectTo: `${baseUrl}/auth/reset-password`
        }
      });
      resetError = error;

      if (!error) {
        console.log('Password reset link generated via admin API for:', normalizedEmail);
      }
    } else {
      // Fallback: Use standard resetPasswordForEmail (works with anon key)
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${baseUrl}/auth/reset-password`
      });
      resetError = error;
    }

    if (resetError) {
      console.error('Supabase password reset error:', resetError);

      // Check for specific error types
      if (resetError.message?.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Too many reset requests. Please wait a few minutes before trying again.'
        }, { status: 429 });
      }

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
