# RentConnect AI Coding Instructions

## Project Overview
Next.js 14 rental marketplace (Kenya). Tenants post rental requests ("leads"); verified agents pay credits to unlock tenant contacts. Uses Supabase (PostgreSQL + Auth), Pesapal (M-Pesa), Africa's Talking SMS. **Currency: KES (Kenyan Shillings)**.

---

## Complete Application Flow

### System Architecture
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         app/page.js (SPA Controller)                    │
│                    useState('landing') → View Router                    │
├─────────────────────────────────────────────────────────────────────────┤
│  VIEWS: landing | login | tenant-form | agent-registration |            │
│         user-dashboard | agent-dashboard | admin-dashboard |            │
│         subscription | properties | agents-listing | agent-detail       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Tenant    │ │    Agent    │ │    Admin    │
            │  Dashboard  │ │  Dashboard  │ │  Dashboard  │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │      lib/database.js            │
                    │   (ALL DB operations here)      │
                    └─────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │    Supabase (PostgreSQL)        │
                    └─────────────────────────────────┘
```

---

## Feature Flows

### 1. TENANT FLOW: Post a Rental Request

```
LandingPage → "Find a Home" → TenantForm (multi-step wizard)
```

**Step-by-step:**
1. **Landing** (`components/LandingPage.jsx`): User clicks "Post Request" or searches
2. **Form Wizard** (`components/TenantForm.jsx`):
   - Step 1: Location selection (with geolocation)
   - Step 2: Property type (1BR, 2BR, Self Contain, etc.)
   - Step 3: Budget in KES
   - Step 4: Contact details + OTP verification via SMS
3. **Submit**: `handleTenantSubmit()` in `app/page.js` calls `createLead()` from `lib/database.js`
4. **Confirmation**: Email sent via `lib/notifications.js`, success animation with confetti

**Key files:**
- `components/TenantForm.jsx` - 6-step wizard with OTP
- `app/api/send-otp/route.js` - Triggers Africa's Talking SMS
- `app/api/verify-otp/route.js` - Validates OTP code

**Database:** Creates row in `leads` table with `requirements` JSONB

---

### 2. AGENT FLOW: Register & Get Verified

```
LandingPage → "I'm an Agent" → AgentRegistration → (Email Verify) → AgentDashboard
```

**Step-by-step:**
1. **Registration** (`components/AgentRegistration.jsx`):
   - Full name, email, password, phone
   - Agency name, location
   - ID document upload (stored in Supabase Storage)
   - Optional referral code
2. **Auth**: `signUpWithEmail()` from `lib/auth-supabase.js` → Supabase Auth
3. **Profile Creation**: `createUser()` with `role: 'agent'`, `verificationStatus: 'pending'`
4. **Verification**: Agent submits to Persona (`components/PersonaVerification.jsx`)
5. **Admin Approval**: Admin reviews in `components/admin/AgentManagement.jsx`

**Verification States:** `not_started` → `pending` → `verified` | `rejected`

---

### 3. AGENT FLOW: Buy Credits

```
AgentDashboard → "Buy Credits" → SubscriptionPage → Pesapal (M-Pesa) → IPN Webhook
```

**Step-by-step:**
1. **Select Package** (`components/SubscriptionPage.jsx`):
   - 5 credits / KSh 250
   - 15 credits / KSh 600 (popular)
   - 30 credits / KSh 1,000
   - 100 credits / KSh 2,500
2. **Initialize Payment**: `initializePayment()` from `lib/pesapal.js` → `/api/pesapal/initialize`
3. **Redirect**: User sent to Pesapal hosted page for M-Pesa/Card
4. **IPN Callback**: Pesapal calls `/api/pesapal/ipn` with payment status
5. **Fulfill**: `addAgentCredits()` updates `users.wallet_balance` + logs `credit_transactions`

**Payment Flow:**
```
Client                    API                      Pesapal
  │                        │                          │
  │─ initializePayment() ─▶│                          │
  │                        │─── POST /submitOrder ───▶│
  │                        │◀── redirect_url ─────────│
  │◀─ redirect to Pesapal ─│                          │
  │────────────────────────│───── User pays ─────────▶│
  │                        │◀── IPN callback ─────────│
  │                        │─ addAgentCredits() ──────│
  │◀── redirect /callback ─│                          │
