# RentConnect AI Coding Instructions

## Project Overview
**RentConnect** is a Next.js 14 rental marketplace connecting tenants with verified agents. It uses Supabase (PostgreSQL, Auth, Storage), Pesapal payments, and multi-channel notifications (Email, WhatsApp, In-App).

## Architecture Essentials

### Data Flow & Collections
Core data flows through PostgreSQL database with real-time listeners:
- **users**  Contains dual role data: `role: 'tenant'|'agent'`, `subscription_status`, `wallet_balance`, `referral_code`
- **leads**  Tenant rental requests; agents subscribe via `subscribeToLeads(filters)` for real-time updates
- **properties**  Agent listings; connected to users via `agent_id` foreign key
- **subscriptions**  Track premium access; webhook updates from Pesapal
- **contact_history**  Tracks every tenant-agent interaction for billing/metrics

**Key Pattern**: All async operations return `{ success: boolean, data?: any, error?: string }` object (see `lib/database.js`).

### Supabase Integration Points
- `utils/supabase/client.js`  Browser client initialization
- `utils/supabase/server.js`  Server-side client with cookies
- `lib/database.js`  2200+ lines of CRUD + real-time subscriptions
- `lib/auth-supabase.js`  Authentication functions (signup, signin, OAuth, password reset)
- `lib/storage-supabase.js`  Image uploads use `/{userId}/{folder}/{timestamp}` path pattern
- Real-time listeners in `lib/hooks.js` auto-unsubscribe on cleanup to prevent memory leaks

### Custom Hooks Architecture
Hooks in `lib/hooks.js` follow this pattern:
- Accept `filters` object + `enabled` boolean to control subscription
- Use `useCallback` for query keys to optimize re-renders
- Return `{ data, loading, error, [action functions] }`
- Example: `useLeads({ agentId, status }, enabled)` subscribes only if `enabled=true`

### Payment & Subscription
- **Paystack Integration** (`lib/paystack.js`):
  - `SUBSCRIPTION_PLANS.PREMIUM.amount = 1500000` (kobo = 15,000)
  - `initializePayment(email, amount, metadata)` returns auth URL; user redirected externally
  - Webhook at `/api/paystack/webhook` verifies signature with `PAYSTACK_SECRET_KEY`
  - Creates `subscriptions` doc with `expiresAt: serverTimestamp() + 30 days`
- Verify subscription status: `checkSubscriptionStatus(userId)` returns boolean

### Notification System
Multi-channel pattern in `lib/notifications.js`:
1. **Email**: POST to `/api/send-email` (SendGrid backend)
2. **WhatsApp**: `sendWhatsAppMessage(phoneNumber, text)` opens wa.me link; for automation, POST to `/api/whatsapp/send`
3. **In-App**: Create `notifications` collection docs; UI subscribes via `useNotifications()`

### Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY
SENDGRID_API_KEY (for email)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (for geocoding)
```

## Common Workflows

### Adding a Database Feature
1. Add function to `lib/firestore.js` following existing patterns
2. Create hook in `lib/hooks.js` that wraps the function + manages state
3. Use hook in component: `const { data, loading } = useLeads()`
4. Include `serverTimestamp()` for any date fields

### Creating an API Route
- Store in `app/api/{feature}/route.js`
- Use `NextResponse` from `next/server`
- Validate auth via Firebase token if needed (existing pattern in email/webhook routes)

### Handling Real-time Data
- Always unsubscribe in cleanup: `useEffect(() => { const unsub = onSnapshot(...); return unsub; }, [])`
- Filter at Firestore level (cheaper): `where('agentId', '==', userId)` not post-query filtering
- Pagination uses `limit()` + document snapshot cursors, not offset

## Code Patterns

### Error Handling
```javascript
// Always return structured response
try {
  // operation
  return { success: true, data: result };
} catch (error) {
  console.error('Context:', error);
  return { success: false, error: error.message };
}
```

### Image Uploads
```javascript
// Path: /images/{userId}/{timestamp}
// Use `uploadImage(file, userId)` from lib/storage.js
// Returns { success, url } where url is public download link
```

### Queries with Sorting
```javascript
// Example: get user''s leads ordered by date
const q = query(
  collection(db, ''leads''),
  where(''userId'', ''=='', userId),
  orderBy(''createdAt'', ''desc''),
  limit(10)
);
```

## Testing & Running

- **Dev**: `npm run dev`  http://localhost:3000
- **Build**: `npm run build` (check for Firebase config before deploying)
- **Linting**: `next lint`

## Key Files Reference
- **Entry**: `app/page.js` (contains auth state + page routing logic)
- **Business Logic**: `lib/firestore.js` (all data operations)
- **UI Components**: `components/*.jsx` (pure presentation, no API calls)
- **Hooks**: `lib/hooks.js` (state management + subscriptions)
- **API Routes**: `app/api/*/route.js` (webhooks, email, external integrations)
