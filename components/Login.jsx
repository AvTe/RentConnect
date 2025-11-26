import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User, Building2, Chrome } from 'lucide-react';
import { Button } from './ui/Button';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export const Login = ({ onNavigate, onLogin }) => {
  const [userType, setUserType] = useState('tenant'); // 'tenant' | 'agent'
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { getUser, createUser } = await import('@/lib/firestore');
      let userCredential;
      
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        const userData = {
          email: user.email,
          name: name || (userType === 'tenant' ? 'New Tenant' : 'New Agent'),
          type: userType,
          phone: null,
          location: null,
          avatar: null
        };
        await createUser(user.uid, userData);
        onLogin({ ...userData, uid: user.uid });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-emerald-600 p-2 rounded-xl">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-sans">
          {isRegistering ? 'Create an account' : 'Welcome back'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegistering ? 'Join RentConnect today' : 'Sign in to your RentConnect account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* User Type Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                userType === 'tenant' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setUserType('tenant')}
            >
              <User className="w-4 h-4" />
              Tenant
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                userType === 'agent' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setUserType('agent')}
            >
              <Building2 className="w-4 h-4" />
              Agent
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">
              {successMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailAuth}>
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isRegistering}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm outline-none transition-colors"
                    placeholder="Your Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isRegistering && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button 
                    type="button"
                    onClick={handlePasswordReset}
                    className="font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            <div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 flex justify-center items-center gap-2 shadow-lg shadow-emerald-100"
              >
                {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign in')}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2"
              >
                <Chrome className="w-5 h-5 text-gray-600" />
                Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                {isRegistering ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