```

---

### 4. AGENT FLOW: Unlock a Lead

```
AgentDashboard (Leads Tab) → Click "Unlock" → Deduct 1 Credit → Show Contact
```

**Step-by-step:**
1. **View Leads**: `AgentDashboard.jsx` fetches via `useLeads()` hook
2. **Check Balance**: `getWalletBalance()` called on mount
3. **Unlock**: `handleUnlockLead()` checks:
   - Is agent verified? (`verificationStatus === 'verified'`)
   - Has 1+ credit? (`walletBalance >= 1`)
4. **Process**: `unlockLead()` → `trackAgentLeadContact()` → `deductCredits()`
5. **Reveal**: Lead's phone/email shown, contact logged in `contact_history`

**Credit Deduction Flow:**
```javascript
// lib/database.js
unlockLead(agentId, leadId)
  → hasAgentContactedLead() // Check if already unlocked (free)
  → trackAgentLeadContact() // Deduct 1 credit, log contact
  → deductCredits(userId, 1, 'Lead Unlock')
```

---

### 5. TENANT FLOW: Dashboard & Requests

```
Login → UserDashboard → View My Requests / Browse Agents / Saved Properties
```

**Tabs in `components/UserDashboard.jsx`:**
| Tab | Description | Data Source |
|-----|-------------|-------------|
| Dashboard | Overview stats | `currentUser` |
| My Requests | Tenant's posted leads | `getAllLeads({ tenantId })` |
| Agents | Browse verified agents | `getAllAgents()` |
| Profile | Edit profile | `updateUser()` |

---

### 6. ADMIN FLOW: Manage Platform

```
Login (admin role) → AdminDashboard → Multiple Management Modules
```

**Admin modules in `components/admin/`:**
| Module | File | Purpose |
|--------|------|---------|
| Overview | `AdminOverview.jsx` | Stats dashboard |
| Agents | `AgentManagement.jsx` | Verify/suspend agents |
| Renters | `RenterManagement.jsx` | Manage tenants |
| Leads | `LeadManagement.jsx` | View all leads |
| Finance | `FinanceManagement.jsx` | Credit transactions |
| Subscriptions | `SubscriptionManagement.jsx` | Premium subscriptions |
| Admins | `AdminManagement.jsx` | Create sub-admins |
| External Leads | `ExternalLeadsManagement.jsx` | Zapier integrations |
| Settings | `Settings.jsx` | System config |

**Admin Hierarchy:**
```
super_admin (full access)
    └── main_admin (can create sub_admins)
            └── sub_admin (limited permissions)
```

---

## Critical Architecture Rules

### 1. Single-Page App - NO NEW ROUTES
`app/page.js` (680+ lines) is the **main application controller** using `useState('landing')` for view routing.

```javascript
// View routing in app/page.js renderView() switch:
case 'landing': return <LandingPage />
case 'login': return <Login />
case 'tenant-form': return <TenantForm />
case 'agent-registration': return <AgentRegistration />
case 'user-dashboard': return <UserDashboard />
case 'agent-dashboard': return <AgentDashboard />
case 'admin-dashboard': return <AdminDashboard />
case 'subscription': return <SubscriptionPage />
// ... etc
```

**To add new features:** Create component in `components/`, import and register in `app/page.js` switch statement. Never create new pages in `app/` directory.

### 2. Database Layer - SINGLE ENTRY POINT
**ALL database operations go through `lib/database.js` (4500+ lines).** Direct Supabase queries in components are prohibited.

```javascript
// REQUIRED return pattern:
{ success: boolean, data?: any, error?: string }

// Case transformation (automatic in lib/database.js):
// DB columns: snake_case → Component props: camelCase
// transformUserData(row)           // for reads
// transformUpdatesToSnakeCase(obj) // for writes
```

**Key exports from lib/database.js:**
```javascript
// Users
createUser, getUser, updateUser, getAllAgents, getPendingAgents

// Leads
createLead, getLead, getAllLeads, updateLead, subscribeToLeads

// Credits & Wallet
getWalletBalance, addCredits, deductCredits, addAgentCredits

// Lead Unlocking
unlockLead, getUnlockedLeads, hasAgentContactedLead, trackAgentLeadContact

// Subscriptions
createUserSubscription, getActiveSubscription, checkSubscriptionStatus

// Admin
approveAgent, rejectAgent, getDashboardStats
```

### 3. Supabase Client - ASYNC MATTERS
```javascript
// Browser (components):
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();  // sync

