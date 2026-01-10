-- ================================================
-- GiftPesa Digital Vouchers System - REVISED
-- Adds voucher support to existing database
-- ================================================

-- 1. Add voucher columns to existing subscription_plans table (if they don't exist)
DO $$ 
BEGIN
    -- Add slug column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'slug') THEN
        ALTER TABLE subscription_plans ADD COLUMN slug VARCHAR(50);
    END IF;
    
    -- Add voucher_enabled if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'voucher_enabled') THEN
        ALTER TABLE subscription_plans ADD COLUMN voucher_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add voucher_value if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'voucher_value') THEN
        ALTER TABLE subscription_plans ADD COLUMN voucher_value DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add voucher_merchant if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'voucher_merchant') THEN
        ALTER TABLE subscription_plans ADD COLUMN voucher_merchant VARCHAR(255);
    END IF;
    
    -- Add voucher_description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'voucher_description') THEN
        ALTER TABLE subscription_plans ADD COLUMN voucher_description TEXT;
    END IF;
END $$;

-- 2. Voucher Pool (Manual mode - preloaded vouchers from GiftPesa)
CREATE TABLE IF NOT EXISTS voucher_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code VARCHAR(100) UNIQUE NOT NULL,
    qr_code_url TEXT,
    value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    merchant_name VARCHAR(255) NOT NULL,
    merchant_logo TEXT,
    merchant_category VARCHAR(100),
    valid_from DATE DEFAULT CURRENT_DATE,
    expires_at DATE NOT NULL,
    -- Pool management
    plan_tier VARCHAR(20), -- Which plan tier this voucher is for (null = any)
    is_assigned BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP WITH TIME ZONE,
    -- Metadata from GiftPesa
    giftpesa_id VARCHAR(100),
    batch_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agent Vouchers (Assigned vouchers)
CREATE TABLE IF NOT EXISTS agent_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voucher_pool_id UUID REFERENCES voucher_pool(id),
    -- Voucher details (copied or API-generated)
    voucher_code VARCHAR(100) NOT NULL,
    qr_code_url TEXT,
    value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    merchant_name VARCHAR(255) NOT NULL,
    merchant_logo TEXT,
    merchant_category VARCHAR(100),
    description TEXT,
    expires_at DATE NOT NULL,
    -- Assignment context
    subscription_id UUID,
    plan_name VARCHAR(100),
    plan_tier VARCHAR(20),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'viewed', 'redeemed', 'expired', 'cancelled')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    viewed_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    -- Notification tracking
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    -- Source tracking
    source VARCHAR(20) DEFAULT 'pool' CHECK (source IN ('pool', 'api')),
    giftpesa_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Voucher Activity Log (For admin tracking)
