/**
 * Security utility functions for the application
 * These helpers provide consistent security practices across API routes
 */

/**
 * Determine if we're in production environment
 */
export const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Get a safe error message for API responses
 * In production, returns a generic message to prevent information leakage
 * In development, returns the actual error message for debugging
 * 
 * @param {Error|string} error - The error object or message
 * @param {string} genericMessage - Generic message to show in production
 * @returns {string} - Safe error message
 */
export const getSafeErrorMessage = (error, genericMessage = 'An error occurred') => {
  if (!isProduction()) {
    // In development, return the actual error for debugging
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  // In production, return generic message
  return genericMessage;
};

/**
 * Log error and return safe response
 * Use this at the end of catch blocks in API routes
 * 
 * @param {string} context - Where the error occurred (e.g., 'GET /api/admins')
 * @param {Error} error - The error object
 * @param {string} genericMessage - Generic message to return
 * @returns {{ message: string }} - Object with safe error message
 */
export const logAndGetSafeError = (context, error, genericMessage = 'An error occurred') => {
  // Always log the full error server-side
  console.error(`Error in ${context}:`, error);
  
  return {
    message: getSafeErrorMessage(error, genericMessage)
  };
};

/**
 * Validate that required environment variables are set
 * @param {string[]} variables - Array of required env var names
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const validateEnvVars = (variables) => {
  const missing = variables.filter(v => !process.env[v]);
  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Get site URL with validation
 * @returns {string} - Site URL
 * @throws {Error} - If NEXT_PUBLIC_SITE_URL is not set in production
 */
export const getSiteUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!siteUrl && isProduction()) {
    throw new Error('NEXT_PUBLIC_SITE_URL is required in production');
  }
  
  return siteUrl || 'http://localhost:3000';
};

/**
 * Validate pagination limit and apply maximum cap
 * @param {number|string} limit - Requested limit
 * @param {number} defaultLimit - Default limit if not provided
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {number} - Safe limit value
 */
export const getSafeLimit = (limit, defaultLimit = 50, maxLimit = 200) => {
  const parsed = parseInt(limit, 10);
  if (isNaN(parsed) || parsed < 1) {
    return defaultLimit;
  }
  return Math.min(parsed, maxLimit);
};

/**
 * Validate pagination offset
 * @param {number|string} offset - Requested offset
 * @returns {number} - Safe offset value (minimum 0)
 */
export const getSafeOffset = (offset) => {
  const parsed = parseInt(offset, 10);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

// CommonJS exports for Jest compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isProduction,
    getSafeErrorMessage,
    logAndGetSafeError,
    validateEnvVars,
    getSiteUrl,
    getSafeLimit,
    getSafeOffset
  };
}
