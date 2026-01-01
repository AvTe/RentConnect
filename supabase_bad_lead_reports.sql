-- ============================================
-- BAD LEAD REPORTS TABLE
-- For agent trust system - allows refund requests
-- ============================================

-- Create the bad_lead_reports table
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
    UNIQUE(agent_id, lead_id) -- One report per agent per lead
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_agent ON bad_lead_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_lead ON bad_lead_reports(lead_id);
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_status ON bad_lead_reports(status);
CREATE INDEX IF NOT EXISTS idx_bad_lead_reports_created ON bad_lead_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE bad_lead_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Agents can view their own reports
DROP POLICY IF EXISTS "Agents can view own reports" ON bad_lead_reports;
CREATE POLICY "Agents can view own reports" ON bad_lead_reports
    FOR SELECT USING (agent_id = auth.uid());

-- Agents can create reports for leads they unlocked
DROP POLICY IF EXISTS "Agents can create reports" ON bad_lead_reports;
CREATE POLICY "Agents can create reports" ON bad_lead_reports
    FOR INSERT WITH CHECK (agent_id = auth.uid());

-- Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all reports" ON bad_lead_reports;
CREATE POLICY "Admins can view all reports" ON bad_lead_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'main_admin')
        )
    );

-- Admins can update reports (approve/reject)
DROP POLICY IF EXISTS "Admins can update reports" ON bad_lead_reports;
CREATE POLICY "Admins can update reports" ON bad_lead_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'main_admin')
        )
    );

-- Update trigger for updated_at
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

-- Grant necessary permissions
GRANT SELECT, INSERT ON bad_lead_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bad_lead_reports TO service_role;
