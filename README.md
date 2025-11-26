# RentConnect Platform

RentConnect is a comprehensive rental property marketplace that connects tenants directly with verified real estate agents, featuring real-time updates, payment integration, and multi-channel notifications.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Firebase (Authentication, Firestore, Storage, Analytics)
- **Payment:** Paystack
- **Language:** JavaScript

## Features

### Core Functionality

#### 1. **Dual User System**
- **Tenants**: Post rental requirements, search properties, save favorites
- **Agents**: View leads, manage property listings, premium subscription access

#### 2. **Firebase Integration**
- **Authentication**: Email/Password + Google OAuth
- **Firestore Database**: Real-time data synchronization
- **Cloud Storage**: Image uploads for profiles and properties
- **Analytics**: User behavior tracking

#### 3. **Real-time Features**
- Live lead updates for agents
- Instant notifications for new leads
- Real-time subscription status updates
- Contact history tracking

#### 4. **Payment Integration**
- **Paystack** payment gateway
- Premium subscription (₦15,000/month)
- Secure payment processing
- Automated subscription management

#### 5. **Notification System**
- **Email Notifications**: Lead confirmations, subscription updates
- **WhatsApp Integration**: Direct tenant-agent communication
- **In-App Notifications**: Real-time alerts and updates

#### 6. **Image Management**
- Profile picture uploads
- Property image galleries
- Automatic image compression
- Cloud storage with Firebase Storage

#### 7. **Search & Filter**
- Location-based search
- Property type filtering
- Price range selection
- Advanced search parameters

## Project Structure

```
RentConnect/
├── app/
│   ├── page.js                 # Main application controller
│   ├── layout.js               # Root layout
│   ├── globals.css             # Global styles
│   └── api/                    # API routes (to be created)
│       ├── send-email/
│       ├── paystack/webhook/
│       └── whatsapp/send/
├── components/
│   ├── LandingPage.jsx         # Marketing homepage
│   ├── TenantForm.jsx          # Tenant request form
│   ├── AgentDashboard.jsx      # Agent interface
│   ├── AgentProfile.jsx        # Agent profile editor
│   ├── UserDashboard.jsx       # Tenant dashboard
│   ├── UserProfile.jsx         # Tenant profile editor
│   ├── Login.jsx               # Authentication
│   ├── SubscriptionPage.jsx   # Premium subscription
│   ├── AgentRegistration.jsx  # Agent onboarding
│   ├── SearchFilter.jsx        # Property search
│   ├── Header.jsx              # Navigation header
│   └── ui/                     # UI primitives
│       ├── Button.jsx
│       └── Badge.jsx
├── lib/
│   ├── firebase.js             # Firebase configuration
│   ├── firestore.js            # Database operations
│   ├── storage.js              # Image upload functions
│   ├── paystack.js             # Payment integration
│   ├── notifications.js        # Notification system
│   └── hooks.js                # Custom React hooks
└── .env.local                  # Environment variables
```

## Database Schema

### Collections

