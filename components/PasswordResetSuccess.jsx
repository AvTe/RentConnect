'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, LogIn } from 'lucide-react';
import { Button } from './ui/Button';

/**
 * Password Reset Success Screen
 * Shown after the user successfully resets their password
 */
const PasswordResetSuccess = ({ onContinue, onSignIn }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    // Trigger animations in sequence
    const animationTimer = setTimeout(() => setIsAnimated(true), 100);
    const checkmarkTimer = setTimeout(() => setShowCheckmark(true), 500);
    const contentTimer = setTimeout(() => setShowContent(true), 800);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(checkmarkTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div 
          className={`bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all duration-700 ease-out ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Success Icon with Animation */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Animated pulse rings */}
            <div 
              className={`absolute w-36 h-36 rounded-full border-4 border-purple-100 transition-all duration-1000 ease-out ${
                isAnimated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            />
            <div 
              className={`absolute w-28 h-28 rounded-full border-4 border-purple-200 transition-all duration-700 ease-out ${
                isAnimated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            />
            
            {/* Shield icon container */}
            <div 
              className={`relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#7A00AA] to-[#9F2CC4] flex items-center justify-center shadow-lg transform transition-all duration-500 ${
                isAnimated ? 'scale-100' : 'scale-0'
              }`}
            >
              {/* Lock to Shield transition */}
              <div className="relative">
                <Lock 
                  className={`w-8 h-8 text-white absolute inset-0 m-auto transition-all duration-500 ${
                    showCheckmark ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                  }`} 
                  strokeWidth={2}
                />
                <ShieldCheck 
                  className={`w-10 h-10 text-white transition-all duration-500 ${
                    showCheckmark ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
                  }`} 
                  strokeWidth={2}
                />
              </div>
            </div>

            {/* Animated sparkles */}
            {isAnimated && (
              <>
                <span 
                  className="absolute top-0 right-12 text-2xl animate-pulse"
                  style={{ animationDelay: '0ms' }}
                >
                  ✨
                </span>
                <span 
                  className="absolute top-8 left-4 text-xl animate-pulse"
                  style={{ animationDelay: '300ms' }}
                >
                  ✨
                </span>
                <span 
                  className="absolute bottom-8 right-4 text-lg animate-pulse"
                  style={{ animationDelay: '600ms' }}
                >
                  ✨
                </span>
              </>
            )}
          </div>

          {/* Content */}
          <div 
            className={`transition-all duration-500 ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-purple-700 text-sm font-medium mb-4">
              <Lock className="w-4 h-4" />
              Password Updated
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Password Reset Successfully!
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Your password has been changed successfully. 
              Your account is now secure with your new password.
            </p>

            {/* Security Tips */}
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">🔒 Security Tips:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Use a unique password for each account</li>
                <li>• Never share your password with anyone</li>
                <li>• Consider enabling two-factor authentication</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onContinue || onSignIn}
                className="w-full bg-gradient-to-r from-[#7A00AA] to-[#9F2CC4] hover:from-[#6B0099] hover:to-[#8A1AAB] text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Continue to Sign In
                <ArrowRight className="w-5 h-5" />
              </Button>

              <button
                onClick={onSignIn}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign in with new password
              </button>
            </div>
          </div>

          {/* Animated checkmark line */}
          <svg 
            className={`absolute top-4 right-4 w-16 h-16 transition-all duration-1000 ${
              showCheckmark ? 'opacity-100' : 'opacity-0'
            }`}
            viewBox="0 0 50 50"
          >
            <circle 
              cx="25" 
              cy="25" 
              r="20" 
              fill="none" 
              stroke="#E9D5FF" 
              strokeWidth="2"
              className={`transition-all duration-700 ${
                showCheckmark ? 'stroke-dashoffset-0' : ''
              }`}
              style={{
                strokeDasharray: 126,
                strokeDashoffset: showCheckmark ? 0 : 126,
                transition: 'stroke-dashoffset 0.7s ease-out'
              }}
            />
          </svg>
        </div>

        {/* Footer text */}
        <p 
          className={`text-center text-sm text-gray-400 mt-6 transition-all duration-500 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Your account is protected 🛡️
        </p>
      </div>
    </div>
  );
};

export default PasswordResetSuccess;
