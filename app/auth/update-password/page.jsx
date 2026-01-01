'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Wrapper component to handle Suspense for useSearchParams
function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Password validation
    const passwordRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    // Check if user has a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const supabase = createClient();
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    setError('Invalid or expired reset link. Please request a new one.');
                    setCheckingSession(false);
                    return;
                }

                if (session) {
                    setIsValidSession(true);
                } else {
                    // Check URL for error parameter
                    const errorParam = searchParams.get('error');
                    if (errorParam === 'invalid_token') {
                        setError('Invalid or expired reset link. Please request a new one.');
                    } else {
                        setError('No active session. Please request a new password reset link.');
                    }
                }
            } catch (err) {
                console.error('Error checking session:', err);
                setError('An error occurred. Please try again.');
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isPasswordValid) {
            setError('Please ensure your password meets all requirements.');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                console.error('Password update error:', updateError);
                setError(updateError.message || 'Failed to update password. Please try again.');
                setLoading(false);
                return;
            }

            setSuccess(true);

            // Sign out and redirect to login after success
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/?message=password_reset_success');
            }, 3000);

        } catch (err) {
            console.error('Error updating password:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#fe9200] mx-auto mb-4" />
                    <p className="text-gray-600">Verifying your reset link...</p>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h1>
                    <p className="text-gray-600 mb-6">
                        Your password has been successfully updated. You will be redirected to the login page shortly.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Redirecting...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid session state
    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'This password reset link is invalid or has expired. Please request a new one.'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 px-4 bg-[#fe9200] text-white font-medium rounded-lg hover:bg-[#e58300] transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#fe9200]">Yoombaa</h1>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-[#fe9200]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-7 h-7 text-[#fe9200]" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                        <p className="text-gray-600">
                            Create a strong password for your account
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fe9200] focus:border-transparent outline-none transition-all"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        {password.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-xs font-medium text-gray-600 mb-2">Password requirements:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <RequirementItem met={passwordRequirements.length} text="8+ characters" />
                                    <RequirementItem met={passwordRequirements.uppercase} text="Uppercase letter" />
                                    <RequirementItem met={passwordRequirements.lowercase} text="Lowercase letter" />
                                    <RequirementItem met={passwordRequirements.number} text="Number" />
                                </div>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#fe9200] focus:border-transparent outline-none transition-all ${confirmPassword.length > 0 && !passwordsMatch
                                        ? 'border-red-300 bg-red-50'
                                        : confirmPassword.length > 0 && passwordsMatch
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-gray-300'
                                        }`}
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !isPasswordValid || !passwordsMatch}
                            className={`w-full py-3 px-4 font-medium rounded-lg transition-all ${loading || !isPasswordValid || !passwordsMatch
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#fe9200] text-white hover:bg-[#e58300]'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating Password...
                                </span>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm text-gray-500 hover:text-[#fe9200] transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-400 mt-8">
                    © 2025 Yoombaa. All rights reserved.
                </p>
            </div>
        </div>
    );
}

// Password requirement item component
function RequirementItem({ met, text }) {
    return (
        <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
            {met ? (
                <CheckCircle className="w-3.5 h-3.5" />
            ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
            )}
            <span>{text}</span>
        </div>
    );
}

// Default export with Suspense wrapper for useSearchParams
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#fe9200] mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}

