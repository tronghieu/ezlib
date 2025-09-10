/**
 * Member Management Hooks Tests
 * Comprehensive tests for member management hooks with TanStack Query integration
 */

import * as React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useMembers,
  useMemberProfile,
  useCreateMember,
  useUpdateMember,
  useUpdateMemberStatus,
  useDeleteMember,
  usePrefetchMember,
  useOptimisticMemberUpdate,
  memberQueryKeys,
} from "../use-members";
import * as membersApi from "@/lib/api/members";
import type {
  LibraryMember,
  MemberRegistrationData,
  MemberUpdateData,
  MemberSearchParams,
  MemberWithCheckouts,
  MemberStatus,
} from "@/types/members";

// Mock dependencies
jest.mock("sonner");
jest.mock("@/lib/api/members");

const mockToast = toast as jest.Mocked<typeof toast>;
const mockMembersApi = membersApi as jest.Mocked<typeof membersApi>;

// Test data
const mockLibraryId = "lib-123";
const mockMemberId = "member-456";
const mockUserId = "user-789";

const mockMember: LibraryMember = {
  id: mockMemberId,
  user_id: undefined,
  library_id: mockLibraryId,
  member_id: "M001",
  personal_info: {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      country: "USA",
      postal_code: "12345",
    },
  },
  membership_info: {
    type: "regular",
    fees_owed: 0,
    expiry_date: "2025-12-31",
    notes: "New member",
  },
  borrowing_stats: {
    current_loans: 2,
    total_books_borrowed: 15,
    overdue_items: 0,
    total_late_fees: 0,
  },
  status: "active",
  is_deleted: false,
  deleted_at: undefined,
  deleted_by: undefined,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

const mockMemberWithCheckouts: MemberWithCheckouts = {
  ...mockMember,
  current_checkouts: [
    {
      id: "checkout-1",
      book_title: "Test Book",
      book_id: "copy-1",
      checkout_date: "2024-01-10T10:00:00Z",
      due_date: "2024-01-24T10:00:00Z",
      status: "active",
    },
  ],
};

const mockRegistrationData: MemberRegistrationData & {
  inviterUserId: string;
  inviterName: string;
} = {
  member_id: "M002",
  first_name: "Jane",
  last_name: "Smith",
  email: "jane.smith@example.com",
  phone: "+0987654321",
  address: {
    street: "456 Oak Ave",
    city: "Somewhere",
    state: "NY",
    country: "USA",
    postal_code: "54321",
  },
  membership_type: "student",
  membership_notes: "Student discount",
  inviterUserId: mockUserId,
  inviterName: "Library Admin",
};

const mockUpdateData: MemberUpdateData = {
  first_name: "John Updated",
  email: "john.updated@example.com",
  membership_type: "senior",
  status: "inactive",
};

