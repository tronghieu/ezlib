/**
 * Books Hooks Tests
 * Integration tests for useBooks and useBookSearch hooks
 */

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBooks, useBookSearch } from "../use-books";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { createClient } from "@/lib/supabase/client";

// Mock dependencies
jest.mock("@/lib/contexts/library-context");
jest.mock("@/lib/supabase/client");
jest.mock("../use-debounce", () => ({
  useDebounce: (value: unknown) => value, // Return value immediately for tests
}));

const mockUseLibraryContext = useLibraryContext as jest.MockedFunction<typeof useLibraryContext>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const mockSupabaseClient = {
  from: jest.fn(),
  channel: jest.fn(),
  removeChannel: jest.fn(),
};

interface MockQuery {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  or: jest.Mock;
}

const mockQuery: MockQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
  or: jest.fn(),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe("useBooks", () => {
  beforeEach(() => {
    // Mock library context
    mockUseLibraryContext.mockReturnValue({
      currentLibrary: {
        id: "lib-1",
        code: "test-lib", 
        name: "Test Library",
        address: {},
        contact_info: {},
        settings: {},
        stats: {},
        status: "active",
        created_at: "2023-01-01",
      },
    });

    // Mock Supabase client
    mockCreateClient.mockReturnValue(mockSupabaseClient as ReturnType<typeof createClient>);
    
    // Setup query chain
    mockSupabaseClient.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.range.mockReturnValue(mockQuery);
    mockQuery.or.mockReturnValue(mockQuery);

    // Mock channel subscription
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    };
    mockSupabaseClient.channel.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should fetch books for current library", async () => {
      const mockBooksData = [
        {
          id: "copy-1",
          availability: { status: "available" },
          book_editions: {
            id: "edition-1",
            isbn_13: "978-0123456789",
            edition_metadata: { publisher: "Test Publisher" },
            general_books: {
              id: "book-1",
              canonical_title: "Test Book",
              first_publication_year: 2023,
              subjects: ["Test Author"],
            },
          },
          borrowing_transactions: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockBooksData,
        error: null,
        count: 1,
      });

      const { result } = renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.books).toHaveLength(1);
      expect(result.current.books[0]).toMatchObject({
        id: "copy-1",
        title: "Test Book",
        author: "Test Author",
        status: "available",
        isbn: "978-0123456789",
        publicationYear: 2023,
      });
      expect(result.current.totalCount).toBe(1);
    });

    it("should handle pagination parameters", async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      renderHook(() => useBooks({ page: 2, pageSize: 25 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockQuery.range).toHaveBeenCalledWith(25, 49); // (page-1)*pageSize to page*pageSize-1
      });
    });

    it("should handle sorting parameters", async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      renderHook(() => useBooks({ sortBy: "title", sortOrder: "desc" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockQuery.order).toHaveBeenCalledWith(
          "book_editions.general_books.canonical_title",
          { ascending: false }
        );
      });
    });

    it("should not fetch when no library is selected", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: null,
      });

      const { result } = renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      expect(result.current.books).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle query errors", async () => {
      const mockError = new Error("Database error");
      mockQuery.range.mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
      });

      const { result } = renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.books).toEqual([]);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe("Real-time Subscriptions", () => {
    it("should set up real-time subscriptions", () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      mockSupabaseClient.channel.mockReturnValue(mockChannel);
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith("book_changes");
      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          table: "book_copies",
          filter: "library_id=eq.lib-1",
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe("Data Transformation", () => {
    it("should correctly transform book data", async () => {
      const mockBooksData = [
        {
          id: "copy-1",
          availability: { status: "available" },
          book_editions: {
            id: "edition-1",
            isbn_10: null,
            isbn_13: "978-0123456789",
            edition_metadata: { publisher: "Test Publisher" },
            general_books: {
              id: "book-1",
              canonical_title: "Test Book Title",
              first_publication_year: 2023,
              subjects: ["Primary Author", "Secondary Author"],
            },
          },
          borrowing_transactions: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockBooksData,
        error: null,
        count: 1,
      });

      const { result } = renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.books).toHaveLength(1);
      });

      const book = result.current.books[0];
      expect(book.title).toBe("Test Book Title");
      expect(book.author).toBe("Primary Author"); // Should use first subject
      expect(book.isbn).toBe("978-0123456789"); // Should prefer ISBN-13
      expect(book.status).toBe("available");
      expect(book.publicationYear).toBe(2023);
    });

    it("should handle checked out books", async () => {
      const mockBooksData = [
        {
          id: "copy-1",
          availability: { status: "checked_out" },
          book_editions: {
            id: "edition-1",
            isbn_13: "978-0123456789",
            edition_metadata: { publisher: "Test Publisher" },
            general_books: {
              id: "book-1",
              canonical_title: "Checked Out Book",
              first_publication_year: 2023,
              subjects: ["Author Name"],
            },
          },
          borrowing_transactions: [
            { id: "trans-1", return_date: null }, // Active checkout
          ],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockBooksData,
        error: null,
        count: 1,
      });

      const { result } = renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.books[0].status).toBe("checked_out");
      });
    });
  });
});

describe("useBookSearch", () => {
  beforeEach(() => {
    mockUseLibraryContext.mockReturnValue({
      currentLibrary: {
        id: "lib-1",
        code: "test-lib",
        name: "Test Library",
        address: {},
        contact_info: {},
        settings: {},
        stats: {},
        status: "active", 
        created_at: "2023-01-01",
      },
    });

    mockCreateClient.mockReturnValue(mockSupabaseClient as ReturnType<typeof createClient>);
    mockSupabaseClient.from.mockReturnValue(mockQuery as MockQuery);
    mockQuery.select.mockReturnValue(mockQuery as MockQuery);
    mockQuery.eq.mockReturnValue(mockQuery as MockQuery);
    mockQuery.or.mockReturnValue(mockQuery as MockQuery);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Search Functionality", () => {
    it("should search books by query", async () => {
      const mockSearchResults = [
        {
          id: "search-1",
          availability: { status: "available" },
          book_editions: {
            id: "edition-1",
            isbn_13: "978-1111111111",
            edition_metadata: { publisher: "Search Publisher" },
            general_books: {
              id: "book-1",
              canonical_title: "Searchable Book",
              first_publication_year: 2024,
              subjects: ["Search Author"],
            },
          },
          borrowing_transactions: [],
        },
      ];

      mockQuery.or.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      });

      const { result } = renderHook(
        () => useBookSearch({ query: "searchable", enabled: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
      });

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining("searchable")
      );
      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].title).toBe("Searchable Book");
    });

    it("should not search when query is empty", () => {
      const { result } = renderHook(
        () => useBookSearch({ query: "", enabled: true }),
        { wrapper: createWrapper() }
      );

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it("should not search when disabled", () => {
      const { result } = renderHook(
        () => useBookSearch({ query: "test", enabled: false }),
        { wrapper: createWrapper() }
      );

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it("should handle search errors", async () => {
      const mockError = new Error("Search failed");
      mockQuery.or.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(
        () => useBookSearch({ query: "test", enabled: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.searchError).toBeTruthy();
      });

      expect(result.current.searchResults).toEqual([]);
    });
  });
});