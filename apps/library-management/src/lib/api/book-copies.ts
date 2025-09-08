/**
 * Book Copies API Functions
 * Create and manage library-specific book copies
 */

import { supabase } from "@/lib/supabase/client";
import type { BookCopy, BookCopyFormData, BookEdition, Author } from "@/types/books.d";
import type { BookCopyUpdateData } from "@/lib/validation/book-copy";

export interface BookCopyWithDetails extends BookCopy {
  book_edition: BookEdition & {
    authors: Author[];
  };
}


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
    const copiesToCreate = [];

    // Handle manual copy number (only for single copy creation)
    if (copyData.copy_number && copyData.total_copies === 1) {
      // Validate copy number is unique within library for this edition
      const { data: existingCopy, error: checkError } = await supabase()
        .from("book_copies")
        .select("id")
        .eq("book_edition_id", editionId)
        .eq("library_id", libraryId)
        .eq("copy_number", copyData.copy_number)
        .limit(1);

      if (checkError) {
        console.error("Error checking copy number uniqueness:", checkError);
        throw new Error("Failed to validate copy number");
      }

      if (existingCopy && existingCopy.length > 0) {
        throw new Error(`Copy number "${copyData.copy_number}" already exists for this book in your library`);
      }

      // Validate barcode is unique within library (if provided)
      if (copyData.barcode) {
        const { data: existingBarcode, error: barcodeError } = await supabase()
          .from("book_copies")
          .select("id")
          .eq("library_id", libraryId)
          .eq("barcode", copyData.barcode)
          .limit(1);

        if (barcodeError) {
          console.error("Error checking barcode uniqueness:", barcodeError);
          throw new Error("Failed to validate barcode");
        }

        if (existingBarcode && existingBarcode.length > 0) {
          throw new Error(`Barcode "${copyData.barcode}" already exists in your library`);
        }
      }

      copiesToCreate.push({
        library_id: libraryId,
        book_edition_id: editionId,
        copy_number: copyData.copy_number,
        barcode: copyData.barcode || null,
        total_copies: 1,
        available_copies: 1,
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
    } else {
      // Auto-generate copy numbers for multiple copies or when no manual number provided
      if (copyData.copy_number && copyData.total_copies > 1) {
        throw new Error("Custom copy numbers can only be used when adding exactly 1 copy. For multiple copies, leave the copy number blank to auto-generate sequential numbers.");
      }

      if (copyData.barcode && copyData.total_copies > 1) {
        throw new Error("Custom barcodes can only be used when adding exactly 1 copy. For multiple copies, leave the barcode blank.");
      }

      // Get the next available copy number for auto-generation
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

      // Create copies array with auto-generated numbers
      for (let i = 0; i < copyData.total_copies; i++) {
        const copyNumber = (startingNumber + i).toString().padStart(3, "0");
        
        copiesToCreate.push({
          library_id: libraryId,
          book_edition_id: editionId,
          copy_number: copyNumber,
          barcode: null, // No custom barcode for auto-generated copies
          total_copies: 1,
          available_copies: 1,
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

/**
 * Fetch detailed information about a book copy including book edition and author details
 */
export async function fetchBookCopyDetail(
  bookCopyId: string,
  libraryId: string
): Promise<BookCopyWithDetails> {
  // Use book_display_view for optimized single query
  const { data, error } = await supabase()
    .from("book_display_view")
    .select("*")
    .eq("book_copy_id", bookCopyId)
    .eq("library_id", libraryId)
    .eq("is_deleted", false)
    .single();

  if (error) {
    console.error("Error fetching book copy detail:", error);
    throw new Error(`Failed to fetch book copy: ${error.message}`);
  }

  if (!data) {
    throw new Error("Book copy not found");
  }

  // Transform view data to match our BookCopyWithDetails interface
  const bookCopy: BookCopyWithDetails = {
    // Book copy fields
    id: data.book_copy_id,
    library_id: data.library_id,
    book_edition_id: data.book_edition_id,
    copy_number: data.copy_number,
    barcode: data.barcode,
    total_copies: data.total_copies,
    available_copies: data.available_copies,
    location: data.location,
    condition_info: data.condition_info,
    availability: data.availability,
    status: data.copy_status,
    is_deleted: data.is_deleted,
    deleted_at: data.deleted_at,
    deleted_by: data.deleted_by,
    created_at: data.copy_created_at,
    updated_at: data.copy_updated_at,
    
    // Additional display fields
    title: data.title,
    authors_display: data.authors_display,
    
    // Book edition nested object
    book_edition: {
      id: data.book_edition_id,
      general_book_id: data.general_book_id,
      isbn_13: data.isbn_13,
      title: data.title,
      subtitle: data.subtitle,
      language: data.language,
      country: data.country,
      edition_metadata: data.edition_metadata,
      social_stats: data.social_stats,
      created_at: data.edition_created_at,
      updated_at: data.edition_updated_at,
      // Parse authors from display string (simplified for view usage)
      authors: data.authors_display ? 
        data.authors_display.split(', ').map((name: string) => ({
          id: '', // Not available in view
          name: name.trim(),
          biography: null,
          birth_date: null,
          death_date: null,
          created_at: null,
          updated_at: null
        })) : []
    }
  };

  return bookCopy;
}

/**
 * Update book copy information
 */
export async function updateBookCopy(
  bookCopyId: string,
  updateData: BookCopyUpdateData,
  libraryId: string
): Promise<BookCopyWithDetails> {
  // Check if copy_number is being updated and validate uniqueness
  if (updateData.copy_number) {
    const { data: existingCopy, error: checkError } = await supabase()
      .from("book_copies")
      .select("id")
      .eq("copy_number", updateData.copy_number)
      .eq("library_id", libraryId)
      .neq("id", bookCopyId) // Exclude current copy
      .limit(1);

    if (checkError) {
      console.error("Error checking copy number uniqueness:", checkError);
      throw new Error("Failed to validate copy number");
    }

    if (existingCopy && existingCopy.length > 0) {
      throw new Error(`Copy number "${updateData.copy_number}" already exists in your library`);
    }
  }

  // Get current book copy to preserve existing condition_info data
  const { data: currentCopy, error: fetchError } = await supabase()
    .from("book_copies")
    .select("condition_info")
    .eq("id", bookCopyId)
    .eq("library_id", libraryId)
    .single();

  if (fetchError) {
    console.error("Error fetching current copy:", fetchError);
    throw new Error("Failed to fetch current book copy");
  }

  const currentConditionInfo = currentCopy?.condition_info || {};

  // Prepare update data with proper structure
  const updatePayload = {
    copy_number: updateData.copy_number,
    barcode: updateData.barcode || null,
    location: {
      shelf: updateData.shelf_location || null,
      section: updateData.section || null,
      call_number: updateData.call_number || null,
    },
    condition_info: {
      ...currentConditionInfo,
      condition: updateData.condition,
      notes: updateData.notes || null,
      last_maintenance: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase()
    .from("book_copies")
    .update(updatePayload)
    .eq("id", bookCopyId)
    .eq("library_id", libraryId)
    .eq("is_deleted", false)
    .select(`
      *,
      book_edition:book_editions (
        *,
        authors (
          id,
          name,
          biography,
          birth_date,
          death_date,
          created_at,
          updated_at
        )
      )
    `)
    .single();

  if (error) {
    console.error("Error updating book copy:", error);
    throw new Error(`Failed to update book copy: ${error.message}`);
  }

  if (!data) {
    throw new Error("Book copy not found or no changes made");
  }

  return data as BookCopyWithDetails;
}

/**
 * Soft delete a book copy (mark as deleted)
 */
export async function softDeleteBookCopy(
  bookCopyId: string,
  libraryId: string
): Promise<void> {
  // Get current user for audit trail
  const { data: { user } } = await supabase().auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase()
    .from("book_copies")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookCopyId)
    .eq("library_id", libraryId)
    .eq("is_deleted", false);

  if (error) {
    console.error("Error deleting book copy:", error);
    throw new Error(`Failed to delete book copy: ${error.message}`);
  }
}


/**
 * Check if book copy can be safely deleted (no active borrows/holds)
 */
export async function checkBookCopyDeleteSafety(
  bookCopyId: string,
  libraryId: string
): Promise<{
  canDelete: boolean;
  activeBorrows: number;
  activeHolds: number;
  warnings: string[];
}> {
  // Check for active borrowing transactions
  const { data: activeBorrows, error: borrowError } = await supabase()
    .from("borrowing_transactions")
    .select("id")
    .eq("book_copy_id", bookCopyId)
    .eq("library_id", libraryId)
    .in("status", ["active", "overdue"]);

  if (borrowError) {
    console.error("Error checking active borrows:", borrowError);
    throw new Error(`Failed to check borrowing status: ${borrowError.message}`);
  }

  // Get book copy availability info
  const { data: bookCopy, error: copyError } = await supabase()
    .from("book_copies")
    .select("availability")
    .eq("id", bookCopyId)
    .eq("library_id", libraryId)
    .single();

  if (copyError) {
    console.error("Error fetching book copy:", copyError);
    throw new Error(`Failed to fetch book copy: ${copyError.message}`);
  }

  const activeHolds = bookCopy?.availability?.hold_queue?.length || 0;
  const activeBorrowsCount = activeBorrows?.length || 0;

  const warnings: string[] = [];
  let canDelete = true;

  if (activeBorrowsCount > 0) {
    warnings.push(`${activeBorrowsCount} active borrowing transaction(s)`);
    canDelete = false;
  }

  if (activeHolds > 0) {
    warnings.push(`${activeHolds} active hold(s) in queue`);
    // Note: We might still allow deletion with holds, but warn the user
  }

  return {
    canDelete,
    activeBorrows: activeBorrowsCount,
    activeHolds,
    warnings,
  };
}

