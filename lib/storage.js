/**
 * DEPRECATED: This file has been replaced with Supabase Storage
 * Use lib/storage-supabase.js instead for all storage operations
 * 
 * This file is kept for backward compatibility but returns empty/error responses
 */

// Deprecated - all functions now return errors directing to use Supabase
const deprecationError = () => ({
  success: false,
  error: 'This function has been deprecated. Please use lib/storage-supabase.js with Supabase Storage instead.'
});

// ============================================
// IMAGE UPLOAD OPERATIONS (DEPRECATED)
// ============================================

export const uploadImage = async (file, path) => {
  console.warn('⚠️ uploadImage is deprecated. Use storage-supabase.js instead.');
  return deprecationError();
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload JPG, PNG, or WebP.' };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL, path: snapshot.ref.fullPath };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
};

export const uploadProfileImage = async (userId, file) => {
  const timestamp = Date.now();
  const path = `profiles/${userId}/${timestamp}_${file.name}`;
  return await uploadImage(file, path);
};

export const uploadPropertyImages = async (propertyId, files) => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const path = `properties/${propertyId}/${timestamp}_${index}_${file.name}`;
      return await uploadImage(file, path);
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result.success);
    const urls = successfulUploads.map(result => result.url);

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

export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

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

        // Calculate new dimensions
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
