"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCirculationHistory, type CirculationTransaction } from "@/lib/api/borrowing-transactions";

/**
 * Hook for fetching circulation history of a book copy
 */
export function useCirculationHistory(
  bookCopyId: string, 
  libraryId: string,
  limit: number = 50
) {
  return useQuery({
    queryKey: ["circulation-history", bookCopyId, libraryId, limit],
    queryFn: () => fetchCirculationHistory(bookCopyId, libraryId, limit),
    enabled: !!bookCopyId && !!libraryId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error?.message?.includes("not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for circulation statistics of a book copy
 */
export function useCirculationStats(bookCopyId: string, libraryId: string) {
  const { data: history, isLoading, error } = useCirculationHistory(
    bookCopyId, 
    libraryId
  );

  const stats = {
    totalTransactions: 0,
    totalBorrows: 0,
    totalReturns: 0,
    averageBorrowDuration: 0,
    currentlyBorrowed: false,
    overdueCount: 0,
    lastTransaction: null as CirculationTransaction | null,
    popularityScore: 0, // Based on borrow frequency
  };

  if (history && history.length > 0) {
    stats.totalTransactions = history.length;
    stats.totalBorrows = history.filter(t => t.transaction_type === "borrow").length;
    stats.totalReturns = history.filter(t => t.transaction_type === "return").length;
    stats.overdueCount = history.filter(t => t.status === "overdue").length;
    stats.currentlyBorrowed = history.some(t => t.status === "active");
    stats.lastTransaction = history[0]; // Most recent

    // Calculate average borrow duration for completed transactions
    const completedBorrows = history.filter(t => 
      t.transaction_type === "borrow" && 
      t.status === "returned" && 
      t.return_date && 
      t.transaction_date
    );

    if (completedBorrows.length > 0) {
      const totalDuration = completedBorrows.reduce((sum, transaction) => {
        const borrowDate = new Date(transaction.transaction_date);
        const returnDate = new Date(transaction.return_date!);
        const duration = returnDate.getTime() - borrowDate.getTime();
        return sum + duration;
      }, 0);

      stats.averageBorrowDuration = Math.round(
        totalDuration / completedBorrows.length / (1000 * 60 * 60 * 24)
      ); // Convert to days
    }

    // Calculate popularity score (borrows per month since first transaction)
    if (stats.totalBorrows > 0) {
      const firstTransaction = history[history.length - 1];
      const firstDate = new Date(firstTransaction.transaction_date);
      const now = new Date();
      const monthsSinceFirst = Math.max(
        1, 
        (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      stats.popularityScore = Math.round((stats.totalBorrows / monthsSinceFirst) * 100) / 100;
    }
  }

  return {
    stats,
    isLoading,
    error,
    history,
  };
}

/**
 * Hook for filtering and searching circulation history
 */
export function useFilteredCirculationHistory(
  bookCopyId: string,
  libraryId: string,
  filters: {
    transactionType?: "borrow" | "return" | "renew" | "all";
    status?: "active" | "completed" | "overdue" | "returned" | "all";
    dateRange?: {
      start: Date;
      end: Date;
    };
    memberId?: string;
  } = {}
) {
  const { data: allHistory, isLoading, error } = useCirculationHistory(
    bookCopyId,
    libraryId
  );

  const filteredHistory = allHistory?.filter((transaction) => {
    // Filter by transaction type
    if (filters.transactionType && 
        filters.transactionType !== "all" && 
        transaction.transaction_type !== filters.transactionType) {
      return false;
    }

    // Filter by status
    if (filters.status && 
        filters.status !== "all" && 
        transaction.status !== filters.status) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange) {
      const transactionDate = new Date(transaction.transaction_date);
      if (transactionDate < filters.dateRange.start || 
          transactionDate > filters.dateRange.end) {
        return false;
      }
    }

    // Filter by member ID
    if (filters.memberId && 
        transaction.library_member.member_id !== filters.memberId) {
      return false;
    }

    return true;
  }) || [];

  return {
    filteredHistory,
    totalCount: allHistory?.length || 0,
    filteredCount: filteredHistory.length,
    isLoading,
    error,
  };
}