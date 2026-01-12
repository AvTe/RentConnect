'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      {/* SEO: noindex for error pages - using native head element in App Router */}
      <head>
        <title>404 - Page Not Found | Yoombaa</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </head>

      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-12 max-w-lg w-full border border-gray-100 text-center">
        {/* 404 Icon */}
        <div className="w-28 h-28 bg-gradient-to-br from-[#FE9200]/10 to-[#FE9200]/5 rounded-[36px] flex items-center justify-center mx-auto mb-8 border border-[#FE9200]/20">
          <div className="relative">
            <MapPin className="w-14 h-14 text-[#FE9200] stroke-[1.5]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">!</span>
            </div>
          </div>
        </div>

        {/* 404 Heading */}
        <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-2 tracking-tight">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 tracking-tight">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-gray-500 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
          Oops! The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full h-14 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#FE9200]/20"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Decorative Footer */}
        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          <Search className="w-4 h-4" />
          Kenya&apos;s #1 Rental Marketplace
        </div>
      </div>
      </div>
    </>
  );
}

