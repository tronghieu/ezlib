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

type BookCopy = Database["public"]["Tables"]["book_copies"]["Row"];
type BookEdition = Database["public"]["Tables"]["book_editions"]["Row"];
type GeneralBook = Database["public"]["Tables"]["general_books"]["Row"];
type BorrowingTransaction =
  Database["public"]["Tables"]["borrowing_transactions"]["Row"];

// Database join result types - using complex nested Supabase joins
// TypeScript struggles with deeply nested join types, so we use any for the map parameter
// but cast individual properties properly for type safety

export interface BookWithDetails {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  isbn: string;
  status: "available" | "checked_out";
  availability: {
    status: string;
    count: number;
  };
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

      // Build the base query with joins
      const baseQuery = supabase
        .from("book_copies")
        .select(
          `
          id,
          availability,
          barcode,
          condition_info,
          copy_number,
          created_at,
          book_editions!inner (
            id,
            isbn_10,
            isbn_13,
            language,
            edition_metadata,
            general_books!inner (
              id,
              canonical_title,
              first_publication_year,
              subjects
            )
          ),
          borrowing_transactions!left (
            id,
            return_date
          )
        `,
          { count: "exact" }
        )
        .eq("library_id", currentLibrary.id);

      // Note: Sorting is handled client-side due to Supabase join limitations
      // We order by created_at as a consistent base order for pagination
      baseQuery.order("created_at", { ascending: true });

      // Add pagination
      const { data, error, count } = await baseQuery.range(
        offset,
        offset + pageSize - 1
      );

      if (error) throw error;

      // Transform the data into the expected format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const books: BookWithDetails[] = (data || []).map((copy: any) => {
        const bookEdition = copy.book_editions;
        const generalBook = bookEdition?.general_books;

        // Get author from general book subjects or use fallback
        const author = generalBook?.subjects?.[0] || "Unknown Author";

        // Parse availability JSON
        const availability = copy.availability as { status: string } | null;

        // Determine availability status
        const hasActiveCheckout = copy.borrowing_transactions?.some(
          (transaction: BorrowingTransaction) => !transaction.return_date
        );

        const status: "available" | "checked_out" = hasActiveCheckout
          ? "checked_out"
          : availability?.status === "checked_out"
            ? "checked_out"
            : "available";

        // Extract publication info from edition metadata
        const editionMetadata = bookEdition?.edition_metadata as {
          publisher?: string;
        } | null;
        const publisher = editionMetadata?.publisher || "Unknown Publisher";
        const publicationYear = generalBook?.first_publication_year || 0;

        // Prefer ISBN-13, fallback to ISBN-10
        const isbn = bookEdition?.isbn_13 || bookEdition?.isbn_10 || "";

        return {
          id: copy.id,
          title: generalBook?.canonical_title || "Unknown Title",
          author,
          publisher,
          publicationYear,
          isbn,
          status,
          availability: {
            status: status,
            count: status === "available" ? 1 : 0,
          },
          book_copy: copy as unknown as BookCopy,
          book_edition: bookEdition as unknown as BookEdition,
          general_book: generalBook as unknown as GeneralBook,
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

      // Search across title and author (subjects)
      const { data, error } = await supabase
        .from("book_copies")
        .select(
          `
          id,
          availability,
          barcode,
          condition_info,
          copy_number,
          created_at,
          book_editions!inner (
            id,
            isbn_10,
            isbn_13,
            language,
            edition_metadata,
            general_books!inner (
              id,
              canonical_title,
              first_publication_year,
              subjects
            )
          ),
          borrowing_transactions!left (
            id,
            return_date
          )
        `
        )
        .eq("library_id", currentLibrary.id);

      if (error) throw error;

      // Transform search results similar to the main books hook
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedBooks: BookWithDetails[] = (data || []).map(
        (copy: any) => {
          const bookEdition = copy.book_editions;
          const generalBook = bookEdition?.general_books;

          const author = generalBook?.subjects?.[0] || "Unknown Author";

          // Parse availability JSON
          const availability = copy.availability as { status: string } | null;

          const hasActiveCheckout = copy.borrowing_transactions?.some(
            (transaction: BorrowingTransaction) => !transaction.return_date
          );

          const status: "available" | "checked_out" = hasActiveCheckout
            ? "checked_out"
            : availability?.status === "checked_out"
              ? "checked_out"
              : "available";

          const editionMetadata = bookEdition?.edition_metadata as {
            publisher?: string;
          } | null;
          const publisher = editionMetadata?.publisher || "Unknown Publisher";
          const publicationYear = generalBook?.first_publication_year || 0;
          const isbn = bookEdition?.isbn_13 || bookEdition?.isbn_10 || "";

          return {
            id: copy.id,
            title: generalBook?.canonical_title || "Unknown Title",
            author,
            publisher,
            publicationYear,
            isbn,
            status,
            availability: {
              status: status,
              count: status === "available" ? 1 : 0,
            },
            book_copy: copy as unknown as BookCopy,
            book_edition: bookEdition as unknown as BookEdition,
            general_book: generalBook as unknown as GeneralBook,
          } as BookWithDetails;
        }
      );

      // Client-side filtering for search
      const filteredBooks = transformedBooks.filter((book) => {
        const searchLower = debouncedQuery.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(searchLower);
        const authorMatch = book.author.toLowerCase().includes(searchLower);
        const isbnMatch = book.isbn.toLowerCase().includes(searchLower);

        return titleMatch || authorMatch || isbnMatch;
      });

      return filteredBooks;
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
