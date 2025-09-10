/**
 * Invitation API Integration Tests
 * 
 * Tests invitation system CRUD operations with database integration
 * Covers: creation, fetching, token validation, status updates, expiration
 */

import {
  createMemberInvitation,
  findPendingInvitation,
  createInvitation,
  fetchInvitations,
  updateInvitationStatus,
  deleteInvitation,
  getInvitationByToken,
  expireOldInvitations,
} from "@/lib/api/invitations";
import type {
  Invitation,
  InvitationCreateRequest,
  InvitationSearchParams,
} from "@/types/invitations";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  supabase: jest.fn(() => ({
    from: jest.fn(() => mockSupabaseChain),
  })),
}));

// Mock Supabase chain interface
interface MockSupabaseChain {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  ilike: jest.Mock;
  gt: jest.Mock;
  lt: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
}

// Create the mock chain with proper typing
const createMockChain = (): MockSupabaseChain => {
  const chain = {} as MockSupabaseChain;
  
  chain.select = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.delete = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.ilike = jest.fn(() => chain);
  chain.gt = jest.fn(() => chain);
  chain.lt = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.range = jest.fn();
  chain.single = jest.fn();
  chain.maybeSingle = jest.fn();
  
  return chain;
};

const mockSupabaseChain = createMockChain();

const mockLibraryId = "lib-123";
const mockInviterUserId = "user-456";
const mockInviterName = "John Librarian";

// Test data
const mockInvitation: Invitation = {
  id: "invitation-789",
  library_id: mockLibraryId,
  inviter_id: mockInviterUserId,
  email: "jane.doe@example.com",
  role: "member",
  invitation_type: "library_member",
  status: "pending",
  token: "inv-token-abc123",
  expires_at: "2025-01-16T12:00:00Z",
  personal_message: "Welcome to our library!",
  metadata: {
    invited_by_name: mockInviterName,
    invitation_reason: "New member registration",
  },
  created_at: "2025-01-09T12:00:00Z",
  updated_at: "2025-01-09T12:00:00Z",
};

