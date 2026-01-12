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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full text-center">
          {/* 404 Icon */}
          <div className="w-16 h-16 bg-[#FE9200]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="relative">
              <MapPin className="w-8 h-8 text-[#FE9200]" />
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">!</span>
              </div>
            </div>
          </div>

          {/* 404 Heading */}
          <h1 className="text-4xl font-black text-gray-900 mb-1">404</h1>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Page Not Found</h2>

          {/* Description */}
          <p className="text-gray-500 text-sm mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link
              href="/"
              className="w-full h-11 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Decorative Footer */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[9px] font-medium text-gray-400 uppercase tracking-wider">
            <Search className="w-3 h-3" />
            Kenya&apos;s #1 Rental Marketplace
          </div>
        </div>
      </div>
    </>
  );
}

