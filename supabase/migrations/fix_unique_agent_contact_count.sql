-- ============================================================================
-- MIGRATION: Fix Lead Contact Counts to Show Unique Agents
-- ============================================================================
-- 
-- PROBLEM:
-- The previous logic incremented leads.contacts for EVERY contact event
-- (unlock, phone, email, whatsapp), even if it was the same agent.
-- This resulted in inflated counts that didn't represent unique agents.
--
-- SOLUTION:
-- This migration recalculates the contact count for all leads based on
-- the actual number of UNIQUE agents who have contacted each lead.
--
-- SAFE TO RUN: Yes, this can be run multiple times without issues.
-- ============================================================================

-- Step 1: Show current state (for verification before running)
-- Run this SELECT first to see the before/after comparison
DO $$
DECLARE
    total_leads INTEGER;
    leads_with_contacts INTEGER;
    leads_to_fix INTEGER;
BEGIN
    -- Count total leads
    SELECT COUNT(*) INTO total_leads FROM leads;
    
    -- Count leads with at least 1 contact
    SELECT COUNT(*) INTO leads_with_contacts FROM leads WHERE contacts > 0;
    
    -- Count leads that need fixing (where current count doesn't match unique agents)
    SELECT COUNT(*) INTO leads_to_fix
    FROM leads l
    WHERE l.contacts != COALESCE((
        SELECT COUNT(DISTINCT agent_id) 
        FROM contact_history 
        WHERE lead_id = l.id
    ), 0);
    
    RAISE NOTICE '====== PRE-MIGRATION STATUS ======';
    RAISE NOTICE 'Total leads in database: %', total_leads;
    RAISE NOTICE 'Leads with contacts > 0: %', leads_with_contacts;
    RAISE NOTICE 'Leads needing correction: %', leads_to_fix;
    RAISE NOTICE '===================================';
END $$;

-- Step 2: Update all leads with correct unique agent count
UPDATE leads 
SET 
    contacts = COALESCE((
        SELECT COUNT(DISTINCT agent_id) 
        FROM contact_history 
        WHERE contact_history.lead_id = leads.id
    ), 0),
    updated_at = NOW()
WHERE id IN (
    -- Only update leads that actually need fixing (optimization)
    SELECT l.id 
    FROM leads l
    WHERE l.contacts != COALESCE((
        SELECT COUNT(DISTINCT agent_id) 
        FROM contact_history 
        WHERE lead_id = l.id
    ), 0)
);

-- Step 3: Show results after migration
DO $$
DECLARE
    fixed_count INTEGER;
    sample_record RECORD;
BEGIN
    -- Get count of leads that were fixed
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RAISE NOTICE '====== POST-MIGRATION STATUS ======';
    RAISE NOTICE 'Leads updated: %', fixed_count;
    RAISE NOTICE '====================================';
    
    -- Show a sample of leads with their contact counts
    RAISE NOTICE 'Sample of leads with contact counts:';
    FOR sample_record IN 
        SELECT 
            l.id,
            l.property_type,
            l.location,
            l.contacts as unique_agents,
            (SELECT COUNT(*) FROM contact_history WHERE lead_id = l.id) as total_events
        FROM leads l
        WHERE l.contacts > 0
        ORDER BY l.contacts DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Lead: % | Location: % | Unique Agents: % | Total Events: %',
            sample_record.property_type,
            sample_record.location,
            sample_record.unique_agents,
            sample_record.total_events;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERY (Run this separately to verify the fix)
-- ============================================================================
-- 
-- SELECT 
--     l.id,
--     l.property_type,
--     l.location,
--     l.contacts as "Unique Agents (Fixed)",
--     (SELECT COUNT(*) FROM contact_history WHERE lead_id = l.id) as "Total Contact Events",
--     (SELECT COUNT(DISTINCT agent_id) FROM contact_history WHERE lead_id = l.id) as "Calculated Unique"
-- FROM leads l
-- WHERE l.contacts > 0
-- ORDER BY l.contacts DESC
-- LIMIT 20;
--
-- ============================================================================

