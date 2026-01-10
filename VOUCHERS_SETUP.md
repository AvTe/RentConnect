# GiftPesa Voucher Integration

Complete digital voucher system for agent subscription rewards.

## ✅ Implementation Complete

### Files Created/Modified:

| File | Description |
|------|-------------|
| `supabase/migrations/add_giftpesa_vouchers.sql` | Database schema |
| `lib/vouchers.js` | Voucher functions & GiftPesa API |
| `components/AgentRewards.jsx` | Agent rewards dashboard |
| `components/admin/AdminVoucherManagement.jsx` | Admin voucher management |
| `components/SubscriptionModal.jsx` | Added voucher carousels |
| `components/AgentDashboard.jsx` | Added "Rewards" tab |
| `components/AdminDashboard.jsx` | Added "Vouchers" admin tab |
| `app/globals.css` | Added carousel animations |
| `.env.giftpesa.example` | Environment variables template |

---

## Environment Variables

Add to your `.env.local`:

```env
# GiftPesa API Configuration
NEXT_PUBLIC_GIFTPESA_API_URL=https://3api.giftpesa.com
GIFTPESA_API_KEY=ebb9e43c8b4f64880a1403d5
GIFTPESA_USERNAME=your_giftpesa_username
```

---

## Database Setup

Run the SQL migration in Supabase:

```sql
-- Go to SQL Editor in Supabase Dashboard
-- Paste contents of: supabase/migrations/add_giftpesa_vouchers.sql
-- Click Run
```

This creates:
- `voucher_pool` - Preloaded vouchers from GiftPesa
- `agent_vouchers` - Vouchers assigned to agents
- `voucher_activity_log` - Activity tracking
- Adds voucher columns to `subscription_plans`

---

## Features Implemented

### Agent Dashboard - Rewards Tab
- Beautiful ticket-style voucher cards
- Stats (Total, Active, Total Value)
- Filter by status (All, Active, Used, Expired)
- Copy voucher code functionality
- Detail modal with QR code support
- "How it Works" guide

### Admin Dashboard - Voucher Management
- Overview stats (Pool, Issued, Redeemed, Expired, Value)
- Searchable & filterable voucher table
- Add vouchers manually or via CSV import
- Pool status by plan tier
- Mark vouchers as redeemed
- Notification status tracking
- View which agent used which voucher, when, and value

### Subscription Popup - Voucher Carousels
- "🎁 Chance to Get Free Vouchers" section
- "Top Brand Vouchers" grid with brand logos
- Animated brand carousel in sidebar
- Top GiftPesa brands featured:
  - Naivas, Carrefour, Java House, KFC
  - Pizza Inn, Quickmart, Uber, Jumia
  - Glovo, Chicken Inn

---

## GiftPesa API Integration

### API Endpoint
```
https://3api.giftpesa.com
```

### Endpoints Used:
- `GET /merchants` - Get available merchants
- `POST /disburse` - Create voucher disbursement

### Disbursement Flow:
1. Agent completes premium subscription payment
2. Payment webhook calls `assignVoucherToAgent()`
3. System checks voucher pool first
4. If pool empty, calls GiftPesa Disburse API
5. Voucher stored in `agent_vouchers` table
6. Notifications sent (Email, SMS, WhatsApp)

---

## Usage Examples

### Assign Voucher (in payment webhook)

```javascript
import { assignVoucherToAgent } from '@/lib/vouchers';

// After successful payment:
const result = await assignVoucherToAgent(agentId, {
  planSlug: 'professional',
  subscriptionId: subscription.id
});

if (result.success && result.voucher) {
  console.log('Voucher assigned:', result.voucher.voucher_code);
}
```

### Get Agent's Vouchers

```javascript
import { getAgentVouchers } from '@/lib/vouchers';

const result = await getAgentVouchers(agentId);
// Returns array of vouchers with status, value, merchant, expiry
```

### Add Vouchers to Pool (Admin)

```javascript
import { addVouchersToPool } from '@/lib/vouchers';

await addVouchersToPool([
  {
    code: 'GIFT-2024-ABCD',
    value: 500,
    merchantName: 'Java House',
    expiresAt: '2024-12-31',
    planTier: 'premium'
  }
]);
```

### CSV Import Format

```csv
code,value,merchant,expires,tier
GIFT-001,500,Java House,2024-12-31,premium
GIFT-002,500,Java House,2024-12-31,premium
GIFT-003,1000,Naivas,2024-12-31,elite
```

---

## Subscription Plans with Vouchers

| Plan | Price | Voucher Reward |
|------|-------|----------------|
| Starter | KES 999 | ❌ None |
| Professional | KES 2,499 | KES 200 (Java House) |
| Business | KES 4,999 | KES 500 (Carrefour) |
| Enterprise | KES 9,999 | KES 1,000 (Naivas) |

---

## Top GiftPesa Brands

The following brands are featured in the subscription modal:

| Brand | Category |
|-------|----------|
| Naivas | Supermarkets |
| Carrefour | Supermarkets |
| Java House | Cafes |
| KFC | Restaurants |
| Pizza Inn | Restaurants |
| Quickmart | Supermarkets |
| Uber | Transport |
| Jumia | Shopping |
| Glovo | Delivery |
| Chicken Inn | Restaurants |

---

## Voucher Status Lifecycle

```
issued → viewed → redeemed
           ↓
        expired
```

---

## Admin Visibility

Admins can see:
- ✅ Which agent used which voucher
- ✅ Date & time of usage/issuance
- ✅ Voucher value/cost
- ✅ Voucher provider/brand (merchant)
- ✅ Current status (issued, viewed, redeemed, expired)
- ✅ Notification status (email, SMS, WhatsApp)

---

## Security

- Vouchers are uniquely mapped to agents
- Single-use, non-repeatable
- RLS policies protect data access
- Admin-only pool management
- Activity logging for audits

---

## Next Steps

1. **Run the database migration** in Supabase SQL Editor
2. **Add environment variables** to `.env.local`
3. **Add sample vouchers** via Admin Panel
4. **Integrate with payment webhook** to auto-assign vouchers
5. **Configure GiftPesa account** for API access
