-- ============================================
-- RENTCONNECT COMPLETE DATABASE SCHEMA
-- ============================================
-- This schema covers ALL tables needed by the application
-- Run this in Supabase SQL Editor for complete setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (CORE)
-- Used by: All components, auth, agents, tenants, admins
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar TEXT,
  
  -- Role & Type
  role TEXT DEFAULT 'tenant' CHECK (role IN ('tenant', 'agent', 'admin', 'super_admin', 'main_admin', 'sub_admin')),
  type TEXT DEFAULT 'tenant' CHECK (type IN ('tenant', 'agent')),
  
  -- Location
  location TEXT,
  city TEXT,
  
  -- Agent-specific fields (used by AgentProfile, AgentRegistration, AgentsListingPage)
  agency_name TEXT,               -- AgentRegistration, AgentProfile, AgentsListingPage
  experience TEXT,                -- AgentProfile (years of experience)
  bio TEXT,                       -- Agent description
  specialties JSONB DEFAULT '[]'::jsonb,  -- Property types agent specializes in
  license_number TEXT,            -- For verified agents
  
  -- Verification (used by AgentManagement, SmileIDVerification)
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'not_started')),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  verification_data JSONB DEFAULT '{}'::jsonb,  -- SmileID response data
  
  -- Account Status (used by RenterManagement, AgentManagement)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending', 'deleted')),
  suspension_reason TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Wallet & Credits (used by AgentDashboard, FinanceManagement)
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  
  -- Referral System
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  
  -- Subscription (used by UserDashboard, SubscriptionPage)
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);

-- ============================================
-- 2. LEADS TABLE (RENTAL REQUESTS)
-- Used by: TenantForm, LeadManagement, PropertiesPage, AgentDashboard
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tenant Info (used in LeadCard, LeadManagement)
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  
  -- Requirements as JSONB for flexibility (backwards compatibility)
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Direct fields for easy querying (used in LeadManagement)
  location TEXT NOT NULL,
  property_type TEXT NOT NULL,
  budget DECIMAL(12, 2),
  bedrooms INTEGER,
  move_in_date DATE,
  additional_notes TEXT,
  
  -- Status & Metrics
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  views INTEGER DEFAULT 0,
  contacts INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_property_type ON leads(property_type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_budget ON leads(budget);

-- ============================================
-- 3. PROPERTIES TABLE
-- Used by: PropertiesPage, AgentDashboard, SavedProperties
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  property_type TEXT NOT NULL,
  
  -- Pricing
  price DECIMAL(12, 2) NOT NULL,
  price_period TEXT DEFAULT 'month' CHECK (price_period IN ('month', 'year', 'day')),
  
  -- Details
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqft INTEGER,
  
  -- Features
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'unavailable')),
  featured BOOLEAN DEFAULT FALSE,
  
  -- Metrics
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);

