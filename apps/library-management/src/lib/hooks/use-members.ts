/**
 * Member management hooks with TanStack Query integration
 * Handles data fetching, mutations, and cache management for members
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchMembers,
  fetchMemberProfile,
  createMemberWithInvitation,
  updateMember,
  updateMemberStatus,
  deleteMember,
} from "@/lib/api/members";
import type {
  LibraryMember,
  MemberRegistrationData,
  MemberUpdateData,
  MemberSearchParams,
  MemberWithCheckouts,
  MemberStatus,
} from "@/types/members";

// Query keys for consistent cache management
export const memberQueryKeys = {
  all: (libraryId: string) => ["members", libraryId] as const,
  lists: (libraryId: string) => ["members", libraryId, "list"] as const,
  list: (libraryId: string, params: MemberSearchParams) =>
    ["members", libraryId, "list", params] as const,
  details: (libraryId: string) => ["members", libraryId, "detail"] as const,
  detail: (libraryId: string, memberId: string) =>
    ["members", libraryId, "detail", memberId] as const,
};

// Hook for fetching member list with search and pagination
export function useMembers(libraryId: string, params: MemberSearchParams = {}) {
  return useQuery({
    queryKey: memberQueryKeys.list(libraryId, params),
    queryFn: () => fetchMembers(libraryId, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching single member profile
export function useMemberProfile(libraryId: string, memberId: string) {
  return useQuery({
    queryKey: memberQueryKeys.detail(libraryId, memberId),
    queryFn: () => fetchMemberProfile(memberId, libraryId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!memberId && !!libraryId,
  });
}

// Hook for creating new members
export function useCreateMember(libraryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemberRegistrationData & { inviterUserId: string; inviterName: string }) =>
      createMemberWithInvitation(data, libraryId, data.inviterUserId, data.inviterName),
    onSuccess: (newMember: LibraryMember) => {
      // Invalidate member lists to refresh with new member
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists(libraryId),
      });

      // Optionally set the new member in cache
      queryClient.setQueryData(
        memberQueryKeys.detail(libraryId, newMember.id),
        newMember
      );

      toast.success("Member registered successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to register member: ${error.message}`);
    },
  });
}

// Hook for updating member information
export function useUpdateMember(libraryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: MemberUpdateData;
    }) => updateMember(memberId, data, libraryId),
    onSuccess: (updatedMember: LibraryMember) => {
      // Update member detail cache
      queryClient.setQueryData(
        memberQueryKeys.detail(libraryId, updatedMember.id),
        updatedMember
      );

      // Invalidate member lists to show updated information
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists(libraryId),
      });

      toast.success("Member updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member: ${error.message}`);
    },
  });
}

// Hook for updating member status
export function useUpdateMemberStatus(libraryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string;
      status: MemberStatus;
    }) => updateMemberStatus(memberId, status, libraryId),
    onSuccess: (updatedMember: LibraryMember, variables) => {
      // Update member detail cache
      queryClient.setQueryData(
        memberQueryKeys.detail(libraryId, updatedMember.id),
        updatedMember
      );

      // Invalidate member lists to show updated status
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists(libraryId),
      });

      const statusText = 
        variables.status === "active" ? "activated" : 
        variables.status === "inactive" ? "deactivated" : "banned";
      
      toast.success(`Member ${statusText} successfully!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member status: ${error.message}`);
    },
  });
}

// Hook for deleting members (soft delete)
export function useDeleteMember(libraryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      deletedBy,
    }: {
      memberId: string;
      deletedBy: string;
    }) => deleteMember(memberId, libraryId, deletedBy),
    onSuccess: (_, { memberId }) => {
      // Remove member from detail cache
      queryClient.removeQueries({
        queryKey: memberQueryKeys.detail(libraryId, memberId),
      });

      // Invalidate member lists to remove deleted member
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists(libraryId),
      });

      toast.success("Member deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete member: ${error.message}`);
    },
  });
}

// Utility hook for prefetching member data
export function usePrefetchMember(libraryId: string) {
  const queryClient = useQueryClient();

  return {
    prefetchMemberProfile: (memberId: string) => {
      queryClient.prefetchQuery({
        queryKey: memberQueryKeys.detail(libraryId, memberId),
        queryFn: () => fetchMemberProfile(memberId, libraryId),
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchMembers: (params: MemberSearchParams = {}) => {
      queryClient.prefetchQuery({
        queryKey: memberQueryKeys.list(libraryId, params),
        queryFn: () => fetchMembers(libraryId, params),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}

// Hook for optimistic member updates
export function useOptimisticMemberUpdate(libraryId: string) {
  const queryClient = useQueryClient();

  const optimisticallyUpdateMember = (
    memberId: string,
    updates: Partial<LibraryMember>
  ) => {
    const queryKey = memberQueryKeys.detail(libraryId, memberId);
    
    queryClient.setQueryData(queryKey, (old: MemberWithCheckouts | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  };

  const revertOptimisticUpdate = (memberId: string) => {
    queryClient.invalidateQueries({
      queryKey: memberQueryKeys.detail(libraryId, memberId),
    });
  };

  return {
    optimisticallyUpdateMember,
    revertOptimisticUpdate,
  };
}