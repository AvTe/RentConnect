/**
 * Input Validation Security Tests
 * Tests for SQL injection prevention, XSS prevention, and input sanitization
 * 
 * Run with: npm run test:security
 */

describe('Input Validation Security', () => {
  describe('SQL ilike Pattern Escaping', () => {
    // Simulates the escapeIlikePattern function from lib/database.js
    const escapeIlikePattern = (str) => {
      if (!str) return '';
      return str
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
    };

    test('escapes % wildcard character', () => {
      expect(escapeIlikePattern('100%')).toBe('100\\%');
      expect(escapeIlikePattern('%admin%')).toBe('\\%admin\\%');
    });

    test('escapes _ single character wildcard', () => {
      expect(escapeIlikePattern('user_123')).toBe('user\\_123');
      expect(escapeIlikePattern('_test_')).toBe('\\_test\\_');
    });

    test('escapes backslash characters', () => {
      expect(escapeIlikePattern('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    test('handles combined special characters', () => {
      expect(escapeIlikePattern('%_\\')).toBe('\\%\\_\\\\');
    });

    test('handles empty and null inputs', () => {
      expect(escapeIlikePattern('')).toBe('');
      expect(escapeIlikePattern(null)).toBe('');
      expect(escapeIlikePattern(undefined)).toBe('');
    });

    test('does not modify safe strings', () => {
      expect(escapeIlikePattern('john.doe@email.com')).toBe('john.doe@email.com');
      expect(escapeIlikePattern('Regular Search Term')).toBe('Regular Search Term');
    });
  });

  describe('HTML Escaping for Email Templates', () => {
    // Simulates the escapeHtml function from notifications/send/route.js
    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    test('escapes HTML tags', () => {
      expect(escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('escapes ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('escapes quotes', () => {
      expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
      expect(escapeHtml("It's fine")).toBe('It&#x27;s fine');
    });

    test('handles complex XSS attempts', () => {
      const xssAttempt = '<img src="x" onerror="alert(\'XSS\')">';
      const escaped = escapeHtml(xssAttempt);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;');
    });

    test('handles empty and null inputs', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    test('preserves safe content', () => {
      expect(escapeHtml('Hello World!')).toBe('Hello World!');
      expect(escapeHtml('Meeting at 3pm')).toBe('Meeting at 3pm');
    });
  });

  describe('Credit Amount Validation', () => {
    // Simulates the validation in addCredits function
    const validateCreditAmount = (amount) => {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return { valid: false, error: 'Amount must be a positive number' };
      }
      return { valid: true, amount: numericAmount };
    };

    test('accepts positive numbers', () => {
      expect(validateCreditAmount(100)).toEqual({ valid: true, amount: 100 });
      expect(validateCreditAmount(0.50)).toEqual({ valid: true, amount: 0.5 });
      expect(validateCreditAmount('250')).toEqual({ valid: true, amount: 250 });
    });

    test('rejects zero', () => {
      expect(validateCreditAmount(0).valid).toBe(false);
    });

    test('rejects negative numbers', () => {
      expect(validateCreditAmount(-100).valid).toBe(false);
      expect(validateCreditAmount('-50').valid).toBe(false);
    });

    test('rejects non-numeric input', () => {
      expect(validateCreditAmount('abc').valid).toBe(false);
      expect(validateCreditAmount(null).valid).toBe(false);
      expect(validateCreditAmount(undefined).valid).toBe(false);
      expect(validateCreditAmount({}).valid).toBe(false);
    });
  });

  describe('Regex DoS Prevention', () => {
    // Safe string replacement (not using regex with user input)
    const safeReplace = (template, variable, value) => {
      return template.split(variable).join(value);
    };

    test('replaces variables safely', () => {
      const template = 'Hello {{name}}, welcome!';
      const result = safeReplace(template, '{{name}}', 'John');
      expect(result).toBe('Hello John, welcome!');
    });

    test('handles regex-special characters in values', () => {
      const template = 'Price: {{amount}}';
      const result = safeReplace(template, '{{amount}}', '$100.00');
      expect(result).toBe('Price: $100.00');
    });

    test('handles multiple replacements', () => {
      const template = '{{name}} and {{name}} are friends';
      const result = safeReplace(template, '{{name}}', 'Bob');
      expect(result).toBe('Bob and Bob are friends');
    });

    test('handles empty values', () => {
      const template = 'Hello {{name}}!';
      const result = safeReplace(template, '{{name}}', '');
      expect(result).toBe('Hello !');
    });
  });
});

