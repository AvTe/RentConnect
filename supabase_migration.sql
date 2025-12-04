-- ============================================
-- RENTCONNECT DATABASE MIGRATION
-- ============================================
-- This script adds missing columns and tables to an existing database
-- Safe to run multiple times
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO USERS TABLE
-- ============================================

-- Add agency_name
ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_name TEXT;

-- Add experience
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add bio
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add specialties
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;

-- Add license_number
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Add verification_status
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Add verified_at
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add rejection_reason
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add verification_data
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}'::jsonb;

-- Add status (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add suspension_reason
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Add suspended_at
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add city
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

-- Add wallet_balance (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0;

-- Add referral_code (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add referred_by (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add subscription_status (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Add subscription_expires_at (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add type column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'tenant';

-- ============================================
-- 2. UPDATE ROLE CONSTRAINT (if needed)
-- ============================================
-- First drop the old constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add updated constraint with all admin roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('tenant', 'agent', 'admin', 'super_admin', 'main_admin', 'sub_admin'));

-- ============================================
-- 3. ADD MISSING COLUMNS TO LEADS TABLE
-- ============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS additional_notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacts INTEGER DEFAULT 0;

-- ============================================
-- 4. CREATE INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- ============================================
-- 5. CREATE MISSING TABLES
-- ============================================

-- Credit Bundles Table
CREATE TABLE IF NOT EXISTS credit_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  per_lead TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Config Table
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  gateway TEXT NOT NULL,
  gateway_transaction_id TEXT,
  gateway_reference TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  purpose TEXT NOT NULL,
  purpose_id UUID,
  status TEXT DEFAULT 'pending',
  gateway_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Subscription Plans Table (if not exists)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  interval TEXT DEFAULT 'monthly',
  features JSONB DEFAULT '[]'::jsonb,
  lead_limit INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions Table (if not exists)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact History Table (if not exists)
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_type TEXT,
  cost_credits DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, lead_id, contact_type)
);

-- Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals Table (if not exists)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credits_awarded DECIMAL(10, 2) DEFAULT 5,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Properties Table (if not exists)
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Subscriptions Table - add plan_id if missing
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- ============================================
-- 6. INSERT DEFAULT DATA
-- ============================================

-- Default subscription plans
INSERT INTO subscription_plans (name, description, price, interval, features, sort_order) VALUES
  ('Basic', 'Perfect for getting started', 500, 'monthly', '["5 lead contacts per month", "Basic support", "Email notifications"]'::jsonb, 1),
  ('Premium', 'Most popular choice', 1500, 'monthly', '["Unlimited lead contacts", "Priority support", "WhatsApp notifications", "Featured agent badge"]'::jsonb, 2),
  ('Enterprise', 'For agencies and teams', 5000, 'monthly', '["Everything in Premium", "Multiple team members", "Custom branding", "API access", "Dedicated account manager"]'::jsonb, 3)
ON CONFLICT DO NOTHING;

-- Default credit bundles
INSERT INTO credit_bundles (name, credits, price, per_lead, features, popular, sort_order) VALUES
  ('Starter', 10, 500, 'KSh 50/lead', '["10 Lead Credits", "7-day validity", "Email support"]'::jsonb, FALSE, 1),
  ('Professional', 30, 1200, 'KSh 40/lead', '["30 Lead Credits", "30-day validity", "Priority support", "WhatsApp alerts"]'::jsonb, TRUE, 2),
  ('Business', 100, 3500, 'KSh 35/lead', '["100 Lead Credits", "90-day validity", "Dedicated support", "All notifications"]'::jsonb, FALSE, 3)
ON CONFLICT DO NOTHING;

-- Default system config
INSERT INTO system_config (key, value, description) VALUES
  ('credit_price', '"100"', 'Price per credit in KES'),
  ('free_credits', '"2"', 'Free credits given to new accounts'),
  ('referral_bonus', '"5"', 'Credits awarded for successful referral'),
  ('lead_unlock_cost', '"1"', 'Credits required to unlock a lead'),
  ('contact_costs', '{"phone": 3, "email": 2, "whatsapp": 2, "view": 1}', 'Credits for different contact types'),
  ('invite_expiry_hours', '"72"', 'Hours before admin invite expires')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE credit_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Service role full access to credit_bundles" ON credit_bundles;
CREATE POLICY "Service role full access to credit_bundles" ON credit_bundles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to support_tickets" ON support_tickets;
CREATE POLICY "Service role full access to support_tickets" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to system_config" ON system_config;
CREATE POLICY "Service role full access to system_config" ON system_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to payment_transactions" ON payment_transactions;
CREATE POLICY "Service role full access to payment_transactions" ON payment_transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SUCCESS
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration completed successfully!';
END $$;