// Server (API routes):
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();  // ASYNC - uses cookies()
```

### 4. Hooks - PREVENT INFINITE LOOPS
```javascript
// Always pass enabled flag to prevent unauthorized API calls
const { leads, loading } = useLeads(filters, !!currentUser);

// REQUIRED: Memoize filter objects to prevent infinite re-renders
const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
```

---

## Adding Features

### New Database Function
1. Add function to `lib/database.js`
2. Use snake_case for DB columns, return camelCase to components
3. Always return `{ success, data?, error? }` pattern
4. Export from module

### New API Route
```javascript
// app/api/{feature}/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { someDbFunction } from '@/lib/database';  // Use database.js!

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const result = await someDbFunction(params);  // NOT direct Supabase query
  return NextResponse.json(result);
}
```

### Payment Routes - SPECIAL CASE
`app/api/pesapal/*` routes use direct `pg` pool for transaction safety:
```javascript
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
```

---

## Key Tables (see `supabase_complete_schema.sql`)
| Table | Purpose |
|-------|---------|
| `users` | All users. `role`: tenant/agent/admin/super_admin/main_admin/sub_admin |
| `leads` | Tenant rental requests with `requirements` JSONB, `budget` in KES |
| `properties` | Agent listings via `agent_id` FK |
| `contact_history` | Tracks which agents unlocked which leads |
| `credit_transactions` | Wallet audit trail (type: purchase/deduction/bonus) |
| `subscriptions` | Premium agent subscriptions |
| `pending_payments` | Pesapal payment records before fulfillment |

---

## User Roles & Routing
| Role | Dashboard View | Capabilities |
|------|----------------|--------------|
| `tenant` | `user-dashboard` | Post leads, browse agents, save properties |
| `agent` | `agent-dashboard` | Buy credits, unlock leads, list properties |
| `admin` | `admin-dashboard` | Limited admin access |
| `sub_admin` | `admin-dashboard` | Team-based permissions |
| `main_admin` | `admin-dashboard` | Can create sub_admins |
| `super_admin` | `admin-dashboard` | Full system access |

---

## Payments & Credits
- **Currency: KES (not cents)** - `SUBSCRIPTION_PLANS.PREMIUM.amount = 1500`
- Credit packages: 5/KSh250, 15/KSh600, 30/KSh1000, 100/KSh2500
- **1 credit = 1 lead unlock**
- Flow: `initializePayment()` → Pesapal redirect → IPN webhook `/api/pesapal/ipn`
- Pesapal config in `lib/pesapal.js` (sandbox vs production via `PESAPAL_ENV`)

---

## Messaging Services
- **SMS OTP**: Africa's Talking (`lib/africastalking.js`) - used for tenant phone verification
- **WhatsApp**: Twilio integration via `/api/whatsapp/send`
- **Email**: Supabase Auth handles auth emails; custom via `/api/send-email`
- **In-app**: Real-time via `subscribeToNotifications()` + `NotificationBell` component
- **AuthKey** (`lib/authkey.js`): DEPRECATED - stub exports only

---

## Commands
```bash
npm run dev   # Port 5000 (not 3000!)
npm run build
npm run lint
```

---

## File Reference
| Purpose | Location |
|---------|----------|
| App controller + view routing | `app/page.js` |
| ALL database operations | `lib/database.js` |
| Auth (signUp, signIn, signOut, OAuth) | `lib/auth-supabase.js` |
| React hooks (useLeads, useSubscription) | `lib/hooks.js` |
| Payment integration | `lib/pesapal.js` |
| SMS service (active) | `lib/africastalking.js` |
| DB schema | `supabase_complete_schema.sql` |
| Admin components (19) | `components/admin/*.jsx` |
| UI primitives | `components/ui/*.jsx` |
| Security headers | `middleware.js` |
| Image uploads | `lib/storage-supabase.js` |

---

## Common Gotchas
1. **Port**: Dev server runs on 5000, not 3000
2. **Auth redirect URLs**: Must include `/auth/callback` and `/auth/reset-password`
3. **Admin invite flow**: Uses `app/admin/accept-invite/` route (exception to SPA rule)
4. **Real-time subscriptions**: Use `subscribeToLeads()` from database.js, not raw Supabase
5. **Image uploads**: Use `lib/storage-supabase.js`, not direct Supabase storage calls
6. **Agent verification required**: Agents can't unlock leads until `verificationStatus === 'verified'`
7. **OTP via SMS**: Uses Africa's Talking, requires `AT_API_KEY` and `AT_USERNAME` env vars
