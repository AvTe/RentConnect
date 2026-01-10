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

// JSON-LD Structured Data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://yoombaa.com/#organization',
      name: 'Yoombaa',
      url: 'https://yoombaa.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yoombaa.com/yoombaa-logo.png',
        width: 512,
        height: 512,
      },
      description: 'Kenya\'s leading rental marketplace connecting tenants with trusted property agents.',
      foundingDate: '2024',
      areaServed: {
        '@type': 'Country',
        name: 'Kenya',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Swahili'],
      },
      sameAs: [
        'https://www.facebook.com/yoombaa',
        'https://www.instagram.com/yoombaa',
        'https://twitter.com/yoombaa',
        'https://www.linkedin.com/company/yoombaa',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://yoombaa.com/#website',
      url: 'https://yoombaa.com',
      name: 'Yoombaa',
      description: 'Find rental properties and verified tenants in Kenya',
      publisher: {
        '@id': 'https://yoombaa.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://yoombaa.com/?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-KE',
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://yoombaa.com/#localbusiness',
      name: 'Yoombaa',
      image: 'https://yoombaa.com/yoombaa-logo.png',
      '@type': ['LocalBusiness', 'RealEstateAgent'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -1.2921,
        longitude: 36.8219,
      },
      url: 'https://yoombaa.com',
      priceRange: 'KSh',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00',
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://yoombaa.com/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://yoombaa.com',
        },
      ],
    },
  ],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e2530',
}

export const metadata = {
  metadataBase: new URL('https://yoombaa.com'),
  title: {
    default: 'Yoombaa - Find Rental Properties & Verified Tenants in Kenya | Nairobi Apartments',
    template: '%s | Yoombaa Kenya'
  },
  description: 'Kenya\'s #1 rental marketplace. Find apartments for rent in Nairobi, Mombasa, Kisumu & across Kenya. Connect with verified property agents. No broker fees, trusted tenants.',
  keywords: [
    'rental properties Kenya',
    'apartments for rent Nairobi',
    'houses for rent Kenya',
    'find tenants Nairobi',
    'property agents Kenya',
    'Nairobi apartments',
    'Mombasa rentals',
    'Kisumu houses for rent',
    'bedsitter Nairobi',
    'studio apartment Kenya',
    'one bedroom apartment Nairobi',
    'two bedroom house Kenya',
    'furnished apartments Nairobi',
    'house hunting Kenya',
    'real estate Kenya',
    'Yoombaa',
    'rental marketplace Kenya',
    'verified tenants Kenya',
    'trusted property agents Nairobi',
    'nyumba ya kupanga Kenya',
    'kodi Nairobi',
  ],
  authors: [{ name: 'Yoombaa', url: 'https://yoombaa.com' }],
  creator: 'Yoombaa',
  publisher: 'Yoombaa',
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
    google: 'BxEEJ2mEjqcEWhnx68dd9EXUCWwMAnUlU0-5eUd-Vpk',
  },
  category: 'real estate',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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
