-- =====================================================
-- SECURITY FIX: agent_rating_summary view
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop the existing view and recreate with SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user
-- instead of the view creator, which is the secure default

DROP VIEW IF EXISTS agent_rating_summary;

CREATE VIEW agent_rating_summary 
WITH (security_invoker = true) 
AS
SELECT 
    u.id as agent_id,
    u.name as agent_name,
    u.avatar,
    u.average_rating,
    u.total_ratings,
    u.rating_breakdown,
    COALESCE(
        json_agg(
            json_build_object(
                'id', ar.id,
                'rating', ar.rating,
                'review_text', ar.review_text,
                'responsiveness_rating', ar.responsiveness_rating,
                'professionalism_rating', ar.professionalism_rating,
                'helpfulness_rating', ar.helpfulness_rating,
                'tenant_name', t.name,
                'tenant_avatar', t.avatar,
                'created_at', ar.created_at
            ) ORDER BY ar.created_at DESC
        ) FILTER (WHERE ar.id IS NOT NULL), 
        '[]'::json
    ) as recent_reviews
FROM users u
LEFT JOIN agent_ratings ar ON u.id = ar.agent_id AND ar.status = 'published'
LEFT JOIN users t ON ar.tenant_id = t.id
WHERE u.role = 'agent'
GROUP BY u.id, u.name, u.avatar, u.average_rating, u.total_ratings, u.rating_breakdown;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON agent_rating_summary TO authenticated;
GRANT SELECT ON agent_rating_summary TO anon;

-- Verify the fix
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'agent_rating_summary';

SELECT 'Security fix applied successfully!' as status;

