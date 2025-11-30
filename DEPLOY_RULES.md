# URGENT: Deploy Updated Firestore Rules

Your firestore.rules file has been updated to allow public read access to property leads.

## Updated Rules Change:

**BEFORE:**
```firestore
match /requests/{requestId} {
  allow read: if isAuthenticated();  // ❌ Only authenticated users
  allow create: if true;
  allow update, delete: if isAuthenticated();
}
```

**AFTER:**
```firestore
match /requests/{requestId} {
  allow read: if true;  // ✅ PUBLIC READ for carousel
  allow create: if true;
  allow update, delete: if isAuthenticated() && 
    resource.data.tenant_info.id == request.auth.uid;
}
```

## Steps to Deploy (Takes 30 seconds):

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to: **Firestore Database** → **Rules** tab
4. Copy the entire content from `./firestore.rules`
5. Paste it into the Firebase Console rules editor
6. Click **"Publish"**

## What This Fixes:

✅ Public users can now read property leads (carousel will display)
✅ Anyone can create a lead (tenant form)
✅ Only authenticated users can update/delete
✅ Carousel will show REAL data immediately after deployment

## Expected Result After Deploy:

The landing page carousel will show:
- Real property types from database
- Real locations
- Real budgets
- Real contact counts
- Real tenant information
