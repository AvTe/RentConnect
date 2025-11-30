# RentConnect (Yoombaa) - Replit Project

## Overview
RentConnect (branded as Yoombaa) is a comprehensive rental property marketplace platform that connects tenants with verified real estate agents. The platform features real-time updates, payment integration via Pesapal (M-Pesa supported), and multi-channel notifications.

## Project Structure

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Frontend:** React 18, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage, Analytics), PostgreSQL (Payment tracking)
- **Payment:** Pesapal (M-Pesa, Airtel Money, Cards) - Kenyan Shillings (KES)
- **Notifications:** SendGrid (Email), Twilio (WhatsApp/SMS)

### Key Features
- Dual user system (Tenants and Agents)
- Real-time lead management
- Premium agent subscriptions (KSh 1,500/month)
- Property listings with image uploads
- Multi-channel notifications
- Admin dashboard for platform management
- **M-Pesa Express (STK Push) payment support**
- **Durable payment tracking with PostgreSQL**
- **Secure HMAC-signed payment metadata**
- **IPN-driven payment fulfillment (server-side)**

## Recent Changes (Secure Pesapal Integration - November 30, 2025)

### Complete Payment Architecture Overhaul
- **PostgreSQL Integration:** Added durable payment tracking with `pending_payments` table
- **HMAC Signature Security:** Payment metadata is cryptographically signed to prevent tampering
- **Three-Phase Payment Status:** Payments move through `pending` → `completed` → `fulfilled` states
- **Server-Side Fulfillment:** IPN handler can fulfill subscriptions/credits directly with Firebase Admin SDK
- **Idempotent Processing:** Duplicate IPN/callback calls are safely handled

### Payment Flow Architecture
1. **Initialize:** Store metadata + HMAC signature in PostgreSQL → Submit to Pesapal → Store tracking ID
2. **IPN Handler:** Verify with Pesapal → Mark payment 'completed' → Attempt server-side fulfillment
3. **Callback Page:** Verify payment → Check if already fulfilled → Complete fulfillment if needed
4. **Reconciliation:** Admin endpoint for viewing/processing pending payments

### Security Features
- HMAC-SHA256 signed metadata (using Pesapal consumer secret)
- Server-side signature verification before fulfillment
- Amount verification against Pesapal response
- Durable idempotency via PostgreSQL status tracking

### Files Created/Updated for Secure Pesapal Integration
- `lib/pesapal.js` - Added HMAC signing functions
- `lib/firebase-admin.js` - Firebase Admin SDK for server-side Firestore operations
- `app/api/pesapal/initialize/route.js` - Stores payment in PostgreSQL, signs metadata
- `app/api/pesapal/ipn/route.js` - Server-side fulfillment with Firebase Admin
- `app/api/pesapal/process-payment/route.js` - Secure payment verification endpoint
- `app/api/admin/reconcile-payments/route.js` - Admin payment reconciliation endpoint
- `app/payment/callback/page.js` - Updated to use process-payment API

### PostgreSQL Schema
```sql
CREATE TABLE pending_payments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  order_tracking_id VARCHAR(100),
  metadata JSONB NOT NULL,
  signature VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  fulfillment_receipt JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  fulfilled_at TIMESTAMP,
  pesapal_status JSONB
);
```

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

### Firebase Admin (Optional but Recommended for IPN Fulfillment)
For automatic server-side subscription/credit fulfillment via IPN, add:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" to download JSON
3. Copy the entire JSON content and add as environment variable:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Note:** Without Firebase Admin credentials, payment fulfillment will only work when users return to the callback page. With credentials, IPN can fulfill payments automatically even if users don't return.

### Pesapal Payment Integration (Required for subscriptions)
Register at https://www.pesapal.com/business to get credentials:
```
PESAPAL_CONSUMER_KEY=your_consumer_key
PESAPAL_CONSUMER_SECRET=your_consumer_secret
PESAPAL_IPN_ID=your_registered_ipn_id
PESAPAL_ENV=sandbox  # Use 'production' for live payments
NEXT_PUBLIC_APP_URL=https://your-app-url.replit.app
```

