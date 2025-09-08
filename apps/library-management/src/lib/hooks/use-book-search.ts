/**
 * TanStack Query hooks for book search functionality
 */

import { useQuery } from "@tanstack/react-query";
import { searchBookEditions } from "@/lib/api/book-editions";
import type { BookSearchResult } from "@/types/books";

/**
 * Hook for searching book editions with debounced query
 * @param searchTerm - Search query (minimum 3 characters)
 * @param enabled - Whether the query is enabled
 */
export function useBookSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<BookSearchResult[], Error>({
    queryKey: ["book-search", searchTerm],
    queryFn: () => searchBookEditions(searchTerm),
    enabled: enabled && searchTerm.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}