describe("Invitation API - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMemberInvitation", () => {
    it("should create member invitation successfully", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      const result = await createMemberInvitation(
        mockLibraryId,
        mockInviterUserId,
        "jane.doe@example.com",
        mockInviterName,
        "Welcome to our library!"
      );

      expect(result).toEqual(mockInvitation);
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        library_id: mockLibraryId,
        inviter_id: mockInviterUserId,
        email: "jane.doe@example.com",
        role: "member",
        invitation_type: "library_member",
        personal_message: "Welcome to our library!",
        metadata: {
          invited_by_name: mockInviterName,
          invitation_reason: "New member registration",
        },
      });
    });

    it("should create invitation without personal message", async () => {
      const invitationWithoutMessage = {
        ...mockInvitation,
        personal_message: null,
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: invitationWithoutMessage,
        error: null,
      });

      const result = await createMemberInvitation(
        mockLibraryId,
        mockInviterUserId,
        "jane.doe@example.com",
        mockInviterName
      );

      expect(result).toEqual(invitationWithoutMessage);
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          personal_message: undefined,
        })
      );
    });

    it("should throw error on database failure", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(
        createMemberInvitation(
          mockLibraryId,
          mockInviterUserId,
          "jane.doe@example.com",
          mockInviterName
        )
      ).rejects.toThrow("Failed to create member invitation: Insert failed");
    });
  });

  describe("findPendingInvitation", () => {
    it("should find pending invitation by email and library", async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      const result = await findPendingInvitation(
        "jane.doe@example.com",
        mockLibraryId
      );

      expect(result).toEqual(mockInvitation);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "email",
        "jane.doe@example.com"
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "library_id",
        mockLibraryId
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "invitation_type",
        "library_member"
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(mockSupabaseChain.gt).toHaveBeenCalledWith(
        "expires_at",
        expect.any(String)
      );
    });

    it("should return null when no invitation found", async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await findPendingInvitation(
        "notfound@example.com",
        mockLibraryId
      );

      expect(result).toBeNull();
    });

    it("should handle PGRST116 error as no match", async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await findPendingInvitation(
        "test@example.com",
        mockLibraryId
      );

      expect(result).toBeNull();
    });

    it("should throw error on other database errors", async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "OTHER_ERROR", message: "Connection failed" },
      });

      await expect(
        findPendingInvitation("test@example.com", mockLibraryId)
      ).rejects.toThrow("Failed to find pending invitation: Connection failed");
    });
  });

  describe("createInvitation", () => {
    const invitationRequest: InvitationCreateRequest = {
      library_id: mockLibraryId,
      inviter_id: mockInviterUserId,
      email: "staff@example.com",
      role: "librarian",
      invitation_type: "library_staff",
      personal_message: "Join our team!",
      metadata: {
        department: "Circulation",
      },
    };

    it("should create general invitation successfully", async () => {
      const staffInvitation = {
        ...mockInvitation,
        email: "staff@example.com",
        role: "librarian",
        invitation_type: "library_staff",
        personal_message: "Join our team!",
        metadata: { department: "Circulation" },
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: staffInvitation,
        error: null,
      });

      const result = await createInvitation(invitationRequest);

      expect(result).toEqual(staffInvitation);
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        ...invitationRequest,
        metadata: { department: "Circulation" },
      });
    });

    it("should throw error on database failure", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Constraint violation" },
      });

      await expect(createInvitation(invitationRequest)).rejects.toThrow(
        "Failed to create invitation: Constraint violation"
      );
    });
  });

  describe("fetchInvitations", () => {
    const mockInvitationsList = [mockInvitation];

    it("should fetch invitations with default parameters", async () => {
      mockSupabaseChain.range.mockReturnValueOnce({
        ...mockSupabaseChain,
        data: mockInvitationsList,
        error: null,
        count: 1,
      });

      const result = await fetchInvitations(mockLibraryId);

      expect(result).toEqual({
        invitations: mockInvitationsList,
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "library_id",
        mockLibraryId
      );
      expect(mockSupabaseChain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should apply all filters", async () => {
      const searchParams: InvitationSearchParams = {
        email: "jane",
        status: "pending",
        invitation_type: "library_member",
        role: "member",
        page: 2,
        limit: 5,
      };

      mockSupabaseChain.range.mockReturnValueOnce({
        ...mockSupabaseChain,
        data: mockInvitationsList,
        error: null,
        count: 10,
      });

      const result = await fetchInvitations(mockLibraryId, searchParams);

      expect(mockSupabaseChain.ilike).toHaveBeenCalledWith("email", "%jane%");
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "invitation_type",
        "library_member"
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("role", "member");
      expect(mockSupabaseChain.range).toHaveBeenCalledWith(5, 9); // (2-1)*5, 5+5-1
      expect(result.hasMore).toBe(false); // 5 + 5 = 10, not < 10
    });

    it("should calculate hasMore correctly", async () => {
      mockSupabaseChain.range.mockReturnValueOnce({
        ...mockSupabaseChain,
        data: mockInvitationsList,
        error: null,
        count: 25,
      });

      const result = await fetchInvitations(mockLibraryId, {
        page: 1,
        limit: 10,
      });

      expect(result.hasMore).toBe(true); // 0 + 10 < 25
    });

    it("should throw error on database failure", async () => {
      mockSupabaseChain.range.mockReturnValueOnce({
        ...mockSupabaseChain,
        data: null,
        error: { message: "Query failed" },
        count: null,
      });

      await expect(fetchInvitations(mockLibraryId)).rejects.toThrow(
        "Failed to fetch invitations: Query failed"
      );
    });
  });

  describe("updateInvitationStatus", () => {
    const invitationId = "invitation-789";

    it("should update invitation status successfully", async () => {
      const updatedInvitation = { ...mockInvitation, status: "accepted" as const };
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: updatedInvitation,
        error: null,
      });

      const result = await updateInvitationStatus(
        invitationId,
        "accepted",
        mockLibraryId
      );

      expect(result).toEqual(updatedInvitation);
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: "accepted",
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("id", invitationId);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "library_id",
        mockLibraryId
      );
    });

    it("should throw error on database failure", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        updateInvitationStatus(invitationId, "rejected", mockLibraryId)
      ).rejects.toThrow("Failed to update invitation status: Update failed");
    });
  });

  describe("deleteInvitation", () => {
    const invitationId = "invitation-789";

    it("should delete invitation successfully", async () => {
      mockSupabaseChain.delete.mockResolvedValueOnce({
        error: null,
      });

      await deleteInvitation(invitationId, mockLibraryId);

      expect(mockSupabaseChain.delete).toHaveBeenCalled();
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("id", invitationId);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "library_id",
        mockLibraryId
      );
    });

    it("should throw error on database failure", async () => {
      mockSupabaseChain.delete.mockResolvedValueOnce({
        error: { message: "Delete failed" },
      });

      await expect(
        deleteInvitation(invitationId, mockLibraryId)
      ).rejects.toThrow("Failed to delete invitation: Delete failed");
    });
  });

  describe("getInvitationByToken", () => {
    const invitationToken = "inv-token-abc123";

    it("should get invitation by token successfully", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      const result = await getInvitationByToken(invitationToken);

      expect(result).toEqual(mockInvitation);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("token", invitationToken);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(mockSupabaseChain.gt).toHaveBeenCalledWith(
        "expires_at",
        expect.any(String)
      );
    });

    it("should return null when token not found", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await getInvitationByToken("invalid-token");

      expect(result).toBeNull();
    });

    it("should throw error on other database errors", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: "OTHER_ERROR", message: "Connection failed" },
      });

      await expect(getInvitationByToken(invitationToken)).rejects.toThrow(
        "Failed to get invitation by token: Connection failed"
      );
    });
  });

  describe("expireOldInvitations", () => {
    it("should expire old invitations successfully", async () => {
      mockSupabaseChain.update.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      const result = await expireOldInvitations(mockLibraryId);

      expect(result).toBe(5);
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: "expired",
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "library_id",
        mockLibraryId
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(mockSupabaseChain.lt).toHaveBeenCalledWith(
        "expires_at",
        expect.any(String)
      );
    });

    it("should handle zero expired invitations", async () => {
      mockSupabaseChain.update.mockResolvedValueOnce({
        count: 0,
        error: null,
      });

      const result = await expireOldInvitations(mockLibraryId);

      expect(result).toBe(0);
    });

    it("should handle null count", async () => {
      mockSupabaseChain.update.mockResolvedValueOnce({
        count: null,
        error: null,
      });

      const result = await expireOldInvitations(mockLibraryId);

      expect(result).toBe(0);
    });

    it("should throw error on database failure", async () => {
      mockSupabaseChain.update.mockResolvedValueOnce({
        count: null,
        error: { message: "Update failed" },
      });

      await expect(expireOldInvitations(mockLibraryId)).rejects.toThrow(
        "Failed to expire old invitations: Update failed"
      );
    });
  });

  describe("Token Security", () => {
    it("should only find unexpired pending invitations by token", async () => {
      await getInvitationByToken("test-token");

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(mockSupabaseChain.gt).toHaveBeenCalledWith(
        "expires_at",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });

    it("should properly scope invitation operations to library", async () => {
      await fetchInvitations(mockLibraryId);
      await updateInvitationStatus("inv-id", "accepted", mockLibraryId);
      await deleteInvitation("inv-id", mockLibraryId);

      // Verify library_id filter was applied
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "library_id",
        mockLibraryId
      );
    });
  });

  describe("Data Integrity", () => {
    it("should preserve metadata structure in createInvitation", async () => {
      const complexMetadata = {
        department: "Reference",
        supervisor: "Jane Manager",
        start_date: "2025-01-15",
        permissions: ["read", "write"],
      };

      const request: InvitationCreateRequest = {
        library_id: mockLibraryId,
        inviter_id: mockInviterUserId,
        email: "complex@example.com",
        role: "librarian",
        invitation_type: "library_staff",
        metadata: complexMetadata,
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { ...mockInvitation, metadata: complexMetadata },
        error: null,
      });

      await createInvitation(request);

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: complexMetadata,
        })
      );
    });

    it("should handle invitation type filtering correctly", async () => {
      await findPendingInvitation("test@example.com", mockLibraryId);

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "invitation_type",
        "library_member"
      );

      await fetchInvitations(mockLibraryId, {
        invitation_type: "library_staff",
      });

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "invitation_type",
        "library_staff"
      );
    });
  });
});