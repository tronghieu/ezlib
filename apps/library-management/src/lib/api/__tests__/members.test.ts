/**
 * Member API Integration Tests
 * 
 * Tests all member CRUD operations with database integration
 * Covers: creation, search, profile fetching, updates, duplicate detection
 */

import {
  generateMemberID,
  checkDuplicateEmail,
  createMember,
  createMemberWithInvitation,
  fetchMembers,
  fetchMemberProfile,
  updateMember,
  updateMemberStatus,
  deleteMember,
} from "@/lib/api/members";
import type {
  MemberRegistrationData,
  MemberUpdateData,
  LibraryMember,
} from "@/types/members";
import { createMemberInvitation } from "@/lib/api/invitations";

// Mock entire Supabase client module
jest.mock("@/lib/supabase/client", () => ({
  supabase: jest.fn(),
}));

// Mock invitation API
jest.mock("@/lib/api/invitations", () => ({
  createMemberInvitation: jest.fn(),
}));

import { supabase } from "@/lib/supabase/client";

const mockLibraryId = "lib-123";
const mockUserId = "user-456";
const mockInviterName = "John Librarian";

// Test data
const mockMemberData: MemberRegistrationData = {
  first_name: "Jane",
  last_name: "Doe",
  email: "jane.doe@example.com",
  phone: "+1234567890",
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    postal_code: "12345",
  },
  membership_type: "regular",
  membership_notes: "New member",
};

const mockLibraryMember: LibraryMember = {
  id: "member-789",
  member_id: "M001",
  library_id: mockLibraryId,
  personal_info: {
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    phone: "+1234567890",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      postal_code: "12345",
    },
  },
  membership_info: {
    type: "regular",
    fees_owed: 0,
    notes: "New member",
  },
  borrowing_stats: {
    current_loans: 0,
    total_books_borrowed: 0,
    overdue_items: 0,
    total_late_fees: 0,
  },
  status: "active",
  is_deleted: false,
  created_at: "2025-01-09T12:00:00Z",
  updated_at: "2025-01-09T12:00:00Z",
};