### Pesapal Setup Steps
1. Register a merchant account at pesapal.com/business
2. Get Consumer Key and Consumer Secret from dashboard
3. Register your IPN URL using the `/api/pesapal/register-ipn` endpoint
4. Store the returned `ipn_id` as `PESAPAL_IPN_ID` environment variable
5. Test with sandbox credentials before going live

### Admin API (Optional - for payment reconciliation)
```
ADMIN_API_KEY=your_secure_random_string
```

### PostgreSQL Database (Auto-configured)
The Replit PostgreSQL database is automatically configured with:
```
DATABASE_URL=postgresql://...
PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
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
5. PostgreSQL tables are auto-created on first use

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

**Important:** 
- Set `PESAPAL_ENV=production` for live payments
- Add `FIREBASE_SERVICE_ACCOUNT` for server-side fulfillment
- PostgreSQL DATABASE_URL is automatically configured

## Project Architecture

### Directory Structure
```
├── app/
│   ├── api/
│   │   ├── admin/           # Admin endpoints (reconciliation)
│   │   └── pesapal/         # Pesapal payment endpoints
│   │       ├── auth/        # Token authentication
│   │       ├── initialize/  # Payment initialization
│   │       ├── verify/      # Payment verification
│   │       ├── ipn/         # IPN webhook handler
│   │       ├── process-payment/ # Secure payment processing
│   │       └── register-ipn/ # IPN URL registration
│   ├── payment/             # Payment callback pages
│   ├── loading.js           # Root loading state
│   ├── page.js              # Main application controller
│   ├── layout.js            # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── admin/               # Admin dashboard components
│   ├── ui/                  # Reusable UI components
│   └── [features]           # Feature-specific components
├── lib/
│   ├── firebase.js          # Firebase client initialization
│   ├── firebase-admin.js    # Firebase Admin SDK for server
│   ├── firestore.js         # Database operations
│   ├── storage.js           # File upload utilities
│   ├── pesapal.js           # Pesapal integration + HMAC signing
│   ├── notifications.js     # Email/WhatsApp utilities
│   ├── hooks.js             # Custom React hooks
│   └── performance.js       # Performance utilities
├── middleware.js            # Performance & security middleware
├── public/                  # Static assets
└── next.config.js           # Next.js config
```

### Key Files
- `app/page.js` - Main app controller with routing logic
- `lib/pesapal.js` - Pesapal API integration with HMAC signing
- `lib/firebase-admin.js` - Server-side Firebase operations
- `app/api/pesapal/ipn/route.js` - IPN handler with server fulfillment
- `app/api/pesapal/process-payment/route.js` - Secure payment verification

## Notes

### Current Status
✅ Application is running successfully on Replit
✅ All dependencies installed (firebase-admin, pg included)
✅ Development server configured for port 5000
✅ Firebase client SDK fully operational
✅ **Pesapal payment integration with security hardening**
✅ **PostgreSQL payment tracking configured**
✅ SendGrid email notifications configured
✅ Twilio WhatsApp/SMS integration configured
✅ All API secrets securely stored in Replit Secrets

### Payment Security Features
- **HMAC Signatures:** Prevents metadata tampering
- **Server-Side Verification:** Validates payments with Pesapal API
- **Amount Validation:** Ensures payment amount matches expected
- **Idempotency:** Safe handling of duplicate IPN/callback calls
- **Audit Trail:** Full payment history in PostgreSQL

### Configured Services
- **Firebase**: Authentication, Firestore database, Cloud Storage
- **PostgreSQL**: Payment tracking and audit logs
- **Pesapal**: Payment processing with M-Pesa Express (STK Push)
- **SendGrid**: Email notifications
- **Twilio**: WhatsApp and SMS notifications

### Demo Mode (if Firebase not configured)
The app includes graceful fallback when Firebase environment variables are not set:
- A demo mode banner appears to inform users
- Auth-dependent features show user-friendly error messages
- No runtime errors occur when Firebase is not configured

### Optional Integrations
- Pesapal: Required for M-Pesa and card payments
- Firebase Admin: Recommended for automatic IPN fulfillment
- SendGrid: Required only for email notifications
- Twilio: Required only for WhatsApp/SMS notifications
- reCAPTCHA: Required only for form spam protection

## Support
For detailed setup instructions, see `README.md` and `IMPLEMENTATION_SUMMARY.md`
