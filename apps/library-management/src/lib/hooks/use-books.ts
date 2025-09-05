"use client";

/**
 * Books Management Hooks
 * Custom hooks for book operations with search, pagination, and real-time updates
 */

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Database } from "@/lib/types/database";

// =============================================================================
// TYPES
// =============================================================================

// View types defined but temporarily using 'any' for compatibility
// type BookDisplayView = Database["public"]["Views"]["book_display_view"]["Row"];
// type BookSearchView = Database["public"]["Views"]["book_search_view"]["Row"];

// Legacy table types for compatibility
type BookCopy = Database["public"]["Tables"]["book_copies"]["Row"];
type BookEdition = Database["public"]["Tables"]["book_editions"]["Row"];
type GeneralBook = Database["public"]["Tables"]["general_books"]["Row"];

export interface BookWithDetails {
  id: string;
  copyNumber: string; // Library-specific identifier
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  isbn: string;
  coverImageUrl?: string; // Book cover URL
  status: "available" | "checked_out";
  availableCopies: number; // Available copies count
  totalCopies: number; // Total copies count
  book_copy: BookCopy;
  book_edition: BookEdition;
  general_book: GeneralBook;
}

export interface UseBooksOptions {
  page?: number;
  pageSize?: number;
  sortBy?: "title" | "author";
  sortOrder?: "asc" | "desc";
}

export interface UseBookSearchOptions {
  query: string;
  enabled?: boolean;
}

// =============================================================================
// MAIN BOOKS HOOK
// =============================================================================

export function useBooks(options: UseBooksOptions = {}) {
  const { currentLibrary } = useLibraryContext();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const {
    page = 1,
    pageSize = 50,
    sortBy = "title",
    sortOrder = "asc",
  } = options;

  const queryKey = useMemo(
    () => ["books", currentLibrary?.id, page, pageSize, sortBy, sortOrder],
    [currentLibrary?.id, page, pageSize, sortBy, sortOrder]
  );

  const {
    data: result,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentLibrary) {
        throw new Error("No library selected");
      }

      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;

      // Use database view for better performance 
      const baseQuery = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("book_display_view" as any)
        .select("*", { count: "exact" })
        .eq("library_id", currentLibrary.id);

      // Note: Sorting is handled client-side due to Supabase join limitations
      // We order by copy_created_at as a consistent base order for pagination
      baseQuery.order("copy_created_at", { ascending: true });

      // Add pagination
      const { data, error, count } = await baseQuery.range(
        offset,
        offset + pageSize - 1
      );

      if (error) throw error;

      // Transform the data using pre-computed view fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const books: BookWithDetails[] = (data || []).map((viewRow: any) => {
        // Parse edition metadata for publisher and publication year
        const editionMetadata = viewRow.edition_metadata as {
          publisher?: string;
          publication_date?: string;
          cover_image_url?: string;
        } | null;
        
        const publisher = editionMetadata?.publisher || "Unknown Publisher";
        const publicationYear = editionMetadata?.publication_date ? 
          new Date(editionMetadata.publication_date).getFullYear() : 0;
        const coverImageUrl = editionMetadata?.cover_image_url;

        // Determine availability status
        const status: "available" | "checked_out" = 
          viewRow.availability_status === "available" ? "available" : "checked_out";

        return {
          id: viewRow.book_copy_id || '',
          copyNumber: viewRow.copy_number || "—",
          title: viewRow.title || "Unknown Title",
          author: viewRow.authors_display || "Unknown Author", // Pre-computed in view!
          publisher,
          publicationYear,
          isbn: viewRow.isbn_13 || "",
          coverImageUrl,
          status,
          availableCopies: viewRow.available_copies || 0,
          totalCopies: viewRow.total_copies || 0,
          // Legacy compatibility fields (can be simplified later)
          book_copy: viewRow as unknown as BookCopy,
          book_edition: { id: viewRow.book_edition_id } as unknown as BookEdition,
          general_book: {} as unknown as GeneralBook,
        };
      });

      // Client-side sorting for both title and author
      books.sort((a, b) => {
        let comparison = 0;

        if (sortBy === "title") {
          comparison = a.title.localeCompare(b.title);
        } else if (sortBy === "author") {
          comparison = a.author.localeCompare(b.author);
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });

      return {
        books,
        totalCount: count || 0,
      };
    },
    enabled: !!currentLibrary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentLibrary) return;

    const channel = supabase
      .channel("book_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "book_copies",
          filter: `library_id=eq.${currentLibrary.id}`,
        },
        () => {
          // Invalidate the books query to refresh data
          queryClient.invalidateQueries({
            queryKey: ["books", currentLibrary.id],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "borrowing_transactions",
          filter: `library_id=eq.${currentLibrary.id}`,
        },
        () => {
          // Invalidate books query when borrowing status changes
          queryClient.invalidateQueries({
            queryKey: ["books", currentLibrary.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentLibrary, queryClient, supabase]);

  return {
    books: result?.books || [],
    totalCount: result?.totalCount || 0,
    isLoading,
    error,
  };
}

// =============================================================================
// BOOK SEARCH HOOK
// =============================================================================

export function useBookSearch({ query, enabled = true }: UseBookSearchOptions) {
  const { currentLibrary } = useLibraryContext();
  const supabase = createClient();

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  const searchQueryKey = useMemo(
    () => ["book-search", currentLibrary?.id, debouncedQuery],
    [currentLibrary?.id, debouncedQuery]
  );

  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: searchQueryKey,
    queryFn: async () => {
      if (!currentLibrary || !debouncedQuery) {
        return [];
      }

      // Use optimized search view with pre-computed search fields
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("book_search_view" as any)
        .select("*")
        .eq("library_id", currentLibrary.id)
        .textSearch("search_vector", `'${debouncedQuery.replace(/'/g, "''")}'`);

      if (error) throw error;

      // Transform search results using the same logic as main books hook
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedBooks: BookWithDetails[] = (data || []).map((viewRow: any) => {
        // Parse edition metadata for publisher and publication year
        const editionMetadata = viewRow.edition_metadata as {
          publisher?: string;
          publication_date?: string;
          cover_image_url?: string;
        } | null;
        
        const publisher = editionMetadata?.publisher || "Unknown Publisher";
        const publicationYear = editionMetadata?.publication_date ? 
          new Date(editionMetadata.publication_date).getFullYear() : 0;
        const coverImageUrl = editionMetadata?.cover_image_url;

        // Determine availability status
        const status: "available" | "checked_out" = 
          viewRow.availability_status === "available" ? "available" : "checked_out";

        return {
          id: viewRow.book_copy_id || '',
          copyNumber: viewRow.copy_number || "—",
          title: viewRow.title || "Unknown Title",
          author: viewRow.authors_display || "Unknown Author", // Pre-computed in view!
          publisher,
          publicationYear,
          isbn: viewRow.isbn_13 || "",
          coverImageUrl,
          status,
          availableCopies: viewRow.available_copies || 0,
          totalCopies: viewRow.total_copies || 0,
          // Legacy compatibility fields (can be simplified later)
          book_copy: viewRow as unknown as BookCopy,
          book_edition: { id: viewRow.book_edition_id } as unknown as BookEdition,
          general_book: {} as unknown as GeneralBook,
        };
      });

      // No need for client-side filtering - database view handles search efficiently
      return transformedBooks;
    },
    enabled: enabled && !!currentLibrary && !!debouncedQuery,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });

  return {
    searchResults,
    isSearching,
    searchError,
  };
}