-- ============================================
-- 4. SUBSCRIPTION PLANS TABLE
-- Used by: SubscriptionManagement, SubscriptionPage, UserSubscriptionPage
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Plan Details
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  interval TEXT DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly', 'weekly')),
  
  -- Features
  features JSONB DEFAULT '[]'::jsonb,
  lead_limit INTEGER DEFAULT -1,  -- -1 = unlimited
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- Insert default plans if not exists
INSERT INTO subscription_plans (name, description, price, interval, features, sort_order) VALUES
  ('Basic', 'Perfect for getting started', 500, 'monthly', '["5 lead contacts per month", "Basic support", "Email notifications"]'::jsonb, 1),
  ('Premium', 'Most popular choice', 1500, 'monthly', '["Unlimited lead contacts", "Priority support", "WhatsApp notifications", "Featured agent badge"]'::jsonb, 2),
  ('Enterprise', 'For agencies and teams', 5000, 'monthly', '["Everything in Premium", "Multiple team members", "Custom branding", "API access", "Dedicated account manager"]'::jsonb, 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SUBSCRIPTIONS TABLE
-- Used by: SubscriptionManagement, checkSubscriptionStatus
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  
  -- Plan Info (denormalized for history)
  plan_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  
  -- Payment Info
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  
  -- Validity Period
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- ============================================
-- 6. CREDIT BUNDLES TABLE
-- Used by: FinanceManagement, SubscriptionPage (for agents)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Bundle Details
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  
  -- Display Info
  per_lead TEXT,  -- e.g., "KSh 50/lead"
  features JSONB DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for credit_bundles
CREATE INDEX IF NOT EXISTS idx_credit_bundles_active ON credit_bundles(is_active);

-- Insert default bundles
INSERT INTO credit_bundles (name, credits, price, per_lead, features, popular, sort_order) VALUES
  ('Starter', 10, 500, 'KSh 50/lead', '["10 Lead Credits", "7-day validity", "Email support"]'::jsonb, FALSE, 1),
  ('Professional', 30, 1200, 'KSh 40/lead', '["30 Lead Credits", "30-day validity", "Priority support", "WhatsApp alerts"]'::jsonb, TRUE, 2),
  ('Business', 100, 3500, 'KSh 35/lead', '["100 Lead Credits", "90-day validity", "Dedicated support", "All notifications"]'::jsonb, FALSE, 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CREDIT TRANSACTIONS TABLE
-- Used by: FinanceManagement, AgentDashboard, getWalletBalance
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction Details
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  reason TEXT NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  
  -- Reference (for linking to purchases, refunds, etc.)
  reference_id UUID,
  reference_type TEXT,  -- 'purchase', 'lead_unlock', 'refund', 'referral', etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for credit_transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- 8. CONTACT HISTORY TABLE
-- Used by: trackAgentLeadContact, hasAgentContactedLead, getUnlockedLeads
-- ============================================
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Contact Details
  contact_type TEXT CHECK (contact_type IN ('phone', 'email', 'whatsapp', 'view')),
  cost_credits DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate contacts
  UNIQUE(agent_id, lead_id, contact_type)
);

-- Indexes for contact_history
CREATE INDEX IF NOT EXISTS idx_contact_history_agent_id ON contact_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_lead_id ON contact_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_created_at ON contact_history(created_at DESC);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- Used by: NotificationBell, createNotification, subscribeToNotifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_lead', 'agent_contact', 'subscription_expiry', 'system', 'payment', 'verification_approved', 'verification_rejected', 'new_inquiry', 'support')),
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  
  -- Additional Data
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 10. REFERRALS TABLE
-- Used by: processReferral, referral system
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reward Info
  credits_awarded DECIMAL(10, 2) DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- 11. SAVED PROPERTIES TABLE
-- Used by: saveProperty, getSavedProperties
-- ============================================
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate saves
  UNIQUE(user_id, property_id)
);

-- Indexes for saved_properties
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);

-- ============================================
-- 12. SUPPORT TICKETS TABLE
-- Used by: SupportManagement, createSupportTicket
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Ticket Info
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'verification', 'account')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Resolution
  resolution_note TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================
-- 13. SYSTEM CONFIGURATION TABLE
-- Used by: Settings, getSystemConfig, updateSystemConfig
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config
INSERT INTO system_config (key, value, description) VALUES
  ('credit_price', '100', 'Price per credit in KES'),
  ('free_credits', '2', 'Free credits given to new accounts'),
  ('referral_bonus', '5', 'Credits awarded for successful referral'),
  ('lead_unlock_cost', '1', 'Credits required to unlock a lead'),
  ('contact_costs', '{"phone": 3, "email": 2, "whatsapp": 2, "view": 1}', 'Credits for different contact types'),
  ('invite_expiry_hours', '72', 'Hours before admin invite expires')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 14. PAYMENT TRANSACTIONS TABLE
-- Used by: Pesapal integration, FinanceManagement
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Payment Gateway Info
  gateway TEXT NOT NULL,  -- 'pesapal', 'paystack', etc.
  gateway_transaction_id TEXT,
  gateway_reference TEXT,
  
  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  
  -- Purpose
  purpose TEXT NOT NULL,  -- 'subscription', 'credits', 'premium'
  purpose_id UUID,  -- Reference to subscription or bundle ID
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Response Data
  gateway_response JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_ref ON payment_transactions(gateway_reference);

-- ============================================
-- 15. NOTIFICATION TEMPLATES TABLE
-- Used by: SystemConfiguration (for custom notification messages)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Template Info
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Variables (list of available variables)
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Channels
  send_email BOOLEAN DEFAULT TRUE,
  send_push BOOLEAN DEFAULT TRUE,
  send_whatsapp BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing service role full access)
-- Users
DROP POLICY IF EXISTS "Service role full access to users" ON users;
CREATE POLICY "Service role full access to users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Leads
DROP POLICY IF EXISTS "Service role full access to leads" ON leads;
CREATE POLICY "Service role full access to leads" ON leads FOR ALL USING (true) WITH CHECK (true);

