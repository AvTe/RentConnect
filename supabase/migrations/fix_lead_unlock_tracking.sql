-- ===========================================
-- Lead Unlock Tracking - Safe Fix v2
-- Handles existing table with different schema
-- ===========================================

-- 1. Add missing columns to lead_agent_connections if they don't exist
DO $$
BEGIN
    -- Add connection_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lead_agent_connections' AND column_name = 'connection_type') THEN
        ALTER TABLE lead_agent_connections ADD COLUMN connection_type TEXT DEFAULT 'unlock';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lead_agent_connections' AND column_name = 'status') THEN
        ALTER TABLE lead_agent_connections ADD COLUMN status TEXT DEFAULT 'connected';
    END IF;
END $$;

-- 2. Create indexes (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_agent_id ON lead_agent_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_agent_connections_lead_id ON lead_agent_connections(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_agent_lead ON contact_history(agent_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_contact_type ON contact_history(contact_type);

-- 3. Sync existing contact_history unlocks to lead_agent_connections (basic insert)
INSERT INTO lead_agent_connections (lead_id, agent_id, created_at)
SELECT DISTINCT 
    ch.lead_id, 
    ch.agent_id, 
    ch.created_at
FROM contact_history ch
WHERE ch.contact_type IN ('unlock', 'exclusive')
AND ch.lead_id IS NOT NULL
AND ch.agent_id IS NOT NULL
ON CONFLICT (lead_id, agent_id) DO NOTHING;

-- 4. Show current records count
SELECT 'contact_history unlocks' as source, COUNT(*) as records 
FROM contact_history 
WHERE contact_type IN ('unlock', 'exclusive')
UNION ALL
SELECT 'lead_agent_connections' as source, COUNT(*) as records 
FROM lead_agent_connections;
