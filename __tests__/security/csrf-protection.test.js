/**
 * CSRF Protection Security Tests
 * Tests for origin/referer validation
 * 
 * Run with: npm run test:security
 */

describe('CSRF Protection - Origin Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://yoombaa.com';
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Simulates validateOrigin function from [id]/invite/route.js
  const validateOrigin = (headers) => {
    const origin = headers.origin;
    const referer = headers.referer;
    const host = headers.host;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const allowedOrigins = [
      siteUrl,
      `https://${host}`,
      `http://${host}`,
    ].filter(Boolean);

    // In development, also allow localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5000');
    }

    // Helper to check if URL matches allowed origin (more secure than startsWith)
    const isValidOrigin = (url) => {
      if (!url) return false;
      try {
        const urlObj = new URL(url);
        return allowedOrigins.some(allowed => {
          const allowedObj = new URL(allowed);
          return urlObj.origin === allowedObj.origin;
        });
      } catch {
        return false;
      }
    };

    // Check origin header first
    if (origin && !isValidOrigin(origin)) {
      return { valid: false, error: 'Invalid origin' };
    }

    // Check referer if origin is not present
    if (!origin && referer) {
      if (!isValidOrigin(referer)) {
        return { valid: false, error: 'Invalid referer' };
      }
    }

    return { valid: true };
  };

  test('accepts requests from allowed origin', () => {
    const result = validateOrigin({
      origin: 'https://yoombaa.com',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(true);
  });

  test('accepts requests from matching host', () => {
    const result = validateOrigin({
      origin: 'https://yoombaa.com',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(true);
  });

  test('rejects requests from malicious origin', () => {
    const result = validateOrigin({
      origin: 'https://evil-site.com',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid origin');
  });

  test('rejects requests from attacker domain with similar name', () => {
    const result = validateOrigin({
      origin: 'https://yoombaa.com.evil.com',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(false);
  });

  test('accepts requests with valid referer when origin is missing', () => {
    const result = validateOrigin({
      referer: 'https://yoombaa.com/admin/dashboard',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(true);
  });

  test('rejects requests with invalid referer', () => {
    const result = validateOrigin({
      referer: 'https://malicious-site.com/phishing',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid referer');
  });

  test('allows localhost in development mode', () => {
    process.env.NODE_ENV = 'development';
    
    const result = validateOrigin({
      origin: 'http://localhost:3000',
      host: 'localhost:3000'
    });
    expect(result.valid).toBe(true);
  });

  test('blocks localhost in production mode', () => {
    process.env.NODE_ENV = 'production';
    
    const result = validateOrigin({
      origin: 'http://localhost:3000',
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(false);
  });

  test('handles requests with no origin or referer', () => {
    // Same-origin requests might not have Origin header
    const result = validateOrigin({
      host: 'yoombaa.com'
    });
    expect(result.valid).toBe(true);
  });
});

describe('Admin Status Validation', () => {
  // Simulates the admin check that requires active status
  const isAdminActive = (adminUser) => {
    return !!(adminUser && adminUser.status === 'active');
  };

  test('allows active admin users', () => {
    expect(isAdminActive({ status: 'active', role: 'admin' })).toBe(true);
  });

  test('rejects inactive admin users', () => {
    expect(isAdminActive({ status: 'inactive', role: 'admin' })).toBe(false);
  });

  test('rejects invited (not yet active) admin users', () => {
    expect(isAdminActive({ status: 'invited', role: 'admin' })).toBe(false);
  });

  test('rejects suspended admin users', () => {
    expect(isAdminActive({ status: 'suspended', role: 'admin' })).toBe(false);
  });

  test('rejects null/undefined admin users', () => {
    expect(isAdminActive(null)).toBe(false);
    expect(isAdminActive(undefined)).toBe(false);
  });
});

