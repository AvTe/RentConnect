import { createClient } from '@/utils/supabase/client';

// ============================================
// SUPABASE AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User display name
 * @param {object} metadata - Additional user metadata
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const signUpWithEmail = async (email, password, name, metadata = {}) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          ...metadata
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return { success: false, error: error.message };
    }

    // If email confirmation is disabled, user is immediately signed in
    // If enabled, user needs to verify email first
    return { 
      success: true, 
      user: data.user,
      session: data.session,
      emailConfirmationRequired: !data.session
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, user?: object, session?: object, error?: string, errorCode?: string}>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase signin error:', error);
      
      // Map Supabase error codes to user-friendly messages
      let errorMessage = error.message;
      let errorCode = 'auth/unknown';
      
      // Check for specific error types - ORDER MATTERS!
      // Check email not confirmed FIRST (before generic invalid credentials)
      if (error.message.includes('Email not confirmed') || 
          error.message.includes('email_not_confirmed')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox (and spam folder) for the confirmation link.';
        errorCode = 'auth/email-not-confirmed';
      } else if (error.message.includes('Invalid login credentials') || 
          error.message.includes('invalid_credentials') ||
          error.status === 400) {
        // Could be wrong password OR user doesn't exist
        // Supabase intentionally returns same error for both (security)
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        errorCode = 'auth/invalid-credential';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'This email is not registered. Please sign up first.';
        errorCode = 'auth/user-not-found';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please try again in a few minutes.';
        errorCode = 'auth/too-many-requests';
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        errorCode = 'auth/rate-limit';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errorCode: errorCode,
        originalError: error.message
      };
    }

    return { 
      success: true, 
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again.',
      errorCode: 'auth/unknown'
    };
  }
};

/**
 * Sign in with Google OAuth
 * @param {string} userType - The role the user selected ('tenant' or 'agent')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signInWithGoogle = async (userType = 'tenant') => {
  try {
    const supabase = createClient();

    // Store user type in both localStorage and cookie so callback can read it
    // Cookie is needed because server-side callback can't access localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pending_user_type', userType);
      // Set cookie that expires in 10 minutes
      document.cookie = `pending_user_type=${userType}; path=/; max-age=600; SameSite=Lax`;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('Supabase Google OAuth error:', error);
      // Clear stored type on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_user_type');
        document.cookie = 'pending_user_type=; path=/; max-age=0';
      }
      return { success: false, error: error.message };
    }

    // Redirect happens automatically
    return { success: true };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out current user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signOut = async () => {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signout error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current authenticated session
 * @returns {Promise<{user: object | null, session: object | null}>}
 */
export const getCurrentSession = async () => {
  try {
    const supabase = createClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return { user: null, session: null };
    }

    return { 
      user: session?.user || null, 
      session: session || null 
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return { user: null, session: null };
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<{user: object | null}>}
 */
export const getCurrentUser = async () => {
  try {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return { user: null };
    }

    return { user };
  } catch (error) {
    console.error('Error getting user:', error);
    return { user: null };
  }
};

/**
 * Update user profile metadata
 * @param {object} updates - Profile updates (name, avatar, etc.)
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const updateUserProfile = async (updates) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user email
 * @param {string} newEmail - New email address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserEmail = async (newEmail) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) {
      console.error('Error updating email:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Confirmation email sent to new address' 
    };
  } catch (error) {
    console.error('Error updating email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserPassword = async (newPassword) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Error updating password:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * Uses Supabase Auth's built-in email system for password reset
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const resetPassword = async (email) => {
  try {
    console.log('Requesting password reset for:', email);

    // Use API endpoint that sends via Supabase Auth
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Password reset API error:', result.error);
      return { 
        success: false, 
        error: result.error || 'Failed to send password reset email' 
      };
    }

    console.log('Password reset email request processed successfully');
    return { 
      success: true, 
      message: result.message || 'If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.' 
    };
  } catch (error) {
    console.error('Error sending reset email:', error);
    
    // Fallback to direct Supabase call if API fails
    try {
      console.log('Falling back to direct Supabase password reset');
      const supabase = createClient();
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
      
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/reset-password`
      });

      if (supabaseError) {
        return { success: false, error: supabaseError.message };
      }

      return { 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.' 
      };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
  }
};

/**
 * Resend email confirmation
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resendConfirmationEmail = async (email) => {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('Error resending confirmation:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Confirmation email resent' 
    };
  } catch (error) {
    console.error('Error resending confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function (event, session) => void
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const supabase = createClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  const { session } = await getCurrentSession();
  return !!session;
};

/**
 * Get user ID (helper function)
 * @returns {Promise<string | null>}
 */
export const getUserId = async () => {
  const { user } = await getCurrentUser();
  return user?.id || null;
};

/**
 * Verify OTP code (for email verification or phone verification)
 * @param {string} email - User email
 * @param {string} token - OTP token
 * @param {string} type - Type of verification ('signup', 'email_change', etc.)
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export const verifyOTP = async (email, token, type = 'signup') => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      session: data.session,
      user: data.user
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// USER ROLE HELPERS
// ============================================

/**
 * Check if current user has a specific role
 * @param {string} role - Role to check ('tenant', 'agent', 'admin')
 * @returns {Promise<boolean>}
 */
export const hasRole = async (role) => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    // Get user role from users table
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return data?.role === role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

/**
 * Check if current user is admin
 * @returns {Promise<boolean>}
 */
export const isAdmin = async () => {
  return await hasRole('admin');
};

/**
 * Check if current user is agent
 * @returns {Promise<boolean>}
 */
export const isAgent = async () => {
  return await hasRole('agent');
};

/**
 * Check if current user is tenant
 * @returns {Promise<boolean>}
 */
export const isTenant = async () => {
  return await hasRole('tenant');
};
