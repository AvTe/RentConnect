# RentConnect (Yoombaa) - Replit Project

## Overview
RentConnect (branded as Yoombaa) is a comprehensive rental property marketplace platform that connects tenants with verified real estate agents. The platform features real-time updates, payment integration via Paystack, and multi-channel notifications.

## Project Structure

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Frontend:** React 18, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage, Analytics)
- **Payment:** Paystack (Nigerian Naira)
- **Notifications:** SendGrid (Email), Twilio (WhatsApp/SMS)

### Key Features
- Dual user system (Tenants and Agents)
- Real-time lead management
- Premium agent subscriptions (₦15,000/month)
- Property listings with image uploads
- Multi-channel notifications
- Admin dashboard for platform management
- **Optimized loading states with Next.js best practices**
- **High-performance image delivery with Next.js Image optimization**

## Recent Changes (Enhanced LeadCard Design - November 30, 2025)

### Enhanced LeadCard Component
- **Icon-Based Feature Labels:** Replaced text labels with modern lucide-react icons:
  - Home icon → Property Type
  - MapPin icon → Area/Location
  - CheckCircle2 icon → Status
  - Zap icon → Active status with live indicator
- **Blurred Contact Details:** Phone and email shown in blurred/masked state for non-subscribers
- **Subscription Overlay:** Lock icon with "Contact details available for subscribed agents" message
- **Click-to-Subscribe:** Non-premium users redirected to subscription page on contact click
- **Agent Engagement Counter:** Shows "X agents contacted this lead" per card (USP feature)
- **Unique Agent Tracking:** Uses Firestore transaction with increment() for atomic counting
- **Real-Time Updates:** Contact counts update in real-time across all cards

### Database & Real Data Implementation
- **Landing Page Carousel:** Updated to fetch real property leads from Firebase Firestore
- **Removed Demo Data:** Replaced hardcoded `sampleLeads` with live database queries
- **Real-Time Updates:** Implemented `useLeads` hook for real-time lead data subscriptions
- **Lead Structure:** Properly mapped real database fields:
  - `requirements.property_type` → Property type
  - `requirements.location` → Location  
  - `requirements.budget` → Budget amount
  - `tenant_info.name` & `tenant_info.phone` & `tenant_info.email` → Tenant details
  - `contacts` → Contact count from database
- **Smart Fallbacks:** Handles missing fields gracefully with defaults
- **Loading States:** Skeleton loaders during data fetch for better UX

### Agent Contact Tracking (New Feature)
- **Unique Tracking:** `trackAgentLeadContact()` function with Firestore transactions
- **Deduplication:** Uses subcollection `requests/{leadId}/agentContacts/{agentId}` to track unique contacts
- **Atomic Increments:** Uses `increment(1)` for thread-safe counter updates
- **Contact Analytics:** Tracks `contactTypes` array, first/last contact timestamps

### Performance Optimizations Implemented
- **Loading States:** Created `loading.js` files with skeleton loaders for seamless Suspense boundaries
- **Image Optimization:** 
  - Configured `remotePatterns` for Firebase images
  - Added WebP and AVIF format support
  - Implemented 1-year cache for optimized images
- **Code Splitting:** 
  - Dynamic imports for heavy components
  - Tree-shaking enabled with `optimizePackageImports`
- **Font Optimization:**
  - Preloaded DM Sans with `display: swap`
  - Optimized font loading strategy
- **Script Optimization:**
  - reCAPTCHA loaded with `afterInteractive` strategy
  - Firebase SDK deferred with `lazyOnload`
- **Security Headers:**
  - Added `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
  - Configured proper `Cache-Control` headers
- **Middleware:** Created performance-focused middleware for header optimization
- **Caching Strategy:**
  - Static assets: 1-year cache with immutable flag
  - API routes: No-cache to ensure fresh data
- **Accessibility:** Respects `prefers-reduced-motion` for users with motion sensitivities
- **CSS Optimizations:**
  - Utility animations with GPU acceleration
  - Smooth transitions throughout app
  - Professional skeleton loaders

## Environment Variables Required

### ⚠️ Security Notice
This project requires several API keys and credentials. **Never commit these to version control.**
Use Replit's Secrets tab to securely store all environment variables.

### Firebase Configuration (Required)
The application uses Firebase for authentication, database, and storage. You'll need to:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password + Google)
3. Create a Firestore database
4. Enable Cloud Storage
5. Add these environment variables in Replit Secrets:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Payment Integration (Optional - for subscriptions)
```
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

