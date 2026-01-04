-- ===========================================
-- Lead Lifecycle Management Migration
-- Add columns for lead lifecycle control
-- ===========================================

-- Add expires_at column to track when a lead should expire
-- This allows admins to set custom expiration times
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add is_hidden column to allow hiding leads without deleting
-- Hidden leads are not visible to agents but remain in the database
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add reactivated_at column to track when a lead was last reactivated
-- Useful for auditing and analytics
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ;

-- Create an index on is_hidden for faster filtering
CREATE INDEX IF NOT EXISTS idx_leads_is_hidden ON leads(is_hidden);

-- Create an index on expires_at for faster expiry queries
CREATE INDEX IF NOT EXISTS idx_leads_expires_at ON leads(expires_at);

-- Update existing leads to set expires_at based on created_at (48 hours)
-- Only for active leads that don't have an expires_at yet
UPDATE leads 
SET expires_at = created_at + INTERVAL '48 hours'
WHERE expires_at IS NULL 
AND status = 'active';

-- ============================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- ============================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run"
-- ============================================
