/**
 * Firebase has been replaced with Supabase
 * This file is kept for backward compatibility but no longer initializes Firebase
 * All authentication, database, and storage now use Supabase
 * 
 * See:
 * - lib/auth-supabase.js for authentication
 * - lib/database.js for database operations
 * - lib/storage-supabase.js for storage
 */

// Deprecated - kept for compatibility
export const isFirebaseReady = false;

// Deprecated exports - return null/undefined
export const app = null;
export const auth = null;
export const db = null;
export const storage = null;
export const googleProvider = null;
export const analytics = null;

// Log warning if anything tries to use Firebase
if (typeof window !== 'undefined') {
  console.warn('⚠️ Firebase has been migrated to Supabase. Please use Supabase clients instead.');
}
