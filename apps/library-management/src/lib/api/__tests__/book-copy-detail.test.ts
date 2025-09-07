import {
  fetchBookCopyDetail,
  updateBookCopy,
  softDeleteBookCopy,
  checkBookCopyDeleteSafety,
} from "../book-copies";
import { fetchCirculationHistory } from "../borrowing-transactions";
import { supabase } from "@/lib/supabase/client";
import type { BookCopyUpdateData } from "@/lib/validation/book-copy";

// Mock the Supabase client
jest.mock("@/lib/supabase/client");

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

const mockFrom = {
  select: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  in: jest.fn(),
};

// Chain all the methods to return themselves for fluent interface
Object.keys(mockFrom).forEach(key => {
  if (key !== 'single') {
    mockFrom[key as keyof typeof mockFrom] = jest.fn().mockReturnThis();
  }
});

mockSupabase.from.mockReturnValue(mockFrom);
(supabase as jest.Mock).mockReturnValue(mockSupabase);

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
    condition: "good",
    notes: "Some wear on cover",
    acquisition_date: "2024-01-15",
    last_maintenance: "2024-01-20",
  },
  availability: {
    status: "available",
    since: "2024-01-20T00:00:00Z",
  },
  status: "active",
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

describe("book-copy-detail API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchBookCopyDetail", () => {
    it("should fetch book copy details successfully", async () => {
      mockFrom.single.mockResolvedValue({
        data: mockBookCopyData,
        error: null,
      });

      const result = await fetchBookCopyDetail("test-id", "lib-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("book_copies");
      expect(mockFrom.select).toHaveBeenCalledWith(expect.stringContaining("authors"));
      expect(mockFrom.eq).toHaveBeenCalledWith("id", "test-id");
      expect(mockFrom.eq).toHaveBeenCalledWith("library_id", "lib-123");
      expect(mockFrom.eq).toHaveBeenCalledWith("is_deleted", false);
      expect(result).toEqual(mockBookCopyData);
    });

    it("should throw error when book copy not found", async () => {
      mockFrom.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        fetchBookCopyDetail("non-existent-id", "lib-123")
      ).rejects.toThrow("Book copy not found");
    });

    it("should throw error when database query fails", async () => {
      const mockError = { message: "Database connection failed" };
      mockFrom.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        fetchBookCopyDetail("test-id", "lib-123")
      ).rejects.toThrow("Failed to fetch book copy: Database connection failed");
    });

    it("should throw error when book edition is missing", async () => {
      const dataWithoutEdition = { ...mockBookCopyData, book_edition: null };
      mockFrom.single.mockResolvedValue({
        data: dataWithoutEdition,
        error: null,
      });

      await expect(
        fetchBookCopyDetail("test-id", "lib-123")
      ).rejects.toThrow("Book edition not found for this copy");
    });
  });

  describe("updateBookCopy", () => {
    it("should update book copy successfully", async () => {
      const updateData: BookCopyUpdateData = {
        copy_number: "A-002",
        barcode: "987654321",
        shelf_location: "B1",
        section: "Non-fiction", 
        call_number: "NON-SMI-001",
        condition: "excellent",
        notes: "Recently maintained",
      };

      mockFrom.single.mockResolvedValue({
        data: { ...mockBookCopyData, ...updateData },
        error: null,
      });

      const result = await updateBookCopy("test-id", updateData, "lib-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("book_copies");
      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          copy_number: "A-002",
          barcode: "987654321",
          location: {
            shelf: "B1",
            section: "Non-fiction",
            call_number: "NON-SMI-001",
          },
          condition_info: expect.objectContaining({
            condition: "excellent",
            notes: "Recently maintained",
            last_maintenance: expect.any(String),
          }),
          updated_at: expect.any(String),
        })
      );
      expect(mockFrom.eq).toHaveBeenCalledWith("id", "test-id");
      expect(mockFrom.eq).toHaveBeenCalledWith("library_id", "lib-123");
      expect(mockFrom.eq).toHaveBeenCalledWith("is_deleted", false);
      expect(result).toMatchObject(updateData);
    });

    it("should throw error when update fails", async () => {
      const updateData: BookCopyUpdateData = {
        copy_number: "A-002",
        shelf_location: "B1",
        condition: "excellent",
      };

      const mockError = { message: "Update failed" };
      mockFrom.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        updateBookCopy("test-id", updateData, "lib-123")
      ).rejects.toThrow("Failed to update book copy: Update failed");
    });
  });

  describe("softDeleteBookCopy", () => {
    it("should soft delete book copy successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      mockFrom.update.mockResolvedValue({
        data: {},
        error: null,
      });

      await softDeleteBookCopy("test-id", "lib-123");

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("book_copies");
      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: true,
          deleted_at: expect.any(String),
          deleted_by: "user-123",
          updated_at: expect.any(String),
        })
      );
      expect(mockFrom.eq).toHaveBeenCalledWith("id", "test-id");
      expect(mockFrom.eq).toHaveBeenCalledWith("library_id", "lib-123");
      expect(mockFrom.eq).toHaveBeenCalledWith("is_deleted", false);
    });

    it("should throw error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        softDeleteBookCopy("test-id", "lib-123")
      ).rejects.toThrow("User not authenticated");
    });

    it("should throw error when delete fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockError = { message: "Delete failed" };
      mockFrom.update.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        softDeleteBookCopy("test-id", "lib-123")
      ).rejects.toThrow("Failed to delete book copy: Delete failed");
    });
  });

  describe("fetchCirculationHistory", () => {
    it("should fetch circulation history successfully", async () => {
      const mockHistory = [
        {
          id: "trans-1",
          transaction_type: "borrow",
          status: "returned",
          transaction_date: "2024-01-15T00:00:00Z",
          due_date: "2024-01-29T00:00:00Z",
          return_date: "2024-01-25T00:00:00Z",
          library_member: {
            member_id: "member-1",
            personal_info: { full_name: "John Doe" },
          },
        },
      ];

      // Mock the chain for circulation history query
      const mockHistoryFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockHistory, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockHistoryFrom);

      const result = await fetchCirculationHistory("test-id", "lib-123", 50);

      expect(mockSupabase.from).toHaveBeenCalledWith("borrowing_transactions");
      expect(mockHistoryFrom.select).toHaveBeenCalledWith(
        expect.stringContaining("library_member")
      );
      expect(mockHistoryFrom.eq).toHaveBeenCalledWith("book_copy_id", "test-id");
      expect(mockHistoryFrom.eq).toHaveBeenCalledWith("library_id", "lib-123");
      expect(mockHistoryFrom.order).toHaveBeenCalledWith("transaction_date", { ascending: false });
      expect(mockHistoryFrom.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockHistory);
    });

    it("should throw error when history fetch fails", async () => {
      const mockError = { message: "History fetch failed" };
      const mockHistoryFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabase.from.mockReturnValue(mockHistoryFrom);

      await expect(
        fetchCirculationHistory("test-id", "lib-123")
      ).rejects.toThrow("Failed to fetch circulation history: History fetch failed");
    });
  });

  describe("checkBookCopyDeleteSafety", () => {
    it("should return safe deletion status", async () => {
      // Mock active borrows query
      const mockBorrowsFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Mock book copy query
      const mockCopyFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { availability: { hold_queue: [] } },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockBorrowsFrom) // First call for borrowing_transactions
        .mockReturnValueOnce(mockCopyFrom); // Second call for book_copies

      const result = await checkBookCopyDeleteSafety("test-id", "lib-123");

      expect(result).toEqual({
        canDelete: true,
        activeBorrows: 0,
        activeHolds: 0,
        warnings: [],
      });
    });

    it("should return unsafe deletion status with warnings", async () => {
      // Mock active borrows query with active transactions
      const mockBorrowsFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ 
          data: [{ id: "trans-1" }], 
          error: null 
        }),
      };

      // Mock book copy query with holds
      const mockCopyFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { 
            availability: { 
              hold_queue: ["member-1", "member-2"] 
            } 
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockBorrowsFrom)
        .mockReturnValueOnce(mockCopyFrom);

      const result = await checkBookCopyDeleteSafety("test-id", "lib-123");

      expect(result).toEqual({
        canDelete: false,
        activeBorrows: 1,
        activeHolds: 2,
        warnings: [
          "1 active borrowing transaction(s)",
          "2 active hold(s) in queue",
        ],
      });
    });
  });
});