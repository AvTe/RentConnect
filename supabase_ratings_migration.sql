-- =====================================================
-- YOOMBAA AGENT RATINGS & REVIEWS SYSTEM
-- Migration Script
-- =====================================================

-- 1. CREATE AGENT_RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,  -- Optional: link to specific lead interaction
    
    -- Rating Data
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- 1-5 star rating
    review_text TEXT,  -- Optional written review
    
    -- Rating Categories (optional detailed ratings)
    responsiveness_rating INTEGER CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged', 'removed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate ratings: one tenant can rate one agent only once per lead
    -- If lead_id is null, one tenant can rate one agent only once overall
    UNIQUE(agent_id, tenant_id, lead_id)
);

-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agent_ratings_agent_id ON agent_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_tenant_id ON agent_ratings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_status ON agent_ratings(status);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_created_at ON agent_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_rating ON agent_ratings(rating);

-- Composite index for fetching agent's published ratings
CREATE INDEX IF NOT EXISTS idx_agent_ratings_agent_published 
ON agent_ratings(agent_id, status) WHERE status = 'published';

-- 3. ADD RATING COLUMNS TO USERS TABLE (for agents)
-- =====================================================
-- Add columns to store calculated rating stats (denormalized for performance)
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_breakdown JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb;

-- 4. CREATE FUNCTION TO UPDATE AGENT RATING STATS
-- =====================================================
CREATE OR REPLACE FUNCTION update_agent_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
    breakdown JSONB;
BEGIN
    -- Calculate new stats for the agent
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
        COUNT(*),
        jsonb_build_object(
            '1', COUNT(*) FILTER (WHERE rating = 1),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '5', COUNT(*) FILTER (WHERE rating = 5)
        )
    INTO avg_rating, total_count, breakdown
    FROM agent_ratings
    WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id)
    AND status = 'published';
    
    -- Update the users table
    UPDATE users
    SET 
        average_rating = avg_rating,
        total_ratings = total_count,
        rating_breakdown = breakdown,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.agent_id, OLD.agent_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE TRIGGERS FOR AUTO-UPDATE
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_rating_stats_insert ON agent_ratings;
CREATE TRIGGER trigger_update_rating_stats_insert
    AFTER INSERT ON agent_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_rating_stats();

DROP TRIGGER IF EXISTS trigger_update_rating_stats_update ON agent_ratings;
CREATE TRIGGER trigger_update_rating_stats_update
    AFTER UPDATE ON agent_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_rating_stats();

DROP TRIGGER IF EXISTS trigger_update_rating_stats_delete ON agent_ratings;
CREATE TRIGGER trigger_update_rating_stats_delete
    AFTER DELETE ON agent_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_rating_stats();

-- 6. CREATE updated_at TRIGGER FOR agent_ratings
-- =====================================================
CREATE OR REPLACE FUNCTION update_agent_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agent_ratings_updated_at ON agent_ratings;
CREATE TRIGGER trigger_agent_ratings_updated_at
    BEFORE UPDATE ON agent_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_ratings_updated_at();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published ratings
CREATE POLICY "Anyone can view published ratings" ON agent_ratings
    FOR SELECT
    USING (status = 'published');

-- Policy: Authenticated users can view their own ratings (even if hidden)
CREATE POLICY "Users can view their own ratings" ON agent_ratings
    FOR SELECT
    USING (auth.uid() = tenant_id);

-- Policy: Tenants can insert ratings
CREATE POLICY "Tenants can insert ratings" ON agent_ratings
    FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

-- Policy: Tenants can update their own ratings
CREATE POLICY "Tenants can update own ratings" ON agent_ratings
    FOR UPDATE
    USING (auth.uid() = tenant_id)
    WITH CHECK (auth.uid() = tenant_id);

-- Policy: Admins can do everything (assuming admin check via role)
CREATE POLICY "Admins can manage all ratings" ON agent_ratings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'main_admin')
        )
    );

-- 8. CREATE VIEW FOR AGENT RATING SUMMARY
-- =====================================================
CREATE OR REPLACE VIEW agent_rating_summary AS
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

-- 9. HELPER FUNCTION: Check if tenant can rate an agent
-- =====================================================
CREATE OR REPLACE FUNCTION can_tenant_rate_agent(
    p_tenant_id UUID,
    p_agent_id UUID,
    p_lead_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    has_contact BOOLEAN;
    already_rated BOOLEAN;
    result JSONB;
BEGIN
    -- Check if agent has contacted this tenant's lead
    SELECT EXISTS(
        SELECT 1 FROM contact_history
        WHERE agent_id = p_agent_id
        AND lead_id IN (SELECT id FROM leads WHERE user_id = p_tenant_id)
    ) INTO has_contact;
    
    -- Check if already rated
    IF p_lead_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM agent_ratings
            WHERE agent_id = p_agent_id
            AND tenant_id = p_tenant_id
            AND lead_id = p_lead_id
        ) INTO already_rated;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM agent_ratings
            WHERE agent_id = p_agent_id
            AND tenant_id = p_tenant_id
        ) INTO already_rated;
    END IF;
    
    result := jsonb_build_object(
        'canRate', has_contact AND NOT already_rated,
        'hasContact', has_contact,
        'alreadyRated', already_rated,
        'reason', CASE
            WHEN already_rated THEN 'You have already rated this agent'
            WHEN NOT has_contact THEN 'You can only rate agents who have contacted you'
            ELSE NULL
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment below to insert test ratings

/*
-- Get sample agent and tenant IDs first
DO $$
DECLARE
    sample_agent_id UUID;
    sample_tenant_id UUID;
BEGIN
    SELECT id INTO sample_agent_id FROM users WHERE role = 'agent' LIMIT 1;
    SELECT id INTO sample_tenant_id FROM users WHERE role = 'tenant' LIMIT 1;
    
    IF sample_agent_id IS NOT NULL AND sample_tenant_id IS NOT NULL THEN
        INSERT INTO agent_ratings (agent_id, tenant_id, rating, review_text, responsiveness_rating, professionalism_rating, helpfulness_rating)
        VALUES 
            (sample_agent_id, sample_tenant_id, 5, 'Excellent agent! Very helpful and responsive.', 5, 5, 5);
    END IF;
END $$;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- INSTRUCTIONS:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Verify tables and functions are created
-- 3. Test with sample data if needed

SELECT 'Agent Ratings Migration Complete!' as status;
