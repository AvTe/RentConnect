/**
 * Firebase Admin SDK - DEPRECATED
 * 
 * This module has been replaced with Supabase.
 * Kept for backward compatibility but all functions return errors.
 * 
 * Use lib/database.js for database operations instead.
 */

// Deprecated - Firebase Admin no longer used
export const initializeFirebaseAdmin = () => {
  console.warn('⚠️ Firebase Admin is deprecated. Use Supabase instead.');
  return null;
};

export const getAdminDb = () => {
  console.warn('⚠️ Firebase Admin is deprecated. Use Supabase instead.');
  return null;
};

export const getAdminFirestore = () => {
  console.warn('⚠️ Firebase Admin is deprecated. Use Supabase instead.');
  return null;
};

export const isFirebaseAdminConfigured = () => {
  return false;
};

export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  increment: (n) => n,
  arrayUnion: (...args) => args,
  arrayRemove: (...args) => args
};

// All admin operations return errors directing to use Supabase
const deprecatedError = { success: false, error: 'Firebase Admin deprecated. Use Supabase database.js instead.' };

export const checkPhoneNumberExists = async () => deprecatedError;
export const createUserAdmin = async () => deprecatedError;
export const getUserAdmin = async () => deprecatedError;
export const updateUserAdmin = async () => deprecatedError;
export const verifyAgentAdmin = async () => deprecatedError;

export const createAgentSubscription = async () => {
  console.warn('⚠️ Use createSubscription from lib/database.js instead.');
  return deprecatedError;
};

export const createUserSubscription = async () => {
  console.warn('⚠️ Use createSubscription from lib/database.js instead.');
  return deprecatedError;
};

export const addAgentCredits = async () => {
  console.warn('⚠️ Use addCredits from lib/database.js instead.');
  return deprecatedError;
};