CREATE TABLE IF NOT EXISTS voucher_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES agent_vouchers(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    performed_by UUID REFERENCES auth.users(id),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voucher_pool_unassigned ON voucher_pool(is_assigned, plan_tier) WHERE is_assigned = FALSE;
CREATE INDEX IF NOT EXISTS idx_agent_vouchers_agent ON agent_vouchers(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_vouchers_status ON agent_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_agent_vouchers_expires ON agent_vouchers(expires_at);
CREATE INDEX IF NOT EXISTS idx_voucher_activity_voucher ON voucher_activity_log(voucher_id);

-- RLS Policies
ALTER TABLE voucher_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_activity_log ENABLE ROW LEVEL SECURITY;

-- Voucher pool: Only admins can view and manage
DROP POLICY IF EXISTS "Admins can manage voucher pool" ON voucher_pool;
CREATE POLICY "Admins can manage voucher pool" ON voucher_pool
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Agent vouchers: Agents can view own, admins can view all
DROP POLICY IF EXISTS "Agents can view own vouchers" ON agent_vouchers;
CREATE POLICY "Agents can view own vouchers" ON agent_vouchers
    FOR SELECT USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all vouchers" ON agent_vouchers;
CREATE POLICY "Admins can manage all vouchers" ON agent_vouchers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Service role can insert vouchers (for webhook)
DROP POLICY IF EXISTS "Service can insert vouchers" ON agent_vouchers;
CREATE POLICY "Service can insert vouchers" ON agent_vouchers
    FOR INSERT WITH CHECK (true);

-- Activity log: Agents can view own, admins can view all
DROP POLICY IF EXISTS "Agents can view own activity" ON voucher_activity_log;
CREATE POLICY "Agents can view own activity" ON voucher_activity_log
    FOR SELECT USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all activity" ON voucher_activity_log;
CREATE POLICY "Admins can view all activity" ON voucher_activity_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

DROP POLICY IF EXISTS "Anyone can insert activity" ON voucher_activity_log;
CREATE POLICY "Anyone can insert activity" ON voucher_activity_log
    FOR INSERT WITH CHECK (true);

-- Function to assign voucher from pool
CREATE OR REPLACE FUNCTION assign_voucher_from_pool(
    p_agent_id UUID,
    p_plan_tier VARCHAR,
    p_subscription_id UUID,
    p_plan_name VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_voucher_pool voucher_pool%ROWTYPE;
    v_agent_voucher_id UUID;
BEGIN
    -- Find an unassigned voucher for the plan tier
    SELECT * INTO v_voucher_pool
    FROM voucher_pool
    WHERE is_assigned = FALSE
      AND (plan_tier IS NULL OR plan_tier = p_plan_tier)
      AND expires_at > CURRENT_DATE
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_voucher_pool.id IS NULL THEN
        RETURN NULL; -- No vouchers available
    END IF;
    
    -- Mark pool voucher as assigned
    UPDATE voucher_pool
    SET is_assigned = TRUE, assigned_at = NOW()
    WHERE id = v_voucher_pool.id;
    
    -- Create agent voucher
    INSERT INTO agent_vouchers (
        agent_id, voucher_pool_id, voucher_code, qr_code_url, value, currency,
        merchant_name, merchant_logo, merchant_category, expires_at,
        subscription_id, plan_name, plan_tier, source, giftpesa_id
    ) VALUES (
        p_agent_id, v_voucher_pool.id, v_voucher_pool.voucher_code, v_voucher_pool.qr_code_url,
        v_voucher_pool.value, v_voucher_pool.currency, v_voucher_pool.merchant_name,
        v_voucher_pool.merchant_logo, v_voucher_pool.merchant_category, v_voucher_pool.expires_at,
        p_subscription_id, p_plan_name, p_plan_tier, 'pool', v_voucher_pool.giftpesa_id
    )
    RETURNING id INTO v_agent_voucher_id;
    
    -- Log the activity
    INSERT INTO voucher_activity_log (voucher_id, agent_id, action, details)
    VALUES (v_agent_voucher_id, p_agent_id, 'assigned', jsonb_build_object(
        'plan_tier', p_plan_tier,
        'plan_name', p_plan_name,
        'source', 'pool'
    ));
    
    RETURN v_agent_voucher_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get voucher stats for admin dashboard
CREATE OR REPLACE FUNCTION get_voucher_stats()
RETURNS TABLE (
    total_pool INT,
    available_pool INT,
    total_issued INT,
    redeemed INT,
    expired INT,
    total_value_issued DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INT FROM voucher_pool),
        (SELECT COUNT(*)::INT FROM voucher_pool WHERE is_assigned = FALSE AND expires_at > CURRENT_DATE),
        (SELECT COUNT(*)::INT FROM agent_vouchers),
        (SELECT COUNT(*)::INT FROM agent_vouchers WHERE status = 'redeemed'),
        (SELECT COUNT(*)::INT FROM agent_vouchers WHERE status = 'expired' OR expires_at < CURRENT_DATE),
        (SELECT COALESCE(SUM(value), 0) FROM agent_vouchers);
END;
$$ LANGUAGE plpgsql;

-- Update existing subscription plans with voucher settings (if the table has the name column)
-- This will safely update existing plans
DO $$
BEGIN
    -- Update Starter/Basic tier
    UPDATE subscription_plans 
    SET voucher_enabled = FALSE, voucher_value = 0
    WHERE name ILIKE '%starter%' OR name ILIKE '%basic%';
    
    -- Update Professional/Standard tier
    UPDATE subscription_plans 
    SET voucher_enabled = TRUE, voucher_value = 200, voucher_merchant = 'Java House', voucher_description = 'Free coffee voucher'
    WHERE name ILIKE '%professional%' OR name ILIKE '%standard%';
    
    -- Update Business/Premium tier
    UPDATE subscription_plans 
    SET voucher_enabled = TRUE, voucher_value = 500, voucher_merchant = 'Carrefour', voucher_description = 'Shopping voucher'
    WHERE name ILIKE '%business%' OR name ILIKE '%premium%';
    
    -- Update Enterprise/Elite tier
    UPDATE subscription_plans 
    SET voucher_enabled = TRUE, voucher_value = 1000, voucher_merchant = 'Naivas', voucher_description = 'Premium shopping voucher'
    WHERE name ILIKE '%enterprise%' OR name ILIKE '%elite%' OR name ILIKE '%unlimited%';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Could not update subscription plans - %', SQLERRM;
END $$;
