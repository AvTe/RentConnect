-- =====================================================
-- FIX: Update leads status check constraint
-- This allows the 'paused' status for tenant leads
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Remove the existing constraint (it might have a generic name or specifically leads_status_check)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Add the updated constraint including 'paused'
-- We include common statuses like 'active', 'paused', 'expired', 'closed'
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('active', 'paused', 'expired', 'closed'));

-- 3. Verify the change
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass AND conname = 'leads_status_check';

-- Confirmation message
SELECT 'Leads status constraint updated successfully! Tenants can now pause their leads.' as status;
