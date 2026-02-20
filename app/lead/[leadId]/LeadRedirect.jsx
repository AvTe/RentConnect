'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LeadRedirect({ leadId }) {
  const [attempted, setAttempted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    if (mobile) {
      // If App Links (Android) / Universal Links (iOS) are properly configured,
      // the OS will intercept the HTTPS URL and open the app BEFORE this page loads.
      // If we reach here, App Links didn't fire — try the custom scheme as fallback.
      const appUrl = `yoombaa://lead/${leadId}`;

      // Attempt to open via custom scheme
      window.location.href = appUrl;

      // If the app didn't open within 2.5s, show the fallback UI
      const timer = setTimeout(() => setAttempted(true), 2500);
      return () => clearTimeout(timer);
    } else {
      // Desktop — show fallback immediately
      setAttempted(true);
    }
  }, [leadId]);

  // Loading state while attempting to open the app
  if (!attempted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <Image
              src="/yoombaa-logo.png"
              alt="Yoombaa"
              fill
              className="object-contain"
            />
          </div>
          <div
            className="w-8 h-8 border-[3px] border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p className="text-white text-lg font-medium">Opening Yoombaa...</p>
          <p className="text-gray-400 text-sm mt-2">
            Redirecting to the app
          </p>
        </div>

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Fallback UI — show when app didn't open or on desktop
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 relative">
            <Image
              src="/yoombaa-logo.png"
              alt="Yoombaa"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-white text-2xl font-bold">Yoombaa</h1>
          <p className="text-orange-100 text-sm mt-1">
            Africa&apos;s #1 Real Estate Agent Platform
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-orange-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>

          <h2 className="text-white text-xl font-semibold mb-2">
            Tenant Lead Available
          </h2>
          <p className="text-gray-400 mb-6">
            A tenant is looking for a property. Open this lead in the Yoombaa
            app to view full details and connect.
          </p>

          {/* Open in App Button (mobile only) */}
          {isMobile && (
            <button
              onClick={() => {
                window.location.href = `yoombaa://lead/${leadId}`;
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl mb-4 transition-colors"
            >
              Open in Yoombaa App
            </button>
          )}

          {/* App Store Download Links */}
          <p className="text-gray-500 text-sm mb-3">
            {isMobile ? "Don't have the app yet?" : 'Get the Yoombaa app'}
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="https://play.google.com/store/apps/details?id=com.yoombaa.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
              </svg>
              Google Play
            </a>
            <a
              href="https://apps.apple.com/app/yoombaa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Yoombaa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
