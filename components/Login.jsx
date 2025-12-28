import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Building2 } from 'lucide-react';
import { Button } from './ui/Button';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, resendConfirmationEmail } from '@/lib/auth-supabase';
import { getUser, createUser, updateUser } from '@/lib/database';

const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/user-not-found': 'This email is not registered. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again or use "Forgot Password" to reset it.',
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again in a few minutes or reset your password.',
    'auth/rate-limit': 'Too many requests. Please wait a few minutes before trying again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
    'auth/email-not-confirmed': 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
    'auth/unknown': 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  };

  return errorMessages[errorCode] || 'An error occurred during authentication. Please try again.';
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const Login = ({ onNavigate, onLogin, authError, initialTab }) => {
  const [userType, setUserType] = useState(initialTab || 'tenant');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(authError || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);

  // Update error if authError prop changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Update userType when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setUserType(initialTab);
    }
  }, [initialTab]);

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await resendConfirmationEmail(email.trim());
      if (result.success) {
        setSuccessMessage('Confirmation email sent! Please check your inbox and spam folder.');
        setShowResendConfirmation(false);
      } else {
        setError(result.error || 'Failed to send confirmation email.');
      }
    } catch (err) {
      setError('Failed to send confirmation email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // signInWithGoogle triggers OAuth popup and redirects to callback
      // Pass the selected userType so it can be stored and used after redirect
      const result = await signInWithGoogle(userType);
      
      if (!result.success) {
        throw new Error(result.error || 'Google sign-in failed');
      }
      
      // The redirect happens automatically via Supabase
      // User will be brought back to the app after successful auth
      
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
    // Don't set loading to false here - the page will redirect
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address to reset password.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      console.log('Requesting password reset for:', trimmedEmail);
      const result = await resetPassword(trimmedEmail);
      
      if (result.success) {
        setSuccessMessage(result.message || 'Password reset email sent! Check your inbox and spam folder.');
        setEmail(''); // Clear email field after successful request
      } else {
        console.error('Password reset failed:', result.error);
        setError(result.error || 'Failed to send password reset email. Please try again.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isRegistering && !trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isRegistering) {
        // signUpWithEmail(email, password, name, metadata)
        const displayName = trimmedName || (userType === 'tenant' ? 'New Tenant' : 'New Agent');
        result = await signUpWithEmail(trimmedEmail, password, displayName, { type: userType });
        
        if (!result.success) {
          throw new Error(result.error || 'Registration failed');
        }

        // Check if email confirmation is required
        if (result.emailConfirmationRequired) {
          setSuccessMessage('Registration successful! Please check your email to verify your account before signing in.');
          setIsRegistering(false);
          setPassword('');
          setLoading(false);
          return;
        }
        
        const user = result.user;
        const userData = {
          email: user.email,
          name: displayName,
          type: userType,
          role: userType,
          phone: null,
          location: null,
          avatar: null
        };
        await createUser(user.id, userData);
        onLogin({ ...userData, uid: user.id, id: user.id });
      } else {
        result = await signInWithEmail(trimmedEmail, password);
        
        if (!result.success) {
          // Check if email not confirmed - show resend option
          if (result.errorCode === 'auth/email-not-confirmed') {
            setShowResendConfirmation(true);
            setError(result.error);
            setLoading(false);
            return;
          }
          
          // Use the error code if available, otherwise use the error message
          const errorMsg = result.errorCode 
            ? getAuthErrorMessage(result.errorCode)
            : result.error;
          throw new Error(errorMsg);
        }
        
        setShowResendConfirmation(false);
        const user = result.user;
        const userResult = await getUser(user.id);
        if (userResult.success) {
          onLogin({ ...userResult.data, uid: user.id, id: user.id });
        } else {
          onLogin({
            uid: user.id,
            id: user.id,
            email: user.email,
            type: userType
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex flex-col px-5 sm:px-8 lg:px-12 xl:px-16 py-6 relative z-10 overflow-y-auto min-h-screen md:min-h-0">
        {/* Header - Logo + I'm an Agent button */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-shrink-0">
          <div
            className="cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <Image src="/yoombaa-logo.svg" alt="Yoombaa" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
          </div>
          <button
            onClick={() => onNavigate('landing')}
            className="px-3 sm:px-4 py-2 rounded-full bg-[#FE9200] text-white font-semibold hover:bg-[#E58300] transition-all shadow-md text-xs sm:text-sm"
          >
            I&apos;m an Agent
          </button>
        </div>

        {/* Form Container - Centered vertically on desktop */}
        <div className="flex-1 flex items-start md:items-center justify-center">
          <div className="w-full max-w-md">
            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {isRegistering ? 'Create an account' : 'Welcome Back!'}
            </h2>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              {isRegistering ? 'Join Yoombaa to find your home' : 'Sign in to access your dashboard'}
            </p>

            {/* User Type Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6 w-fit">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  userType === 'tenant'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setUserType('tenant')}
                type="button"
              >
                <User className="w-4 h-4" />
                <span>Tenant</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  userType === 'agent'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setUserType('agent')}
                type="button"
              >
                <Building2 className="w-4 h-4" />
                <span>Agent</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
                {showResendConfirmation && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="block mt-2 text-[#FE9200] hover:text-[#E58300] font-medium underline"
                  >
                    {loading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200">
                {successMessage}
              </div>
            )}

            {/* Form - proper mobile spacing */}
            <form className="space-y-4" onSubmit={handleEmailAuth}>
              {/* Full Name - Only for Registration */}
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required={isRegistering}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 min-h-[48px] border border-gray-200 rounded-xl focus:border-[#FE9200] focus:ring-2 focus:ring-[#FFE4C4] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 min-h-[48px] border border-gray-200 rounded-xl focus:border-[#FE9200] focus:ring-2 focus:ring-[#FFE4C4] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 min-h-[48px] border border-gray-200 rounded-xl focus:border-[#FE9200] focus:ring-2 focus:ring-[#FFE4C4] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password - 44px touch target */}
              {!isRegistering && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-sm font-medium text-[#FE9200] hover:text-[#E58300] transition-colors min-h-[44px] flex items-center"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit Button - 48px height per guidelines */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 min-h-[48px] bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleLogo />
              <span className="font-medium text-gray-700 group-hover:text-gray-900 text-sm">Continue with Google</span>
            </button>

            {/* Footer Link */}
            <p className="mt-6 text-center text-sm text-gray-600">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="font-semibold text-[#FE9200] hover:text-[#E58300] transition-colors"
              >
                {isRegistering ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] relative items-center justify-center p-8 lg:p-12 text-white overflow-hidden">
        {/* Background Gradient/Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7A00AA] to-slate-900 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">
            Find your perfect home with trusted agents.
          </h2>
          <div className="space-y-4">
            <p className="text-base lg:text-lg text-gray-300 italic leading-relaxed">
              &quot;Yoombaa transformed my house hunting experience. I found a verified apartment in Nairobi within 2 days! The process was seamless and secure.&quot;
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-12 rounded-full bg-[#FE9200] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#7A00AA]/20">S</div>
              <div>
                <p className="font-semibold text-white">Sarah Johnson</p>
                <p className="text-sm text-[#FFD4A3]">Tenant in Nairobi</p>
              </div>
            </div>
          </div>
          
          {/* Logos at bottom */}
          <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-white/10 flex gap-6 lg:gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 lg:w-6 h-5 lg:h-6" />
              <span className="font-bold text-base lg:text-lg">Yoombaa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base lg:text-lg">Pesapal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base lg:text-lg">Google</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
