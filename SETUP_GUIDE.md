# RentConnect Setup Guide

This guide will help you complete the setup of your RentConnect application with all Firebase and payment integrations.

## Prerequisites

- Node.js 18+ installed
- Firebase account
- Paystack account (for Nigerian market)
- (Optional) SendGrid or similar email service
- (Optional) Twilio or WhatsApp Business API account

## Part 1: Firebase Setup

### Step 1: Firebase Project Configuration

The Firebase credentials are already configured in `.env.local`. Now you need to set up the Firebase Console:

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**: `rentconnect-ba93a`

### Step 2: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** sign-in
   - Add your domain to authorized domains
   - Set up OAuth consent screen

### Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Select **Start in production mode**
3. Choose your region (closest to Nigeria for best performance)
4. After creation, go to **Rules** tab
5. Copy the contents from `firestore.rules` and paste it there
6. Click **Publish**

### Step 4: Create Indexes

Create these composite indexes in Firestore:

```
Collection: leads
Fields: status (Ascending), createdAt (Descending)

Collection: properties
Fields: agentId (Ascending), createdAt (Descending)

Collection: subscriptions
Fields: agentId (Ascending), status (Ascending), createdAt (Descending)

Collection: contactHistory
Fields: userId (Ascending), createdAt (Descending)

Collection: notifications
Fields: userId (Ascending), read (Ascending), createdAt (Descending)
```

**To create indexes:**
1. Go to Firestore → Indexes
2. Click "Add Index"
3. Add each field with its sort order
4. Click "Create"

### Step 5: Enable Cloud Storage

1. Go to **Storage** → **Get Started**
2. Start in production mode
3. Go to **Rules** tab
4. Copy contents from `storage.rules` and paste
5. Click **Publish**

### Step 6: Enable Analytics (Optional)

1. Go to **Analytics** → **Enable Analytics**
2. Select analytics account or create new one
3. Click **Enable**

## Part 2: Paystack Setup

### Step 1: Create Paystack Account

1. Go to [Paystack](https://paystack.com/)
2. Sign up for an account
3. Complete KYC verification

### Step 2: Get API Keys

1. Go to **Settings** → **API Keys & Webhooks**
2. Copy your **Public Key** and **Secret Key**
3. Add to `.env.local`:

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Step 3: Set Up Webhooks

1. In Paystack Settings → **API Keys & Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/paystack/webhook`
3. Select events to listen to:
   - `charge.success`
   - `subscription.create`
   - `subscription.disable`

### Step 4: Test Payments

Use Paystack test cards:
- Success: `4084084084084081`
- Decline: `5060666666666666666`
- CVV: `408` | PIN: `0000`

## Part 3: Email Setup (Optional but Recommended)

### Option A: SendGrid

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key
3. Verify sender email
4. Add to `.env.local`:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

5. Install SendGrid package:
```bash
npm install @sendgrid/mail
```

### Option B: EmailJS (Easier but limited)

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create email service
3. Create email template
4. Add to `.env.local`:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxx
NEXT_PUBLIC_EMAILJS_USER_ID=user_xxxxxxxxxxxxx
```

## Part 4: WhatsApp Integration (Optional)

### Option A: WhatsApp Business API (Official)

1. Sign up for [WhatsApp Business API](https://business.whatsapp.com/products/business-api)
2. Get API credentials
3. Set up templates
4. Add credentials to `.env.local`

### Option B: Twilio WhatsApp

1. Sign up at [Twilio](https://www.twilio.com/)
2. Enable WhatsApp in Console
3. Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

4. Install Twilio:
```bash
npm install twilio
```

## Part 5: Create API Routes

Create the following directories and files:

### 1. Create directories:
```bash
mkdir app/api
mkdir app/api/send-email
mkdir app/api/paystack
mkdir app/api/paystack/webhook
mkdir app/api/whatsapp
mkdir app/api/whatsapp/send
```

### 2. Email API (`app/api/send-email/route.js`):
```javascript
import { NextResponse } from 'next/server';
const sgMail = require('@sendgrid/mail');

export async function POST(request) {
  try {
    const { to, subject, htmlContent } = await request.json();
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to,
      from: 'noreply@rentconnect.com',
      subject,
      html: htmlContent
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### 3. The Paystack webhook file already exists in `lib/paystack.js`

### 4. WhatsApp API (`app/api/whatsapp/send/route.js`):
```javascript
import { NextResponse } from 'next/server';
const twilio = require('twilio');

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();
    
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

## Part 6: Initial Data Population (Optional)

### Create sample leads:
```javascript
// Run this once to populate sample data
import { createLead } from './lib/firestore';

const sampleLeads = [
  {
    tenantId: 'sample',
    name: "John Doe",
    email: "john@example.com",
    phone: "2348012345678",
    whatsapp: "2348012345678",
    location: "Lekki, Lagos",
    type: "2 Bedroom",
    budget: "₦1,500,000"
  },
  // Add more...
];

sampleLeads.forEach(async (lead) => {
  await createLead(lead);
});
```

## Part 7: Testing

### 1. Test Authentication:
- Sign up with email/password
- Sign in with Google
- Test password reset

### 2. Test Tenant Flow:
- Post a rental request
- Check if it appears in Firestore
- Verify email notification (if configured)

### 3. Test Agent Flow:
- Register as agent
- View leads in dashboard
- Test subscription payment (use test card)
- After payment, verify premium status

### 4. Test Real-time Updates:
- Open two browser windows
- Post a lead in one
- See it appear immediately in agent dashboard in the other

### 5. Test Image Upload:
- Upload profile picture
- Check Firebase Storage
- Verify URL is saved in Firestore

## Part 8: Deployment

### Deploy to Vercel:

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Add environment variables
5. Deploy

### Add Environment Variables in Vercel:

Go to Project Settings → Environment Variables and add all from `.env.local`

### Update Paystack Webhook URL:

After deployment, update webhook URL in Paystack dashboard to your production URL.

## Part 9: Security Checklist

- [ ] Firestore rules are set correctly
- [ ] Storage rules are set correctly
- [ ] API keys are in environment variables (not in code)
- [ ] CORS is configured properly
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] Email domain is verified
- [ ] Paystack test mode is disabled for production

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"
**Solution**: Check Firestore rules and ensure user is authenticated

### Issue: "Storage upload failed"
**Solution**: Check Storage rules and file size/type validation

### Issue: "Payment webhook not working"
**Solution**: 
- Verify webhook URL is correct
- Check webhook secret matches
- Look at Paystack webhook logs

### Issue: "Emails not sending"
**Solution**:
- Verify SendGrid API key
- Check sender email is verified
- Look at SendGrid activity logs

### Issue: "Real-time updates not working"
**Solution**:
- Check Firestore indexes are created
- Verify subscription cleanup on unmount
- Check browser console for errors

## Support

For additional help:
- Firebase: [Firebase Documentation](https://firebase.google.com/docs)
- Paystack: [Paystack Documentation](https://paystack.com/docs)
- Next.js: [Next.js Documentation](https://nextjs.org/docs)

## Next Steps

After completing setup:
1. Populate with real property data
2. Test thoroughly with real users
3. Set up monitoring and analytics
4. Configure backups
5. Set up staging environment
6. Create admin panel
7. Add more features from roadmap

Good luck with your RentConnect platform! 🚀
