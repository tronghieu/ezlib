/**
 * useAddBook Hook
 * React Query hook for adding new books with optimistic updates and cache invalidation
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBook } from "@/lib/api/books";
import type {
  BookCreationData,
  BookCreationResult,
} from "@/lib/validation/books";

interface UseAddBookOptions {
  onSuccess?: (result: BookCreationResult) => void;
  onError?: (error: Error) => void;
}

export function useAddBook(options?: UseAddBookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookCreationData) => createBook(data),

    onSuccess: (result: BookCreationResult) => {
      // Show success toast
      toast.success("Book added successfully!", {
        description: `"${result.edition.title}" by ${result.author.name} is now available`,
        action: {
          label: "Add Another",
          onClick: () => {
            // The form will handle resetting itself
            toast.info("Ready to add another book");
          },
        },
      });

      // Invalidate and refetch books list for this library
      queryClient.invalidateQueries({
        queryKey: ["books", result.copy.library_id],
      });

      // Invalidate library dashboard stats
      queryClient.invalidateQueries({
        queryKey: ["library-stats", result.copy.library_id],
      });

      // Call custom success handler if provided
      options?.onSuccess?.(result);
    },

    onError: (error: Error) => {
      console.error("Book creation failed:", error);

      // Show error toast with specific message
      toast.error("Failed to add book", {
        description: error.message || "Please try again or contact support",
      });

      // Call custom error handler if provided
      options?.onError?.(error);
    },

    // Retry configuration for network errors
    retry: (failureCount, error) => {
      // Don't retry validation errors or duplicate detection
      if (
        error.message.includes("duplicate") ||
        error.message.includes("required") ||
        error.message.includes("invalid")
      ) {
        return false;
      }

      // Retry network errors up to 2 times
      return failureCount < 2;
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
