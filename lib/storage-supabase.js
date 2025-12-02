import { createClient } from '@/utils/supabase/client';

// ============================================
// SUPABASE STORAGE - IMAGE UPLOAD OPERATIONS
// ============================================

/**
 * Upload image to Supabase Storage
 * Path structure: {userId}/{timestamp}-{filename}
 * @param {File} file - The file to upload
 * @param {string} userId - User ID for folder organization
 * @param {string} folder - Optional subfolder (e.g., 'properties', 'profiles')
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export const uploadImage = async (file, userId, folder = '') => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.' };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    const supabase = createClient();
    
    // Create path: userId/timestamp-filename or userId/folder/timestamp-filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = folder ? `${userId}/${folder}/${fileName}` : `${userId}/${fileName}`;

    // Upload file to 'images' bucket
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return { 
      success: true, 
      url: publicUrl, 
      path: data.path 
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload profile/avatar image
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export const uploadProfileImage = async (userId, file) => {
  return await uploadImage(file, userId, 'avatar');
};

/**
 * Upload multiple property images
 * @param {string} agentId - Agent/user ID
 * @param {string} propertyId - Property ID
 * @param {File[]} files - Array of image files
 * @returns {Promise<{success: boolean, urls?: string[], count?: number, total?: number, error?: string}>}
 */
export const uploadPropertyImages = async (agentId, propertyId, files) => {
  try {
    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided' };
    }

    const uploadPromises = files.map(async (file, index) => {
      return await uploadImage(file, agentId, `properties/${propertyId}`);
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result.success);
    const urls = successfulUploads.map(result => result.url);

    if (successfulUploads.length === 0) {
      return { success: false, error: 'All uploads failed' };
    }

    return {
      success: true,
      urls,
      count: successfulUploads.length,
      total: files.length
    };
  } catch (error) {
    console.error('Error uploading property images:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete image from Supabase Storage
 * @param {string} imagePath - Full path to the image in storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImage = async (imagePath) => {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from('images')
      .remove([imagePath]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete multiple images
 * @param {string[]} imagePaths - Array of image paths
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export const deleteImages = async (imagePaths) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from('images')
      .remove(imagePaths);

    if (error) {
      console.error('Supabase storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error deleting images:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get public URL for an image
 * @param {string} imagePath - Path to image in storage
 * @returns {string} Public URL
 */
export const getImageUrl = (imagePath) => {
  const supabase = createClient();
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(imagePath);
  return publicUrl;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Compress image before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.' };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit.' };
  }

  return { valid: true };
};
