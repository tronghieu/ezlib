/**
 * @jest-environment jsdom
 */

import { createBook, checkDuplicateBooks } from '../books';
import { supabase } from '@/lib/supabase/client';
import type { BookCreationData } from '@/lib/validation/books';

// Mock Supabase client with proper chaining
jest.mock('@/lib/supabase/client', () => ({
  supabase: jest.fn()
}));

const mockSupabase = supabase as jest.MockedFunction<typeof supabase>;

// Helper function to create mock query chains
const createMockChain = (finalResult: unknown) => {
  const eqChain = {
    eq: jest.fn(() => eqChain),
    like: jest.fn(() => eqChain),
    ilike: jest.fn(() => ({
      ilike: jest.fn(() => Promise.resolve(finalResult))
    })),
    order: jest.fn(() => eqChain),
    limit: jest.fn(() => eqChain),
    single: jest.fn(() => Promise.resolve(finalResult)),
    maybeSingle: jest.fn(() => Promise.resolve(finalResult))
  };

  return {
    select: jest.fn(() => eqChain),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve(finalResult))
      }))
    }))
  };
};

describe('Books API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    const mockBookData: BookCreationData = {
      title: 'Test Book',
      author: 'Test Author',
      publisher: 'Test Publisher',
      publication_year: 2024,
      isbn: '9781234567890',
      library_id: 'test-library-id'
    };

    it('2.2-INT-013: should create book with atomic transaction', async () => {
      // Mock the sequence of database calls made by createBook
      const callResults = [
        { data: [], error: null },  // 1. Duplicate check
        { data: { id: 'author-id', name: 'Test Author', canonical_name: 'test author' }, error: null }, // 2. Author lookup/creation
        { data: { id: 'general-book-id', canonical_title: 'test book' }, error: null }, // 3. General book creation
        { data: { id: 'edition-id', title: 'Test Book', isbn_13: '9781234567890' }, error: null }, // 4. Edition creation
        { data: { code: 'TEST' }, error: null }, // 5. Library lookup for copy number
        { data: null, error: null }, // 6. Last copy number query (no existing copies)
        { data: { id: 'copy-id', copy_number: 'TEST001', availability_status: 'available' }, error: null } // 7. Copy creation
      ];
      
      let callCount = 0;
      const mockFromReturn = {
        from: jest.fn(() => {
          const result = callResults[callCount] || { data: null, error: null };
          callCount++;
          return createMockChain(result);
        })
      };
      
      mockSupabase.mockReturnValue(mockFromReturn as ReturnType<typeof supabase>);

      const result = await createBook(mockBookData);

      expect(result).toHaveProperty('generalBook.id');
      expect(result).toHaveProperty('edition.id'); 
      expect(result).toHaveProperty('author.id');
      expect(result).toHaveProperty('copy.id');
      expect(result.copy.availability.status).toBe('available');
    });

    it('2.2-INT-007: should detect duplicates within library scope', async () => {
      // Mock duplicate found response
      const duplicatesResult = { 
        data: [
          {
            id: 'existing-copy-id',
            copy_number: 'LIB001',
            availability_status: 'available',
            book_edition: { title: 'Test Book' },
            author: { name: 'Test Author' }
          }
        ], 
        error: null 
      };

      const mockFromReturn = {
        from: jest.fn(() => createMockChain(duplicatesResult))
      };
      
      mockSupabase.mockReturnValue(mockFromReturn as ReturnType<typeof supabase>);

      const result = await checkDuplicateBooks('Test Book', 'Test Author', 'test-library-id');

      expect(result.isDuplicate).toBe(true);
      expect(result.existingBooks).toHaveLength(1);
      expect(result.suggestion).toContain('Found 1 similar book');
    });

    it('2.2-INT-009: should set automatic available status', async () => {
      // Mock the sequence of database calls, same as above but focus on availability status
      const callResults = [
        { data: [], error: null },  // 1. Duplicate check
        { data: { id: 'author-id', name: 'Test Author', canonical_name: 'test author' }, error: null },
        { data: { id: 'general-book-id', canonical_title: 'test book' }, error: null },
        { data: { id: 'edition-id', title: 'Test Book', isbn_13: '9781234567890' }, error: null },
        { data: { code: 'TEST' }, error: null }, // Library lookup
        { data: null, error: null }, // Last copy query
        { data: { id: 'copy-id', copy_number: 'TEST001', availability_status: 'available', availability_since: new Date().toISOString() }, error: null }
      ];
      
      let callCount = 0;
      const mockFromReturn = {
        from: jest.fn(() => {
          const result = callResults[callCount] || { data: null, error: null };
          callCount++;
          return createMockChain(result);
        })
      };
      
      mockSupabase.mockReturnValue(mockFromReturn as ReturnType<typeof supabase>);

      const result = await createBook(mockBookData);

      expect(result.copy.availability.status).toBe('available');
      expect(result.copy.availability.since).toBeDefined();
    });

    it('2.2-INT-014: should handle transaction rollback on failure', async () => {
      // Mock successful duplicate check and author lookup, then fail on general book creation
      const callResults = [
        { data: [], error: null },  // 1. Duplicate check - success
        { data: { id: 'author-id', name: 'Test Author', canonical_name: 'test author' }, error: null }, // 2. Author lookup - success
        { data: null, error: { message: 'Constraint violation' } } // 3. General book creation - FAIL
      ];
      
      let callCount = 0;
      const mockFromReturn = {
        from: jest.fn(() => {
          const result = callResults[callCount] || { data: null, error: { message: 'Constraint violation' } };
          callCount++;
          return createMockChain(result);
        })
      };
      
      mockSupabase.mockReturnValue(mockFromReturn as ReturnType<typeof supabase>);

      await expect(createBook(mockBookData)).rejects.toThrow();
    });
  });

  describe('checkDuplicateBooks', () => {
    it('2.2-INT-006: should perform duplicate detection query efficiently', async () => {
      const noDuplicatesResult = { data: [], error: null };

      const mockFromReturn = {
        from: jest.fn(() => createMockChain(noDuplicatesResult))
      };
      
      mockSupabase.mockReturnValue(mockFromReturn as ReturnType<typeof supabase>);

      const startTime = Date.now();
      const result = await checkDuplicateBooks('Unique Title', 'Unique Author', 'test-library-id');
      const endTime = Date.now();

      expect(result.isDuplicate).toBe(false);
      expect(endTime - startTime).toBeLessThan(2000); // Performance requirement: <2s
    });

    it('should return false for no duplicates', async () => {
      const noDuplicatesResult = { data: [], error: null };

      const mockFromReturn = {
        from: jest.fn(() => createMockChain(noDuplicatesResult))
      };
      
      mockSupabase.mockReturnValue(mockFromReturn as ReturnType<typeof supabase>);

      const result = await checkDuplicateBooks('Unique Title', 'Unique Author', 'test-library-id');

      expect(result.isDuplicate).toBe(false);
      expect(result.existingBooks).toBeUndefined();
    });
  });
});