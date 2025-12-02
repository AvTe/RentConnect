# Supabase Authentication Setup

## Overview
Configure Supabase Authentication to replace Firebase Auth with email/password and Google OAuth support.

## Setup Steps

### Step 1: Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Find **Email** provider
3. Ensure it's **Enabled** (should be enabled by default)
4. Configure settings:
   - ✅ **Enable email confirmations**: Toggle based on your needs
     - **Recommended for production**: ON (users verify email before access)
     - **For development**: OFF (skip email verification step)
   - ✅ **Enable email change confirmations**: ON
   - ✅ **Secure password change**: ON

### Step 2: Configure Google OAuth Provider

1. Go to **Authentication** → **Providers**
2. Find **Google** provider and click to expand
3. Toggle **Enable Google** to ON
4. You'll need Google OAuth credentials:

#### Get Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Configure:
   - **Name**: RentConnect
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://yydwhwkvrvgkqnmirbrr.supabase.co
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://yydwhwkvrvgkqnmirbrr.supabase.co/auth/v1/callback
     https://your-production-domain.com/auth/callback
     ```
7. Click **Create** and copy the **Client ID** and **Client Secret**

#### Configure in Supabase:
1. Back in Supabase **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)
3. Copy the **Callback URL** from Supabase (e.g., `https://yydwhwkvrvgkqnmirbrr.supabase.co/auth/v1/callback`)
4. Ensure this matches your Google OAuth redirect URIs
5. Click **Save**

### Step 3: Configure Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: 
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`
3. Add **Redirect URLs** (comma-separated):
   ```
   http://localhost:3000/**,
   https://yydwhwkvrvgkqnmirbrr.supabase.co/**,
   https://your-production-domain.com/**
   ```

### Step 4: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - **Confirm signup**: Welcome email with verification link
   - **Magic Link**: Passwordless login email
   - **Change Email Address**: Email change confirmation
   - **Reset Password**: Password reset link

**Variables available:**
- `{{ .ConfirmationURL }}` - Verification/action link
- `{{ .Token }}` - 6-digit OTP code
- `{{ .SiteURL }}` - Your site URL

### Step 5: Update Environment Variables

Add to your `.env.local`:
```env
# Supabase Auth (already added)
NEXT_PUBLIC_SUPABASE_URL=https://yydwhwkvrvgkqnmirbrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Authentication Flow Comparison

### Firebase vs Supabase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| Email/Password Signup | `createUserWithEmailAndPassword()` | `auth.signUp({ email, password })` |
| Email/Password Login | `signInWithEmailAndPassword()` | `auth.signInWithPassword({ email, password })` |
| Google OAuth | `signInWithPopup(googleProvider)` | `auth.signInWithOAuth({ provider: 'google' })` |
| Logout | `signOut()` | `auth.signOut()` |
| Current User | `onAuthStateChanged()` | `auth.onAuthStateChanged()` or `getSession()` |
| User Object | `user.uid`, `user.email` | `user.id`, `user.email` |

## Code Implementation

### New File: `lib/auth-supabase.js`

This file provides auth helper functions that match your existing Firebase Auth patterns:

```javascript
// Sign up new user
const result = await signUpWithEmail(email, password, name);

// Sign in existing user
const result = await signInWithEmail(email, password);

// Sign in with Google
const result = await signInWithGoogle();

// Sign out
await signOut();

// Get current session
const { user, session } = await getCurrentSession();
```

## Key Differences from Firebase

### 1. User ID Field
- Firebase: `user.uid`
- Supabase: `user.id`

**Migration Note**: When migrating data, you'll need to map Firebase `uid` → Supabase `id` (UUID format).

### 2. User Metadata
- Firebase: `user.displayName`, `user.photoURL`
- Supabase: `user.user_metadata.name`, `user.user_metadata.avatar_url`

### 3. Session Management
- Firebase: `onAuthStateChanged()` listener
- Supabase: Cookie-based sessions + `onAuthStateChange()` listener

### 4. OAuth Redirect
- Firebase: Popup-based (`signInWithPopup()`)
- Supabase: Redirect-based (`signInWithOAuth()` opens new window)

## Testing Checklist

After configuration, test these flows:

### Email/Password
- [ ] Sign up new user with email/password
- [ ] Email verification (if enabled)
- [ ] Sign in with email/password
- [ ] Password reset flow
- [ ] Sign out

### Google OAuth
- [ ] Click "Sign in with Google"
- [ ] Authorize app in Google consent screen
- [ ] Redirect back to app with authenticated session
- [ ] User profile data populated correctly
- [ ] Sign out

### Session Persistence
- [ ] Refresh page while logged in (session persists)
- [ ] Close and reopen browser (session persists)
- [ ] Sign out and verify session cleared

## Troubleshooting

### "Invalid login credentials" error
- Check email/password are correct
- Verify user exists in **Authentication** → **Users** table
- Check if email confirmation is required but not completed

### Google OAuth redirect error
- Verify redirect URIs match exactly in Google Console
- Check Site URL is configured correctly in Supabase
- Ensure Google OAuth is enabled in Supabase Providers

### Session not persisting
- Check cookies are enabled in browser
- Verify `utils/supabase/server.js` is using cookie storage
- Check middleware is configured correctly

### User metadata not saving
- Ensure you're updating `user_metadata` field
- Check RLS policies allow user profile updates
- Verify `users` table has corresponding fields

## Security Best Practices

1. ✅ **Enable email verification** in production
2. ✅ **Use HTTPS** for all redirect URLs
3. ✅ **Store secrets** in environment variables (never commit)
4. ✅ **Implement rate limiting** on auth endpoints
5. ✅ **Use strong password requirements** (8+ chars, mix of types)
6. ✅ **Enable 2FA** for admin accounts
7. ✅ **Monitor auth logs** in Supabase dashboard

## Next Steps

After authentication is configured:
1. ✅ Task 6 Complete: Authentication providers enabled
2. ➡️ Task 7 Next: Build `lib/database.js` (1846 lines - largest migration task)
3. ➡️ Task 8 Next: Update all components to use Supabase Auth

---

**Note**: Keep your Google OAuth credentials secure and never commit them to Git. Use environment variables for all sensitive keys.
