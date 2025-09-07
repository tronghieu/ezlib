import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookCopyDetail, useDeleteBookCopy } from "../use-book-copy-detail";
import * as bookCopyApi from "@/lib/api/book-copy-detail";
import type { BookCopyUpdateData } from "@/lib/validation/book-copy";

// Mock the API functions
jest.mock("@/lib/api/book-copy-detail");

const mockFetchBookCopyDetail = bookCopyApi.fetchBookCopyDetail as jest.MockedFunction<
  typeof bookCopyApi.fetchBookCopyDetail
>;
const mockUpdateBookCopy = bookCopyApi.updateBookCopy as jest.MockedFunction<
  typeof bookCopyApi.updateBookCopy
>;
const mockSoftDeleteBookCopy = bookCopyApi.softDeleteBookCopy as jest.MockedFunction<
  typeof bookCopyApi.softDeleteBookCopy
>;

const mockBookCopyData = {
  id: "test-book-copy-id",
  library_id: "test-library-id",
  book_edition_id: "test-edition-id",
  copy_number: "A-001",
  barcode: "123456789",
  location: {
    shelf: "A1",
    section: "Fiction",
    call_number: "FIC-SMI-001",
  },
  condition_info: {
    condition: "good" as const,
    notes: "Some wear on cover",
    acquisition_date: "2024-01-15",
    last_maintenance: "2024-01-20",
  },
  availability: {
    status: "available" as const,
    since: "2024-01-20T00:00:00Z",
  },
  status: "active" as const,
  created_at: "2024-01-15T00:00:00Z",
  updated_at: "2024-01-20T00:00:00Z",
  book_edition: {
    id: "test-edition-id",
    general_book_id: "test-general-book-id",
    isbn_13: "9781234567890",
    title: "The Great Test Book",
    subtitle: "A Novel About Testing",
    language: "English",
    country: "US",
    edition_metadata: {
      publisher: "Test Publisher",
      publication_date: "2024-01-01",
      page_count: 300,
      cover_image_url: "https://example.com/cover.jpg",
      format: "Hardcover",
    },
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    authors: [
      {
        id: "author-1",
        name: "Jane Smith",
        biography: "A test author",
        birth_date: "1980-01-01",
        death_date: null,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
    ],
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useBookCopyDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch book copy detail successfully", async () => {
    mockFetchBookCopyDetail.mockResolvedValue(mockBookCopyData);

    const { result } = renderHook(
      () => useBookCopyDetail("test-id", "lib-123"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockBookCopyData);
    expect(result.current.error).toBe(null);
    expect(mockFetchBookCopyDetail).toHaveBeenCalledWith("test-id", "lib-123");
  });

  it("should handle fetch error", async () => {
    const mockError = new Error("Failed to fetch book copy");
    mockFetchBookCopyDetail.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useBookCopyDetail("test-id", "lib-123"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  it("should not fetch when parameters are missing", () => {
    const { result } = renderHook(
      () => useBookCopyDetail("", "lib-123"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockFetchBookCopyDetail).not.toHaveBeenCalled();
  });

  it("should update book copy successfully", async () => {
    const updateData: BookCopyUpdateData = {
      copy_number: "A-002",
      location: { shelf: "B1" },
      condition_info: { condition: "excellent" },
    };

    const updatedBookCopy = { ...mockBookCopyData, ...updateData };
    mockFetchBookCopyDetail.mockResolvedValue(mockBookCopyData);
    mockUpdateBookCopy.mockResolvedValue(updatedBookCopy);

    const { result } = renderHook(
      () => useBookCopyDetail("test-id", "lib-123"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateMutation = result.current.updateMutation;
    updateMutation.mutate(updateData);

    await waitFor(() => {
      expect(updateMutation.isSuccess).toBe(true);
    });

    expect(mockUpdateBookCopy).toHaveBeenCalledWith("test-id", updateData, "lib-123");
    expect(updateMutation.data).toEqual(updatedBookCopy);
  });

  it("should handle update error", async () => {
    const updateData: BookCopyUpdateData = {
      copy_number: "A-002",
      location: { shelf: "B1" },
      condition_info: { condition: "excellent" },
    };

    const mockError = new Error("Update failed");
    mockFetchBookCopyDetail.mockResolvedValue(mockBookCopyData);
    mockUpdateBookCopy.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useBookCopyDetail("test-id", "lib-123"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateMutation = result.current.updateMutation;
    updateMutation.mutate(updateData);

    await waitFor(() => {
      expect(updateMutation.isError).toBe(true);
    });

    expect(updateMutation.error).toEqual(mockError);
  });
});

describe("useDeleteBookCopy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete book copy successfully", async () => {
    mockSoftDeleteBookCopy.mockResolvedValue();

    const { result } = renderHook(
      () => useDeleteBookCopy(),
      { wrapper: createWrapper() }
    );

    const deleteData = {
      bookCopyId: "test-id",
      libraryId: "lib-123",
    };

    result.current.mutate(deleteData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSoftDeleteBookCopy).toHaveBeenCalledWith("test-id", "lib-123");
  });

  it("should handle delete error", async () => {
    const mockError = new Error("Delete failed");
    mockSoftDeleteBookCopy.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useDeleteBookCopy(),
      { wrapper: createWrapper() }
    );

    const deleteData = {
      bookCopyId: "test-id",
      libraryId: "lib-123",
    };

    result.current.mutate(deleteData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe("Query invalidation", () => {
  it("should invalidate related queries after successful update", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");
    const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const updateData: BookCopyUpdateData = {
      copy_number: "A-002",
      location: { shelf: "B1" },
      condition_info: { condition: "excellent" },
    };

    const updatedBookCopy = { ...mockBookCopyData, ...updateData };
    mockFetchBookCopyDetail.mockResolvedValue(mockBookCopyData);
    mockUpdateBookCopy.mockResolvedValue(updatedBookCopy);

    const { result } = renderHook(
      () => useBookCopyDetail("test-id", "lib-123"),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateMutation = result.current.updateMutation;
    updateMutation.mutate(updateData);

    await waitFor(() => {
      expect(updateMutation.isSuccess).toBe(true);
    });

    // Check that cache was updated
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ["book-copy-detail", "test-id", "lib-123"],
      updatedBookCopy
    );

    // Check that related queries were invalidated
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["books", "lib-123"] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["book-copies", "lib-123"] });
  });
});