import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Password Reset Route Handler
 * Handles password reset confirmation from email links
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const code = requestUrl.searchParams.get('code');

  // Handle edge case where origin might be 0.0.0.0 (dev server)
  let origin = requestUrl.origin;
  if (origin.includes('0.0.0.0')) {
    origin = 'http://localhost:5000';
  }

  // Handle code-based recovery (newer Supabase flow)
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging recovery code:', error);
        return NextResponse.redirect(`${origin}/?error=invalid_token`);
      }

      // Redirect to the main app - user can now update password
      return NextResponse.redirect(`${origin}/?view=reset-password`);
    } catch (error) {
      console.error('Error processing recovery:', error);
      return NextResponse.redirect(`${origin}/?error=invalid_token`);
    }
  }

  // Handle token_hash-based recovery (older flow)
  if (token_hash && type === 'recovery') {
    try {
      const supabase = await createClient();

      // Verify token
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery'
      });

      if (error) {
        console.error('Error verifying reset token:', error);
        return NextResponse.redirect(`${origin}/?error=invalid_token`);
      }

      // Redirect to main app where user can reset password
      return NextResponse.redirect(`${origin}/?view=reset-password`);
    } catch (error) {
      console.error('Error processing recovery:', error);
      return NextResponse.redirect(`${origin}/?error=invalid_token`);
    }
  }

  // Invalid request, redirect to login
  return NextResponse.redirect(`${origin}/`);
}
