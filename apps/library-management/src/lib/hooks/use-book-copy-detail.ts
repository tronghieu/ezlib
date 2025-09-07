"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBookCopyDetail,
  updateBookCopy,
  softDeleteBookCopy,
  checkBookCopyDeleteSafety,
  type BookCopyWithDetails,
} from "@/lib/api/book-copies";
import type { BookCopyUpdateData } from "@/lib/validation/book-copy";

/**
 * Hook for fetching detailed book copy information
 */
export function useBookCopyDetail(bookCopyId: string, libraryId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["book-copy-detail", bookCopyId, libraryId],
    queryFn: () => fetchBookCopyDetail(bookCopyId, libraryId),
    enabled: !!bookCopyId && !!libraryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error?.message?.includes("not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BookCopyUpdateData) =>
      updateBookCopy(bookCopyId, data, libraryId),
    onSuccess: (updatedBookCopy) => {
      // Update the cache with fresh data
      queryClient.setQueryData(
        ["book-copy-detail", bookCopyId, libraryId],
        updatedBookCopy
      );
      
      // Invalidate related queries to refresh lists
      queryClient.invalidateQueries({ 
        queryKey: ["books", libraryId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["book-copies", libraryId] 
      });
    },
    onError: (error) => {
      console.error("Failed to update book copy:", error);
    },
  });

  return {
    ...query,
    updateMutation,
  };
}

/**
 * Hook for book copy deletion functionality
 */
export function useDeleteBookCopy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookCopyId, libraryId }: { bookCopyId: string; libraryId: string }) =>
      softDeleteBookCopy(bookCopyId, libraryId),
    onSuccess: (_, { bookCopyId, libraryId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: ["book-copy-detail", bookCopyId, libraryId]
      });
      
      // Invalidate related queries to refresh lists
      queryClient.invalidateQueries({ 
        queryKey: ["books", libraryId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["book-copies", libraryId] 
      });
    },
    onError: (error) => {
      console.error("Failed to delete book copy:", error);
    },
  });
}

/**
 * Hook for checking if book copy can be safely deleted
 */
export function useBookCopyDeleteSafety(bookCopyId: string, libraryId: string) {
  return useQuery({
    queryKey: ["book-copy-delete-safety", bookCopyId, libraryId],
    queryFn: () => checkBookCopyDeleteSafety(bookCopyId, libraryId),
    enabled: !!bookCopyId && !!libraryId,
    staleTime: 1000 * 60, // 1 minute - this info can change quickly
  });
}

/**
 * Hook for managing book copy state with optimistic updates
 */
export function useBookCopyActions(bookCopyId: string, libraryId: string) {
  const queryClient = useQueryClient();

  const updateWithOptimisticUpdate = useMutation({
    mutationFn: (data: BookCopyUpdateData) =>
      updateBookCopy(bookCopyId, data, libraryId),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["book-copy-detail", bookCopyId, libraryId]
      });

      // Snapshot the previous value
      const previousBookCopy = queryClient.getQueryData<BookCopyWithDetails>([
        "book-copy-detail",
        bookCopyId,
        libraryId,
      ]);

      // Optimistically update the cache
      if (previousBookCopy) {
        const optimisticUpdate: BookCopyWithDetails = {
          ...previousBookCopy,
          copy_number: newData.copy_number,
          barcode: newData.barcode || previousBookCopy.barcode,
          location: {
            shelf: newData.shelf_location || previousBookCopy.location?.shelf,
            section: newData.section || previousBookCopy.location?.section,
            call_number: newData.call_number || previousBookCopy.location?.call_number,
          },
          condition_info: {
            ...previousBookCopy.condition_info,
            condition: newData.condition || previousBookCopy.condition_info.condition,
            notes: newData.notes || previousBookCopy.condition_info.notes,
            last_maintenance: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData(
          ["book-copy-detail", bookCopyId, libraryId],
          optimisticUpdate
        );
      }

      // Return a context object with the snapshotted value
      return { previousBookCopy };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookCopy) {
        queryClient.setQueryData(
          ["book-copy-detail", bookCopyId, libraryId],
          context.previousBookCopy
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["book-copy-detail", bookCopyId, libraryId]
      });
    },
  });

  return {
    updateWithOptimisticUpdate,
  };
}

/**
 * Hook for bulk operations on book copies
 */
export function useBookCopyBulkActions(libraryId: string) {
  const queryClient = useQueryClient();

  const bulkUpdate = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: Partial<BookCopyUpdateData> }>) => {
      const results = await Promise.allSettled(
        updates.map(({ id, data }) => updateBookCopy(id, data as BookCopyUpdateData, libraryId))
      );
      return results;
    },
    onSuccess: () => {
      // Invalidate all book-related queries
      queryClient.invalidateQueries({ 
        queryKey: ["books", libraryId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["book-copies", libraryId] 
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (bookCopyIds: string[]) => {
      const results = await Promise.allSettled(
        bookCopyIds.map(id => softDeleteBookCopy(id, libraryId))
      );
      return results;
    },
    onSuccess: (_, bookCopyIds) => {
      // Remove deleted items from cache
      bookCopyIds.forEach(id => {
        queryClient.removeQueries({
          queryKey: ["book-copy-detail", id, libraryId]
        });
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ["books", libraryId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["book-copies", libraryId] 
      });
    },
  });

  return {
    bulkUpdate,
    bulkDelete,
  };
}