#### `users`
```javascript
{
  uid: string,
  email: string,
  name: string,
  type: 'tenant' | 'agent',
  phone: string?,
  location: string?,
  avatar: string?,
  // Agent-specific
  agencyName: string?,
  experience: string?,
  isPremium: boolean,
  subscriptionEndDate: Timestamp?,
  // Tenant-specific
  savedProperties: array<string>,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `leads`
```javascript
{
  id: string,
  tenantId: string,
  name: string,
  email: string,
  phone: string,
  whatsapp: string,
  location: string,
  type: string,
  budget: string,
  status: 'active' | 'contacted' | 'closed',
  views: number,
  contacts: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `properties`
```javascript
{
  id: string,
  agentId: string,
  title: string,
  description: string,
  location: string,
  type: string,
  price: number,
  images: array<string>,
  amenities: array<string>,
  status: 'active' | 'pending' | 'rented',
  views: number,
  inquiries: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `subscriptions`
```javascript
{
  id: string,
  agentId: string,
  plan: 'premium',
  status: 'active' | 'expired' | 'cancelled',
  amount: number,
  currency: 'NGN',
  reference: string,
  startDate: Timestamp,
  endDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `contactHistory`
```javascript
{
  id: string,
  userId: string,
  propertyId: string?,
  leadId: string?,
  agentName: string,
  contactMode: 'whatsapp' | 'call' | 'form',
  createdAt: Timestamp
}
```

#### `notifications`
```javascript
{
  id: string,
  userId: string,
  type: 'new_lead' | 'agent_contact' | 'subscription_expiry',
  title: string,
  message: string,
  data: object,
  read: boolean,
  createdAt: Timestamp,
  readAt: Timestamp?
}
```

## Getting Started

### 1. Install dependencies:
```bash
npm install
```

### 2. Environment Setup:

The `.env.local` file is already configured with Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### 3. Run the development server:
```bash
npm run dev
```

### 4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Features Implementation

### 1. Real-time Lead Updates
```javascript
import { useLeads } from '@/lib/hooks';

function AgentDashboard() {
  const { leads, loading } = useLeads();
  // Automatically updates when new leads are posted
}
```

### 2. Image Upload
```javascript
import { uploadProfileImage } from '@/lib/storage';

const handleUpload = async (file) => {
  const result = await uploadProfileImage(userId, file);
  if (result.success) {
    // Update user profile with new image URL
  }
};
```

### 3. Payment Processing
```javascript
import { initializePayment } from '@/lib/paystack';

const handleSubscribe = async () => {
  const result = await initializePayment(email, amount, metadata);
  window.location.href = result.authorizationUrl;
};
```

### 4. Notifications
```javascript
import { sendWhatsAppMessage } from '@/lib/notifications';

const contactTenant = () => {
  sendWhatsAppMessage(phoneNumber, message);
};
```

## Custom Hooks

### `useLeads(filters)`
Real-time lead subscription with optional filtering.

### `useAgentProperties(agentId)`
Fetch all properties for a specific agent.

### `useSubscription(agentId)`
Check and monitor agent subscription status.

### `useSavedProperties(userId)`
Manage tenant's saved properties.

### `useNotifications(userId)`
Real-time notification updates.

## API Routes (To Be Created)

### `/api/send-email`
Handles email notifications via SendGrid or similar service.

### `/api/paystack/webhook`
Processes Paystack payment webhooks for subscription activation.

### `/api/whatsapp/send`
Sends automated WhatsApp messages via WhatsApp Business API.

## Deployment

### Firebase Setup:
1. Create a Firebase project
2. Enable Authentication (Email/Password + Google)
3. Create Firestore database
4. Enable Storage
5. Set up security rules

### Paystack Setup:
1. Create Paystack account
2. Get API keys (public and secret)
3. Add webhook URL for payment confirmations
4. Test with test keys before going live

### Environment Variables:
Add these to your production environment:
- Firebase credentials (already set)
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `SENDGRID_API_KEY` (for emails)
- `TWILIO_ACCOUNT_SID` (for WhatsApp)
- `TWILIO_AUTH_TOKEN`

## Security Considerations

1. **Firestore Rules**: Implement proper security rules
2. **API Keys**: Never expose secret keys on client side
3. **Input Validation**: Validate all user inputs
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Image Validation**: Check file types and sizes before upload

## Future Enhancements

- [ ] Admin dashboard
- [ ] Property verification system
- [ ] Agent ratings and reviews
- [ ] Advanced property filters
- [ ] Map integration for property locations
- [ ] Chat system between tenants and agents
- [ ] SMS notifications
- [ ] Email marketing campaigns
- [ ] Analytics dashboard for agents
- [ ] Mobile app (React Native)

## Support

For issues or questions, contact: support@rentconnect.com

## License

Proprietary - All rights reserved
