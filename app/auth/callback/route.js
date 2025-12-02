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
  
  // Use localhost instead of 0.0.0.0
  const origin = 'http://localhost:5000';

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);

      console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
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
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: metadata.full_name || metadata.name || data.user.email?.split('@')[0],
              avatar: metadata.avatar_url || metadata.picture || null,
              role: 'tenant',
              type: 'tenant',
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
            console.log('User profile created successfully');
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

      // Redirect to the home page
      console.log('Redirecting to:', `${origin}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
      
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=callback_error`);
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
