'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Mail, ArrowRight, Home } from 'lucide-react';
import { Button } from './ui/Button';

/**
 * Email Confirmation Success Screen
 * Shown after the user successfully verifies their email
 */
const EmailConfirmationSuccess = ({ onContinue, onGoHome }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const animationTimer = setTimeout(() => setIsAnimated(true), 100);
    const contentTimer = setTimeout(() => setShowContent(true), 600);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div 
          className={`bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all duration-700 ease-out ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Success Icon with Animation */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Animated rings */}
            <div 
              className={`absolute w-32 h-32 rounded-full bg-green-100 transition-all duration-1000 ease-out ${
                isAnimated ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              style={{ animationDelay: '200ms' }}
            />
            <div 
              className={`absolute w-24 h-24 rounded-full bg-green-200 transition-all duration-700 ease-out ${
                isAnimated ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              style={{ animationDelay: '400ms' }}
            />
            
            {/* Check icon */}
            <div 
              className={`relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg transform transition-all duration-500 ${
                isAnimated ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}
            >
              <CheckCircle 
                className={`w-10 h-10 text-white transition-all duration-300 ${
                  isAnimated ? 'opacity-100' : 'opacity-0'
                }`} 
                strokeWidth={2.5}
              />
            </div>

            {/* Floating particles */}
            {isAnimated && (
              <>
                <span className="absolute top-2 left-8 w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '2s' }} />
                <span className="absolute top-4 right-6 w-3 h-3 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '2.5s' }} />
                <span className="absolute bottom-6 left-4 w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '600ms', animationDuration: '2s' }} />
                <span className="absolute bottom-4 right-10 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '2.2s' }} />
              </>
            )}
          </div>

          {/* Content */}
          <div 
            className={`transition-all duration-500 ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {/* Email Icon Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              Email Verified
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Email Confirmed!
            </h1>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Your email address has been successfully verified. 
              You can now access all features of your RentConnect account.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-[#FE9200] to-[#E58300] hover:from-[#E58300] hover:to-[#D47500] text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Button>

              <button
                onClick={onGoHome}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>

          {/* Confetti effect */}
          {isAnimated && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
              <div className="confetti-container">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10%',
                      backgroundColor: ['#FE9200', '#7A00AA', '#22C55E', '#3B82F6', '#F59E0B'][i % 5],
                      animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer text */}
        <p 
          className={`text-center text-sm text-gray-400 mt-6 transition-all duration-500 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Welcome to RentConnect 🏠
        </p>
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(400px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
};

export default EmailConfirmationSuccess;
