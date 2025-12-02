# Supabase Storage Setup Instructions

## Overview
This document explains how to set up Supabase Storage buckets for RentConnect's image and document storage needs.

## Storage Structure

### Buckets
1. **images** (Public) - For property photos, profile avatars, lead attachments
2. **documents** (Private) - For contracts, verification documents (future use)

### Path Structure

#### Images Bucket
```
images/
├── {userId}/
│   ├── avatar/
│   │   └── {timestamp}-{filename}.jpg
│   ├── properties/
│   │   └── {propertyId}/
│   │       ├── {timestamp}-{filename}.jpg
│   │       └── {timestamp}-{filename}.jpg
│   └── leads/
│       └── {leadId}/
│           └── {timestamp}-{filename}.jpg
```

**Examples:**
- Profile avatar: `550e8400-e29b-41d4-a716-446655440000/avatar/1701446400000-profile.jpg`
- Property image: `550e8400-e29b-41d4-a716-446655440000/properties/abc123/1701446400000-bedroom.jpg`

## Setup Steps

### Step 1: Run Storage SQL Script
1. Go to your Supabase Dashboard: https://yydwhwkvrvgkqnmirbrr.supabase.co
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase_storage.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify Buckets Created
1. Navigate to **Storage** in the left sidebar
2. You should see two buckets:
   - ✅ **images** (Public)
   - ✅ **documents** (Private)

### Step 3: Check Bucket Configuration
Click on the **images** bucket and verify:
- **Public bucket**: Yes ✅
- **File size limit**: 5 MB
- **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp, image/gif

### Step 4: Review Storage Policies
1. Click on **images** bucket
2. Go to **Policies** tab
3. Verify these policies exist:
   - ✅ "Anyone can view images" (SELECT)
   - ✅ "Authenticated users can upload images" (INSERT)
   - ✅ "Users can update own images" (UPDATE)
   - ✅ "Users can delete own images" (DELETE)
   - ✅ "Admins can manage all images" (ALL)

## Storage API Usage

### New File: `lib/storage-supabase.js`
This file replaces `lib/storage.js` with Supabase-compatible functions:

```javascript
// Upload profile image
const result = await uploadProfileImage(userId, file);
// Returns: { success: true, url: 'https://...', path: '...' }

// Upload property images
const result = await uploadPropertyImages(agentId, propertyId, [file1, file2]);
// Returns: { success: true, urls: [...], count: 2, total: 2 }

// Delete image
const result = await deleteImage('userId/properties/propertyId/timestamp-image.jpg');
// Returns: { success: true }

// Get public URL
const url = getImageUrl('userId/avatar/timestamp-avatar.jpg');
// Returns: 'https://yydwhwkvrvgkqnmirbrr.supabase.co/storage/v1/object/public/images/...'
```

## Migration Notes

### Differences from Firebase Storage
| Feature | Firebase | Supabase |
|---------|----------|----------|
| Path Structure | `/images/{userId}/{timestamp}` | `{userId}/{folder}/{timestamp}` |
| Public Access | Per-file metadata | Bucket-level setting |
| URLs | `getDownloadURL()` | `getPublicUrl()` |
| Authentication | Firebase Auth | Supabase Auth |
| Policies | Storage Rules | RLS Policies |

### Key Changes
1. **Bucket prefix removed**: Firebase used `/images/`, Supabase bucket name is `images`
2. **User folder first**: Path starts with `userId` for RLS policy enforcement
3. **Subfolder support**: Added `properties/{propertyId}` for better organization
4. **Public URLs**: Instantly available via `getPublicUrl()`, no async call needed

## Security Features

### Row Level Security (RLS)
- Users can only upload/delete images in their own folder (`userId/`)
- Anyone can view images (public bucket)
- Admins can manage all images

### File Validation
- **Max size**: 5 MB per file
- **Allowed types**: JPEG, JPG, PNG, WebP, GIF
- **Naming**: Special characters sanitized to underscores

## Testing Checklist

After setup, test these scenarios:

- [ ] Upload profile avatar as authenticated user
- [ ] Upload property images with multiple files
- [ ] View uploaded images via public URL
- [ ] Delete own images
- [ ] Attempt to delete another user's images (should fail)
- [ ] Upload oversized file (should fail with error)
- [ ] Upload invalid file type (should fail with error)

## Troubleshooting

### "Bucket not found" error
- Verify SQL script ran successfully
- Check bucket exists in Storage dashboard
- Ensure bucket name is exactly `images` (lowercase)

### "Permission denied" error
- Check RLS policies are enabled
- Verify user is authenticated
- Ensure path starts with `userId`

### Images not loading
- Check bucket is set to **Public**
- Verify `getPublicUrl()` returns valid HTTPS URL
- Test URL directly in browser

## Next Steps

Once storage is set up:
1. ✅ Task 5 Complete: Storage buckets configured
2. ➡️ Task 6 Next: Configure Supabase Authentication (email + Google OAuth)
3. ➡️ Task 7 Next: Build `lib/database.js` to replace Firestore functions
