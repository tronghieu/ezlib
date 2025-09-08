/**
 * Unit Tests: useCreateBookEdition and useCreateBookCopies hooks
 * Tests the book creation mutations with proper query invalidation
 */

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateBookEdition, useCreateBookCopies } from "@/lib/hooks/use-book-management";
import { createBookEdition } from "@/lib/api/book-editions";
import { createBookCopies } from "@/lib/api/book-copies";
import type { BookEdition, BookCopy, BookEditionFormData, BookCopyFormData } from "@/types/books";

// Mock the API functions
jest.mock("@/lib/api/book-editions");
jest.mock("@/lib/api/book-copies");
const mockCreateBookEdition = createBookEdition as jest.MockedFunction<typeof createBookEdition>;
const mockCreateBookCopies = createBookCopies as jest.MockedFunction<typeof createBookCopies>;

// Test data
const mockBookEdition: BookEdition = {
  id: "edition-1",
  general_book_id: "book-1",
  title: "Test Book",
  language: "en",
  isbn_13: "9781234567890",
  subtitle: null,
  country: null,
  edition_metadata: {
    publication_date: "2023",
    publisher: "Test Publisher",
  },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  authors: [
    {
      id: "author-1",
      name: "Test Author",
      canonical_name: "test author",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    }
  ],
};

const mockBookCopies: BookCopy[] = [
  {
    id: "copy-1",
    library_id: "library-1",
    book_edition_id: "edition-1",
    copy_number: "001",
    location: {
      shelf: "A1",
      section: "Fiction", 
      call_number: "813.54 TES",
    },
    condition_info: {
      condition: "good",
      notes: "Test notes",
      acquisition_date: "2023-01-01T00:00:00Z",
      acquisition_price: undefined,
      last_maintenance: undefined,
    },
    availability: {
      status: "available",
      since: "2023-01-01T00:00:00Z",
      current_borrower_id: undefined,
      due_date: undefined,
      hold_queue: [],
    },
    status: "active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }
];

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

const createWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useCreateBookEdition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create book edition successfully", async () => {
    mockCreateBookEdition.mockResolvedValue(mockBookEdition);

    const { result } = renderHook(
      () => useCreateBookEdition(),
      { wrapper: createWrapper() }
    );

    const editionData: BookEditionFormData = {
      title: "Test Book",
      language: "en",
      author_id: "author-1",
      isbn: "9781234567890",
      publication_year: 2023,
      publisher: "Test Publisher",
    };

    result.current.mutate(editionData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateBookEdition).toHaveBeenCalledWith(editionData);
    expect(result.current.data).toEqual(mockBookEdition);
  });

  it("should handle creation errors", async () => {
    const error = new Error("Creation failed");
    mockCreateBookEdition.mockRejectedValue(error);

    const { result } = renderHook(
      () => useCreateBookEdition(),
      { wrapper: createWrapper() }
    );

    const editionData: BookEditionFormData = {
      title: "Test Book",
      language: "en", 
      author_id: "author-1",
    };

    result.current.mutate(editionData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("should invalidate book search queries on success", async () => {
    const queryClient = createQueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
    
    mockCreateBookEdition.mockResolvedValue(mockBookEdition);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useCreateBookEdition(),
      { wrapper }
    );

    const editionData: BookEditionFormData = {
      title: "Test Book",
      language: "en",
      author_id: "author-1",
    };

    result.current.mutate(editionData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["book-search"] });
  });
});

describe("useCreateBookCopies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create book copies successfully", async () => {
    mockCreateBookCopies.mockResolvedValue(mockBookCopies);

    const { result } = renderHook(
      () => useCreateBookCopies(),
      { wrapper: createWrapper() }
    );

    const copyData: BookCopyFormData = {
      total_copies: 1,
      shelf_location: "A1",
      section: "Fiction",
      call_number: "813.54 TES",
      condition: "good",
      notes: "Test notes",
    };

    const mutationData = {
      editionId: "edition-1",
      libraryId: "library-1",
      copyData,
    };

    result.current.mutate(mutationData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateBookCopies).toHaveBeenCalledWith("edition-1", "library-1", copyData);
    expect(result.current.data).toEqual(mockBookCopies);
  });

  it("should handle copy creation errors", async () => {
    const error = new Error("Copy creation failed");
    mockCreateBookCopies.mockRejectedValue(error);

    const { result } = renderHook(
      () => useCreateBookCopies(),
      { wrapper: createWrapper() }
    );

    const mutationData = {
      editionId: "edition-1",
      libraryId: "library-1", 
      copyData: {
        total_copies: 1,
        condition: "good" as const,
      },
    };

    result.current.mutate(mutationData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("should invalidate library queries on success", async () => {
    const queryClient = createQueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
    
    mockCreateBookCopies.mockResolvedValue(mockBookCopies);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useCreateBookCopies(),
      { wrapper }
    );

    const mutationData = {
      editionId: "edition-1",
      libraryId: "library-1",
      copyData: {
        total_copies: 1,
        condition: "good" as const,
      },
    };

    result.current.mutate(mutationData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["library-books", "library-1"]
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["book-copies", "edition-1", "library-1"]
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["library-edition-counts", "library-1"]
    });
  });

  it("should show loading state during mutation", () => {
    const { result } = renderHook(
      () => useCreateBookCopies(),
      { wrapper: createWrapper() }
    );

    expect(result.current.isPending).toBe(false);

    const mutationData = {
      editionId: "edition-1",
      libraryId: "library-1",
      copyData: {
        total_copies: 1,
        condition: "good" as const,
      },
    };

    result.current.mutate(mutationData);

    expect(result.current.isPending).toBe(true);
  });
});