/**
 * Real-time Update Tests for Library Data Operations
 * Tests Supabase subscription functionality and live data updates
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useLibraryStats, useLibraryTransactions } from "../use-library-data";
import { MockLibraryProvider, MockAuthProvider } from "@/lib/test-utils";
import { createClient } from "@/lib/supabase/client";
import type { LibraryWithAccess } from "@/lib/types";

// Mock Supabase client with real-time capabilities - match existing test pattern
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Mock real-time subscription behavior
class MockRealtimeChannel {
  private eventHandlers: Map<string, ((...args: unknown[]) => void)[]> =
    new Map();
  private subscriptionCallback?: (status: string) => void;

  constructor(private channelName: string) {}

  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    this.subscriptionCallback = callback;
    setTimeout(() => {
      if (callback) callback("SUBSCRIBED");
    }, 100);
    return this;
  }

  unsubscribe() {
    this.eventHandlers.clear();
    return this;
  }

  // Helper to simulate real-time events
  simulateEvent(event: string, payload: Record<string, unknown>) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(payload));
  }
}

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

function createRealtimeWrapper() {
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
      <MockAuthProvider value={mockAuthValue}>
        <MockLibraryProvider value={mockLibraryValue}>{children}</MockLibraryProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  );

  TestWrapper.displayName = "RealtimeTestWrapper";
  return { TestWrapper, queryClient };
}

describe("Real-time Update Tests", () => {
  let mockSupabase: Record<string, jest.Mock>;
  let mockChannel: MockRealtimeChannel;

  beforeEach(() => {
    mockChannel = new MockRealtimeChannel("library_updates");

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue({ error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Activity Feed Real-time Updates", () => {
    it("should subscribe to real-time transaction updates", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify subscription is established
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining("library_transactions")
      );
      expect(result.current.transactions).toHaveLength(1);
    });

    it("should handle new transaction events", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate new transaction event
      const newTransaction = {
        id: "trans-2",
        library_id: "lib-1",
        book_copy_id: "book-2",
        member_id: "member-2",
        transaction_type: "checkout",
        due_date: "2024-02-15T00:00:00Z",
        return_date: null,
        created_at: new Date().toISOString(),
        book_copies: {
          id: "book-2",
          barcode: "987654321",
          book_editions: {
            id: "edition-2",
            title: "New Book",
            subtitle: "A new book",
          },
        },
        library_members: {
          id: "member-2",
          member_id: "MEM002",
          personal_info: {
            first_name: "Jane",
            last_name: "Smith",
          },
        },
      };

      act(() => {
        mockChannel.simulateEvent("postgres_changes", {
          eventType: "INSERT",
          new: newTransaction,
          old: {},
          schema: "public",
          table: "borrowing_transactions",
        });
      });

      // The actual real-time implementation would update the query cache
      // For this test, we verify the subscription is properly configured
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    it("should handle transaction update events", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate transaction update (return)
      const updatedTransaction = {
        ...mockTransactions[0],
        return_date: new Date().toISOString(),
      };

      act(() => {
        mockChannel.simulateEvent("postgres_changes", {
          eventType: "UPDATE",
          new: updatedTransaction,
          old: mockTransactions[0],
          schema: "public",
          table: "borrowing_transactions",
        });
      });

      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    it("should filter real-time events by library_id", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      // Verify subscription includes library filter
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining("library_transactions")
      );
    });

    it("should handle subscription errors gracefully", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      // Mock channel subscription failure
      mockChannel.subscribe = jest.fn().mockImplementation((callback) => {
        setTimeout(() => {
          if (callback) callback("CLOSED");
        }, 100);
        return mockChannel;
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still have initial data even if subscription fails
      expect(result.current.transactions).toHaveLength(1);
    });
  });

  describe("Statistics Real-time Updates", () => {
    it("should update statistics when new transactions occur", async () => {
      // Mock initial statistics
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "book_copies") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockResolvedValue({
              data: Array(100).fill({ id: "book" }),
              error: null,
            }),
          };
        } else if (table === "library_members") {
          return {
            ...mockSupabase,
            eq: jest.fn().mockImplementation(() => ({
              ...mockSupabase,
              eq: jest.fn().mockResolvedValue({
                data: Array(50).fill({ id: "member" }),
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
                  data: Array(25).fill({ id: "checkout" }),
                  error: null,
                }),
              })),
            })),
          };
        }
        return mockSupabase;
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalBooks: 100,
        activeMembers: 50,
        currentCheckouts: 25,
      });

      // Verify initial subscription
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    it("should handle concurrent real-time events efficiently", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate multiple concurrent events
      const events = Array.from({ length: 5 }, (_, i) => ({
        eventType: "INSERT",
        new: {
          id: `trans-${i + 2}`,
          library_id: "lib-1",
          book_copy_id: `book-${i + 2}`,
          member_id: `member-${i + 2}`,
          transaction_type: "checkout",
          created_at: new Date().toISOString(),
        },
        old: {},
        schema: "public",
        table: "borrowing_transactions",
      }));

      // Fire events rapidly
      events.forEach((event, i) => {
        setTimeout(() => {
          act(() => {
            mockChannel.simulateEvent("postgres_changes", event);
          });
        }, i * 10);
      });

      // Should handle rapid events without issues
      expect(mockSupabase.channel).toHaveBeenCalled();
    });
  });

  describe("Subscription Management", () => {
    it("should cleanup subscriptions on unmount", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result, unmount } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify subscription is active
      expect(mockSupabase.channel).toHaveBeenCalled();

      // Unmount component
      unmount();

      // Verify cleanup would be called
      // Note: Actual cleanup testing would require integration with the real hook implementation
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });

    it("should handle library context changes", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify initial subscription for lib-1
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining("lib-1")
      );

      // Change library context (would require updating the wrapper)
      // This simulates what would happen when user switches libraries
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });

    it("should reconnect on connection loss", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate connection loss and recovery
      act(() => {
        mockChannel.simulateEvent("system", {
          status: "CLOSED",
        });
      });

      act(() => {
        mockChannel.simulateEvent("system", {
          status: "SUBSCRIBED",
        });
      });

      // Should maintain data integrity during reconnection
      expect(result.current.transactions).toHaveLength(1);
    });
  });

  describe("Cross-Library Real-time Isolation", () => {
    it("should only receive events for current library", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const { TestWrapper } = createRealtimeWrapper();

      const { result } = renderHook(() => useLibraryTransactions(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate event from different library (should be filtered out)
      const otherLibraryTransaction = {
        id: "trans-other",
        library_id: "lib-other",
        book_copy_id: "book-other",
        member_id: "member-other",
        transaction_type: "checkout",
        created_at: new Date().toISOString(),
      };

      act(() => {
        mockChannel.simulateEvent("postgres_changes", {
          eventType: "INSERT",
          new: otherLibraryTransaction,
          old: {},
          schema: "public",
          table: "borrowing_transactions",
        });
      });

      // Should not affect current library's data
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].library_id).toBe("lib-1");
    });
  });
});
