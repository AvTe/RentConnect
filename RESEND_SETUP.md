# Yoombaa - Resend Email Integration

## Overview

This document describes the Resend email integration for the Yoombaa platform. Resend is used for all transactional and notification emails, while Supabase Auth handles authentication-related emails (password reset, email verification, etc.).

---

## Configuration

### Environment Variables

Add the following to your `.env.local`:

```bash
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx

# Custom sender emails (optional - defaults to onboarding@resend.dev for testing)
RESEND_FROM_EMAIL=Yoombaa <noreply@yoombaa.com>
RESEND_SUPPORT_EMAIL=Yoombaa Support <support@yoombaa.com>
```

### Getting Your API Key

1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Copy the key and add it to your `.env.local`

### Domain Verification (Production)

For production, you need to verify your domain:

1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `yoombaa.com`)
3. Add the DNS records provided (TXT and MX records)
4. Wait for verification (usually takes a few minutes)
5. Update `RESEND_FROM_EMAIL` to use your verified domain

---

## Architecture

### Email Flow

```
User Action (e.g., lead unlock)
         ↓
Database Operation (database.js)
         ↓
Unified Notification Service (notification-service.js)
         ↓
    ┌────────────────────────────┐
    │                            │
    ↓                            ↓
In-App Notification        Email via Resend
(notifications table)      (resend-email.js)
```

### Files

| File | Purpose |
|------|---------|
| `lib/resend-email.js` | Email templates and send functions |
| `lib/notification-service.js` | Unified service (in-app + email) |
| `lib/notifications.js` | Legacy notifications (in-app only) |
| `app/api/email/send/route.js` | API endpoint for sending emails |
| `app/api/email/test/route.js` | Testing endpoint |

---

## Automatic Notifications

The following notifications are sent automatically:

### Agent Notifications

| Event | In-App | Email | Trigger |
|-------|--------|-------|---------|
| Welcome | ✅ | ✅ | Account creation |
| Verification Approved | ✅ | ✅ | Admin approves verification |
| Verification Rejected | ✅ | ✅ | Admin rejects verification |
| New Lead Available | ✅ | ✅ | New lead in agent's area |
| Lead Unlocked | ✅ | ✅ | Agent unlocks a lead |
| Credits Purchased | ✅ | ✅ | Successful payment |
| Low Credits Warning | ✅ | ✅ | Balance drops to 5 or below |

### Tenant Notifications

| Event | In-App | Email | Trigger |
|-------|--------|-------|---------|
| Welcome | ✅ | ✅ | Account/lead creation |
| Lead Submitted | ✅ | ✅ | Lead request submitted |
| Agent Interested | ✅ | ✅ | Agent unlocks their lead |

---

## Duplicate Prevention

The notification service includes built-in duplicate prevention:

- **1-minute window**: Prevents same notification from being sent twice within 60 seconds
- **Daily limit**: Low credits warning is sent max once per day
- **Hash-based detection**: Uses notification type + user ID + data hash

---

## API Usage

### Send Email via API

```javascript
// POST /api/email/send
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome_agent',
    to: 'agent@example.com',
    data: { name: 'John Doe' }
  })
});
```

### Available Email Types

| Type | Required Data |
|------|---------------|
| `welcome_agent` | `name` |
| `welcome_tenant` | `name` |
| `new_lead` | `agentName`, `leadData` (location, budget, bedrooms, propertyType, urgency) |
| `lead_unlocked` | `agentName`, `leadData`, `tenantContact` (name, phone, email) |
| `verification_approved` | `name` |
| `verification_rejected` | `name`, `reason` |
| `credits_purchased` | `name`, `credits`, `amount`, `newBalance` |
| `low_credits` | `name`, `balance` |
| `agent_interested` | `tenantName`, `agentName`, `agentPhone` |
| `custom` | `subject`, `content` |

### Direct Import

```javascript
import {
  sendWelcomeAgentEmail,
  sendNewLeadNotification,
  sendLeadUnlockedEmail
} from '@/lib/resend-email';

// Send welcome email
await sendWelcomeAgentEmail('agent@example.com', 'John Doe');

// Send new lead notification
await sendNewLeadNotification('agent@example.com', 'John', {
  location: 'Kilimani',
  budget: 50000,
  bedrooms: 2,
  propertyType: 'Apartment'
});
```

---

## Testing

### Test All Email Types

Visit the test endpoint:

```
GET /api/email/test?email=your@email.com&type=all
```

Test a specific type:

```
GET /api/email/test?email=your@email.com&type=welcome_agent
```

### Response Format

```json
{
  "success": true,
  "summary": {
    "total": 10,
    "successful": 10,
    "failed": 0,
    "testEmail": "your@email.com"
  },
  "results": [
    {
      "type": "welcome_agent",
      "success": true,
      "data": { "id": "email-id-from-resend" }
    }
  ]
}
```

---

## Email Templates

All emails use consistent Yoombaa branding:

- **Brand Color**: `#fe9200` (Orange)
- **Text Color**: `#18181b` (Dark gray)
- **Font**: DM Sans (with Arial fallback)
- **Layout**: Centered, max-width 520px
- **Footer**: © 2025 Yoombaa. All rights reserved.

### Template Structure

```html
┌─────────────────────────────┐
│          Yoombaa            │ ← Brand logo in #fe9200
├─────────────────────────────┤
│                             │
│     [Title]                 │
│                             │
│     [Body Content]          │
│                             │
│     ┌───────────────┐       │
│     │    Button     │       │ ← #fe9200 background
│     └───────────────┘       │
│                             │
│     [Footer text]           │
│                             │
├─────────────────────────────┤
│  © 2025 Yoombaa...          │
└─────────────────────────────┘
```

---

## Monitoring

### Resend Dashboard

View email delivery status at [resend.com/emails](https://resend.com/emails):

- **Delivered**: Email reached inbox
- **Bounced**: Invalid email address
- **Complained**: Marked as spam
- **Opened**: Email was opened (if tracking enabled)
- **Clicked**: Link in email was clicked

### Console Logs

All email sends are logged:

```
Email sent successfully: <resend-email-id>
```

Errors are logged with details:

```
Resend error: <error-message>
```

---

## Best Practices

1. **Always send both in-app and email**: Use `notification-service.js` functions
2. **Never duplicate manually**: The service handles duplicate prevention
3. **Test before production**: Use the test endpoint with your email
4. **Monitor deliverability**: Check Resend dashboard for bounce rates
5. **Verify domain**: Required for production to avoid spam filters

---

## Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set in `.env.local`
2. Verify API key is valid at resend.com
3. Check server logs for errors
4. Ensure email address is valid

### Emails Going to Spam

1. Verify your domain in Resend
2. Use consistent sender email
3. Avoid spam trigger words
4. Include unsubscribe link (for marketing emails)

### Rate Limiting

Resend has rate limits. If you hit them:

1. Batch similar notifications
2. Add delays between bulk sends
3. Upgrade Resend plan if needed

---

## Support

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Yoombaa Support**: support@yoombaa.com
