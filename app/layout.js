import './globals.css'
import Script from 'next/script'
import { DM_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { SkeletonLoadingScreen } from '@/components/ui/SkeletonLoadingScreen'
import { ToastProvider } from '@/context/ToastContext'
import DebugPanel from '@/components/DebugPanel'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-dm-sans',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e2530',
}

export const metadata = {
  metadataBase: new URL('https://yoombaa.com'),
  title: {
    default: 'Yoombaa - Find Rental Properties & Verified Tenants in Kenya',
    template: '%s | Yoombaa'
  },
  description: 'Yoombaa connects tenants with trusted agents in Kenya. Find your perfect rental property or verify quality tenants without the hassle.',
  keywords: [
    'rental properties Kenya',
    'find tenants Nairobi',
    'apartments for rent Nairobi',
    'property agents Kenya',
    'house hunting Kenya',
    'real estate Kenya',
    'Yoombaa',
    'rental marketplace Kenya',
    'verified tenants Kenya',
    'trusted property agents Nairobi'
  ],
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Yoombaa - Kenya\'s Leading Rental Marketplace',
    description: 'Connect with trusted agents and find your perfect rental property faster. Kenya\'s smartest way to rent.',
    url: 'https://yoombaa.com',
    siteName: 'Yoombaa',
    locale: 'en_KE',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Yoombaa - Find Your Perfect Rental Home in Kenya',
        type: 'image/png',
      },
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Yoombaa - Kenya Rental Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yoombaa - Rental Marketplace Kenya',
    description: 'Find verified tenants and rental properties across Kenya.',
    images: ['/api/og'],
    creator: '@yoombaa',
    site: '@yoombaa',
  },
  icons: {
    icon: [
      { url: '/yoombaa-favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/yoombaa-favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/yoombaa-favicon.png',
    apple: [
      { url: '/yoombaa-favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
  category: 'real estate',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://yydwhwkvrvgkqnmirbrr.supabase.co" />

        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />

        {/* Optimize performance with link prefetch */}
        <link rel="prefetch" href="/yoombaa-logo.png" as="image" />
        <link rel="prefetch" href="/yoombaa-favicon.png" as="image" />
      </head>
      <body className={`${dmSans.className} font-sans`}>
        <ToastProvider>
          <Suspense fallback={<SkeletonLoadingScreen />}>
            {children}
          </Suspense>
        </ToastProvider>

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
