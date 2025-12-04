-- ============================================
-- RENTCONNECT EXTERNAL LEADS & ZAPIER INTEGRATION
-- ============================================
-- Run this in Supabase SQL Editor after the main schema
-- ============================================

-- ============================================
-- 1. ADD EXTERNAL LEAD FIELDS TO LEADS TABLE
-- ============================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'platform';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ad_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS form_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE;

-- Index for external leads
CREATE INDEX IF NOT EXISTS idx_leads_external_source ON leads(external_source);
CREATE INDEX IF NOT EXISTS idx_leads_is_external ON leads(is_external);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- ============================================
-- 2. EXTERNAL LEAD LOGS TABLE
-- Tracks all incoming leads from external sources
-- ============================================
CREATE TABLE IF NOT EXISTS external_lead_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Source information
  source TEXT NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  ad_id TEXT,
  form_id TEXT,
  
  -- Original payload for debugging
  original_payload JSONB,
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_external_lead_logs_lead ON external_lead_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_external_lead_logs_source ON external_lead_logs(source);
CREATE INDEX IF NOT EXISTS idx_external_lead_logs_campaign ON external_lead_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_external_lead_logs_created ON external_lead_logs(created_at DESC);

-- ============================================
-- 3. LEAD AGENT CONNECTIONS TABLE
-- Tracks which agents have connected/accepted leads
-- ============================================
CREATE TABLE IF NOT EXISTS lead_agent_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Connection status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'contacted', 'converted', 'lost')),
  
  -- Agent actions
  accepted_at TIMESTAMP WITH TIME ZONE,
  first_contact_at TIMESTAMP WITH TIME ZONE,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  contact_count INTEGER DEFAULT 0,
  
  -- Notes
  agent_notes TEXT,
  
  -- Outcome
  outcome TEXT,
  outcome_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each agent can only connect once per lead
  UNIQUE(lead_id, agent_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_lead ON lead_agent_connections(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_agent ON lead_agent_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_status ON lead_agent_connections(status);
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_created ON lead_agent_connections(created_at DESC);

-- ============================================
-- 4. NOTIFICATIONS TABLE UPDATES
-- Add missing columns if table exists
-- ============================================
-- Add new columns to existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label TEXT;

-- Update title from message if title is null
UPDATE notifications SET title = COALESCE(type, 'Notification') WHERE title IS NULL;

-- Make title NOT NULL after populating
ALTER TABLE notifications ALTER COLUMN title SET NOT NULL;

-- Indexes (using existing 'read' column, not 'is_read')
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 5. API KEYS TABLE
-- Store API keys for external integrations
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Key info
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,  -- Store hashed version
  key_prefix TEXT NOT NULL,  -- First 8 chars for identification
  
  -- Permissions
  permissions JSONB DEFAULT '["leads:create"]'::jsonb,
  
  -- Rate limiting
  rate_limit INTEGER DEFAULT 100,  -- Requests per hour
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- 6. ENABLE RLS
-- ============================================
ALTER TABLE external_lead_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_agent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Service role full access to external_lead_logs" ON external_lead_logs;
CREATE POLICY "Service role full access to external_lead_logs" ON external_lead_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to lead_agent_connections" ON lead_agent_connections;
CREATE POLICY "Service role full access to lead_agent_connections" ON lead_agent_connections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to notifications" ON notifications;
CREATE POLICY "Service role full access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to api_keys" ON api_keys;
CREATE POLICY "Service role full access to api_keys" ON api_keys FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. ENABLE REALTIME FOR NOTIFICATIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- 8. CREATE FUNCTION TO UPDATE LEAD STATUS
-- ============================================
CREATE OR REPLACE FUNCTION update_lead_on_agent_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- When an agent accepts a lead, update the lead status
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE leads 
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = NEW.lead_id AND status = 'new';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_agent_accept_lead ON lead_agent_connections;
CREATE TRIGGER on_agent_accept_lead
  AFTER UPDATE ON lead_agent_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_on_agent_accept();

-- ============================================
-- SUCCESS
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'External Leads & Zapier Integration migration completed successfully!';
END $$;
