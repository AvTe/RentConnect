-- ============================================
-- RentConnect Supabase Storage Configuration
-- Image storage buckets and access policies
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Images bucket for property and profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,  -- Public access for images
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Documents bucket for private files (optional, for future use)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- Private access
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR 'images' BUCKET
-- ============================================

-- Allow anyone to view/download images (public bucket)
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- STORAGE POLICIES FOR 'documents' BUCKET
-- ============================================

-- Allow users to view only their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload documents to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- ADMIN STORAGE POLICIES
-- ============================================

-- Admins can manage all images
CREATE POLICY "Admins can manage all images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'images' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- PATH STRUCTURE DOCUMENTATION
-- ============================================

-- Images bucket path structure:
-- /images/{userId}/{timestamp}-{filename}
-- Example: /images/550e8400-e29b-41d4-a716-446655440000/1638316800000-property.jpg

-- Property images: /images/{agentId}/{timestamp}-property-{propertyId}.jpg
-- Profile avatars: /images/{userId}/{timestamp}-avatar.jpg
-- Lead attachments: /images/{userId}/{timestamp}-lead-{leadId}.jpg

-- Documents bucket path structure:
-- /documents/{userId}/{timestamp}-{filename}
-- Example: /documents/550e8400-e29b-41d4-a716-446655440000/1638316800000-contract.pdf
