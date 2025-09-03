import {
  validateISBN,
  formatISBN,
  enrichFromISBN,
  normalizeISBN,
  formatISBNForDisplay,
} from '../isbn';

describe('ISBN Validation', () => {
  // AC2: ISBN validation functionality
  describe('validateISBN', () => {
    test('2.2-UNIT-008: should validate correct ISBN-10', () => {
      // Valid ISBN-10 examples
      expect(validateISBN('0306406152')).toBe(true);
      expect(validateISBN('0-306-40615-2')).toBe(true);
      expect(validateISBN('0 306 40615 2')).toBe(true);
      expect(validateISBN('043942089X')).toBe(true); // ISBN with X check digit
    });

    test('2.2-UNIT-009: should validate correct ISBN-13', () => {
      // Valid ISBN-13 examples
      expect(validateISBN('9780306406157')).toBe(true);
      expect(validateISBN('978-0-306-40615-7')).toBe(true);
      expect(validateISBN('978 0 306 40615 7')).toBe(true);
      expect(validateISBN('9780471958697')).toBe(true);
    });

    test('2.2-UNIT-010: should reject invalid ISBN-10', () => {
      expect(validateISBN('0306406151')).toBe(false); // Wrong check digit
      expect(validateISBN('123456789')).toBe(false);   // Too short
      expect(validateISBN('12345678901')).toBe(false); // Too long
      expect(validateISBN('030640615Y')).toBe(false);  // Invalid character
      expect(validateISBN('')).toBe(false);            // Empty string
    });

    test('2.2-UNIT-011: should reject invalid ISBN-13', () => {
      expect(validateISBN('9780306406158')).toBe(false); // Wrong check digit
      expect(validateISBN('978030640615')).toBe(false);  // Too short
      expect(validateISBN('97803064061578')).toBe(false); // Too long
      expect(validateISBN('978030640615Y')).toBe(false); // Invalid character
    });

    test('2.2-UNIT-012: should handle edge cases', () => {
      expect(validateISBN(null as unknown as string)).toBe(false);
      expect(validateISBN(undefined as unknown as string)).toBe(false);
      expect(validateISBN('   ')).toBe(false);
      expect(validateISBN('abc123')).toBe(false);
    });
  });

  describe('formatISBN', () => {
    test('2.2-UNIT-013: should format valid ISBN-10', () => {
      const result = formatISBN('0306406152');
      expect(result.isValid).toBe(true);
      expect(result.isbn10).toBe('0306406152');
      expect(result.isbn13).toBe('9780306406157');
    });

    test('2.2-UNIT-014: should format valid ISBN-13', () => {
      const result = formatISBN('9780306406157');
      expect(result.isValid).toBe(true);
      expect(result.isbn10).toBe('0306406152');
      expect(result.isbn13).toBe('9780306406157');
    });

    test('2.2-UNIT-015: should handle ISBN-13 without ISBN-10 equivalent', () => {
      const result = formatISBN('9791234567896'); // 979 prefix with correct check digit
      expect(result.isValid).toBe(true);
      expect(result.isbn10).toBeUndefined();
      expect(result.isbn13).toBe('9791234567896');
    });

    test('2.2-UNIT-016: should return invalid for bad ISBN', () => {
      const result = formatISBN('invalid');
      expect(result.isValid).toBe(false);
      expect(result.isbn10).toBeUndefined();
      expect(result.isbn13).toBeUndefined();
    });
  });

  describe('normalizeISBN', () => {
    test('2.2-UNIT-017: should normalize ISBN format', () => {
      expect(normalizeISBN('978-0-306-40615-7')).toBe('9780306406157');
      expect(normalizeISBN('978 0 306 40615 7')).toBe('9780306406157');
      expect(normalizeISBN('0-306-40615-2')).toBe('0306406152');
      expect(normalizeISBN('043942089x')).toBe('043942089X');
    });
  });

  describe('formatISBNForDisplay', () => {
    test('2.2-UNIT-018: should format ISBN-10 for display', () => {
      expect(formatISBNForDisplay('0306406152')).toBe('0-306-40615-2');
      expect(formatISBNForDisplay('043942089X')).toBe('0-439-42089-X');
    });

    test('2.2-UNIT-019: should format ISBN-13 for display', () => {
      expect(formatISBNForDisplay('9780306406157')).toBe('978-0-306-40615-7');
    });

    test('2.2-UNIT-020: should return original for invalid length', () => {
      expect(formatISBNForDisplay('invalid')).toBe('invalid');
      expect(formatISBNForDisplay('123')).toBe('123');
    });
  });
});

describe('ISBN Enrichment', () => {
  // AC2: ISBN lookup integration
  describe('enrichFromISBN', () => {
    // Mock fetch for testing
    const originalFetch = global.fetch;
    
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    
    afterEach(() => {
      global.fetch = originalFetch;
      jest.resetAllMocks();
    });

    test('2.2-UNIT-021: should return null for invalid ISBN', async () => {
      const result = await enrichFromISBN('invalid');
      expect(result).toBe(null);
      expect(fetch).not.toHaveBeenCalled();
    });

    test('2.2-UNIT-022: should return null when service unavailable', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 503 }) // Health check fails
        .mockResolvedValueOnce({ ok: false, status: 503 }); // Service unavailable

      const result = await enrichFromISBN('9780306406157');
      expect(result).toBe(null);
    });

    test('2.2-UNIT-023: should return enriched data when service available', async () => {
      const mockMetadata = {
        title: 'Test Book',
        author: 'Test Author',
        publisher: 'Test Publisher',
        publication_year: 2024,
        isbn_13: '9780306406157',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Health check succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata),
        });

      const result = await enrichFromISBN('9780306406157');
      expect(result).toEqual(mockMetadata);
    });

    test('2.2-UNIT-024: should handle enrichment service timeout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Health check succeeds
        .mockRejectedValueOnce(new Error('Request timeout'));

      const result = await enrichFromISBN('9780306406157');
      expect(result).toBe(null);
    });

    test('2.2-UNIT-025: should handle malformed response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Health check succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve('invalid json'),
        });

      const result = await enrichFromISBN('9780306406157');
      expect(result).toBe(null);
    });

    test('2.2-UNIT-026: should gracefully handle network errors', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await enrichFromISBN('9780306406157');
      expect(result).toBe(null);
    });
  });
});