-- Properties
DROP POLICY IF EXISTS "Service role full access to properties" ON properties;
CREATE POLICY "Service role full access to properties" ON properties FOR ALL USING (true) WITH CHECK (true);

-- Subscription Plans (read by all)
DROP POLICY IF EXISTS "Anyone can read subscription_plans" ON subscription_plans;
CREATE POLICY "Anyone can read subscription_plans" ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access to subscription_plans" ON subscription_plans;
CREATE POLICY "Service role full access to subscription_plans" ON subscription_plans FOR ALL USING (true) WITH CHECK (true);

-- Subscriptions
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON subscriptions;
CREATE POLICY "Service role full access to subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Credit Bundles (read by all)
DROP POLICY IF EXISTS "Anyone can read credit_bundles" ON credit_bundles;
CREATE POLICY "Anyone can read credit_bundles" ON credit_bundles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access to credit_bundles" ON credit_bundles;
CREATE POLICY "Service role full access to credit_bundles" ON credit_bundles FOR ALL USING (true) WITH CHECK (true);

-- Credit Transactions
DROP POLICY IF EXISTS "Service role full access to credit_transactions" ON credit_transactions;
CREATE POLICY "Service role full access to credit_transactions" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);

-- Contact History
DROP POLICY IF EXISTS "Service role full access to contact_history" ON contact_history;
CREATE POLICY "Service role full access to contact_history" ON contact_history FOR ALL USING (true) WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "Service role full access to notifications" ON notifications;
CREATE POLICY "Service role full access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Referrals
DROP POLICY IF EXISTS "Service role full access to referrals" ON referrals;
CREATE POLICY "Service role full access to referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);

-- Saved Properties
DROP POLICY IF EXISTS "Service role full access to saved_properties" ON saved_properties;
CREATE POLICY "Service role full access to saved_properties" ON saved_properties FOR ALL USING (true) WITH CHECK (true);

-- Support Tickets
DROP POLICY IF EXISTS "Service role full access to support_tickets" ON support_tickets;
CREATE POLICY "Service role full access to support_tickets" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

-- System Config
DROP POLICY IF EXISTS "Service role full access to system_config" ON system_config;
CREATE POLICY "Service role full access to system_config" ON system_config FOR ALL USING (true) WITH CHECK (true);

-- Payment Transactions
DROP POLICY IF EXISTS "Service role full access to payment_transactions" ON payment_transactions;
CREATE POLICY "Service role full access to payment_transactions" ON payment_transactions FOR ALL USING (true) WITH CHECK (true);

-- Notification Templates
DROP POLICY IF EXISTS "Service role full access to notification_templates" ON notification_templates;
CREATE POLICY "Service role full access to notification_templates" ON notification_templates FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'main_admin', 'sub_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system config value
CREATE OR REPLACE FUNCTION get_config(config_key TEXT)
RETURNS JSONB AS $$
DECLARE
  config_value JSONB;
BEGIN
  SELECT value INTO config_value FROM system_config WHERE key = config_key;
  RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- (Safe to run - uses IF NOT EXISTS pattern)
-- ============================================

-- Add agency_name to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='agency_name') THEN
    ALTER TABLE users ADD COLUMN agency_name TEXT;
  END IF;
END $$;

-- Add experience to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='experience') THEN
    ALTER TABLE users ADD COLUMN experience TEXT;
  END IF;
END $$;

-- Add bio to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Add verification_status to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verification_status') THEN
    ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add verified_at to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verified_at') THEN
    ALTER TABLE users ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add rejection_reason to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='rejection_reason') THEN
    ALTER TABLE users ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Add suspension_reason to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspension_reason') THEN
    ALTER TABLE users ADD COLUMN suspension_reason TEXT;
  END IF;
END $$;

-- Add suspended_at to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspended_at') THEN
    ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add deleted_at to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add city to users if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='city') THEN
    ALTER TABLE users ADD COLUMN city TEXT;
  END IF;
END $$;

-- Add plan_id to subscriptions if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_id') THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add additional_notes to leads if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='additional_notes') THEN
    ALTER TABLE leads ADD COLUMN additional_notes TEXT;
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'RentConnect complete schema created successfully!';
  RAISE NOTICE 'Tables created: users, leads, properties, subscription_plans, subscriptions, credit_bundles, credit_transactions, contact_history, notifications, referrals, saved_properties, support_tickets, system_config, payment_transactions, notification_templates';
END $$;