### Email Service (Optional - for notifications)
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### WhatsApp/SMS (Optional - for notifications)
```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### reCAPTCHA (Optional - for spam protection)
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

## Development

### Running Locally
The application is configured to run on port 5000. The workflow "Start application" will automatically:
- Start the Next.js development server
- Bind to `0.0.0.0:5000` (required for Replit proxy)
- Watch for file changes and hot-reload

### Database Setup
1. Go to your Firebase Console
2. Create Firestore database (start in test mode)
3. Deploy security rules from `firestore.rules`
4. Deploy storage rules from `storage.rules`

### Admin Access
The application auto-promotes `kartikamit171@gmail.com` to admin role.
Modify this in `app/page.js` lines 65-66 if needed.

## Deployment Configuration

### For Replit Deployments
- **Type:** Autoscale (recommended for stateless web apps)
- **Build Command:** `npm run build`
- **Run Command:** `npm start`
- **Port:** 5000

### Environment Variables for Production
All the same environment variables used in development must be added to the production deployment.
Use Replit's deployment environment variable settings.

## User Preferences

### Project Conventions
- Uses Next.js App Router architecture
- Client components marked with `'use client'`
- Firebase operations centralized in `lib/` directory
- Tailwind CSS for styling with custom brand colors
- Lucide React for icons
- Performance-focused with skeleton loaders and code splitting

## Project Architecture

### Directory Structure
```
├── app/
│   ├── api/              # API routes (email, payments, SMS)
│   ├── loading.js        # Root loading state with Suspense
│   ├── page.js           # Main application controller
│   ├── layout.js         # Root layout with optimization
│   └── globals.css       # Global styles with animations
├── components/
│   ├── admin/            # Admin dashboard components
│   ├── ui/               # Reusable UI components (Skeleton, LoadingScreen)
│   └── [features]        # Feature-specific components
├── lib/
│   ├── firebase.js       # Firebase initialization
│   ├── firestore.js      # Database operations
│   ├── storage.js        # File upload utilities
│   ├── paystack.js       # Payment integration
│   ├── notifications.js  # Email/WhatsApp utilities
│   ├── hooks.js          # Custom React hooks
│   └── performance.js    # Performance utilities & optimization
├── middleware.js         # Performance & security middleware
├── public/               # Static assets
└── next.config.js        # Next.js config with optimizations
```

### Key Files
- `app/page.js` - Main app controller with routing logic
- `app/layout.js` - Root layout with performance optimizations
- `app/loading.js` - Suspense boundary loading state
- `components/ui/SkeletonLoadingScreen.jsx` - Animated skeleton loader
- `lib/firestore.js` - All database CRUD operations
- `lib/hooks.js` - Real-time data hooks (useLeads, useSubscription, etc.)
- `lib/performance.js` - Performance utilities (preload, prefetch, debounce, throttle)
- `middleware.js` - Performance & security headers

## Performance Optimizations

### Loading States
- **Root Loading:** `app/loading.js` with animated skeleton
- **Suspense Boundaries:** Implemented throughout app
- **Skeleton Components:** Reusable skeleton loaders in `components/ui/Skeleton.jsx`

### Image Optimization
- Next.js `remotePatterns` for Firebase storage
- WebP and AVIF format support
- 1-year cache TTL with immutable flag
- Lazy loading with Intersection Observer

### Script Optimization
- reCAPTCHA: `afterInteractive` strategy
- Firebase SDK: `lazyOnload` strategy
- Preconnect to external resources in layout

### Code Splitting
- Dynamic imports for heavy components
- Tree-shaking with `optimizePackageImports`
- Route-based code splitting

### Caching Strategy
- Static assets: `public, max-age=31536000, immutable`
- API routes: `no-cache, no-store, must-revalidate`
- Middleware-based cache optimization

## Notes

### Current Status
✅ Application is running successfully on Replit
✅ All dependencies installed
✅ Development server configured for port 5000
✅ Firebase fully configured and operational
✅ Paystack payment integration configured
✅ SendGrid email notifications configured
✅ Twilio WhatsApp/SMS integration configured
✅ All API secrets securely stored in Replit Secrets
✅ Custom LoadingScreen with Yoombaa logo and bouncing dots animation
✅ **Performance-optimized with Next.js best practices**
✅ **Loading states implemented with Suspense & skeleton loaders**
✅ **Image optimization with remotePatterns & format support**
✅ **Security headers & caching strategy configured**

### Configured Services
- **Firebase**: Authentication, Firestore database, Cloud Storage
- **Paystack**: Payment processing for subscriptions (test mode)
- **SendGrid**: Email notifications
- **Twilio**: WhatsApp and SMS notifications
- **Performance**: Next.js optimizations, code splitting, image optimization

### Performance Improvements
- **Faster loading times** with skeleton loaders and Suspense
- **Reduced bundle size** with code splitting and tree-shaking
- **Optimized images** with WebP/AVIF support
- **Smart caching** for static assets and API routes
- **Security headers** for safe content delivery
- **Accessibility** respecting motion preferences

### Demo Mode (if Firebase not configured)
The app includes graceful fallback when Firebase environment variables are not set:
- A demo mode banner appears to inform users
- Auth-dependent features show user-friendly error messages
- No runtime errors occur when Firebase is not configured

### Optional Integrations
- Paystack: Required only for premium subscription payments
- SendGrid: Required only for email notifications
- Twilio: Required only for WhatsApp/SMS notifications
- reCAPTCHA: Required only for form spam protection

## Support
For detailed setup instructions, see `README.md` and `IMPLEMENTATION_SUMMARY.md`
