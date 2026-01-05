-- ================================================
-- FIX: Allow viewing assets in shared folders
-- Run this in Supabase SQL Editor
-- ================================================

-- Drop the existing public asset view policy
DROP POLICY IF EXISTS "Public can view shared assets" ON agent_assets;

-- Create a new policy that allows viewing:
-- 1. Assets that are individually shared (is_shared = true)
-- 2. Assets that belong to a shared folder
CREATE POLICY "Public can view shared assets" ON agent_assets
    FOR SELECT USING (
        is_shared = true 
        OR 
        EXISTS (
            SELECT 1 FROM agent_asset_folders 
            WHERE agent_asset_folders.id = agent_assets.folder_id 
            AND agent_asset_folders.is_shared = true
        )
    );
