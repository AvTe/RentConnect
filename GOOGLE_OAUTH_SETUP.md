# Google OAuth Setup Guide for RentConnect

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Sign in with your Google account (kartikamit171@gmail.com)

### Step 2: Create a New Project (or Select Existing)
1. Click the project dropdown at the top
2. Click "NEW PROJECT"
3. Project Name: `RentConnect`
4. Click "CREATE"
5. Wait for project creation (few seconds)

### Step 3: Enable Google+ API
1. In the search bar, type: "Google+ API" or "Google Identity"
2. Click on "Google+ API" or "Google Identity Services"
3. Click "ENABLE"

### Step 4: Configure OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Select "External" (for testing with any Google account)
3. Click "CREATE"

**Fill in the following:**
- App name: `RentConnect`
- User support email: `kartikamit171@gmail.com`
- App logo: (Optional - skip for now)
- App domain: (Leave blank for development)
- Authorized domains: (Leave blank for now)
- Developer contact: `kartikamit171@gmail.com`
4. Click "SAVE AND CONTINUE"

**Scopes section:**
5. Click "ADD OR REMOVE SCOPES"
6. Select these scopes:
   - `userinfo.email` - See your primary Google Account email address
   - `userinfo.profile` - See your personal info, including any personal info you've made publicly available
7. Click "UPDATE"
8. Click "SAVE AND CONTINUE"

**Test users (for development):**
9. Click "ADD USERS"
10. Add your email: `kartikamit171@gmail.com`
11. Click "ADD"
12. Click "SAVE AND CONTINUE"

### Step 5: Create OAuth 2.0 Client ID
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS"
3. Select "OAuth client ID"
4. Application type: Select "Web application"
5. Name: `RentConnect Web Client`

**Authorized JavaScript origins:**
6. Click "+ ADD URI"
   - Add: `http://localhost:5000`
7. Click "+ ADD URI" again
   - Add: `http://localhost:3000` (backup)

**Authorized redirect URIs:**
8. Click "+ ADD URI"
   - Add: `http://localhost:5000/auth/callback`
9. Click "+ ADD URI"
   - Add: `https://yydwhwkvrvgkqnmirbrr.supabase.co/auth/v1/callback`

10. Click "CREATE"

### Step 6: Copy Your Credentials
**You'll see a popup with:**
- Client ID: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- Client secret: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**IMPORTANT:** Copy both values!

---

## Step 7: Configure Supabase

### 7.1: Add Google Provider to Supabase
1. Go to: https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/auth/providers
2. Find "Google" in the provider list
3. Click to expand it
4. Toggle "Enable" to ON

### 7.2: Enter Credentials
5. Paste your **Client ID** from Google Console
6. Paste your **Client Secret** from Google Console
7. Click "SAVE"

### 7.3: Configure Redirect URLs (Already done, but verify)
8. Go to: https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/auth/url-configuration
9. Verify these URLs are in "Redirect URLs":
   - `http://localhost:5000/**`
   - `http://localhost:5000/auth/callback`
10. Site URL should be: `http://localhost:5000`

---

## Step 8: Update Your .env.local File

Add these to your `.env.local`:

```env
# Google OAuth (Optional - only if you need server-side access)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

**Note:** For Supabase, you don't need these in .env.local as Supabase handles it!

---

## Step 9: Test Google Login

1. Restart your dev server: `npm run dev`
2. Go to: http://localhost:5000
3. Click "Login" or "Register"
4. Click the "Continue with Google" button
5. Select your Google account
6. Allow permissions
7. You should be redirected back and logged in!

---

## What Gets Stored Automatically

When a user logs in with Google, Supabase automatically stores:

✅ **Email**: user.email
✅ **Name**: user.user_metadata.name or user.user_metadata.full_name
✅ **Profile Image**: user.user_metadata.avatar_url or user.user_metadata.picture
✅ **Google ID**: user.user_metadata.sub

Your code in `app/page.js` already handles this:

```javascript
const userData = {
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0],
  avatar: user.user_metadata?.avatar_url,
  type: userType,
  phone: null,
  location: null
};
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that redirect URIs in Google Console match exactly
- Must include: `https://yydwhwkvrvgkqnmirbrr.supabase.co/auth/v1/callback`

### Error: "Access blocked: This app's request is invalid"
- Make sure OAuth consent screen is configured
- Add yourself as a test user

### Error: "Unauthorized client or scope"
- Enable Google+ API in Google Cloud Console
- Check that required scopes are added

### Profile image not showing
- Check browser console for image URL
- Verify `avatar_url` is being saved to database
- Image URL might be in `user.user_metadata.picture` instead

---

## Quick Copy-Paste URLs

**Google Cloud Console - Credentials:**
https://console.cloud.google.com/apis/credentials

**Supabase - Auth Providers:**
https://supabase.com/dashboard/project/yydwhwkvrvgkqnmirbrr/auth/providers

**Authorized redirect URI (for Google Console):**
```
https://yydwhwkvrvgkqnmirbrr.supabase.co/auth/v1/callback
```

---

## After Setup

Once configured, users can:
1. Click "Continue with Google"
2. Log in with their Google account
3. Profile automatically created with:
   - Name from Google
   - Email from Google
   - Profile picture from Google
4. Access their dashboard immediately!

---

**Need help?** If you encounter any issues during setup, let me know which step you're on!
