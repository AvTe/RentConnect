/**
 * Rate Limiting Security Tests
 * Tests for invite verification rate limiting
 * 
 * Run with: npm run test:security
 */

describe('Rate Limiting', () => {
  // Simulates the rate limiting logic from verify-invite/route.js
  let verificationAttempts;
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  beforeEach(() => {
    verificationAttempts = new Map();
  });

  const checkRateLimit = (ip) => {
    const now = Date.now();
    const attemptData = verificationAttempts.get(ip);

    if (attemptData) {
      // Check if blocked
      if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
        return {
          allowed: false,
          blockedUntil: attemptData.blockedUntil,
          retryAfter: Math.ceil((attemptData.blockedUntil - now) / 1000)
        };
      }

      // Reset if window expired
      if (now - attemptData.firstAttempt > WINDOW_MS) {
        verificationAttempts.set(ip, { count: 1, firstAttempt: now });
        return { allowed: true };
      }

      // Check if over limit
      if (attemptData.count >= MAX_ATTEMPTS) {
        const blockedUntil = now + BLOCK_DURATION_MS;
        verificationAttempts.set(ip, { ...attemptData, blockedUntil });
        return {
          allowed: false,
          blockedUntil,
          retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000)
        };
      }

      // Increment counter
      attemptData.count++;
      return { allowed: true };
    }

    // First attempt
    verificationAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  };

  test('allows first attempt from new IP', () => {
    const result = checkRateLimit('192.168.1.1');
    expect(result.allowed).toBe(true);
  });

  test('allows up to MAX_ATTEMPTS within window', () => {
    const ip = '192.168.1.2';
    
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
    }
  });

  test('blocks after exceeding MAX_ATTEMPTS', () => {
    const ip = '192.168.1.3';
    
    // Use up all attempts
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      checkRateLimit(ip);
    }
    
    // Next attempt should be blocked
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.blockedUntil).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test('provides retry-after time when blocked', () => {
    const ip = '192.168.1.4';
    
    // Use up all attempts
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      checkRateLimit(ip);
    }
    
    // Get blocked
    const result = checkRateLimit(ip);
    
    // Should have ~15 minutes retry time (900 seconds)
    expect(result.retryAfter).toBeLessThanOrEqual(900);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test('different IPs have independent limits', () => {
    const ip1 = '192.168.1.5';
    const ip2 = '192.168.1.6';
    
    // Use up all attempts for IP1
    for (let i = 0; i < MAX_ATTEMPTS + 1; i++) {
      checkRateLimit(ip1);
    }
    
    // IP2 should still be allowed
    const result = checkRateLimit(ip2);
    expect(result.allowed).toBe(true);
  });
});

describe('Password Strength Validation', () => {
  // Simulates password validation from verify-invite/route.js
  const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  test('accepts strong passwords', () => {
    expect(validatePasswordStrength('SecurePass123').valid).toBe(true);
    expect(validatePasswordStrength('MyP@ssw0rd').valid).toBe(true);
    expect(validatePasswordStrength('AbCdEfGh1').valid).toBe(true);
  });

  test('rejects passwords without uppercase', () => {
    const result = validatePasswordStrength('password123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  test('rejects passwords without lowercase', () => {
    const result = validatePasswordStrength('PASSWORD123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  test('rejects passwords without numbers', () => {
    const result = validatePasswordStrength('SecurePassword');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  test('rejects short passwords', () => {
    const result = validatePasswordStrength('Pass1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  test('rejects empty passwords', () => {
    expect(validatePasswordStrength('').valid).toBe(false);
    expect(validatePasswordStrength(null).valid).toBe(false);
    expect(validatePasswordStrength(undefined).valid).toBe(false);
  });
});