describe("Member API - Integration Tests", () => {
  // Setup mock functions for each test
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockNeq: jest.Mock;
  let mockOr: jest.Mock;
  let mockOrder: jest.Mock;
  let mockRange: jest.Mock;
  let mockSingle: jest.Mock;
  let mockMaybeSingle: jest.Mock;
  let mockHead: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock functions for each test
    mockSelect = jest.fn().mockReturnThis();
    mockInsert = jest.fn().mockReturnThis();
    mockUpdate = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockNeq = jest.fn().mockReturnThis();
    mockOr = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnThis();
    mockRange = jest.fn().mockReturnThis();
    mockSingle = jest.fn();
    mockMaybeSingle = jest.fn();
    mockHead = jest.fn();

    // Create mock Supabase chain
    const mockSupabaseChain = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      neq: mockNeq,
      or: mockOr,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      head: mockHead,
    };

    mockFrom = jest.fn().mockReturnValue(mockSupabaseChain);

    (supabase as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  describe("generateMemberID", () => {
    it("should generate member ID with proper format", async () => {
      mockHead.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      const result = await generateMemberID(mockLibraryId);

      expect(result).toBe("M006");
      expect(mockFrom).toHaveBeenCalledWith("library_members");
      expect(mockSelect).toHaveBeenCalledWith("id", {
        count: "exact",
        head: true,
      });
      expect(mockEq).toHaveBeenCalledWith("library_id", mockLibraryId);
      expect(mockEq).toHaveBeenCalledWith("is_deleted", false);
    });

    it("should handle first member (count = 0)", async () => {
      mockHead.mockResolvedValueOnce({
        count: 0,
        error: null,
      });

      const result = await generateMemberID(mockLibraryId);

      expect(result).toBe("M001");
    });

    it("should handle null count", async () => {
      mockHead.mockResolvedValueOnce({
        count: null,
        error: null,
      });

      const result = await generateMemberID(mockLibraryId);

      expect(result).toBe("M001");
    });

    it("should properly format member IDs with padding", async () => {
      mockHead.mockResolvedValueOnce({ count: 5, error: null });
      const result = await generateMemberID(mockLibraryId);
      expect(result).toMatch(/^M\d{3}$/); // M followed by exactly 3 digits
      expect(result).toBe("M006");
    });

    it("should handle member ID generation edge cases", async () => {
      // Test high count
      mockHead.mockResolvedValueOnce({ count: 999, error: null });
      const result = await generateMemberID(mockLibraryId);
      expect(result).toBe("M1000");
    });

    it("should throw error on database failure", async () => {
      mockHead.mockResolvedValueOnce({
        count: null,
        error: { message: "Database connection failed" },
      });

      await expect(generateMemberID(mockLibraryId)).rejects.toThrow(
        "Failed to generate member ID: Database connection failed"
      );
    });
  });

  describe("checkDuplicateEmail", () => {
    it("should return true when email exists", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: "existing-member" },
        error: null,
      });

      const result = await checkDuplicateEmail(
        mockLibraryId,
        "existing@example.com"
      );

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("library_members");
      expect(mockEq).toHaveBeenCalledWith(
        "personal_info->>email",
        "existing@example.com"
      );
    });

    it("should return false when email does not exist", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await checkDuplicateEmail(
        mockLibraryId,
        "new@example.com"
      );

      expect(result).toBe(false);
    });

    it("should exclude specific member ID when checking", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await checkDuplicateEmail(
        mockLibraryId,
        "test@example.com",
        "exclude-member-id"
      );

      expect(mockNeq).toHaveBeenCalledWith(
        "id",
        "exclude-member-id"
      );
    });

    it("should handle PGRST116 error as no match", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await checkDuplicateEmail(
        mockLibraryId,
        "test@example.com"
      );

      expect(result).toBe(false);
    });

    it("should throw error on other database errors", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "OTHER_ERROR", message: "Connection failed" },
      });

      await expect(
        checkDuplicateEmail(mockLibraryId, "test@example.com")
      ).rejects.toThrow("Failed to check duplicate email: Connection failed");
    });

    it("should differentiate between not found and other errors", async () => {
      // PGRST116 is "not found" - should not throw
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await checkDuplicateEmail(mockLibraryId, "test@example.com");
      expect(result).toBe(false);

      // Other errors should throw
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "OTHER_ERROR", message: "Real error" },
      });

      await expect(
        checkDuplicateEmail(mockLibraryId, "test@example.com")
      ).rejects.toThrow("Failed to check duplicate email: Real error");
    });
  });

  describe("createMember", () => {
    beforeEach(() => {
      // Default mocks for duplicate email check (no duplicate)
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Default mock for member ID generation
      mockHead.mockResolvedValueOnce({
        count: 0,
        error: null,
      });
    });

    it("should create member successfully", async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockLibraryMember,
        error: null,
      });

      const result = await createMember(mockMemberData, mockLibraryId);

      expect(result).toEqual(mockLibraryMember);
      expect(mockFrom).toHaveBeenCalledWith("library_members");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          library_id: mockLibraryId,
          member_id: "M001",
          personal_info: expect.objectContaining({
            first_name: "Jane",
            last_name: "Doe",
            email: "jane.doe@example.com",
          }),
          status: "active",
          is_deleted: false,
        })
      );
    });

    it("should use provided member ID instead of generating", async () => {
      const memberDataWithId = { ...mockMemberData, member_id: "M999" };

      mockSingle.mockResolvedValueOnce({
        data: { ...mockLibraryMember, member_id: "M999" },
        error: null,
      });

      const result = await createMember(memberDataWithId, mockLibraryId);

      expect(result.member_id).toBe("M999");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          member_id: "M999",
        })
      );
    });

    it("should throw error when email already exists", async () => {
      // Override the beforeEach mock to simulate duplicate email
      mockMaybeSingle.mockReset();
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: "existing-member" },
        error: null,
      });

      await expect(createMember(mockMemberData, mockLibraryId)).rejects.toThrow(
        "A member with this email address already exists"
      );
    });

    it("should throw error on database failure", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(createMember(mockMemberData, mockLibraryId)).rejects.toThrow(
        "Failed to create member: Insert failed"
      );
    });

    it("should handle constraint violations", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Duplicate key violation" },
      });

      await expect(createMember(mockMemberData, mockLibraryId)).rejects.toThrow(
        "Failed to create member: Duplicate key violation"
      );
    });
  });

  describe("createMemberWithInvitation", () => {
    beforeEach(() => {
      // Default mocks for duplicate email check (no duplicate)
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Default mock for member ID generation
      mockHead.mockResolvedValueOnce({
        count: 0,
        error: null,
      });
    });

    it("should create member and invitation successfully", async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockLibraryMember,
        error: null,
      });

      // Mock invitation creation
      (createMemberInvitation as jest.Mock).mockResolvedValueOnce({
        id: "invitation-123",
        email: mockMemberData.email,
      });

      const result = await createMemberWithInvitation(
        mockMemberData,
        mockLibraryId,
        mockUserId,
        mockInviterName
      );

      expect(result).toEqual(mockLibraryMember);
      expect(createMemberInvitation).toHaveBeenCalledWith(
        mockLibraryId,
        mockUserId,
        mockMemberData.email,
        mockInviterName,
        "Welcome to the library! Your member ID is M001."
      );
    });

    it("should succeed even if invitation creation fails", async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockLibraryMember,
        error: null,
      });

      // Mock invitation creation failure
      (createMemberInvitation as jest.Mock).mockRejectedValueOnce(
        new Error("Invitation failed")
      );

      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = await createMemberWithInvitation(
        mockMemberData,
        mockLibraryId,
        mockUserId,
        mockInviterName
      );

      expect(result).toEqual(mockLibraryMember);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to create member invitation:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("fetchMembers", () => {
    const mockMembersList = [mockLibraryMember];

    it("should fetch members with default parameters", async () => {
      mockRange.mockResolvedValueOnce({
        data: mockMembersList,
        error: null,
        count: 1,
      });

      const result = await fetchMembers(mockLibraryId);

      expect(result).toEqual({
        members: mockMembersList,
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });
      expect(mockFrom).toHaveBeenCalledWith("library_members");
      expect(mockEq).toHaveBeenCalledWith("library_id", mockLibraryId);
      expect(mockEq).toHaveBeenCalledWith("is_deleted", false);
    });

    it("should apply search filter", async () => {
      mockRange.mockResolvedValueOnce({
        data: mockMembersList,
        error: null,
        count: 1,
      });

      await fetchMembers(mockLibraryId, { search: "Jane" });

      expect(mockOr).toHaveBeenCalledWith(`
      member_id.ilike.%Jane%,
      personal_info->>first_name.ilike.%Jane%,
      personal_info->>last_name.ilike.%Jane%,
      personal_info->>email.ilike.%Jane%
    `);
    });

    it("should apply status and membership type filters", async () => {
      mockRange.mockResolvedValueOnce({
        data: mockMembersList,
        error: null,
        count: 1,
      });

      await fetchMembers(mockLibraryId, {
        status: "active",
        membership_type: "student",
      });

      expect(mockEq).toHaveBeenCalledWith("status", "active");
      expect(mockEq).toHaveBeenCalledWith(
        "membership_info->>type",
        "student"
      );
    });

    it("should apply pagination correctly", async () => {
      mockRange.mockResolvedValueOnce({
        data: mockMembersList,
        error: null,
        count: 50,
      });

      const result = await fetchMembers(mockLibraryId, { page: 2, limit: 10 });

      expect(mockRange).toHaveBeenCalledWith(10, 19); // (2-1)*10, 10+10-1
      expect(result.hasMore).toBe(true); // 10 + 10 < 50
    });

    it("should throw error on database failure", async () => {
      mockRange.mockResolvedValueOnce({
        data: null,
        error: { message: "Query failed" },
        count: null,
      });

      await expect(fetchMembers(mockLibraryId)).rejects.toThrow(
        "Failed to fetch members: Query failed"
      );
    });
  });

  describe("fetchMemberProfile", () => {
    const mockMemberId = "member-789";
    const mockCheckouts = [
      {
        id: "checkout-1",
        transaction_date: "2025-01-01T12:00:00Z",
        due_date: "2025-01-15T12:00:00Z",
        status: "checked_out",
        book_copies: {
          id: "copy-1",
          book_editions: {
            title: "Test Book",
            general_books: {
              id: "book-1",
            },
          },
        },
      },
    ];

    it("should fetch member profile with checkouts", async () => {
      // Mock member profile fetch - first call
      mockSingle.mockResolvedValueOnce({
        data: mockLibraryMember,
        error: null,
      });

      // Need to reset and setup mocks for second Supabase call
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockCheckouts,
              error: null,
            }),
          }),
        }),
      });

      const result = await fetchMemberProfile(mockMemberId, mockLibraryId);

      expect(result).toEqual({
        ...mockLibraryMember,
        current_checkouts: [
          {
            id: "checkout-1",
            book_title: "Test Book",
            book_id: "book-1",
            checkout_date: "2025-01-01T12:00:00Z",
            due_date: "2025-01-15T12:00:00Z",
            status: "checked_out",
          },
        ],
      });
    });

    it("should handle member not found", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Member not found" },
      });

      await expect(
        fetchMemberProfile(mockMemberId, mockLibraryId)
      ).rejects.toThrow("Failed to fetch member profile: Member not found");
    });

    it("should handle checkout fetch failure gracefully", async () => {
      // Mock member profile fetch success - first call
      mockSingle.mockResolvedValueOnce({
        data: mockLibraryMember,
        error: null,
      });

      // Mock checkout fetch failure - second call
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Checkout query failed" },
            }),
          }),
        }),
      });

      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = await fetchMemberProfile(mockMemberId, mockLibraryId);

      expect(result).toEqual({
        ...mockLibraryMember,
        current_checkouts: [],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch member checkouts:",
        "Checkout query failed"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("updateMember", () => {
    const mockMemberId = "member-789";
    const mockUpdateData: MemberUpdateData = {
      first_name: "Jane Updated",
      email: "jane.updated@example.com",
      membership_notes: "Updated notes",
    };

    it("should update member with personal and membership info", async () => {
      // Mock duplicate email check - no conflict
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock current member data fetch for personal_info
      mockSingle
        .mockResolvedValueOnce({
          data: { personal_info: mockLibraryMember.personal_info },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { membership_info: mockLibraryMember.membership_info },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockLibraryMember, ...mockUpdateData },
          error: null,
        });

      const result = await updateMember(
        mockMemberId,
        mockUpdateData,
        mockLibraryId
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          personal_info: expect.objectContaining({
            first_name: "Jane Updated",
            email: "jane.updated@example.com",
          }),
          membership_info: expect.objectContaining({
            notes: "Updated notes",
          }),
        })
      );
      expect(result).toEqual({ ...mockLibraryMember, ...mockUpdateData });
    });

    it("should check for duplicate email when email is updated", async () => {
      // Mock duplicate email check - email exists
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: "other-member" },
        error: null,
      });

      await expect(
        updateMember(mockMemberId, mockUpdateData, mockLibraryId)
      ).rejects.toThrow("A member with this email address already exists");
    });

    it("should throw error on database failure", async () => {
      // Mock duplicate email check - no conflict
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock current member data fetch for personal_info
      mockSingle
        .mockResolvedValueOnce({
          data: { personal_info: mockLibraryMember.personal_info },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { membership_info: mockLibraryMember.membership_info },
          error: null,
        })
        // Mock update failure
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        });

      await expect(
        updateMember(mockMemberId, mockUpdateData, mockLibraryId)
      ).rejects.toThrow("Failed to update member: Update failed");
    });
  });

  describe("updateMemberStatus", () => {
    const mockMemberId = "member-789";

    it("should update member status successfully", async () => {
      const updatedMember = { ...mockLibraryMember, status: "inactive" as const };
      
      mockSingle.mockResolvedValueOnce({
        data: updatedMember,
        error: null,
      });

      const result = await updateMemberStatus(
        mockMemberId,
        "inactive",
        mockLibraryId
      );

      expect(mockFrom).toHaveBeenCalledWith("library_members");
      expect(mockUpdate).toHaveBeenCalledWith({
        status: "inactive",
      });
      expect(result).toEqual(updatedMember);
    });

    it("should throw error on database failure", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        updateMemberStatus(mockMemberId, "banned", mockLibraryId)
      ).rejects.toThrow("Failed to update member status: Update failed");
    });
  });

  describe("deleteMember", () => {
    const mockMemberId = "member-789";
    const mockDeletedBy = "admin-user";

    it("should soft delete member successfully", async () => {
      // Mock the chain to return itself and resolve
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockFrom.mockReturnValueOnce(mockChain);
      mockChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await deleteMember(mockMemberId, mockLibraryId, mockDeletedBy);

      expect(mockChain.update).toHaveBeenCalledWith({
        is_deleted: true,
        deleted_at: expect.any(String),
        deleted_by: mockDeletedBy,
      });
    });

    it("should throw error on database failure", async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockFrom.mockReturnValueOnce(mockChain);
      mockChain.eq.mockResolvedValueOnce({
        error: { message: "Delete failed" },
      });

      await expect(
        deleteMember(mockMemberId, mockLibraryId, mockDeletedBy)
      ).rejects.toThrow("Failed to delete member: Delete failed");
    });
  });

  describe("API Contract Tests", () => {
    it("should enforce library_id isolation", async () => {
      mockHead.mockResolvedValueOnce({ count: 0, error: null });

      await generateMemberID(mockLibraryId);

      expect(mockEq).toHaveBeenCalledWith("library_id", mockLibraryId);
    });

    it("should enforce soft delete filtering", async () => {
      mockHead.mockResolvedValueOnce({ count: 0, error: null });

      await generateMemberID(mockLibraryId);

      expect(mockEq).toHaveBeenCalledWith("is_deleted", false);
    });

    it("should use proper table names", async () => {
      mockHead.mockResolvedValueOnce({ count: 0, error: null });

      await generateMemberID(mockLibraryId);

      expect(mockFrom).toHaveBeenCalledWith("library_members");
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      mockHead.mockResolvedValueOnce({
        count: null,
        error: { message: "Connection timeout" },
      });

      await expect(generateMemberID(mockLibraryId)).rejects.toThrow(
        "Failed to generate member ID: Connection timeout"
      );
    });

    it("should handle constraint violations", async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockHead.mockResolvedValueOnce({ count: 0, error: null });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Duplicate key violation" },
      });

      await expect(createMember(mockMemberData, mockLibraryId)).rejects.toThrow(
        "Failed to create member: Duplicate key violation"
      );
    });
  });
});