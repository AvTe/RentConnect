-- ============================================
-- REFERRAL SYSTEM - Complete Setup
-- Run this if referrals are not working
-- ============================================

-- Create referrals table if not exists
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits_awarded INTEGER DEFAULT 0,
    bonus_amount INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'expired')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referred_user_id)  -- Each user can only be referred once
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Enable RLS on referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "referrals_select_policy" ON referrals;
DROP POLICY IF EXISTS "referrals_insert_policy" ON referrals;
DROP POLICY IF EXISTS "referrals_all_policy" ON referrals;
DROP POLICY IF EXISTS "Referrers can view their referrals" ON referrals;
DROP POLICY IF EXISTS "Users can see referrals they are part of" ON referrals;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON referrals;

-- Create permissive RLS policies for referrals
-- Allow users to see referrals where they are the referrer
CREATE POLICY "referrals_select_own" ON referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

-- Allow insert for authenticated users (needed when processing referrals)
CREATE POLICY "referrals_insert_authenticated" ON referrals
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "referrals_service_role" ON referrals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure wallet_balance column exists on users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'wallet_balance') THEN
        ALTER TABLE users ADD COLUMN wallet_balance NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- Ensure referral_code column exists on users table  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(20);
    END IF;
END $$;

-- Create index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Grant permissions
GRANT SELECT, INSERT ON referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON referrals TO service_role;

-- ============================================
-- VERIFY THE SETUP
-- Run these queries to check if everything is set up correctly:
-- ============================================

-- Check if referrals table exists and has correct columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'referrals';

-- Check if wallet_balance column exists:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_balance';

-- Check if there are any referral records:
-- SELECT * FROM referrals ORDER BY created_at DESC LIMIT 10;

-- Check users with their referral codes:
-- SELECT id, name, referral_code, wallet_balance FROM users WHERE referral_code IS NOT NULL LIMIT 10;

COMMIT;

-- ============================================
-- SUCCESS! The referrals table is now set up correctly.
-- Try registering a new agent with a referral code.
-- ============================================
