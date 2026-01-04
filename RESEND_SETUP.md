# Resend Email Service Setup Guide for Yoombaa

## ✅ Your Domain is Verified: yoombaa.com

Your Resend domain is verified and ready to send emails.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_YOUR_API_KEY_HERE
RESEND_FROM_EMAIL=Yoombaa <noreply@yoombaa.com>
RESEND_SUPPORT_EMAIL=Yoombaa Support <support@yoombaa.com>
```

### Getting Your API Key:
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it "Yoombaa Production"
4. Set permissions to "Sending access" → "Full access"
5. Copy the key (starts with `re_`)
6. Paste it in your `.env.local` file

## Available Email Types

The following email notifications are configured:

| Email Type | Trigger | Recipient |
|------------|---------|-----------|
| `welcome_agent` | Agent registration | New agent |
| `welcome_tenant` | Tenant submits lead | Tenant |
| `new_lead` | New lead created | Agents in area |
| `lead_unlocked` | Agent unlocks a lead | Agent |
| `verification_approved` | Admin approves agent | Agent |
| `verification_rejected` | Admin rejects agent | Agent |
| `credits_purchased` | Agent buys credits | Agent |
| `low_credits` | Agent balance low | Agent |
| `agent_interested` | Agent unlocks lead | Tenant |

## Testing the Email Service

### Test via API:
```bash
curl -X POST http://localhost:5000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome_agent",
    "to": "your-test-email@gmail.com",
    "data": { "name": "Test Agent" }
  }'
```

### Test via Browser Console:
```javascript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome_agent',
    to: 'your-test-email@gmail.com',
    data: { name: 'Test Agent' }
  })
}).then(r => r.json()).then(console.log)
```

## Email Templates Location

All email templates are in: `lib/resend-email.js`

To customize templates, edit the HTML in each template function:
- `welcomeAgentEmail()`
- `welcomeTenantEmail()`
- `newLeadNotificationEmail()`
- `leadUnlockedEmail()`
- `verificationApprovedEmail()`
- `verificationRejectedEmail()`
- `creditsPurchasedEmail()`
- `lowCreditsWarningEmail()`
- `agentInterestedEmail()`

## Notification Flow

1. **Action occurs** (e.g., lead unlocked)
2. **Notification service** (`lib/notification-service.js`) is called
3. **In-app notification** created in database
4. **Email sent** via `/api/email/send` endpoint
5. **Resend API** delivers the email from `noreply@yoombaa.com`

## Troubleshooting

### "RESEND_API_KEY is not configured"
- Make sure `RESEND_API_KEY` is set in `.env.local`
- Restart your dev server after changing env vars

### "Invalid From Address"
- Ensure your domain is verified in Resend dashboard
- Use the format: `Name <email@yoombaa.com>`

### Email not received
1. Check Resend dashboard for delivery logs
2. Check spam folder
3. Verify the `to` email address is correct
4. Check browser console for API errors

## Production Checklist

- [x] Domain verified in Resend (yoombaa.com)
- [ ] API key added to `.env.local`
- [ ] API key added to production environment (Vercel/etc)
- [ ] Test emails work in development
- [ ] Test emails work in production
