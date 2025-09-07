/**
 * Borrowing Transactions API Functions
 * Manage circulation and borrowing transaction operations
 */

import { supabase } from "@/lib/supabase/client";

export interface CirculationTransaction {
  id: string;
  transaction_type: "borrow" | "return" | "renew";
  status: "active" | "completed" | "overdue" | "returned";
  transaction_date: string;
  due_date?: string | null;
  return_date?: string | null;
  library_member: {
    member_id: string;
    personal_info: {
      full_name: string;
    };
  };
}

/**
 * Fetch circulation history for a specific book copy
 */
export async function fetchCirculationHistory(
  bookCopyId: string,
  libraryId: string,
  limit: number = 50
): Promise<CirculationTransaction[]> {
  const { data, error } = await supabase()
    .from("borrowing_transactions")
    .select(`
      id,
      transaction_type,
      status,
      transaction_date,
      due_date,
      return_date,
      library_member:library_members!inner (
        member_id,
        personal_info
      )
    `)
    .eq("book_copy_id", bookCopyId)
    .eq("library_id", libraryId)
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching circulation history:", error);
    throw new Error(`Failed to fetch circulation history: ${error.message}`);
  }

  return data as CirculationTransaction[];
}