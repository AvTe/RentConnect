import './globals.css'
import Script from 'next/script'
import { DM_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { SkeletonLoadingScreen } from '@/components/ui/SkeletonLoadingScreen'
import DebugPanel from '@/components/DebugPanel'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
  preload: true,
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e2530',
}

export const metadata = {
  title: 'Yoombaa - Find Your Perfect Home',
  description: 'Yoombaa connects tenants with trusted agents. Find your perfect rental property without the hassle.',
  keywords: 'rental, apartments, housing, agents, tenants, property rental',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Yoombaa - Find Your Perfect Home',
    description: 'Connect with trusted agents and find your perfect rental property.',
    siteName: 'Yoombaa',
    type: 'website',
  },
  icons: {
    icon: '/yoombaa-logo.png',
    apple: '/yoombaa-logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://yydwhwkvrvgkqnmirbrr.supabase.co" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        
        {/* Optimize performance with link prefetch */}
        <link rel="prefetch" href="/yoombaa-logo.png" as="image" />
      </head>
      <body className={`${dmSans.className} font-sans`}>
        <Suspense fallback={<SkeletonLoadingScreen />}>
          {children}
        </Suspense>

        {/* Debug Panel - TEMPORARY for troubleshooting */}
        <DebugPanel />

        {/* Suppress harmless ResizeObserver loop errors */}
        <Script id="resize-observer-fix" strategy="beforeInteractive">
          {`
            // Suppress ResizeObserver loop limit exceeded error
            // This is a benign error that occurs with dynamic layouts
            const resizeObserverErr = window.onerror;
            window.onerror = function(message, source, lineno, colno, error) {
              if (message && message.includes && message.includes('ResizeObserver loop')) {
                return true; // Suppress the error
              }
              if (resizeObserverErr) {
                return resizeObserverErr.apply(this, arguments);
              }
              return false;
            };

            // Also handle unhandledrejection for ResizeObserver
            window.addEventListener('error', function(e) {
              if (e.message && e.message.includes && e.message.includes('ResizeObserver loop')) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            });
          `}
        </Script>

        {/* reCAPTCHA Script - Optimized with afterInteractive strategy */}
        <Script
          src="https://www.google.com/recaptcha/enterprise.js?render=6LfThBosAAAAALZ06Y7e9jaFROeO_hSgiGdzQok1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
