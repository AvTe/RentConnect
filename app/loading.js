/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Fast progress at start, slower near the end
        const increment = prev < 60 ? 8 : prev < 80 ? 4 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-white via-orange-50 to-white">
      {/* Logo Container with Animation */}
      <div className="relative mb-10 animate-fade-in">
        {/* Animated glow ring behind logo */}
        <div className="absolute -inset-6 bg-[#FE9200]/10 rounded-full blur-xl animate-pulse-ring" />

        {/* Logo Image */}
        <div className="relative">
          <img
            src="/yoombaa-logo.svg"
            alt="Yoombaa"
            className="h-14 w-auto drop-shadow-lg"
          />
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-72 space-y-4">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#FE9200] to-[#FFB84D] rounded-full transition-all duration-200 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Loading Text with animated dots */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500 font-medium">Finding your perfect home</span>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-[#FE9200] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-[#FE9200] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-[#FE9200] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Progress percentage */}
        <div className="text-center">
          <span className="text-xs text-gray-400">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

