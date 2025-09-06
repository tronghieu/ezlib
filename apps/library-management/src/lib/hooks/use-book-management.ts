/**
 * TanStack Query hooks for book edition and copy management
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBookEdition } from "@/lib/api/book-editions";
import { createBookCopies } from "@/lib/api/book-copies";
import type { BookEdition, BookCopy, BookEditionFormData, BookCopyFormData } from "@/lib/types/books";

/**
 * Hook for creating a new book edition
 */
export function useCreateBookEdition() {
  const queryClient = useQueryClient();

  return useMutation<BookEdition, Error, BookEditionFormData>({
    mutationFn: createBookEdition,
    onSuccess: (newEdition) => {
      // Invalidate book searches to include the new edition
      queryClient.invalidateQueries({ queryKey: ["book-search"] });
      
      // Add the new edition to cache
      queryClient.setQueryData(["book-edition", newEdition.id], newEdition);
    },
    onError: (error) => {
      console.error("Failed to create book edition:", error);
    },
  });
}

/**
 * Hook for creating book copies
 */
export function useCreateBookCopies() {
  const queryClient = useQueryClient();

  return useMutation<BookCopy[], Error, { editionId: string; libraryId: string; copyData: BookCopyFormData }>({
    mutationFn: ({ editionId, libraryId, copyData }) => 
      createBookCopies(editionId, libraryId, copyData),
    onSuccess: (newCopies, variables) => {
      // Invalidate library inventory queries
      queryClient.invalidateQueries({ 
        queryKey: ["library-books", variables.libraryId] 
      });
      
      // Invalidate book copies for this edition
      queryClient.invalidateQueries({ 
        queryKey: ["book-copies", variables.editionId, variables.libraryId] 
      });
      
      // Update library edition counts cache
      queryClient.invalidateQueries({ 
        queryKey: ["library-edition-counts", variables.libraryId] 
      });
    },
    onError: (error) => {
      console.error("Failed to create book copies:", error);
    },
  });
}