"use client";

/**
 * Library-Scoped Data Operations Hooks
 * Custom hooks for database operations scoped to selected library
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useLibraryContext } from "@/lib/contexts/library-context";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";

// =============================================================================
// BASE HOOK FOR LIBRARY-SCOPED OPERATIONS
// =============================================================================

export function useLibraryData() {
  const { currentLibrary } = useLibraryContext();
  const supabase = createClient();

  const ensureLibrarySelected = useCallback(() => {
    if (!currentLibrary) {
      throw new Error("No library selected. Please select a library first.");
    }
    return currentLibrary;
  }, [currentLibrary]);

  return {
    currentLibrary,
    supabase,
    ensureLibrarySelected,
  };
}

// =============================================================================
// BOOK COPIES HOOKS
// =============================================================================

export function useLibraryBooks() {
  const { supabase, currentLibrary, ensureLibrarySelected } = useLibraryData();
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["library-books", currentLibrary?.id],
    [currentLibrary?.id]
  );

  // Fetch all book copies for current library using optimized view
  const {
    data: books,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const library = ensureLibrarySelected();

      const { data, error } = await supabase
        .from("book_display_view")
        .select("*")
        .eq("library_id", library.id)
        .eq("is_deleted", false)
        .eq("status", "active")
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentLibrary,
  });

  // Add new book copy
  const addBookCopy = useMutation({
    mutationFn: async (bookData: Partial<TablesInsert<"book_copies">>) => {
      const library = ensureLibrarySelected();

      const { data, error } = await supabase
        .from("book_copies")
        .insert({
          book_edition_id: bookData.book_edition_id!,
          copy_number: bookData.copy_number!,
          availability: bookData.availability,
          condition_info: bookData.condition_info,
          barcode: bookData.barcode || null,
          library_id: library.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update book copy
  const updateBookCopy = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TablesUpdate<"book_copies">>;
    }) => {
      ensureLibrarySelected(); // Ensure library is selected

      const { data, error } = await supabase
        .from("book_copies")
        .update({
          book_edition_id: updates.book_edition_id,
          copy_number: updates.copy_number,
          availability: updates.availability,
          condition_info: updates.condition_info,
          barcode: updates.barcode,
        })
        .eq("id", id)
        .eq("library_id", currentLibrary!.id) // Additional security check
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete book copy
  const deleteBookCopy = useMutation({
    mutationFn: async (id: string) => {
      ensureLibrarySelected();

      const { error } = await supabase
        .from("book_copies")
        .delete()
        .eq("id", id)
        .eq("library_id", currentLibrary!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    books: books || [],
    isLoading,
    error,
    addBookCopy: addBookCopy.mutate,
    updateBookCopy: updateBookCopy.mutate,
    deleteBookCopy: deleteBookCopy.mutate,
    isAddingBook: addBookCopy.isPending,
    isUpdatingBook: updateBookCopy.isPending,
    isDeletingBook: deleteBookCopy.isPending,
  };
}

// =============================================================================
// LIBRARY MEMBERS HOOKS
// =============================================================================

export function useLibraryMembers() {
  const { supabase, currentLibrary, ensureLibrarySelected } = useLibraryData();
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["library-members", currentLibrary?.id],
    [currentLibrary?.id]
  );

  // Fetch all members for current library
  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const library = ensureLibrarySelected();

      const { data, error } = await supabase
        .from("library_members")
        .select("*")
        .eq("library_id", library.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentLibrary,
  });

  // Add new member
  const addMember = useMutation({
    mutationFn: async (memberData: Partial<TablesInsert<"library_members">>) => {
      const library = ensureLibrarySelected();

      const { data, error } = await supabase
        .from("library_members")
        .insert({
          member_id: memberData.member_id!,
          personal_info: memberData.personal_info,
          membership_info: memberData.membership_info,
          borrowing_stats: memberData.borrowing_stats,
          status: memberData.status,
          user_id: memberData.user_id,
          library_id: library.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update member
  const updateMember = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TablesUpdate<"library_members">>;
    }) => {
      ensureLibrarySelected();

      const { data, error } = await supabase
        .from("library_members")
        .update({
          member_id: updates.member_id,
          personal_info: updates.personal_info,
          membership_info: updates.membership_info,
          borrowing_stats: updates.borrowing_stats,
          status: updates.status,
          user_id: updates.user_id,
        })
        .eq("id", id)
        .eq("library_id", currentLibrary!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    members: members || [],
    isLoading,
    error,
    addMember: addMember.mutate,
    updateMember: updateMember.mutate,
    isAddingMember: addMember.isPending,
    isUpdatingMember: updateMember.isPending,
  };
}

// =============================================================================
// BORROWING TRANSACTIONS HOOKS
// =============================================================================

export function useLibraryTransactions() {
  const { supabase, currentLibrary, ensureLibrarySelected } = useLibraryData();
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["library-transactions", currentLibrary?.id],
    [currentLibrary?.id]
  );

  // Fetch recent transactions for current library
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const library = ensureLibrarySelected();

      const { data, error } = await supabase
        .from("borrowing_transactions")
        .select(
          `
          *,
          book_copies (
            id,
            barcode,
            book_editions (
              id,
              title,
              subtitle
            )
          ),
          library_members (
            id,
            member_id,
            personal_info
          )
        `
        )
        .eq("library_id", library.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentLibrary,
  });

  // Create new transaction (checkout, return, etc.)
  const createTransaction = useMutation({
    mutationFn: async (
      transactionData: Partial<TablesInsert<"borrowing_transactions">>
    ) => {
      const library = ensureLibrarySelected();

      const { data, error } = await supabase
        .from("borrowing_transactions")
        .insert({
          book_copy_id: transactionData.book_copy_id!,
          member_id: transactionData.member_id!,
          due_date: transactionData.due_date,
          fees: transactionData.fees,
          notes: transactionData.notes,
          return_date: transactionData.return_date,
          transaction_type: transactionData.transaction_type,
          library_id: library.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate book and member queries since availability might change
      queryClient.invalidateQueries({
        queryKey: ["library-books", currentLibrary?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["library-members", currentLibrary?.id],
      });
    },
  });

  return {
    transactions: transactions || [],
    isLoading,
    error,
    createTransaction: createTransaction.mutate,
    isCreatingTransaction: createTransaction.isPending,
  };
}

// =============================================================================
// LIBRARY STATS HOOKS
// =============================================================================

export function useLibraryStats() {
  const { supabase, currentLibrary, ensureLibrarySelected } = useLibraryData();

  const queryKey = useMemo(
    () => ["library-stats", currentLibrary?.id],
    [currentLibrary?.id]
  );

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const library = ensureLibrarySelected();

      // Use optimized view for pre-computed stats
      const { data, error } = await supabase
        .from("library_book_summary_view")
        .select("*")
        .eq("library_id", library.id)
        .single();

      if (error) throw error;

      // Get additional stats not covered by book summary view
      const [membersResult, transactionsResult] = await Promise.all([
        supabase
          .from("library_members")
          .select("id")
          .eq("library_id", library.id)
          .eq("status", "active"),

        supabase
          .from("borrowing_transactions")
          .select("id")
          .eq("library_id", library.id)
          .eq("transaction_type", "checkout")
          .is("return_date", null),
      ]);

      return {
        totalBooks: data?.total_copies || 0,
        uniqueTitles: data?.unique_titles || 0,
        availableBooks: data?.available_copies || 0,
        borrowedBooks: data?.borrowed_copies || 0,
        recentAdditions: data?.recent_additions || 0,
        activeMembers: membersResult.data?.length || 0,
        currentCheckouts: transactionsResult.data?.length || 0,
      };
    },
    enabled: !!currentLibrary,
  });

  return {
    stats: stats || { 
      totalBooks: 0, 
      uniqueTitles: 0,
      availableBooks: 0,
      borrowedBooks: 0,
      recentAdditions: 0,
      activeMembers: 0, 
      currentCheckouts: 0 
    },
    isLoading,
    error,
  };
}
