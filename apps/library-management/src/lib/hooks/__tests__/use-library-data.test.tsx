/**
 * Tests for Library-Scoped Data Operations Hooks
 * Validates multi-tenant data isolation and library-aware operations
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useLibraryData,
  useLibraryBooks,
  useLibraryMembers,
  useLibraryTransactions,
  useLibraryStats,
} from "../use-library-data";
import { LibraryProvider } from "@/lib/contexts/library-context";
import { AuthProvider } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type { LibraryWithAccess } from "@/lib/types";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Test data
const mockUser = {
  id: "test-user-123",
  email: "test@library.com",
  created_at: "2024-01-01T00:00:00Z",
};

const mockLibrary: LibraryWithAccess = {
  id: "lib-1",
  name: "Test Library",
  code: "TEST-LIB",
  address: { city: "New York", state: "NY" },
  contact_info: { email: "test@library.com" },
  settings: {},
  stats: { total_books: 100 },
  status: "active",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_role: "admin",
  user_permissions: { manage_books: true },
  staff_id: "staff-1",
  staff_status: "active",
};

const mockBookCopies = [
  {
    id: "book-1",
    library_id: "lib-1",
    book_edition_id: "edition-1",
    barcode: "123456789",
    status: "available",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    book_editions: {
      id: "edition-1",
      title: "Test Book 1",
      subtitle: "A test book",
      isbn_10: "1234567890",
      isbn_13: "1234567890123",
      language: "en",
      general_books: {
        id: "gen-1",
        canonical_title: "Test Book",
        subjects: ["Fiction"],
      },
    },
  },
  {
    id: "book-2",
    library_id: "lib-1",
    book_edition_id: "edition-2",
    barcode: "987654321",
    status: "checked_out",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    book_editions: {
      id: "edition-2",
      title: "Test Book 2",
      subtitle: "Another test book",
      isbn_10: "0987654321",
      isbn_13: "0987654321098",
      language: "en",
      general_books: {
        id: "gen-2",
        canonical_title: "Another Test Book",
        subjects: ["Non-Fiction"],
      },
    },
  },
];

const mockMembers = [
  {
    id: "member-1",
    library_id: "lib-1",
    member_id: "MEM001",
    personal_info: {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "member-2",
    library_id: "lib-1",
    member_id: "MEM002",
    personal_info: {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
    },
    status: "active",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

const mockTransactions = [
  {
    id: "trans-1",
    library_id: "lib-1",
    book_copy_id: "book-1",
    member_id: "member-1",
    transaction_type: "checkout",
    due_date: "2024-02-01T00:00:00Z",
    return_date: null,
    created_at: "2024-01-15T00:00:00Z",
    book_copies: {
      id: "book-1",
      barcode: "123456789",
      book_editions: {
        id: "edition-1",
        title: "Test Book 1",
        subtitle: "A test book",
      },
    },
    library_members: {
      id: "member-1",
      member_id: "MEM001",
      personal_info: {
        first_name: "John",
        last_name: "Doe",
      },
    },
  },
];

// Helper to create wrapper with providers
function createWrapper({
  currentLibrary = mockLibrary,
  user = mockUser,
}: {
  currentLibrary?: LibraryWithAccess | null;
  user?: {
    id: string;
    email?: string;
    created_at: string;
  };
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock auth context
  const mockAuthValue = {
    user,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  };

  // Mock library context
  const mockLibraryValue = {
    currentLibrary,
    availableLibraries: currentLibrary ? [currentLibrary] : [],
    isLoading: false,
    error: null,
    selectLibrary: jest.fn(),
    refreshLibraries: jest.fn(),
    clearLibrarySelection: jest.fn(),
    switchLibrary: jest.fn(),
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider value={mockAuthValue}>
        <LibraryProvider value={mockLibraryValue}>{children}</LibraryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
}

describe("useLibraryData", () => {
  let mockSupabase: {
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Base Hook", () => {
    it("should provide current library and supabase client", () => {
      const { result } = renderHook(() => useLibraryData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentLibrary).toEqual(mockLibrary);
      expect(result.current.supabase).toBeDefined();
    });

    it("should throw error when no library selected", () => {
      const { result } = renderHook(() => useLibraryData(), {
        wrapper: createWrapper({ currentLibrary: null }),
      });

      expect(() => result.current.ensureLibrarySelected()).toThrow(
        "No library selected. Please select a library first."
      );
    });

    it("should return library when selected", () => {
      const { result } = renderHook(() => useLibraryData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.ensureLibrarySelected()).toEqual(mockLibrary);
    });
  });

  describe("useLibraryBooks", () => {
    it("should fetch books for current library", async () => {
      mockSupabase.order.mockResolvedValue({
        data: mockBookCopies,
        error: null,
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.books).toEqual(mockBookCopies);
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
    });

    it("should not fetch when no library selected", () => {
      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({ currentLibrary: null }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.books).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should add new book copy with library ID", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockBookCopies[0], id: "new-book" },
        error: null,
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.addBookCopy({
          book_edition_id: "edition-3",
          barcode: "111111111",
          status: "available",
        });
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          library_id: "lib-1",
          book_edition_id: "edition-3",
          barcode: "111111111",
          status: "available",
        })
      );
    });

    it("should update book copy with library validation", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockBookCopies[0], status: "lost" },
        error: null,
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.updateBookCopy({
          id: "book-1",
          updates: { status: "lost" },
        });
      });

      expect(mockSupabase.update).toHaveBeenCalledWith({ status: "lost" });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "book-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
    });

    it("should delete book copy with library validation", async () => {
      mockSupabase.delete.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.deleteBookCopy("book-1");
      });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "book-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
    });

    it("should handle fetch error", async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error("Fetch failed"),
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.books).toEqual([]);
    });
  });

  describe("useLibraryMembers", () => {
    it("should fetch members for current library", async () => {
      mockSupabase.order.mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const { result } = renderHook(() => useLibraryMembers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toEqual(mockMembers);
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "active");
    });

    it("should add new member with library ID", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockMembers[0], id: "new-member" },
        error: null,
      });

      const { result } = renderHook(() => useLibraryMembers(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.addMember({
          member_id: "MEM003",
          personal_info: {
            first_name: "Bob",
            last_name: "Johnson",
            email: "bob@example.com",
          },
          status: "active",
        });
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          library_id: "lib-1",
          member_id: "MEM003",
        })
      );
    });

    it("should update member with library validation", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockMembers[0], status: "suspended" },
        error: null,
      });

      const { result } = renderHook(() => useLibraryMembers(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.updateMember({
          id: "member-1",
          updates: { status: "suspended" },
        });
      });

      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: "suspended",
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "member-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
    });
  });

  describe("useLibraryTransactions", () => {
    it("should fetch transactions for current library", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transactions).toEqual(mockTransactions);
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
      expect(mockSupabase.limit).toHaveBeenCalledWith(100);
    });

    it("should create transaction with library ID", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTransactions[0],
        error: null,
      });

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.createTransaction({
          book_copy_id: "book-2",
          member_id: "member-2",
          transaction_type: "checkout",
          due_date: "2024-02-15T00:00:00Z",
        });
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          library_id: "lib-1",
          book_copy_id: "book-2",
          member_id: "member-2",
          transaction_type: "checkout",
        })
      );
    });

    it("should invalidate related queries after transaction", async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      mockSupabase.single.mockResolvedValue({
        data: mockTransactions[0],
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider
            value={{
              user: mockUser,
              isLoading: false,
              error: null,
              signIn: jest.fn(),
              signOut: jest.fn(),
              refreshSession: jest.fn(),
            }}
          >
            <LibraryProvider
              value={{
                currentLibrary: mockLibrary,
                availableLibraries: [mockLibrary],
                isLoading: false,
                error: null,
                selectLibrary: jest.fn(),
                refreshLibraries: jest.fn(),
                clearLibrarySelection: jest.fn(),
                switchLibrary: jest.fn(),
              }}
            >
              {children}
            </LibraryProvider>
          </AuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper,
      });

      await act(async () => {
        result.current.createTransaction({
          book_copy_id: "book-1",
          member_id: "member-1",
          transaction_type: "return",
        });
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["library-transactions", "lib-1"],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["library-books", "lib-1"],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["library-members", "lib-1"],
        });
      });
    });
  });

  describe("useLibraryStats", () => {
    it("should fetch library statistics", async () => {
      // Mock parallel queries
      mockSupabase.is.mockImplementation(() => ({
        data: [{ id: "trans-1" }],
        error: null,
      }));

      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "book_copies") {
          mockSupabase.eq.mockResolvedValueOnce({
            data: [{ id: "book-1" }, { id: "book-2" }],
            error: null,
          });
        } else if (table === "library_members") {
          mockSupabase.eq.mockResolvedValueOnce({
            data: [{ id: "member-1" }, { id: "member-2" }],
            error: null,
          });
        } else if (table === "borrowing_transactions") {
          mockSupabase.is.mockResolvedValueOnce({
            data: [{ id: "trans-1" }],
            error: null,
          });
        }
        return mockSupabase;
      });

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalBooks: 2,
        activeMembers: 2,
        currentCheckouts: 1,
      });
    });

    it("should return zeros when no data", async () => {
      mockSupabase.eq.mockResolvedValue({ data: [], error: null });
      mockSupabase.is.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalBooks: 0,
        activeMembers: 0,
        currentCheckouts: 0,
      });
    });

    it("should not fetch when no library selected", () => {
      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createWrapper({ currentLibrary: null }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.stats).toEqual({
        totalBooks: 0,
        activeMembers: 0,
        currentCheckouts: 0,
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.books).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle mutation errors", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          result.current.addBookCopy({
            book_edition_id: "edition-1",
            barcode: "123",
            status: "available",
          });
        })
      ).rejects.toThrow();
    });

    it("should prevent operations without library context", () => {
      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({ currentLibrary: null }),
      });

      expect(() => {
        result.current.addBookCopy({
          book_edition_id: "edition-1",
          barcode: "123",
          status: "available",
        });
      }).toThrow("No library selected. Please select a library first.");
    });
  });

  describe("Query Caching", () => {
    it("should use correct query keys for caching", async () => {
      mockSupabase.order.mockResolvedValue({
        data: mockBookCopies,
        error: null,
      });

      const queryClient = new QueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider
            value={{
              user: mockUser,
              isLoading: false,
              error: null,
              signIn: jest.fn(),
              signOut: jest.fn(),
              refreshSession: jest.fn(),
            }}
          >
            <LibraryProvider
              value={{
                currentLibrary: mockLibrary,
                availableLibraries: [mockLibrary],
                isLoading: false,
                error: null,
                selectLibrary: jest.fn(),
                refreshLibraries: jest.fn(),
                clearLibrarySelection: jest.fn(),
                switchLibrary: jest.fn(),
              }}
            >
              {children}
            </LibraryProvider>
          </AuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLibraryBooks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check if data is cached with correct key
      const cachedData = queryClient.getQueryData(["library-books", "lib-1"]);
      expect(cachedData).toEqual(mockBookCopies);
    });
  });

  // NEW: Critical multi-tenant isolation tests based on QA gaps
  describe("Multi-tenant Data Isolation (Critical Security Tests)", () => {
    it("should validate library_id is always included in statistics queries", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "book_copies") {
          mockSupabase.eq.mockResolvedValueOnce({
            data: [{ id: "book-1" }, { id: "book-2" }],
            error: null,
          });
        } else if (table === "library_members") {
          mockSupabase.eq.mockResolvedValueOnce({
            data: [{ id: "member-1" }],
            error: null,
          });
        } else if (table === "borrowing_transactions") {
          mockSupabase.is.mockResolvedValueOnce({
            data: [{ id: "trans-1" }],
            error: null,
          });
        }
        return mockSupabase;
      });

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify ALL queries include library_id filter
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
      expect(mockSupabase.eq).toHaveBeenCalledTimes(3); // books, members, transactions
    });

    it("should prevent data leakage between libraries", async () => {
      const library2: LibraryWithAccess = {
        ...mockLibrary,
        id: "lib-2",
        name: "Library 2",
        code: "TEST-LIB2",
      };

      mockSupabase.order.mockResolvedValue({
        data: mockBookCopies,
        error: null,
      });

      // Test with first library
      const { result: result1 } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({ currentLibrary: mockLibrary }),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");

      // Reset mocks
      jest.clearAllMocks();
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      // Test with second library - should use different library_id
      const { result: result2 } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({ currentLibrary: library2 }),
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-2");
      expect(mockSupabase.eq).not.toHaveBeenCalledWith("library_id", "lib-1");
    });

    it("should validate RLS policy enforcement simulation", async () => {
      // Simulate RLS blocking cross-library access
      mockSupabase.eq.mockImplementation((field: string, value: string) => {
        if (field === "library_id" && value !== "lib-1") {
          mockSupabase.order.mockResolvedValue({
            data: null,
            error: {
              message: "Row Level Security policy violation",
              code: "42501",
            },
          });
        }
        return mockSupabase;
      });

      const unauthorizedLibrary: LibraryWithAccess = {
        ...mockLibrary,
        id: "unauthorized-lib",
        code: "UNAUTH",
      };

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({ currentLibrary: unauthorizedLibrary }),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.books).toEqual([]);
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        "library_id",
        "unauthorized-lib"
      );
    });

    it("should ensure activity feed respects library boundaries", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify transactions query is scoped to library
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
      expect(result.current.transactions).toEqual(mockTransactions);

      // Ensure all returned transactions belong to the correct library
      result.current.transactions.forEach((transaction) => {
        expect(transaction.library_id).toBe("lib-1");
      });
    });
  });
});
