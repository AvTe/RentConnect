-- ================================================
-- Agent Assets Management System
-- Property asset storage for agents
-- ================================================

-- 1. Asset Folders Table (Properties)
CREATE TABLE IF NOT EXISTS agent_asset_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    thumbnail_url TEXT,
    share_token VARCHAR(100) UNIQUE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agent Assets Table (Files)
CREATE TABLE IF NOT EXISTS agent_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES agent_asset_folders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
    mime_type VARCHAR(100),
    file_size BIGINT NOT NULL DEFAULT 0, -- in bytes
    storage_path TEXT NOT NULL, -- Supabase storage path
    public_url TEXT,
    thumbnail_url TEXT,
    is_shared BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agent Storage Usage Table (for tracking limits)
CREATE TABLE IF NOT EXISTS agent_storage_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    total_storage_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 52428800, -- 50 MB default
    image_count INT DEFAULT 0,
    video_count INT DEFAULT 0,
    document_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shared Asset Views (for analytics)
CREATE TABLE IF NOT EXISTS asset_share_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES agent_assets(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES agent_asset_folders(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_assets_agent ON agent_assets(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assets_folder ON agent_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_agent_folders_agent ON agent_asset_folders(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assets_share_token ON agent_assets(share_token);
CREATE INDEX IF NOT EXISTS idx_agent_folders_share_token ON agent_asset_folders(share_token);

-- Function to update storage usage on asset insert/delete
CREATE OR REPLACE FUNCTION update_agent_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Initialize storage record if not exists
        INSERT INTO agent_storage_usage (agent_id, total_storage_bytes, image_count, video_count, document_count)
        VALUES (NEW.agent_id, 0, 0, 0, 0)
        ON CONFLICT (agent_id) DO NOTHING;
        
        -- Update counts based on file type
        IF NEW.file_type = 'image' THEN
            UPDATE agent_storage_usage 
            SET total_storage_bytes = total_storage_bytes + NEW.file_size,
                image_count = image_count + 1,
                updated_at = NOW()
            WHERE agent_id = NEW.agent_id;
        ELSIF NEW.file_type = 'video' THEN
            UPDATE agent_storage_usage 
            SET total_storage_bytes = total_storage_bytes + NEW.file_size,
                video_count = video_count + 1,
                updated_at = NOW()
            WHERE agent_id = NEW.agent_id;
        ELSE
            UPDATE agent_storage_usage 
            SET total_storage_bytes = total_storage_bytes + NEW.file_size,
                document_count = document_count + 1,
                updated_at = NOW()
            WHERE agent_id = NEW.agent_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease counts based on file type
        IF OLD.file_type = 'image' THEN
            UPDATE agent_storage_usage 
            SET total_storage_bytes = GREATEST(0, total_storage_bytes - OLD.file_size),
                image_count = GREATEST(0, image_count - 1),
                updated_at = NOW()
            WHERE agent_id = OLD.agent_id;
        ELSIF OLD.file_type = 'video' THEN
            UPDATE agent_storage_usage 
            SET total_storage_bytes = GREATEST(0, total_storage_bytes - OLD.file_size),
                video_count = GREATEST(0, video_count - 1),
                updated_at = NOW()
            WHERE agent_id = OLD.agent_id;
        ELSE
            UPDATE agent_storage_usage 
            SET total_storage_bytes = GREATEST(0, total_storage_bytes - OLD.file_size),
                document_count = GREATEST(0, document_count - 1),
                updated_at = NOW()
            WHERE agent_id = OLD.agent_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage usage tracking
DROP TRIGGER IF EXISTS trigger_update_storage_usage ON agent_assets;
CREATE TRIGGER trigger_update_storage_usage
    AFTER INSERT OR DELETE ON agent_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_storage_usage();

-- RLS Policies
ALTER TABLE agent_asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_share_views ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own folders
CREATE POLICY "Agents can manage own folders" ON agent_asset_folders
    FOR ALL USING (auth.uid() = agent_id);

-- Public can view shared folders
CREATE POLICY "Public can view shared folders" ON agent_asset_folders
    FOR SELECT USING (is_shared = true);

-- Agents can manage their own assets
CREATE POLICY "Agents can manage own assets" ON agent_assets
    FOR ALL USING (auth.uid() = agent_id);

-- Public can view shared assets
CREATE POLICY "Public can view shared assets" ON agent_assets
    FOR SELECT USING (is_shared = true);

-- Agents can view their own storage usage
CREATE POLICY "Agents can view own storage" ON agent_storage_usage
    FOR SELECT USING (auth.uid() = agent_id);

-- Allow insert on share views for analytics
CREATE POLICY "Allow insert share views" ON asset_share_views
    FOR INSERT WITH CHECK (true);
