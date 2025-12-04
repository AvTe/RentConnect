# RentConnect AI Coding Instructions

## Project Overview
**RentConnect** is a Next.js 14 rental marketplace connecting tenants with verified agents in Kenya. Uses Supabase (PostgreSQL + Auth + Storage), Pesapal payments (M-Pesa), and multi-channel notifications. Currency: KES (Kenyan Shillings).

## Architecture

### Core Data Flow
All database operations go through `lib/database.js` (4500+ lines). Uses Supabase PostgreSQL with snake_case columns, but components expect camelCase - transformations handled via `transformUserData()` and `transformUpdatesToSnakeCase()`.

**Key Tables** (see `supabase_complete_schema.sql`):
- `users` - Dual roles: `role: 'tenant'|'agent'|'admin'|'super_admin'|'main_admin'|'sub_admin'`
- `leads` - Tenant rental requests; agents unlock with credits
- `properties` - Agent listings linked via `agent_id`
- `subscriptions` - Premium access tracked with `subscription_expires_at`
- `credit_transactions` - Wallet/credit audit trail

**Return Pattern**: All async database functions return `{ success: boolean, data?: any, error?: string }`.

### Supabase Integration
```
utils/supabase/client.js   → Browser client (createBrowserClient)
utils/supabase/server.js   → Server client with cookies (createServerClient)
lib/database.js            → All CRUD + real-time subscriptions
lib/auth-supabase.js       → signUpWithEmail, signInWithEmail, signOut, onAuthStateChange
lib/storage-supabase.js    → uploadImage(file, userId, folder) → path: {userId}/{folder}/{timestamp}-{filename}
```

### Hooks Pattern (`lib/hooks.js`)
```javascript
// Accept filters + enabled flag to control subscription
const { leads, loading, error } = useLeads(filters, enabled);
// Real-time subscriptions auto-cleanup on unmount
// Memoize filters with useMemo to prevent re-renders
```

### Payment (Pesapal + M-Pesa)
- Config in `lib/pesapal.js` - amounts in KES (not cents): `SUBSCRIPTION_PLANS.PREMIUM.amount = 1500`
- Credit packages: 5 credits = KSh 250, 15 = KSh 600, 30 = KSh 1,000
- Flow: `initializePayment()` → Pesapal redirect → IPN webhook at `/api/pesapal/callback`
- API routes use direct PostgreSQL (`pg` pool) for payment tracking

### Notifications (`lib/notifications.js`)
1. **Email**: POST `/api/send-email` (SendGrid)
2. **WhatsApp**: `sendWhatsAppMessage()` opens wa.me link; automated via `/api/whatsapp/send` (Twilio)
3. **In-App**: `createNotification()` in database, subscribed via `useNotifications()`

## Key Patterns

### API Route Structure
```javascript
// app/api/{feature}/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... logic
  return NextResponse.json({ success: true, data: result });
}
```

### Adding Database Features
1. Add function to `lib/database.js` with snake_case DB columns
2. Create hook in `lib/hooks.js` wrapping the function
3. Transform snake_case → camelCase for component consumption

### Component Organization
- `app/page.js` - Main router: handles auth state, view switching based on role
- `components/*.jsx` - Feature components receive data via props
- `components/admin/*.jsx` - Admin dashboard modules (19 components)
- `components/ui/*.jsx` - Shared UI primitives (Button, Badge, etc.)

## Environment Variables
```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://...  # For Pesapal API routes

# Payments
PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_IPN_ID

# Services
SENDGRID_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
NEXT_PUBLIC_RECAPTCHA_SITE_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

## Commands
```bash
npm run dev      # Starts on port 5000 (not 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## File Reference
| Purpose | Location |
|---------|----------|
| App entry + routing | `app/page.js` |
| All database CRUD | `lib/database.js` |
| Auth functions | `lib/auth-supabase.js` |
| Custom hooks | `lib/hooks.js` |
| Payment logic | `lib/pesapal.js` |
| DB schema | `supabase_complete_schema.sql` |
| API routes | `app/api/*/route.js` |
