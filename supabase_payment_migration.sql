-- =====================================================
-- YOOMBAA PESAPAL PAYMENT INTEGRATION
-- Database Migration Script
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. CREATE PENDING_PAYMENTS TABLE (for Pesapal payment tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Order identifiers
    order_id VARCHAR(100) UNIQUE NOT NULL,
    order_tracking_id VARCHAR(100),
    
    -- Payment metadata (JSON containing userId, type, credits, etc.)
    metadata JSONB NOT NULL,
    signature VARCHAR(255),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    email VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    pesapal_status JSONB,
    
    -- Fulfillment tracking
    fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'fulfilled', 'failed', 'not_applicable')),
    fulfillment_receipt JSONB,
    
    -- Timestamps
    completed_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pending_payments
CREATE INDEX IF NOT EXISTS idx_pending_payments_order_id ON pending_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_order_tracking_id ON pending_payments(order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_email ON pending_payments(email);
CREATE INDEX IF NOT EXISTS idx_pending_payments_created ON pending_payments(created_at DESC);

-- 2. ENSURE CREDIT_TRANSACTIONS TABLE EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    reason TEXT,
    balance_after DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for credit_transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- 3. ENSURE CONTACT_HISTORY TABLE EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    contact_type VARCHAR(20) CHECK (contact_type IN ('phone', 'email', 'whatsapp', 'view')),
    cost_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_history
CREATE INDEX IF NOT EXISTS idx_contact_history_agent ON contact_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_lead ON contact_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_agent_lead ON contact_history(agent_id, lead_id);

-- 4. ENSURE USERS TABLE HAS WALLET_BALANCE COLUMN
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0;

-- 5. ENSURE SUBSCRIPTIONS TABLE EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'KES',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

-- 6. ENSURE CREDIT_BUNDLES TABLE EXISTS (for admin to configure)
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    per_lead VARCHAR(50),
    features JSONB DEFAULT '[]'::jsonb,
    popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default credit bundles if table is empty
INSERT INTO credit_bundles (name, credits, price, per_lead, features, popular, sort_order)
SELECT 'Starter', 5, 250, 'KSh 50', '["5 lead unlocks", "Email & phone access", "No expiry"]'::jsonb, false, 1
WHERE NOT EXISTS (SELECT 1 FROM credit_bundles WHERE credits = 5);

INSERT INTO credit_bundles (name, credits, price, per_lead, features, popular, sort_order)
SELECT 'Basic', 10, 500, 'KSh 50', '["10 lead unlocks", "Email & phone access", "WhatsApp integration", "No expiry"]'::jsonb, false, 2
WHERE NOT EXISTS (SELECT 1 FROM credit_bundles WHERE credits = 10);

INSERT INTO credit_bundles (name, credits, price, per_lead, features, popular, sort_order)
SELECT 'Premium', 50, 1500, 'KSh 30', '["50 lead unlocks", "All contact methods", "Priority support", "Best value"]'::jsonb, true, 3
WHERE NOT EXISTS (SELECT 1 FROM credit_bundles WHERE credits = 50);

INSERT INTO credit_bundles (name, credits, price, per_lead, features, popular, sort_order)
SELECT 'Pro', 150, 3000, 'KSh 20', '["150 lead unlocks", "All contact methods", "Priority support", "Dedicated account manager"]'::jsonb, false, 4
WHERE NOT EXISTS (SELECT 1 FROM credit_bundles WHERE credits = 150);

-- 7. RLS POLICIES FOR SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_bundles ENABLE ROW LEVEL SECURITY;

-- Pending payments: Only service role can access (server-side only)
DROP POLICY IF EXISTS "Service role access for pending_payments" ON pending_payments;
CREATE POLICY "Service role access for pending_payments" ON pending_payments
    FOR ALL USING (auth.role() = 'service_role');

-- Credit transactions: Users can view their own
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Contact history: Agents can view their own
DROP POLICY IF EXISTS "Agents can view own contact history" ON contact_history;
CREATE POLICY "Agents can view own contact history" ON contact_history
    FOR SELECT USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents can insert contact history" ON contact_history;
CREATE POLICY "Agents can insert contact history" ON contact_history
    FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Subscriptions: Users can view their own
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Credit bundles: Everyone can view active bundles
DROP POLICY IF EXISTS "Anyone can view active credit bundles" ON credit_bundles;
CREATE POLICY "Anyone can view active credit bundles" ON credit_bundles
    FOR SELECT USING (is_active = true);

COMMENT ON TABLE pending_payments IS 'Tracks Pesapal payment orders before fulfillment';
COMMENT ON TABLE credit_transactions IS 'Audit trail for credit purchases and deductions';
COMMENT ON TABLE contact_history IS 'Tracks which agents have unlocked which leads';

