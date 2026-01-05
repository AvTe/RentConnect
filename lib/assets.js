import { createClient } from '@/utils/supabase/client';

// ============================================
// AGENT ASSETS DATABASE LAYER
// Property asset storage and management
// ============================================

const STORAGE_BUCKET = 'agent-assets';
const MAX_STORAGE_BYTES = 52428800; // 50 MB

// ============================================
// STORAGE USAGE
// ============================================

/**
 * Get agent's storage usage and limits
 */
export const getAgentStorageUsage = async (agentId) => {
    try {
        const supabase = createClient();

        // Get or create storage usage record
        let { data, error } = await supabase
            .from('agent_storage_usage')
            .select('*')
            .eq('agent_id', agentId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Record doesn't exist, create it
            const { data: newData, error: insertError } = await supabase
                .from('agent_storage_usage')
                .insert({
                    agent_id: agentId,
                    total_storage_bytes: 0,
                    storage_limit_bytes: MAX_STORAGE_BYTES,
                    image_count: 0,
                    video_count: 0,
                    document_count: 0
                })
                .select()
                .single();

            if (insertError) throw insertError;
            data = newData;
        } else if (error) {
            throw error;
        }

        return {
            success: true,
            data: {
                totalUsed: data.total_storage_bytes,
                limit: data.storage_limit_bytes,
                remaining: data.storage_limit_bytes - data.total_storage_bytes,
                percentage: Math.round((data.total_storage_bytes / data.storage_limit_bytes) * 100),
                imageCount: data.image_count,
                videoCount: data.video_count,
                documentCount: data.document_count
            }
        };
    } catch (error) {
        console.error('Error getting storage usage:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// FOLDERS (Properties)
// ============================================

/**
 * Create a new asset folder (property)
 */
export const createAssetFolder = async (agentId, folderData) => {
    try {
        const supabase = createClient();

        // Generate share token
        const shareToken = generateShareToken();

        const { data, error } = await supabase
            .from('agent_asset_folders')
            .insert({
                agent_id: agentId,
                name: folderData.name,
                location: folderData.location || null,
                description: folderData.description || null,
                share_token: shareToken,
                is_shared: false
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating folder:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all folders for an agent
 */
export const getAgentFolders = async (agentId) => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('agent_asset_folders')
            .select(`
        *,
        assets:agent_assets(count)
      `)
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to include asset count
        const folders = data.map(folder => ({
            ...folder,
            assetCount: folder.assets?.[0]?.count || 0
        }));

        return { success: true, data: folders };
    } catch (error) {
        console.error('Error getting folders:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a folder
 */
export const updateAssetFolder = async (folderId, updates) => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('agent_asset_folders')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', folderId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating folder:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a folder and all its assets
 */
export const deleteAssetFolder = async (agentId, folderId) => {
    try {
        const supabase = createClient();

        // First get all assets in folder to delete from storage
        const { data: assets } = await supabase
            .from('agent_assets')
            .select('storage_path')
            .eq('folder_id', folderId);

        // Delete files from storage
        if (assets && assets.length > 0) {
            const paths = assets.map(a => a.storage_path);
            await supabase.storage.from(STORAGE_BUCKET).remove(paths);
        }

        // Delete folder (cascades to assets due to FK)
        const { error } = await supabase
            .from('agent_asset_folders')
            .delete()
            .eq('id', folderId)
            .eq('agent_id', agentId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting folder:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Toggle folder sharing
 */
export const toggleFolderSharing = async (folderId, isShared) => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('agent_asset_folders')
            .update({
                is_shared: isShared,
                updated_at: new Date().toISOString()
            })
            .eq('id', folderId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error toggling folder sharing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get shared folder by token (public)
 */
export const getSharedFolder = async (shareToken) => {
    try {
        const supabase = createClient();

        // First get the folder
        const { data: folder, error } = await supabase
            .from('agent_asset_folders')
            .select('id, name, location, description, share_token, agent_id')
            .eq('share_token', shareToken)
            .eq('is_shared', true)
            .single();

        if (error) throw error;

        // Get assets in folder
        const { data: assets } = await supabase
            .from('agent_assets')
            .select('*')
            .eq('folder_id', folder.id)
            .order('created_at', { ascending: false });

        // Get agent info from users table
        let agent = null;
        if (folder.agent_id) {
            const { data: userData } = await supabase
                .from('users')
                .select('name, phone, avatar')
                .eq('id', folder.agent_id)
                .single();
            agent = userData;
        }

        return {
            success: true,
            data: {
                ...folder,
                agent,
                assets: assets || []
            }
        };
    } catch (error) {
        console.error('Error getting shared folder:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// ASSETS (Files)
// ============================================

/**
 * Upload an asset file
 */
export const uploadAsset = async (agentId, folderId, file) => {
    try {
        const supabase = createClient();

        // Check storage limit
        const usageResult = await getAgentStorageUsage(agentId);
        if (usageResult.success) {
            const remaining = usageResult.data.remaining;
            if (file.size > remaining) {
                return {
                    success: false,
                    error: `Not enough storage. You have ${formatBytes(remaining)} remaining.`
                };
            }
        }

        // Determine file type
        const fileType = getFileType(file.type);

        // Generate unique filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${agentId}/${folderId || 'uncategorized'}/${timestamp}_${cleanName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);

        // Generate share token
        const shareToken = generateShareToken();

        // Create asset record
        const { data: asset, error: dbError } = await supabase
            .from('agent_assets')
            .insert({
                agent_id: agentId,
                folder_id: folderId || null,
                file_name: file.name,
                file_type: fileType,
                mime_type: file.type,
                file_size: file.size,
                storage_path: storagePath,
                public_url: urlData.publicUrl,
                share_token: shareToken,
                is_shared: false
            })
            .select()
            .single();

        if (dbError) {
            // Rollback storage upload if DB insert fails
            await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
            throw dbError;
        }

        return { success: true, data: asset };
    } catch (error) {
        console.error('Error uploading asset:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get assets in a folder
 */
export const getFolderAssets = async (folderId) => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('agent_assets')
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting folder assets:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all assets for an agent
 */
export const getAgentAssets = async (agentId, options = {}) => {
    try {
        const supabase = createClient();

        let query = supabase
            .from('agent_assets')
            .select(`
        *,
        folder:folder_id(id, name, location)
      `)
            .eq('agent_id', agentId);

        if (options.fileType) {
            query = query.eq('file_type', options.fileType);
        }

        if (options.folderId) {
            query = query.eq('folder_id', options.folderId);
        }

        query = query.order('created_at', { ascending: false });

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting agent assets:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete an asset
 */
export const deleteAsset = async (agentId, assetId) => {
    try {
        const supabase = createClient();

        // Get asset to get storage path
        const { data: asset, error: fetchError } = await supabase
            .from('agent_assets')
            .select('storage_path')
            .eq('id', assetId)
            .eq('agent_id', agentId)
            .single();

        if (fetchError) throw fetchError;

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([asset.storage_path]);

        if (storageError) console.warn('Storage delete warning:', storageError);

        // Delete from database
        const { error: dbError } = await supabase
            .from('agent_assets')
            .delete()
            .eq('id', assetId)
            .eq('agent_id', agentId);

        if (dbError) throw dbError;
        return { success: true };
    } catch (error) {
        console.error('Error deleting asset:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Toggle asset sharing
 */
export const toggleAssetSharing = async (assetId, isShared) => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('agent_assets')
            .update({
                is_shared: isShared,
                updated_at: new Date().toISOString()
            })
            .eq('id', assetId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error toggling asset sharing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get shared asset by token (public)
 */
export const getSharedAsset = async (shareToken) => {
    try {
        const supabase = createClient();

        // Get the asset
        const { data: asset, error } = await supabase
            .from('agent_assets')
            .select('id, file_name, file_type, mime_type, public_url, folder_id, agent_id, file_size')
            .eq('share_token', shareToken)
            .eq('is_shared', true)
            .single();

        if (error) throw error;

        // Get folder info if exists
        let folder = null;
        if (asset.folder_id) {
            const { data: folderData } = await supabase
                .from('agent_asset_folders')
                .select('name, location')
                .eq('id', asset.folder_id)
                .single();
            folder = folderData;
        }

        // Get agent info from users table
        let agent = null;
        if (asset.agent_id) {
            const { data: userData } = await supabase
                .from('users')
                .select('name, phone, avatar')
                .eq('id', asset.agent_id)
                .single();
            agent = userData;
        }

        return {
            success: true,
            data: {
                ...asset,
                folder,
                agent
            }
        };
    } catch (error) {
        console.error('Error getting shared asset:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateShareToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
}

export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
