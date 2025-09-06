/**
 * Unit Tests: useBookSearch hook
 * Tests the book search functionality with TanStack Query integration
 */

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookSearch } from "@/lib/hooks/use-book-search";
import { searchBookEditions } from "@/lib/api/book-editions";
import type { BookSearchResult } from "@/lib/types/books";

// Mock the API function
jest.mock("@/lib/api/book-editions");
const mockSearchBookEditions = searchBookEditions as jest.MockedFunction<typeof searchBookEditions>;

// Test data
const mockSearchResults: BookSearchResult[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    authors: ["F. Scott Fitzgerald"],
    publication_year: 1925,
    isbn_13: "9780743273565",
  },
  {
    id: "2", 
    title: "The Great Expectations",
    authors: ["Charles Dickens"],
    publication_year: 1861,
    isbn_13: "9780141439563",
  }
];

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const createWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useBookSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty state when search term is too short", () => {
    const { result } = renderHook(
      () => useBookSearch("ab", true),
      { wrapper: createWrapper() }
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(mockSearchBookEditions).not.toHaveBeenCalled();
  });

  it("should search books when search term is 3+ characters", async () => {
    mockSearchBookEditions.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(
      () => useBookSearch("great", true),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSearchBookEditions).toHaveBeenCalledWith("great");
    expect(result.current.data).toEqual(mockSearchResults);
  });

  it("should not search when disabled", () => {
    const { result } = renderHook(
      () => useBookSearch("great gatsby", false),
      { wrapper: createWrapper() }
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(mockSearchBookEditions).not.toHaveBeenCalled();
  });

  it("should handle search errors", async () => {
    const error = new Error("Search failed");
    mockSearchBookEditions.mockRejectedValue(error);

    const { result } = renderHook(
      () => useBookSearch("error test", true),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it("should use correct cache key and stale time", async () => {
    mockSearchBookEditions.mockResolvedValue(mockSearchResults);

    const { result, rerender } = renderHook(
      ({ searchTerm }) => useBookSearch(searchTerm, true),
      { 
        wrapper: createWrapper(),
        initialProps: { searchTerm: "gatsby" }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should fetch initially
    expect(mockSearchBookEditions).toHaveBeenCalledTimes(1);

    // Re-render with same search term should not refetch due to stale time
    rerender({ searchTerm: "gatsby" });
    expect(mockSearchBookEditions).toHaveBeenCalledTimes(1);

    // Different search term should trigger new fetch
    rerender({ searchTerm: "dickens" });
    await waitFor(() => {
      expect(mockSearchBookEditions).toHaveBeenCalledTimes(2);
    });
    expect(mockSearchBookEditions).toHaveBeenLastCalledWith("dickens");
  });

  it("should retry failed requests", async () => {
    mockSearchBookEditions
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue(mockSearchResults);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          retryDelay: 0,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useBookSearch("retry test", true),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have retried once
    expect(mockSearchBookEditions).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(mockSearchResults);
  });
});