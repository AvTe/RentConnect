import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Password Reset Route Handler
 * Handles password reset confirmation from email links
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (token_hash && type === 'recovery') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Verify token
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery'
    });

    if (error) {
      console.error('Error verifying reset token:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_token`);
    }

    // Redirect to reset password form (you'll need to create this component)
    return NextResponse.redirect(`${requestUrl.origin}/reset-password-form`);
  }

  // Invalid request, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
