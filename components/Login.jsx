import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Building2 } from 'lucide-react';
import { Button } from './ui/Button';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

// Helper function to convert Firebase error codes to user-friendly messages
const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  };

  return errorMessages[errorCode] || 'An error occurred during authentication. Please try again.';
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Google Logo SVG Component
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

export const Login = ({ onNavigate, onLogin }) => {
  const [userType, setUserType] = useState('tenant'); // 'tenant' | 'agent'
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Check if Firebase auth is initialized
    if (!auth || !googleProvider) {
      setError('Authentication service is not available. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const { getUser, createUser } = await import('@/lib/firestore');
      const userResult = await getUser(user.uid);

      if (!userResult.success) {
        // Create new user profile
        const userData = {
          email: user.email,
          name: user.displayName,
          avatar: user.photoURL,
          type: userType,
          phone: null,
          location: null
        };
        await createUser(user.uid, userData);
        onLogin({ ...userData, uid: user.uid });
      } else {
        // User exists, use their profile
        onLogin({ ...userResult.data, uid: user.uid });
      }
    } catch (err) {
      const errorCode = err.code || '';
      setError(getAuthErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
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

    if (!auth) {
      setError('Authentication service is not available. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      const errorCode = err.code || '';
      setError(getAuthErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    // Validate email format
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Validate name for registration
    if (isRegistering && !trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    // Check if Firebase auth is initialized
    if (!auth) {
      setError('Authentication service is not available. Please refresh the page and try again.');
      return;
    }

    setLoading(true);

    try {
      const { getUser, createUser } = await import('@/lib/firestore');
      let userCredential;

      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userData = {
          email: user.email,
          name: trimmedName || (userType === 'tenant' ? 'New Tenant' : 'New Agent'),
          type: userType,
          phone: null,
          location: null,
          avatar: null
        };
        await createUser(user.uid, userData);
        onLogin({ ...userData, uid: user.uid });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;

        // Fetch user profile
        const userResult = await getUser(user.uid);
        if (userResult.success) {
          onLogin({ ...userResult.data, uid: user.uid });
        } else {
          onLogin({
            uid: user.uid,
            email: user.email,
            type: userType
          });
        }
      }
    } catch (err) {
      const errorCode = err.code || '';
      setError(getAuthErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 relative z-10 overflow-y-auto">
         {/* Logo */}
         <div className="absolute top-8 left-8 sm:left-12 lg:left-24 flex items-center gap-1 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Rent-</span>
            <span className="text-xl font-bold text-[#8B5CF6] tracking-tight">Connect</span>
         </div>

         <div className="max-w-md w-full mx-auto mt-16 md:mt-0">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegistering ? 'Create an account' : 'Welcome Back!'}
            </h2>
            <p className="text-gray-500 mb-8">
              {isRegistering ? 'Join Yoombaa to find your home' : 'Sign in to access your dashboard'}
            </p>

            {/* User Type Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6 w-fit">
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  userType === 'tenant' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setUserType('tenant')}
                type="button"
              >
                <User className="w-4 h-4" />
                Tenant
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  userType === 'agent' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setUserType('agent')}
                type="button"
              >
                <Building2 className="w-4 h-4" />
                Agent
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-[#FFF5E6] text-[#16A34A] text-sm rounded-lg border border-[#FFE4C4]">
                {successMessage}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleEmailAuth}>
               {isRegistering && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                   <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type="text"
                       required={isRegistering}
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                       placeholder="Enter your name"
                     />
                   </div>
                 </div>
               )}

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                   <input
                     type="email"
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                     placeholder="Enter your email"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                   <input
                     type={showPassword ? "text" : "password"}
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                     placeholder="Enter your password"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                   >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                   </button>
                 </div>
               </div>

               {!isRegistering && (
                 <div className="flex justify-end">
                   <button 
                     type="button"
                     onClick={handlePasswordReset}
                     className="text-sm font-medium text-[#8B5CF6] hover:text-[#7C3AED]"
                   >
                     Forgot Password?
                   </button>
                 </div>
               )}

               <Button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-3 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-lg font-medium shadow-lg shadow-[#FFE4C4] transition-all"
               >
                 {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
               </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">OR</span></div>
            </div>

            {/* Google Button */}
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all group"
            >
               <GoogleLogo />
               <span className="font-medium text-gray-700 group-hover:text-gray-900">Continue with Google</span>
            </button>

            {/* Footer Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
               {isRegistering ? 'Already have an account?' : "Don't have an Account?"} 
               <button 
                 onClick={() => setIsRegistering(!isRegistering)} 
                 className="ml-1 font-semibold text-[#8B5CF6] hover:underline"
               >
                 {isRegistering ? 'Sign In' : 'Sign Up'}
               </button>
            </p>
         </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] relative items-center justify-center p-12 text-white overflow-hidden">
         {/* Background Gradient/Image */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#7A00AA] to-slate-900 z-0"></div>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
         
         <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
               Find your perfect home with trusted agents.
            </h2>
            <div className="space-y-4">
               <p className="text-lg text-gray-300 italic leading-relaxed">
                  &quot;Yoombaa transformed my house hunting experience. I found a verified apartment in Nairobi within 2 days! The process was seamless and secure.&quot;
               </p>
               <div className="flex items-center gap-4 mt-8">
                  <div className="w-12 h-12 rounded-full bg-[#FE9200] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#7A00AA]/20">S</div>
                  <div>
                     <p className="font-semibold text-white">Sarah Johnson</p>
                     <p className="text-sm text-[#FFD4A3]">Tenant in Lekki</p>
                  </div>
               </div>
            </div>
            
            {/* Logos at bottom */}
            <div className="mt-16 pt-8 border-t border-white/10 flex gap-8 opacity-40 grayscale">
               <div className="flex items-center gap-2">
                 <Building2 className="w-6 h-6" />
                 <span className="font-bold text-lg">Yoombaa</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-bold text-lg">Paystack</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-bold text-lg">Google</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
