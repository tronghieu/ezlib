/**
 * TanStack Query hooks for author search and management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchAuthors, createAuthor, getAuthorById } from "@/lib/api/authors";
import type { AuthorSearchResult, Author, AuthorFormData } from "@/types/books";

/**
 * Hook for searching authors with debounced query
 * @param searchTerm - Search query (minimum 3 characters)
 * @param enabled - Whether the query is enabled
 */
export function useAuthorSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<AuthorSearchResult[], Error>({
    queryKey: ["author-search", searchTerm],
    queryFn: () => searchAuthors(searchTerm),
    enabled: enabled && searchTerm.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook for getting author by ID
 * @param authorId - Author ID
 * @param enabled - Whether the query is enabled
 */
export function useAuthor(authorId: string, enabled: boolean = true) {
  return useQuery<Author | null, Error>({
    queryKey: ["author", authorId],
    queryFn: () => getAuthorById(authorId),
    enabled: enabled && !!authorId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook for creating a new author
 */
export function useCreateAuthor() {
  const queryClient = useQueryClient();

  return useMutation<Author, Error, AuthorFormData>({
    mutationFn: createAuthor,
    onSuccess: (newAuthor) => {
      // Invalidate author searches to include the new author
      queryClient.invalidateQueries({ queryKey: ["author-search"] });
      
      // Add the new author to cache
      queryClient.setQueryData(["author", newAuthor.id], newAuthor);
    },
    onError: (error) => {
      console.error("Failed to create author:", error);
    },
  });
}