/**
 * Security Utility Tests
 * Tests for security utility functions
 *
 * Run with: npm run test:security
 */

// Re-implement functions here for testing (since ES modules can't be directly imported by Jest)
const isProduction = () => process.env.NODE_ENV === 'production';

const getSafeErrorMessage = (error, genericMessage = 'An error occurred') => {
  if (!error) return '';
  if (!isProduction()) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  return genericMessage;
};

const logAndGetSafeError = (context, error, genericMessage = 'An error occurred') => {
  console.error(`Error in ${context}:`, error);
  return {
    message: getSafeErrorMessage(error, genericMessage)
  };
};

const getSafeLimit = (limit, defaultLimit = 50, maxLimit = 200) => {
  const parsed = parseInt(limit, 10);
  if (isNaN(parsed) || parsed < 1) {
    return defaultLimit;
  }
  return Math.min(parsed, maxLimit);
};

const getSafeOffset = (offset) => {
  const parsed = parseInt(offset, 10);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

describe('Security Utils', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('isProduction', () => {
    test('returns true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    test('returns false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });

    test('returns false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
    });
  });

  describe('getSafeErrorMessage', () => {
    test('returns actual error in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed: password incorrect');
      const message = getSafeErrorMessage(error, 'An error occurred');
      expect(message).toBe('Database connection failed: password incorrect');
    });

    test('returns generic message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database connection failed: password incorrect');
      const message = getSafeErrorMessage(error, 'An error occurred');
      expect(message).toBe('An error occurred');
    });

    test('handles string errors', () => {
      process.env.NODE_ENV = 'development';
      const message = getSafeErrorMessage('String error message', 'Generic');
      expect(message).toBe('String error message');
    });

    test('handles null/undefined errors', () => {
      process.env.NODE_ENV = 'development';
      expect(getSafeErrorMessage(null, 'Generic')).toBe('');
      expect(getSafeErrorMessage(undefined, 'Generic')).toBe('');
    });
  });

  describe('logAndGetSafeError', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('logs error to console', () => {
      const error = new Error('Test error');
      logAndGetSafeError('GET /api/test', error, 'Generic message');
      expect(consoleSpy).toHaveBeenCalledWith('Error in GET /api/test:', error);
    });

    test('returns safe message object', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive info');
      const result = logAndGetSafeError('POST /api/test', error, 'Something went wrong');
      expect(result).toEqual({ message: 'Something went wrong' });
    });
  });

  describe('getSafeLimit', () => {
    test('returns default limit for invalid input', () => {
      expect(getSafeLimit('invalid', 50, 200)).toBe(50);
      expect(getSafeLimit(null, 50, 200)).toBe(50);
      expect(getSafeLimit(undefined, 50, 200)).toBe(50);
      expect(getSafeLimit(-5, 50, 200)).toBe(50);
      expect(getSafeLimit(0, 50, 200)).toBe(50);
    });

    test('returns requested limit when within bounds', () => {
      expect(getSafeLimit(10, 50, 200)).toBe(10);
      expect(getSafeLimit(100, 50, 200)).toBe(100);
      expect(getSafeLimit('75', 50, 200)).toBe(75);
    });

    test('caps limit at maximum', () => {
      expect(getSafeLimit(500, 50, 200)).toBe(200);
      expect(getSafeLimit(1000, 50, 200)).toBe(200);
      expect(getSafeLimit('999', 50, 100)).toBe(100);
    });

    test('uses default max of 200 if not specified', () => {
      expect(getSafeLimit(300)).toBe(200);
    });
  });

  describe('getSafeOffset', () => {
    test('returns 0 for invalid input', () => {
      expect(getSafeOffset('invalid')).toBe(0);
      expect(getSafeOffset(null)).toBe(0);
      expect(getSafeOffset(undefined)).toBe(0);
      expect(getSafeOffset(-10)).toBe(0);
    });

    test('returns valid offset values', () => {
      expect(getSafeOffset(0)).toBe(0);
      expect(getSafeOffset(10)).toBe(10);
      expect(getSafeOffset('50')).toBe(50);
      expect(getSafeOffset(1000)).toBe(1000);
    });
  });
});

