-- ===========================================
-- Complete Database Constraints Fix
-- For Lead Unlock and Lifecycle Features
-- Run Date: 2026-01-04
-- ===========================================

-- 1. Fix contact_history contact_type constraint 
-- (Adds 'unlock' and 'exclusive' for lead purchases)
ALTER TABLE contact_history 
DROP CONSTRAINT IF EXISTS contact_history_contact_type_check;

ALTER TABLE contact_history 
ADD CONSTRAINT contact_history_contact_type_check 
CHECK (contact_type IN ('phone', 'email', 'whatsapp', 'view', 'browse', 'unlock', 'exclusive', 'call', 'message', 'sms'));

-- 2. Fix leads status constraint
-- (Adds 'sold_out' for when all slots are filled)
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('active', 'paused', 'expired', 'closed', 'sold_out'));

-- 3. Lead lifecycle columns (for admin lifecycle management)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ;

-- 4. Lead agent connections table and indexes
CREATE TABLE IF NOT EXISTS lead_agent_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_type TEXT DEFAULT 'unlock',
    status TEXT DEFAULT 'connected',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id, agent_id)
);

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lead_agent_connections' AND column_name = 'connection_type') THEN
        ALTER TABLE lead_agent_connections ADD COLUMN connection_type TEXT DEFAULT 'unlock';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lead_agent_connections' AND column_name = 'status') THEN
        ALTER TABLE lead_agent_connections ADD COLUMN status TEXT DEFAULT 'connected';
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_agent_id ON lead_agent_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_lead_id ON lead_agent_connections(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_agent_lead ON contact_history(agent_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_contact_type ON contact_history(contact_type);
CREATE INDEX IF NOT EXISTS idx_leads_is_hidden ON leads(is_hidden);
CREATE INDEX IF NOT EXISTS idx_leads_expires_at ON leads(expires_at);

-- 6. Sync existing unlocks to lead_agent_connections
INSERT INTO lead_agent_connections (lead_id, agent_id, created_at)
SELECT DISTINCT ch.lead_id, ch.agent_id, ch.created_at
FROM contact_history ch
WHERE ch.contact_type IN ('unlock', 'exclusive')
AND ch.lead_id IS NOT NULL
AND ch.agent_id IS NOT NULL
ON CONFLICT (lead_id, agent_id) DO NOTHING;

-- Done!
SELECT 'All database constraints fixed successfully!' as status;
