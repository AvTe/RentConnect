-- ============================================
-- REFERRAL SYSTEM UPGRADE
-- Awards 500 credits on first purchase (not on signup)
-- ============================================

-- Add new columns to referrals table
DO $$
BEGIN
    -- Add bonus_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'referrals' AND column_name = 'bonus_amount') THEN
        ALTER TABLE referrals ADD COLUMN bonus_amount INTEGER DEFAULT 500;
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'referrals' AND column_name = 'completed_at') THEN
        ALTER TABLE referrals ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update existing 'completed' referrals to have the bonus amount set
UPDATE referrals 
SET bonus_amount = credits_awarded 
WHERE status = 'completed' AND bonus_amount IS NULL;

-- Create index for faster lookup of pending referrals
CREATE INDEX IF NOT EXISTS idx_referrals_pending_status 
ON referrals(referred_user_id, status) 
WHERE status = 'pending';

-- ============================================
-- BAD LEAD REPORTS TABLE  
-- (Also included here for convenience)
-- ============================================

-- Create the bad_lead_reports table if not exists
CREATE TABLE IF NOT EXISTS bad_lead_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('unreachable', 'fake_number', 'already_closed', 'wrong_info', 'other')),
    details TEXT,
    credits_paid INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    admin_notes TEXT,
    refunded_amount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, lead_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_agent ON bad_lead_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_lead ON bad_lead_reports(lead_id);
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_status ON bad_lead_reports(status);
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_created ON bad_lead_reports(created_at DESC);

-- Enable RLS
ALTER TABLE bad_lead_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bad_lead_reports
DROP POLICY IF EXISTS "Agents can view own reports" ON bad_lead_reports;
CREATE POLICY "Agents can view own reports" ON bad_lead_reports
    FOR SELECT USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Agents can create reports" ON bad_lead_reports;
CREATE POLICY "Agents can create reports" ON bad_lead_reports
    FOR INSERT WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access" ON bad_lead_reports;
CREATE POLICY "Service role full access" ON bad_lead_reports
    FOR ALL USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_bad_lead_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bad_lead_reports_updated_at ON bad_lead_reports;
CREATE TRIGGER trigger_bad_lead_reports_updated_at
    BEFORE UPDATE ON bad_lead_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_bad_lead_reports_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON bad_lead_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bad_lead_reports TO service_role;

-- ============================================
-- Summary of changes:
-- 1. referrals table: Added bonus_amount (default 500) and completed_at columns
-- 2. Created bad_lead_reports table with full schema and RLS
-- ============================================
