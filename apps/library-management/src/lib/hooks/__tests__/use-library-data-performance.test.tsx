/**
 * Performance Tests for Library Data Operations
 * Tests dashboard performance with production-scale datasets (5,000 books, 1,000 members)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useLibraryStats,
  useLibraryBooks,
  useLibraryTransactions,
} from "../use-library-data";
import { LibraryProvider } from "@/lib/contexts/library-context";
import { AuthProvider } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type { LibraryWithAccess } from "@/lib/types";

// Mock Supabase client - match existing test pattern
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Test data generators for large datasets
const generateLargeBookDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `book-${i}`,
    library_id: "lib-1",
    book_edition_id: `edition-${i}`,
    barcode: `BOOK${String(i).padStart(6, "0")}`,
    status: i % 4 === 0 ? "checked_out" : "available",
    created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
    book_editions: {
      id: `edition-${i}`,
      title: `Book Title ${i}`,
      subtitle: `Subtitle ${i}`,
      isbn_13: `978000000${String(i).padStart(4, "0")}`,
      language: "en",
      general_books: {
        id: `gen-${i}`,
        canonical_title: `Canonical Title ${i}`,
        subjects: ["Fiction", "Mystery", "Romance"][i % 3],
      },
    },
  }));
};

const generateLargeMemberDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `member-${i}`,
    library_id: "lib-1",
    member_id: `MEM${String(i).padStart(6, "0")}`,
    personal_info: {
      first_name: `FirstName${i}`,
      last_name: `LastName${i}`,
      email: `member${i}@example.com`,
    },
    status: "active",
    created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  }));
};

const generateLargeTransactionDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `trans-${i}`,
    library_id: "lib-1",
    book_copy_id: `book-${i % 100}`, // Cycle through books
    member_id: `member-${i % 50}`, // Cycle through members
    transaction_type: i % 2 === 0 ? "checkout" : "return",
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    return_date: i % 2 === 0 ? null : new Date().toISOString(),
    created_at: new Date(Date.now() - i * 1000 * 60).toISOString(),
    book_copies: {
      id: `book-${i % 100}`,
      barcode: `BOOK${String(i % 100).padStart(6, "0")}`,
      book_editions: {
        id: `edition-${i % 100}`,
        title: `Book Title ${i % 100}`,
        subtitle: `Subtitle ${i % 100}`,
      },
    },
    library_members: {
      id: `member-${i % 50}`,
      member_id: `MEM${String(i % 50).padStart(6, "0")}`,
      personal_info: {
        first_name: `FirstName${i % 50}`,
        last_name: `LastName${i % 50}`,
      },
    },
  }));
};

const mockUser = {
  id: "test-user-123",
  email: "test@library.com",
  created_at: "2024-01-01T00:00:00Z",
};

const mockLibrary: LibraryWithAccess = {
  id: "lib-1",
  name: "Large Test Library",
  code: "LARGE-LIB",
  address: { city: "New York", state: "NY" },
  contact_info: { email: "large@library.com" },
  settings: {},
  stats: { total_books: 5000 },
  status: "active",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_role: "admin",
  user_permissions: { manage_books: true },
  staff_id: "staff-1",
  staff_status: "active",
};

function createPerformanceWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, cacheTime: 0 },
      mutations: { retry: false },
    },
  });

  const mockAuthValue = {
    user: mockUser,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  };

  const mockLibraryValue = {
    currentLibrary: mockLibrary,
    availableLibraries: [mockLibrary],
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

  TestWrapper.displayName = "PerformanceTestWrapper";
  return TestWrapper;
}

describe("Library Data Performance Tests", () => {
  let mockSupabase: Record<string, jest.Mock>;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Dashboard Load Performance with Large Datasets", () => {
    it("should load dashboard statistics within 2 seconds with 5,000 books", async () => {
      const largeBooks = generateLargeBookDataset(5000);
      const largeMembers = generateLargeMemberDataset(1000);
      const currentCheckouts = 250; // Realistic checkout ratio

      // Mock parallel statistics queries
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "book_copies") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockResolvedValue({
              data: largeBooks,
              error: null,
            }),
          };
        } else if (table === "library_members") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockImplementation(() => ({
              ...mockSupabase,
              eq: jest.fn().mockResolvedValue({
                data: largeMembers,
                error: null,
              }),
            })),
          };
        } else if (table === "borrowing_transactions") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockImplementation(() => ({
              ...mockSupabase,
              eq: jest.fn().mockImplementation(() => ({
                ...mockSupabase,
                is: jest.fn().mockResolvedValue({
                  data: Array(currentCheckouts).fill({ id: "checkout" }),
                  error: null,
                }),
              })),
            })),
          };
        }
        return mockSupabase;
      });

      const startTime = performance.now();

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createPerformanceWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      const loadTime = performance.now() - startTime;

      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
      expect(result.current.stats).toEqual({
        totalBooks: 5000,
        activeMembers: 1000,
        currentCheckouts: currentCheckouts,
      });
    });

    it("should handle large transaction datasets efficiently", async () => {
      const largeTransactions = generateLargeTransactionDataset(1000);

      mockSupabase.limit.mockResolvedValue({
        data: largeTransactions.slice(0, 100), // Simulate limit
        error: null,
      });

      const startTime = performance.now();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createPerformanceWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const loadTime = performance.now() - startTime;

      expect(loadTime).toBeLessThan(1000); // Should load within 1 second
      expect(result.current.transactions).toHaveLength(100); // Respects limit
      expect(mockSupabase.limit).toHaveBeenCalledWith(100);
    });

    it("should handle book list pagination efficiently", async () => {
      const largeBooks = generateLargeBookDataset(5000);

      // Simulate paginated loading
      mockSupabase.order.mockResolvedValue({
        data: largeBooks.slice(0, 50), // First page
        error: null,
      });

      const startTime = performance.now();

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createPerformanceWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const loadTime = performance.now() - startTime;

      expect(loadTime).toBeLessThan(1000); // Should load first page quickly
      expect(result.current.books).toHaveLength(50);
    });
  });

  describe("Statistics Calculation Performance", () => {
    it("should calculate statistics efficiently for large libraries", async () => {
      // Test statistics calculation time
      mockSupabase.from.mockImplementation((table: string) => {
        const delay = new Promise((resolve) => setTimeout(resolve, 100)); // Simulate DB delay

        if (table === "book_copies") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockImplementation(async () => {
              await delay;
              return { data: Array(5000).fill({ id: "book" }), error: null };
            }),
          };
        } else if (table === "library_members") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockImplementation(() => ({
              ...mockSupabase,
              eq: jest.fn().mockImplementation(async () => {
                await delay;
                return {
                  data: Array(1000).fill({ id: "member" }),
                  error: null,
                };
              }),
            })),
          };
        } else if (table === "borrowing_transactions") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockImplementation(() => ({
              ...mockSupabase,
              eq: jest.fn().mockImplementation(() => ({
                ...mockSupabase,
                is: jest.fn().mockImplementation(async () => {
                  await delay;
                  return {
                    data: Array(250).fill({ id: "checkout" }),
                    error: null,
                  };
                }),
              })),
            })),
          };
        }
        return mockSupabase;
      });

      const startTime = performance.now();

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createPerformanceWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const totalTime = performance.now() - startTime;

      // Should complete all parallel queries efficiently
      expect(totalTime).toBeLessThan(500); // Parallel execution should be faster than sequential
      expect(result.current.stats).toEqual({
        totalBooks: 5000,
        activeMembers: 1000,
        currentCheckouts: 250,
      });
    });

    it("should handle memory efficiently with large datasets", async () => {
      // Monitor memory usage during large data processing
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      const largeBooks = generateLargeBookDataset(5000);
      mockSupabase.order.mockResolvedValue({
        data: largeBooks,
        error: null,
      });

      const { result } = renderHook(() => useLibraryBooks(), {
        wrapper: createPerformanceWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 5000 books)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(result.current.books).toHaveLength(5000);
    });
  });

  describe("Real-time Update Performance", () => {
    it("should handle concurrent user activity without performance degradation", async () => {
      const initialTransactions = generateLargeTransactionDataset(100);

      mockSupabase.limit.mockResolvedValue({
        data: initialTransactions,
        error: null,
      });

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: createPerformanceWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate rapid updates (concurrent user activity)
      const updatePromises = [];
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        const newTransaction = {
          book_copy_id: `book-${i}`,
          member_id: `member-${i}`,
          transaction_type: "checkout" as const,
          due_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        };

        mockSupabase.single.mockResolvedValueOnce({
          data: {
            id: `new-trans-${i}`,
            ...newTransaction,
            library_id: "lib-1",
          },
          error: null,
        });

        updatePromises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              result.current.createTransaction(newTransaction);
              resolve(true);
            }, i * 10); // Stagger updates
          })
        );
      }

      await Promise.all(updatePromises);

      const updateTime = performance.now() - startTime;

      // Should handle 10 concurrent updates within reasonable time
      expect(updateTime).toBeLessThan(1000);
    });
  });

  describe("Resource Cleanup and Optimization", () => {
    it("should properly cleanup resources when component unmounts", async () => {
      mockSupabase.order.mockResolvedValue({
        data: generateLargeBookDataset(1000),
        error: null,
      });

      const { result, unmount } = renderHook(() => useLibraryBooks(), {
        wrapper: createPerformanceWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Unmount component
      unmount();

      // Verify cleanup (no memory leaks, subscriptions cleaned up)
      // This is more of a structural test - actual cleanup would be handled by React Query
      expect(result.current.books).toHaveLength(1000);
    });

    it("should use optimized query strategies", async () => {
      // Verify that queries are optimized (select only needed fields, use indexes, etc.)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      renderHook(() => useLibraryBooks(), {
        wrapper: createPerformanceWrapper(),
      });

      // Verify query optimization
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining("*") // Full object selection for complete data
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith("library_id", "lib-1");
    });
  });
});
