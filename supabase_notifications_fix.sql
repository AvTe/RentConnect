-- ============================================
-- NOTIFICATIONS TABLE TYPE CONSTRAINT FIX
-- ============================================
-- This migration fixes the notifications_type_check constraint
-- to allow all notification types used in the application.
-- 
-- Run this in your Supabase SQL Editor.
-- ============================================

-- Step 1: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Add updated constraint with all allowed notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    -- Agent-related notifications
    'new_lead',
    'lead_unlocked',
    'agent_contact',
    'agent_interested',
    'connection_request',
    'connection_accepted',
    'connection_rejected',
    
    -- Verification notifications
    'verification_approved',
    'verification_rejected',
    'verification_pending',
    
    -- Subscription/payment notifications
    'subscription_expiry',
    'subscription_renewed',
    'payment_received',
    'payment_failed',
    'credits_added',
    'credits_low',
    
    -- Inquiry notifications
    'new_inquiry',
    'inquiry_response',
    
    -- Support notifications
    'support',
    'support_response',
    'ticket_closed',
    
    -- General notifications
    'info',
    'warning',
    'success',
    'error',
    'system',
    'welcome',
    'reminder'
  ));

-- Step 3: Create an index on the type column if not exists
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Step 4: Verify the constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

