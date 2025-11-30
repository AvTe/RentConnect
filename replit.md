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

## Recent Changes (Replit Setup)

### Date: November 30, 2024
- **Created** `next.config.js` for Next.js configuration
- **Updated** `package.json` scripts to bind to `0.0.0.0:5000` for Replit compatibility
- **Configured** development workflow to run on port 5000
- **Installed** all npm dependencies
- **Added** Firebase graceful initialization with `isFirebaseReady` flag
- **Configured** all environment variables (Firebase, Paystack, SendGrid, Twilio)
- **Set up** all API secrets securely in Replit Secrets

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
Modify this in `app/page.js` lines 45 and 109 if needed.

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

## Project Architecture

### Directory Structure
```
├── app/
│   ├── api/              # API routes (email, payments, SMS)
│   ├── page.js           # Main application controller
│   ├── layout.js         # Root layout with metadata
│   └── globals.css       # Global styles
├── components/
│   ├── admin/            # Admin dashboard components
│   ├── ui/               # Reusable UI components
│   └── [features]        # Feature-specific components
├── lib/
│   ├── firebase.js       # Firebase initialization
│   ├── firestore.js      # Database operations
│   ├── storage.js        # File upload utilities
│   ├── paystack.js       # Payment integration
│   ├── notifications.js  # Email/WhatsApp utilities
│   └── hooks.js          # Custom React hooks
└── public/               # Static assets
```

### Key Files
- `app/page.js` - Main app controller with routing logic
- `lib/firestore.js` - All database CRUD operations
- `lib/hooks.js` - Real-time data hooks (useLeads, useSubscription, etc.)

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

### Configured Services
- **Firebase**: Authentication, Firestore database, Cloud Storage
- **Paystack**: Payment processing for subscriptions (test mode)
- **SendGrid**: Email notifications
- **Twilio**: WhatsApp and SMS notifications

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
