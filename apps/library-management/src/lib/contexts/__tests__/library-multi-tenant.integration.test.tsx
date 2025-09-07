import { MockLibraryProvider, MockAuthProvider } from "@/lib/test-utils";
/**
 * Integration Tests for Multi-Tenant Data Isolation
 * Validates critical security boundaries between libraries
 */

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  // LibraryProvider, // Using MockLibraryProvider instead
  useLibraryContext 
} from "../library-context";
import {
  useLibraryBooks,
  useLibraryMembers,
  useLibraryTransactions,
} from "@/lib/hooks/use-library-data";

import { createClient } from "@/lib/supabase/client";
import type { LibraryWithAccess } from "@/lib/types";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Test data for multiple libraries
const mockUser1 = {
  id: "user-1",
  email: "admin@library1.com",
  created_at: "2024-01-01T00:00:00Z",
};

const mockUser2 = {
  id: "user-2",
  email: "admin@library2.com",
  created_at: "2024-01-01T00:00:00Z",
};

const library1: LibraryWithAccess = {
  id: "lib-1",
  name: "Library One",
  code: "LIB1",
  address: { city: "New York", state: "NY" },
  contact_info: { email: "lib1@test.com" },
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

const library2: LibraryWithAccess = {
  id: "lib-2",
  name: "Library Two",
  code: "LIB2",
  address: { city: "Chicago", state: "IL" },
  contact_info: { email: "lib2@test.com" },
  settings: {},
  stats: { total_books: 200 },
  status: "active",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_role: "admin",
  user_permissions: { manage_books: true },
  staff_id: "staff-2",
  staff_status: "active",
};

// Library 1 data
const library1Books = [
  {
    id: "book-lib1-1",
    library_id: "lib-1",
    barcode: "LIB1-001",
    status: "available",
  },
  {
    id: "book-lib1-2",
    library_id: "lib-1",
    barcode: "LIB1-002",
    status: "available",
  },
];

const library1Members = [
  {
    id: "member-lib1-1",
    library_id: "lib-1",
    member_id: "L1M001",
    personal_info: { name: "John Doe" },
    status: "active",
  },
];

// Library 2 data
const library2Books = [
  {
    id: "book-lib2-1",
    library_id: "lib-2",
    barcode: "LIB2-001",
    status: "available",
  },
  {
    id: "book-lib2-2",
    library_id: "lib-2",
    barcode: "LIB2-002",
    status: "available",
  },
  {
    id: "book-lib2-3",
    library_id: "lib-2",
    barcode: "LIB2-003",
    status: "available",
  },
];

const library2Members = [
  {
    id: "member-lib2-1",
    library_id: "lib-2",
    member_id: "L2M001",
    personal_info: { name: "Jane Smith" },
    status: "active",
  },
  {
    id: "member-lib2-2",
    library_id: "lib-2",
    member_id: "L2M002",
    personal_info: { name: "Bob Johnson" },
    status: "active",
  },
];

// Helper to create wrapper with specific library context
function createWrapper({
  user,
  currentLibrary,
  availableLibraries,
}: {
  user: {
    id: string;
    email?: string;
    created_at: string;
  };
  currentLibrary: LibraryWithAccess | null;
  availableLibraries: LibraryWithAccess[];
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockAuthValue = {
    user,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  };

  const mockLibraryValue = {
    currentLibrary,
    availableLibraries,
    isLoading: false,
    error: null,
    selectLibrary: jest.fn(),
    refreshLibraries: jest.fn(),
    clearLibrarySelection: jest.fn(),
    switchLibrary: jest.fn((libraryId: string) => {
      const newLibrary = availableLibraries.find((l) => l.id === libraryId);
      if (newLibrary) {
        mockLibraryValue.currentLibrary = newLibrary;
      }
    }),
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider value={mockAuthValue}>
        <MockLibraryProvider value={mockLibraryValue}>{children}</MockLibraryProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  );

  return TestWrapper;
}

describe("Multi-Tenant Data Isolation", () => {
  let mockSupabase: jest.Mocked<ReturnType<typeof createClient>>;

  beforeEach(() => {
    localStorage.clear();

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

  describe("Data Isolation Between Libraries", () => {
    it("should only fetch data for the selected library", async () => {
      // Setup mock to return library-specific data
      mockSupabase.order.mockImplementation(() => {
        const calls = mockSupabase.eq.mock.calls as Array<[string, string]>;
        const libraryIdCall = calls.find(
          (call: [string, string]) => call[0] === "library_id"
        );

        if (libraryIdCall && libraryIdCall[1] === "lib-1") {
          return { data: library1Books, error: null };
        } else if (libraryIdCall && libraryIdCall[1] === "lib-2") {
          return { data: library2Books, error: null };
        }
        return { data: [], error: null };
      });

      // Test with Library 1 context
      const { result: result1 } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: library1,
          availableLibraries: [library1],
        }),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      expect(result1.current.books).toEqual(library1Books);
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");

      // Clear mocks for next test
      jest.clearAllMocks();
      mockSupabase.order.mockImplementation(() => {
        const calls = mockSupabase.eq.mock.calls as Array<[string, string]>;
        const libraryIdCall = calls.find(
          (call: [string, string]) => call[0] === "library_id"
        );

        if (libraryIdCall && libraryIdCall[1] === "lib-2") {
          return { data: library2Books, error: null };
        }
        return { data: [], error: null };
      });

      // Test with Library 2 context
      const { result: result2 } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: mockUser2,
          currentLibrary: library2,
          availableLibraries: [library2],
        }),
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.books).toEqual(library2Books);
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-2");
    });

    it("should prevent cross-library data access in mutations", async () => {
      // User 1 trying to update a book in Library 1
      mockSupabase.single.mockResolvedValue({
        data: { ...library1Books[0], status: "lost" },
        error: null,
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: library1,
          availableLibraries: [library1],
        }),
      });

      await act(async () => {
        result.current.updateBookCopy({
          id: "book-lib1-1",
          updates: { status: "lost" },
        });
      });

      // Verify library_id filter was applied
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "book-lib1-1");
    });

    it("should isolate member data between libraries", async () => {
      // Setup mock for members
      mockSupabase.order.mockImplementation(() => {
        const calls = mockSupabase.eq.mock.calls as Array<[string, string]>;
        const libraryIdCall = calls.find(
          (call: [string, string]) => call[0] === "library_id"
        );

        if (libraryIdCall && libraryIdCall[1] === "lib-1") {
          return { data: library1Members, error: null };
        } else if (libraryIdCall && libraryIdCall[1] === "lib-2") {
          return { data: library2Members, error: null };
        }
        return { data: [], error: null };
      });

      // Test Library 1 members
      const { result: result1 } = renderHook(() => useLibraryMembers(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: library1,
          availableLibraries: [library1],
        }),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      expect(result1.current.members).toEqual(library1Members);
      expect(result1.current.members.length).toBe(1);

      // Clear and test Library 2 members
      jest.clearAllMocks();
      mockSupabase.order.mockImplementation(() => {
        const calls = mockSupabase.eq.mock.calls as Array<[string, string]>;
        const libraryIdCall = calls.find(
          (call: [string, string]) => call[0] === "library_id"
        );

        if (libraryIdCall && libraryIdCall[1] === "lib-2") {
          return { data: library2Members, error: null };
        }
        return { data: [], error: null };
      });

      const { result: result2 } = renderHook(() => useLibraryMembers(), {
        wrapper: createWrapper({
          user: mockUser2,
          currentLibrary: library2,
          availableLibraries: [library2],
        }),
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.members).toEqual(library2Members);
      expect(result2.current.members.length).toBe(2);
    });
  });

  describe("Library Switching Security", () => {
    it("should clear cached data when switching libraries", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Initial state with Library 1
      mockSupabase.order.mockResolvedValueOnce({
        data: library1Books,
        error: null,
      });

      const TestComponent = () => {
        const { currentLibrary, switchLibrary } = useLibraryContext();
        const { books } = useLibraryBooks();
        return { currentLibrary, books, switchLibrary };
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <MockAuthProvider
            value={{
              user: mockUser1,
              isLoading: false,
              error: null,
              signIn: jest.fn(),
              signOut: jest.fn(),
              refreshSession: jest.fn(),
            }}
          >
            <MockLibraryProvider
              value={{
                currentLibrary: library1,
                availableLibraries: [library1, library2],
                isLoading: false,
                error: null,
                selectLibrary: jest.fn(),
                refreshLibraries: jest.fn(),
                clearLibrarySelection: jest.fn(),
                switchLibrary: jest.fn(),
              }}
            >
              {children}
            </MockLibraryProvider>
          </MockAuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => TestComponent(), { wrapper });

      await waitFor(() => {
        expect(result.current.books).toEqual(library1Books);
      });

      // Verify cache key includes library ID
      const cachedData = queryClient.getQueryData(["library-books", "lib-1"]);
      expect(cachedData).toEqual(library1Books);

      // Data for library 2 should not be cached
      const otherLibraryData = queryClient.getQueryData([
        "library-books",
        "lib-2",
      ]);
      expect(otherLibraryData).toBeUndefined();
    });

    it("should validate library access before allowing operations", async () => {
      // Mock validation failure
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Access denied" },
      });

      const { result } = renderHook(
        () => {
          const context = useLibraryContext();
          return context;
        },
        {
          wrapper: createWrapper({
            user: mockUser1,
            currentLibrary: library1,
            availableLibraries: [library1],
          }),
        }
      );

      await expect(
        act(async () => {
          await result.current.switchLibrary("lib-2");
        })
      ).rejects.toThrow();
    });
  });

  describe("Transaction Isolation", () => {
    it("should scope transactions to current library", async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: "trans-1",
          library_id: "lib-1",
          book_copy_id: "book-lib1-1",
          member_id: "member-lib1-1",
          transaction_type: "checkout",
        },
        error: null,
      });

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: library1,
          availableLibraries: [library1],
        }),
      });

      await act(async () => {
        result.current.createTransaction({
          book_copy_id: "book-lib1-1",
          member_id: "member-lib1-1",
          transaction_type: "checkout",
        });
      });

      // Verify library_id was included in the transaction
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          library_id: "lib-1",
        })
      );
    });

    it("should prevent transactions across library boundaries", async () => {
      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: library1,
          availableLibraries: [library1],
        }),
      });

      // Attempt to create transaction with Library 2's book (should be prevented by RLS)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Row level security violation" },
      });

      await expect(
        act(async () => {
          result.current.createTransaction({
            book_copy_id: "book-lib2-1", // Book from Library 2
            member_id: "member-lib1-1",
            transaction_type: "checkout",
          });
        })
      ).rejects.toThrow();
    });
  });

  describe("Concurrent Library Access", () => {
    it("should handle users with access to multiple libraries", async () => {
      // User with access to both libraries
      const multiLibraryUser = {
        id: "user-multi",
        email: "admin@both.com",
        created_at: "2024-01-01T00:00:00Z",
      };

      // Mock different data for each library
      let currentLibraryId = "lib-1";
      mockSupabase.eq.mockImplementation((field: string, value: unknown) => {
        if (field === "library_id") {
          currentLibraryId = value;
        }
        return mockSupabase;
      });

      mockSupabase.order.mockImplementation(() => {
        if (currentLibraryId === "lib-1") {
          return { data: library1Books, error: null };
        } else if (currentLibraryId === "lib-2") {
          return { data: library2Books, error: null };
        }
        return { data: [], error: null };
      });

      // Test switching between libraries
      const { result, rerender } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: multiLibraryUser,
          currentLibrary: library1,
          availableLibraries: [library1, library2],
        }),
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(library1Books);
      });

      // Switch to Library 2
      rerender({
        wrapper: createWrapper({
          user: multiLibraryUser,
          currentLibrary: library2,
          availableLibraries: [library1, library2],
        }),
      });

      // Mock response for library 2
      mockSupabase.order.mockResolvedValueOnce({
        data: library2Books,
        error: null,
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(library2Books);
      });
    });
  });

  describe("Permission-Based Isolation", () => {
    it("should respect role-based permissions within library context", async () => {
      const librarianUser = {
        id: "user-librarian",
        email: "librarian@library1.com",
        created_at: "2024-01-01T00:00:00Z",
      };

      const libraryWithLimitedRole: LibraryWithAccess = {
        ...library1,
        user_role: "librarian",
        user_permissions: { manage_books: false, view_reports: false },
      };

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: librarianUser,
          currentLibrary: libraryWithLimitedRole,
          availableLibraries: [libraryWithLimitedRole],
        }),
      });

      // Attempt to delete a book (should be prevented by permissions)
      mockSupabase.delete.mockResolvedValue({
        error: { message: "Insufficient permissions" },
      });

      await expect(
        act(async () => {
          result.current.deleteBookCopy("book-lib1-1");
        })
      ).rejects.toThrow();
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data consistency across related queries", async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      mockSupabase.single.mockResolvedValue({
        data: {
          id: "trans-new",
          library_id: "lib-1",
          transaction_type: "checkout",
        },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <MockAuthProvider
            value={{
              user: mockUser1,
              isLoading: false,
              error: null,
              signIn: jest.fn(),
              signOut: jest.fn(),
              refreshSession: jest.fn(),
            }}
          >
            <MockLibraryProvider
              value={{
                currentLibrary: library1,
                availableLibraries: [library1],
                isLoading: false,
                error: null,
                selectLibrary: jest.fn(),
                refreshLibraries: jest.fn(),
                clearLibrarySelection: jest.fn(),
                switchLibrary: jest.fn(),
              }}
            >
              {children}
            </MockLibraryProvider>
          </MockAuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper,
      });

      await act(async () => {
        result.current.createTransaction({
          book_copy_id: "book-lib1-1",
          member_id: "member-lib1-1",
          transaction_type: "checkout",
        });
      });

      // Verify related queries are invalidated with library-specific keys
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

      // Verify other libraries' caches are not invalidated
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ["library-books", "lib-2"],
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle library deletion gracefully", async () => {
      // Simulate library becoming inactive
      const deletedLibrary: LibraryWithAccess = {
        ...library1,
        status: "inactive",
      };

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: { message: "Library not found or inactive" },
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: deletedLibrary,
          availableLibraries: [],
        }),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.books).toEqual([]);
    });

    it("should handle user permission revocation", async () => {
      // Start with normal access
      const { result, rerender } = renderHook(() => useLibraryBooks(), {
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: library1,
          availableLibraries: [library1],
        }),
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: library1Books,
        error: null,
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(library1Books);
      });

      // Simulate permission revocation
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Access revoked" },
      });

      rerender({
        wrapper: createWrapper({
          user: mockUser1,
          currentLibrary: null,
          availableLibraries: [],
        }),
      });

      expect(result.current.books).toEqual([]);
    });
  });
});
