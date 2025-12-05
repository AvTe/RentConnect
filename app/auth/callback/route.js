import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Auth Callback Route Handler
 * Handles OAuth redirects from Supabase Auth
 * Used for Google OAuth and email confirmation links
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  // Get pending user type from cookie (set before OAuth redirect)
  const cookieStore = await cookies();
  const pendingUserType = cookieStore.get('pending_user_type')?.value || 'tenant';
  
  // Dynamically determine origin based on environment
  // Use request origin for production, fallback to localhost for dev
  let origin = requestUrl.origin;
  
  // Handle edge case where origin might be 0.0.0.0 (dev server)
  if (origin.includes('0.0.0.0')) {
    origin = 'http://localhost:5000';
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  if (code) {
    try {
      const supabase = await createClient();

      console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
      console.log('Pending user type from cookie:', pendingUserType);

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/?error=auth_failed`);
      }

      // If user data exists, ensure user profile is created in database
      if (data.user) {
        console.log('User logged in:', data.user.email);
        
        // Check if user exists in users table
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id, email, name, avatar')
          .eq('id', data.user.id)
          .maybeSingle();

        // If user doesn't exist, create profile
        if (!existingUser) {
          console.log('Creating new user profile for:', data.user.email);
          
          const metadata = data.user.user_metadata || {};
          
          // Get role from cookie (set during login), then metadata, then default to tenant
          // Priority: cookie > metadata > default
          const userRole = pendingUserType || metadata.type || metadata.role || 'tenant';
          
          console.log('Creating user with role:', userRole);
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: metadata.full_name || metadata.name || data.user.email?.split('@')[0],
              avatar: metadata.avatar_url || metadata.picture || null,
              role: userRole,
              type: userRole,
              phone: metadata.phone || null,
              status: 'active',
              wallet_balance: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Continue anyway - profile can be created later
          } else {
            console.log('User profile created successfully with role:', userRole);
          }
        } else {
          console.log('User profile already exists');
          
          // Update avatar if it changed
          const metadata = data.user.user_metadata || {};
          const newAvatar = metadata.avatar_url || metadata.picture;
          
          if (newAvatar && newAvatar !== existingUser.avatar) {
            await supabase
              .from('users')
              .update({ 
                avatar: newAvatar,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.user.id);
          }
        }
      }

      // Redirect to the home page with email confirmed flag
      console.log('Redirecting to:', `${origin}${next}`);
      
      // Check if this was an email confirmation (no existing session before)
      const isEmailConfirmation = next === '/' && data.user?.email_confirmed_at;
      
      // Create response with cookie cleanup
      let redirectUrl = `${origin}${next}`;
      if (isEmailConfirmation) {
        redirectUrl = `${origin}/?view=email-confirmed`;
      }
      
      const response = NextResponse.redirect(redirectUrl);
      // Clear the pending_user_type cookie
      response.cookies.set('pending_user_type', '', { maxAge: 0, path: '/' });
      
      return response;
      
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(`${origin}/?error=callback_error`);
    }
  }

  // No code present, redirect to home
  return NextResponse.redirect(`${origin}/`);
}