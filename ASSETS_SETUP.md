# Agent Assets Storage Setup

This document explains how to set up the Supabase storage bucket for agent property assets.

## 1. Create Storage Bucket

Run this in your Supabase SQL Editor or Dashboard:

```sql
-- Create the storage bucket for agent assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-assets',
  'agent-assets',
  true, -- Public bucket for sharing
  52428800, -- 50 MB limit per file
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);
```

## 2. Set Up Storage Policies

Run these policies to control access:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Agents can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Agents can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Agents can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (for sharing)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-assets');
```

## 3. Run Database Migration

Execute the migration file located at:
`supabase/migrations/add_agent_assets.sql`

This creates the following tables:
- `agent_asset_folders` - Property folders
- `agent_assets` - Individual files
- `agent_storage_usage` - Storage tracking
- `asset_share_views` - View analytics

## 4. Features Overview

### Storage Limits
- Each agent starts with **50 MB** of storage
- Storage is automatically tracked on upload/delete

### Folder System
- Create folders for each property
- Add property name and location
- Upload multiple images, videos, documents

### Sharing
- Share individual files or entire folders
- Public links work without login
- Toggle sharing on/off anytime

### Asset Types Supported
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, WebM, MOV
- **Documents**: PDF, DOC, DOCX

## 5. API Endpoints

The asset functions are available in `/lib/assets.js`:

```javascript
// Storage Usage
getAgentStorageUsage(agentId)

// Folders
createAssetFolder(agentId, folderData)
getAgentFolders(agentId)
updateAssetFolder(folderId, updates)
deleteAssetFolder(agentId, folderId)
toggleFolderSharing(folderId, isShared)
getSharedFolder(shareToken)

// Assets
uploadAsset(agentId, folderId, file)
getAgentAssets(agentId, options)
getFolderAssets(folderId)
deleteAsset(agentId, assetId)
toggleAssetSharing(assetId, isShared)
getSharedAsset(shareToken)
```

## 6. Share URL Format

Shared content is accessible at:
- Folders: `/share/folder/{shareToken}`
- Assets: `/share/asset/{shareToken}`

## 7. Upgrading Storage

To increase an agent's storage limit, update the `storage_limit_bytes` in `agent_storage_usage`:

```sql
UPDATE agent_storage_usage
SET storage_limit_bytes = 104857600 -- 100 MB
WHERE agent_id = 'agent-uuid-here';
```
