-- ================================================
-- FIX: Agent Assets RLS Policies
-- Run this in Supabase SQL Editor to fix permissions
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view own storage" ON agent_storage_usage;
DROP POLICY IF EXISTS "Agents can manage own folders" ON agent_asset_folders;
DROP POLICY IF EXISTS "Public can view shared folders" ON agent_asset_folders;
DROP POLICY IF EXISTS "Agents can manage own assets" ON agent_assets;
DROP POLICY IF EXISTS "Public can view shared assets" ON agent_assets;
DROP POLICY IF EXISTS "Allow insert share views" ON asset_share_views;

-- ======================
-- AGENT STORAGE USAGE
-- ======================

-- Allow agents to view their own storage
CREATE POLICY "Agents can view own storage" ON agent_storage_usage
    FOR SELECT USING (auth.uid() = agent_id);

-- Allow agents to insert their own storage record
CREATE POLICY "Agents can insert own storage" ON agent_storage_usage
    FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Allow agents to update their own storage
CREATE POLICY "Agents can update own storage" ON agent_storage_usage
    FOR UPDATE USING (auth.uid() = agent_id);

-- ======================
-- ASSET FOLDERS
-- ======================

-- Allow agents full control of their own folders
CREATE POLICY "Agents can select own folders" ON agent_asset_folders
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert own folders" ON agent_asset_folders
    FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own folders" ON agent_asset_folders
    FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own folders" ON agent_asset_folders
    FOR DELETE USING (auth.uid() = agent_id);

-- Public can view shared folders
CREATE POLICY "Public can view shared folders" ON agent_asset_folders
    FOR SELECT USING (is_shared = true);

-- ======================
-- ASSETS
-- ======================

-- Allow agents full control of their own assets
CREATE POLICY "Agents can select own assets" ON agent_assets
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert own assets" ON agent_assets
    FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own assets" ON agent_assets
    FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own assets" ON agent_assets
    FOR DELETE USING (auth.uid() = agent_id);

-- Public can view shared assets
CREATE POLICY "Public can view shared assets" ON agent_assets
    FOR SELECT USING (is_shared = true);

-- ======================
-- SHARE VIEWS (Analytics)
-- ======================

-- Allow anyone to insert view records
CREATE POLICY "Allow insert share views" ON asset_share_views
    FOR INSERT WITH CHECK (true);

-- Allow agents to view their own asset views
CREATE POLICY "Agents can view own asset views" ON asset_share_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agent_assets WHERE agent_assets.id = asset_share_views.asset_id AND agent_assets.agent_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM agent_asset_folders WHERE agent_asset_folders.id = asset_share_views.folder_id AND agent_asset_folders.agent_id = auth.uid()
        )
    );
