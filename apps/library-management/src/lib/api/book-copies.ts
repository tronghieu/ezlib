/**
 * Book Copies API Functions
 * Create and manage library-specific book copies
 */

import { supabase } from "@/lib/supabase/client";
import type { BookCopy, BookCopyFormData } from "@/lib/types/books";

/**
 * Create multiple copies of a book edition for a library
 * @param editionId - Book edition ID
 * @param libraryId - Library ID
 * @param copyData - Copy form data
 * @returns Array of created book copies
 */
export async function createBookCopies(
  editionId: string,
  libraryId: string,
  copyData: BookCopyFormData
): Promise<BookCopy[]> {
  try {
    // Get the next available copy number for this edition in this library
    const { data: existingCopies, error: countError } = await supabase()
      .from("book_copies")
      .select("copy_number")
      .eq("book_edition_id", editionId)
      .eq("library_id", libraryId)
      .order("copy_number", { ascending: false })
      .limit(1);

    if (countError) {
      console.error("Error counting existing copies:", countError);
    }

    // Determine starting copy number
    const lastCopyNumber = existingCopies?.[0]?.copy_number || "000";
    const startingNumber = parseInt(lastCopyNumber) + 1;

    // Create copies array
    const copiesToCreate = [];
    for (let i = 0; i < copyData.total_copies; i++) {
      const copyNumber = (startingNumber + i).toString().padStart(3, "0");
      
      copiesToCreate.push({
        library_id: libraryId,
        book_edition_id: editionId,
        copy_number: copyNumber,
        location: copyData.shelf_location || copyData.section || copyData.call_number ? {
          shelf: copyData.shelf_location || null,
          section: copyData.section || null,
          call_number: copyData.call_number || null,
        } : null,
        condition_info: {
          condition: copyData.condition || "good",
          notes: copyData.notes || null,
          acquisition_date: new Date().toISOString(),
          acquisition_price: null,
          last_maintenance: null,
        },
        availability: {
          status: "available" as const,
          since: new Date().toISOString(),
          current_borrower_id: null,
          due_date: null,
          hold_queue: [],
        },
        status: "active" as const,
      });
    }

    // Insert all copies
    const { data: createdCopies, error: insertError } = await supabase()
      .from("book_copies")
      .insert(copiesToCreate)
      .select("*");

    if (insertError) {
      throw new Error(`Failed to create book copies: ${insertError.message}`);
    }

    // Update library book edition counts (for performance)
    await updateLibraryEditionCounts(editionId, libraryId);

    return (createdCopies as unknown as BookCopy[]) || [];
  } catch (error) {
    console.error("Error creating book copies:", error);
    throw error;
  }
}

/**
 * Update or create library book edition counts for efficient querying
 * @param editionId - Book edition ID
 * @param libraryId - Library ID
 */
async function updateLibraryEditionCounts(
  editionId: string,
  libraryId: string
): Promise<void> {
  try {
    // Note: This function is prepared for future stats table implementation
    // Currently counts are calculated but not used until the stats table is available
    const { error: countError } = await supabase()
      .from("book_copies")
      .select("availability")
      .eq("book_edition_id", editionId)
      .eq("library_id", libraryId)
      .eq("status", "active");

    if (countError) {
      console.warn("Error counting copies for edition counts:", countError);
      return;
    }

    // Calculate copy counts for future stats table implementation
    // const totalCopies = counts?.length || 0;
    // const availableCopies = counts?.filter(
    //   copy => (copy.availability as BookCopy["availability"])?.status === "available"
    // ).length || 0;

    // TODO: Upsert the counts record when table is available
    // const { error: upsertError } = await supabase()
    //   .from("library_book_edition_counts")
    //   .upsert({
    //     library_id: libraryId,
    //     book_edition_id: editionId,
    //     total_copies: totalCopies,
    //     available_copies: availableCopies,
    //   });

    // if (upsertError) {
    //   console.warn("Error updating edition counts:", upsertError);
    // }
  } catch (error) {
    console.warn("Error updating library edition counts:", error);
  }
}

