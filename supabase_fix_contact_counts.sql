-- ============================================================================
-- FIX LEAD CONTACT COUNTS - Run in Supabase SQL Editor
-- ============================================================================
-- This script fixes the leads.contacts field to show UNIQUE agents count
-- instead of total contact events.
-- 
-- BEFORE: If Agent A unlocked + called + WhatsApped = contacts showed 3
-- AFTER:  If Agent A unlocked + called + WhatsApped = contacts shows 1
-- ============================================================================

-- STEP 1: Check current state (run this first to see what needs fixing)
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total_leads,
    SUM(CASE WHEN contacts > 0 THEN 1 ELSE 0 END) as leads_with_contacts,
    SUM(contacts) as total_contact_count_sum
FROM leads;

-- STEP 2: Preview what will change (run to see before/after comparison)
SELECT 
    l.id,
    l.property_type,
    l.location,
    l.contacts as "Current Count (Wrong)",
    COALESCE((
        SELECT COUNT(DISTINCT agent_id) 
        FROM contact_history 
        WHERE lead_id = l.id
    ), 0) as "Correct Count (Unique Agents)",
    (SELECT COUNT(*) FROM contact_history WHERE lead_id = l.id) as "Total Events"
FROM leads l
WHERE l.contacts > 0
ORDER BY l.contacts DESC
LIMIT 20;

-- ============================================================================
-- STEP 3: APPLY THE FIX (Run this to update all leads)
-- ============================================================================
UPDATE leads 
SET 
    contacts = COALESCE((
        SELECT COUNT(DISTINCT agent_id) 
        FROM contact_history 
        WHERE contact_history.lead_id = leads.id
    ), 0),
    updated_at = NOW();

-- STEP 4: Verify the fix worked
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total_leads,
    SUM(CASE WHEN contacts > 0 THEN 1 ELSE 0 END) as leads_with_contacts,
    SUM(contacts) as total_contact_count_sum
FROM leads;

-- STEP 5: Show sample results
SELECT 
    l.id,
    l.property_type,
    l.location,
    l.contacts as "Unique Agents",
    (SELECT COUNT(*) FROM contact_history WHERE lead_id = l.id) as "Total Events",
    (SELECT string_agg(DISTINCT u.name, ', ') 
     FROM contact_history ch 
     JOIN users u ON ch.agent_id = u.id 
     WHERE ch.lead_id = l.id) as "Agent Names"
FROM leads l
WHERE l.contacts > 0
ORDER BY l.created_at DESC
LIMIT 10;

