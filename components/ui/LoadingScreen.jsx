'use client';

import React, { useState, useEffect } from 'react';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center z-50">
      <div className="relative flex flex-col items-center">
        <div className="relative animate-fade-in">
          <svg 
            viewBox="0 0 300 120" 
            className="w-72 h-28 md:w-96 md:h-36"
          >
            <defs>
              <linearGradient id="houseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FE9200" />
                <stop offset="100%" stopColor="#FFB84D" />
              </linearGradient>
            </defs>
            
            <g className="animate-draw-house" style={{ strokeDasharray: 300, strokeDashoffset: 0 }}>
              <path 
                d="M 10 60 L 45 25 L 45 10 L 55 10 L 55 18 L 80 60" 
                fill="none" 
                stroke="url(#houseGradient)" 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-house-roof"
              />
              <path 
                d="M 10 60 L 10 105 L 290 105" 
                fill="none" 
                stroke="url(#houseGradient)" 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-house-base"
              />
            </g>
            
            <text 
              x="55" 
              y="82" 
              fill="white" 
              fontSize="52" 
              fontFamily="DM Sans, sans-serif" 
              fontWeight="600"
              className="animate-text-reveal"
            >
              yoombaa
            </text>
          </svg>
        </div>

        <div className="mt-8 flex space-x-2">
          <div className="w-3 h-3 bg-brand-orange rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-brand-orange rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-brand-orange rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }}></div>
        </div>

        <div className="mt-6 w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        <p className="mt-4 text-gray-400 text-sm animate-pulse">
          Finding your perfect home...
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes house-roof {
          from {
            stroke-dashoffset: 200;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes house-base {
          from {
            stroke-dashoffset: 300;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes text-reveal {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-12px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-house-roof {
          stroke-dasharray: 200;
          animation: house-roof 1.2s ease-out 0.3s forwards;
        }

        .animate-house-base {
          stroke-dasharray: 300;
          animation: house-base 1s ease-out 0.6s forwards;
        }

        .animate-text-reveal {
          animation: text-reveal 0.8s ease-out 0.5s both;
        }

        .animate-bounce-dot {
          animation: bounce-dot 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
