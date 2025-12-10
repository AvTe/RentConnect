'use client';

import React from 'react';
import Image from 'next/image';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ backgroundColor: '#1e2530' }}>
      <div className="flex flex-col items-center">
        <div className="animate-fade-in-up">
          <Image
            src="/yoombaa-logo.png"
            alt="Yoombaa"
            width={320}
            height={80}
            className="w-64 md:w-80 h-auto"
            priority
          />
        </div>

        <div className="mt-10 flex space-x-3">
          <div className="w-3 h-3 rounded-full animate-bounce-dot" style={{ backgroundColor: '#FE9200', animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full animate-bounce-dot" style={{ backgroundColor: '#FE9200', animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full animate-bounce-dot" style={{ backgroundColor: '#FE9200', animationDelay: '300ms' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-bounce-dot {
          animation: bounce-dot 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
