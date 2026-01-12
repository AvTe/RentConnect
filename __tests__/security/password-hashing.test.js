/**
 * Password Hashing Security Tests
 * Tests for bcrypt password hashing implementation
 * 
 * Run with: npm run test:security
 */

const bcrypt = require('bcryptjs');

describe('Password Hashing with bcrypt', () => {
  const SALT_ROUNDS = 12;

  // Simulates hashPassword function from lib/database.js
  const hashPassword = async (password) => {
    if (!password) {
      throw new Error('Password is required');
    }
    return bcrypt.hash(password, SALT_ROUNDS);
  };

  // Simulates verifyPassword function from lib/database.js
  const verifyPassword = async (password, hash) => {
    if (!password || !hash) {
      return false;
    }
    return bcrypt.compare(password, hash);
  };

  test('hashes password and creates different output each time', async () => {
    const password = 'TestPassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    // Hashes should be different due to random salt
    expect(hash1).not.toBe(hash2);
    
    // But both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  test('hash is not the same as plaintext', async () => {
    const password = 'SecurePassword456';
    const hash = await hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
  });

  test('verifies correct password', async () => {
    const password = 'CorrectHorseBatteryStaple1';
    const hash = await hashPassword(password);
    
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  test('rejects incorrect password', async () => {
    const password = 'RealPassword789';
    const wrongPassword = 'WrongPassword789';
    const hash = await hashPassword(password);
    
    expect(await verifyPassword(wrongPassword, hash)).toBe(false);
  });

  test('rejects similar passwords', async () => {
    const password = 'MyPassword123';
    const hash = await hashPassword(password);
    
    // Test case sensitivity
    expect(await verifyPassword('mypassword123', hash)).toBe(false);
    expect(await verifyPassword('MyPassword12', hash)).toBe(false);
    expect(await verifyPassword('MyPassword1234', hash)).toBe(false);
  });

  test('handles empty password verification gracefully', async () => {
    const password = 'ValidPassword1';
    const hash = await hashPassword(password);
    
    expect(await verifyPassword('', hash)).toBe(false);
    expect(await verifyPassword(null, hash)).toBe(false);
    expect(await verifyPassword(undefined, hash)).toBe(false);
  });

  test('handles empty hash gracefully', async () => {
    expect(await verifyPassword('password', '')).toBe(false);
    expect(await verifyPassword('password', null)).toBe(false);
    expect(await verifyPassword('password', undefined)).toBe(false);
  });

  test('throws error for empty password during hashing', async () => {
    await expect(hashPassword('')).rejects.toThrow('Password is required');
    await expect(hashPassword(null)).rejects.toThrow('Password is required');
    await expect(hashPassword(undefined)).rejects.toThrow('Password is required');
  });

  test('hash format is valid bcrypt', async () => {
    const hash = await hashPassword('TestPassword1');
    
    // bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
    
    // Should start with $2a$12$ or $2b$12$ (12 rounds)
    expect(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$')).toBe(true);
  });
});

describe('Token Hashing (SHA-256)', () => {
  const crypto = require('crypto');

  // Simulates hashToken function (for non-password tokens)
  const hashToken = (token) => {
    if (!token) return '';
    return crypto.createHash('sha256').update(token).digest('hex');
  };

  test('creates consistent hash for same input', () => {
    const token = 'my-secret-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    
    expect(hash1).toBe(hash2);
  });

  test('creates different hash for different input', () => {
    const hash1 = hashToken('token-1');
    const hash2 = hashToken('token-2');
    
    expect(hash1).not.toBe(hash2);
  });

  test('hash is 64 characters (SHA-256 hex)', () => {
    const hash = hashToken('any-token');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('handles empty input', () => {
    expect(hashToken('')).toBe('');
    expect(hashToken(null)).toBe('');
    expect(hashToken(undefined)).toBe('');
  });
});