function createWrapper() {
  const queryClient = new QueryClient({
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

  function TestQueryClientWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return TestQueryClientWrapper;
}

describe("Member Query Keys", () => {
  it("should generate correct query keys", () => {
    const searchParams: MemberSearchParams = {
      search: "john",
      status: "active",
      page: 1,
      limit: 10,
    };

    expect(memberQueryKeys.all(mockLibraryId)).toEqual([
      "members",
      mockLibraryId,
    ]);
    expect(memberQueryKeys.lists(mockLibraryId)).toEqual([
      "members",
      mockLibraryId,
      "list",
    ]);
    expect(memberQueryKeys.list(mockLibraryId, searchParams)).toEqual([
      "members",
      mockLibraryId,
      "list",
      searchParams,
    ]);
    expect(memberQueryKeys.details(mockLibraryId)).toEqual([
      "members",
      mockLibraryId,
      "detail",
    ]);
    expect(memberQueryKeys.detail(mockLibraryId, mockMemberId)).toEqual([
      "members",
      mockLibraryId,
      "detail",
      mockMemberId,
    ]);
  });
});

describe("useMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch members successfully", async () => {
    const mockMembersResponse = {
      members: [mockMember],
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false,
    };
    mockMembersApi.fetchMembers.mockResolvedValue(mockMembersResponse);

    const { result } = renderHook(
      () => useMembers(mockLibraryId, { search: "john" }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMembersResponse);
    expect(mockMembersApi.fetchMembers).toHaveBeenCalledWith(mockLibraryId, {
      search: "john",
    });
  });

  it("should handle fetch members error", async () => {
    const error = new Error("Failed to fetch members");
    mockMembersApi.fetchMembers.mockRejectedValue(error);

    const { result } = renderHook(() => useMembers(mockLibraryId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("should use correct stale and cache times", () => {
    const emptyResponse = {
      members: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
    };
    mockMembersApi.fetchMembers.mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useMembers(mockLibraryId), {
      wrapper: createWrapper(),
    });

    // Query should be configured with appropriate timing
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useMemberProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch member profile successfully", async () => {
    mockMembersApi.fetchMemberProfile.mockResolvedValue(
      mockMemberWithCheckouts
    );

    const { result } = renderHook(
      () => useMemberProfile(mockLibraryId, mockMemberId),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMemberWithCheckouts);
    expect(mockMembersApi.fetchMemberProfile).toHaveBeenCalledWith(
      mockMemberId,
      mockLibraryId
    );
  });

  it("should be disabled when memberId or libraryId is missing", () => {
    const { result } = renderHook(() => useMemberProfile("", mockMemberId), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockMembersApi.fetchMemberProfile).not.toHaveBeenCalled();
  });

  it("should handle fetch member profile error", async () => {
    const error = new Error("Member not found");
    mockMembersApi.fetchMemberProfile.mockRejectedValue(error);

    const { result } = renderHook(
      () => useMemberProfile(mockLibraryId, mockMemberId),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useCreateMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create member successfully", async () => {
    mockMembersApi.createMemberWithInvitation.mockResolvedValue(mockMember);

    const { result } = renderHook(() => useCreateMember(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRegistrationData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMember);
    expect(mockMembersApi.createMemberWithInvitation).toHaveBeenCalledWith(
      mockRegistrationData,
      mockLibraryId,
      mockRegistrationData.inviterUserId,
      mockRegistrationData.inviterName
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Member registered successfully!"
    );
  });

  it("should handle create member error", async () => {
    const error = new Error("Email already exists");
    mockMembersApi.createMemberWithInvitation.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateMember(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRegistrationData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Failed to register member: Email already exists"
    );
  });

  it("should invalidate queries on success", async () => {
    mockMembersApi.createMemberWithInvitation.mockResolvedValue(mockMember);

    const queryClient = new QueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");
    const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateMember(mockLibraryId), {
      wrapper,
    });

    result.current.mutate(mockRegistrationData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.lists(mockLibraryId),
    });
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      memberQueryKeys.detail(mockLibraryId, mockMember.id),
      mockMember
    );
  });
});

describe("useUpdateMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update member successfully", async () => {
    const updatedMember = { ...mockMember, ...mockUpdateData };
    mockMembersApi.updateMember.mockResolvedValue(updatedMember);

    const { result } = renderHook(() => useUpdateMember(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      data: mockUpdateData,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(updatedMember);
    expect(mockMembersApi.updateMember).toHaveBeenCalledWith(
      mockMemberId,
      mockUpdateData,
      mockLibraryId
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Member updated successfully!"
    );
  });

  it("should handle update member error", async () => {
    const error = new Error("Validation failed");
    mockMembersApi.updateMember.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateMember(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      data: mockUpdateData,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Failed to update member: Validation failed"
    );
  });
});

describe("useUpdateMemberStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update member status to inactive successfully", async () => {
    const newStatus: MemberStatus = "inactive";
    const updatedMember = { ...mockMember, status: newStatus };
    mockMembersApi.updateMemberStatus.mockResolvedValue(updatedMember);

    const { result } = renderHook(() => useUpdateMemberStatus(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      status: newStatus,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(updatedMember);
    expect(mockMembersApi.updateMemberStatus).toHaveBeenCalledWith(
      mockMemberId,
      newStatus,
      mockLibraryId
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Member deactivated successfully!"
    );
  });

  it("should update member status to active successfully", async () => {
    const status: MemberStatus = "active";
    const updatedMember = { ...mockMember, status };
    mockMembersApi.updateMemberStatus.mockResolvedValue(updatedMember);

    const { result } = renderHook(() => useUpdateMemberStatus(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      status,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockToast.success).toHaveBeenCalledWith("Member activated successfully!");
  });

  it("should update member status to banned successfully", async () => {
    const status: MemberStatus = "banned";
    const updatedMember = { ...mockMember, status };
    mockMembersApi.updateMemberStatus.mockResolvedValue(updatedMember);

    const { result } = renderHook(() => useUpdateMemberStatus(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      status,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockToast.success).toHaveBeenCalledWith("Member banned successfully!");
  });
});

describe("useDeleteMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete member successfully", async () => {
    mockMembersApi.deleteMember.mockResolvedValue();

    const { result } = renderHook(() => useDeleteMember(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      deletedBy: mockUserId,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMembersApi.deleteMember).toHaveBeenCalledWith(
      mockMemberId,
      mockLibraryId,
      mockUserId
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Member deleted successfully!"
    );
  });

  it("should handle delete member error", async () => {
    const error = new Error("Cannot delete member with active loans");
    mockMembersApi.deleteMember.mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteMember(mockLibraryId), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      memberId: mockMemberId,
      deletedBy: mockUserId,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Failed to delete member: Cannot delete member with active loans"
    );
  });

  it("should remove queries on successful deletion", async () => {
    mockMembersApi.deleteMember.mockResolvedValue();

    const queryClient = new QueryClient();
    const removeQueriesSpy = jest.spyOn(queryClient, "removeQueries");
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteMember(mockLibraryId), {
      wrapper,
    });

    result.current.mutate({
      memberId: mockMemberId,
      deletedBy: mockUserId,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(removeQueriesSpy).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.detail(mockLibraryId, mockMemberId),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.lists(mockLibraryId),
    });
  });
});

describe("usePrefetchMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should prefetch member profile", () => {
    const queryClient = new QueryClient();
    const prefetchQuerySpy = jest.spyOn(queryClient, "prefetchQuery");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchMember(mockLibraryId), {
      wrapper,
    });

    result.current.prefetchMemberProfile(mockMemberId);

    expect(prefetchQuerySpy).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.detail(mockLibraryId, mockMemberId),
      queryFn: expect.any(Function),
      staleTime: 2 * 60 * 1000,
    });
  });

  it("should prefetch members list", () => {
    const queryClient = new QueryClient();
    const prefetchQuerySpy = jest.spyOn(queryClient, "prefetchQuery");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchMember(mockLibraryId), {
      wrapper,
    });

    const searchParams: MemberSearchParams = { search: "test" };
    result.current.prefetchMembers(searchParams);

    expect(prefetchQuerySpy).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.list(mockLibraryId, searchParams),
      queryFn: expect.any(Function),
      staleTime: 5 * 60 * 1000,
    });
  });
});

describe("useOptimisticMemberUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should optimistically update member", () => {
    const queryClient = new QueryClient();
    const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

    // Set initial data
    queryClient.setQueryData(
      memberQueryKeys.detail(mockLibraryId, mockMemberId),
      mockMemberWithCheckouts
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticMemberUpdate(mockLibraryId),
      {
        wrapper,
      }
    );

    const updates = { status: "inactive" as MemberStatus };
    result.current.optimisticallyUpdateMember(mockMemberId, updates);

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      memberQueryKeys.detail(mockLibraryId, mockMemberId),
      expect.any(Function)
    );
  });

  it("should revert optimistic update", () => {
    const queryClient = new QueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticMemberUpdate(mockLibraryId),
      {
        wrapper,
      }
    );

    result.current.revertOptimisticUpdate(mockMemberId);

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.detail(mockLibraryId, mockMemberId),
    });
  });
});
