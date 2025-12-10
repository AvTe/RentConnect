# RentConnect AI Coding Instructions

## Project Overview
Next.js 14 rental marketplace (Kenya). Tenants post rental requests ("leads"); verified agents pay credits to unlock tenant contacts. Uses Supabase (PostgreSQL + Auth), Pesapal (M-Pesa), Twilio WhatsApp. **Currency: KES (Kenyan Shillings)**.

## Critical Architecture Decisions

### Single-Page App Pattern
`app/page.js` is the **main application controller** - a 680-line client component managing all view routing via `useState('landing')`. Views switch based on `currentUser.role`:
- `tenant` → `user-dashboard`
- `agent` → `agent-dashboard`  
- `admin|super_admin|main_admin|sub_admin` → `admin-dashboard`

**Don't create new pages in `app/`** - add components to `components/` and register them in `app/page.js`.

### Database Layer (`lib/database.js`)
**ALL database operations go through this 4500+ line file.** Direct Supabase queries in components are prohibited.

```javascript
// REQUIRED return pattern for ALL functions:
{ success: boolean, data?: any, error?: string }

// snake_case in DB ↔ camelCase in components
// Use transformUserData() for reads, transformUpdatesToSnakeCase() for writes
```

Key exports: `createUser`, `getUser`, `updateUser`, `createLead`, `getAllLeads`, `getWalletBalance`, `deductCredits`, `unlockLead`, `createNotification`, `subscribeToLeads`

### Supabase Client Usage
```javascript
// Browser (components, client-side):
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();

// Server (API routes, middleware):
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient(); // Note: async!
```

### Hooks Pattern (`lib/hooks.js`)
```javascript
// Always pass enabled flag to prevent unauthorized API calls
const { leads, loading } = useLeads(filters, !!currentUser);
// Memoize filters to prevent infinite re-renders
const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
```

## Adding Features

### New Database Function
1. Add to `lib/database.js` using snake_case for DB columns
2. Return `{ success, data?, error? }` pattern
3. Transform snake_case → camelCase before returning

### New API Route
```javascript
// app/api/{feature}/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Use lib/database.js functions, not direct queries
  return NextResponse.json({ success: true, data: result });
}
```

### Payment Routes Exception
`app/api/pesapal/*` routes use direct `pg` pool (not Supabase client) for transaction safety:
```javascript
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
```

## Key Tables (see `supabase_complete_schema.sql`)
| Table | Purpose |
|-------|---------|
| `users` | All users. `role`: tenant/agent/admin/super_admin/main_admin/sub_admin |
| `leads` | Tenant rental requests with `requirements` JSONB |
| `properties` | Agent listings via `agent_id` FK |
| `unlocked_leads` | Junction table: which agents unlocked which leads |
| `credit_transactions` | Wallet audit trail |
| `subscriptions` | Premium agent subscriptions |

## Payments & Credits
- Amounts in **KES (not cents)**: `SUBSCRIPTION_PLANS.PREMIUM.amount = 1500`
- Credit packages: 5/KSh250, 15/KSh600, 30/KSh1000
- Flow: `initializePayment()` → Pesapal redirect → IPN webhook `/api/pesapal/ipn`

## Commands
```bash
npm run dev   # Port 5000 (not 3000!)
npm run build
npm run lint
```

## File Reference
| Purpose | Location |
|---------|----------|
| App controller + view routing | `app/page.js` |
| ALL database operations | `lib/database.js` |
| Auth (signUp, signIn, signOut) | `lib/auth-supabase.js` |
| React hooks | `lib/hooks.js` |
| Payment config | `lib/pesapal.js` |
| DB schema | `supabase_complete_schema.sql` |
| Admin components (19) | `components/admin/*.jsx` |
| UI primitives | `components/ui/*.jsx` |
