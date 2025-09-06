/**
 * Books API Functions
 * Handles book creation with the three-table pattern and duplicate detection
 */

import { supabase } from "@/lib/supabase/client";
import type {
  BookCreationData,
  BookCreationResult,
  DuplicateDetectionResult,
} from "@/lib/validation/books";

/**
 * Check for duplicate books within the library scope
 * AC: Duplicate detection by title and author within library
 */
export async function checkDuplicateBooks(
  title: string,
  author: string,
  libraryId: string
): Promise<DuplicateDetectionResult> {
  // Query book copies with joined data to check for duplicates (without general_books)
  const { data, error } = await supabase()
    .from("book_copies")
    .select(
      `
      id,
      copy_number,
      availability,
      book_editions!inner (
        title,
        book_contributors!inner (
          authors!inner (
            name,
            canonical_name
          )
        )
      )
    `
    )
    .eq("library_id", libraryId);

  if (error) {
    console.error("Duplicate detection error:", error);
    return { isDuplicate: false };
  }

  if (!data || data.length === 0) {
    return { isDuplicate: false };
  }

  // Filter results by title and author similarity
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedAuthor = author.trim().toLowerCase();

  const duplicates = data.filter((copy) => {
    const bookTitle = copy.book_editions?.title?.toLowerCase() || "";
    const contributors = copy.book_editions?.book_contributors || [];

    // Check if title matches
    const titleMatch =
      bookTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(bookTitle);

    // Check if any author matches
    const authorMatch = contributors.some(
      (contributor: {
        authors?: { name?: string; canonical_name?: string };
      }) => {
        const authorName = contributor.authors?.name?.toLowerCase() || "";
        const canonicalName =
          contributor.authors?.canonical_name?.toLowerCase() || "";
        return (
          authorName.includes(normalizedAuthor) ||
          normalizedAuthor.includes(authorName) ||
          canonicalName.includes(normalizedAuthor) ||
          normalizedAuthor.includes(canonicalName)
        );
      }
    );

    return titleMatch && authorMatch;
  });

  if (duplicates.length === 0) {
    return { isDuplicate: false };
  }

  // Format existing books for display
  const existingBooks = duplicates.map((copy) => {
    const contributors = copy.book_editions?.book_contributors || [];
    const firstAuthor = contributors[0]?.authors?.name || "Unknown Author";
    const availability = copy.availability as {
      status?: string;
      since?: string;
    };

    return {
      id: copy.id,
      title: copy.book_editions?.title || "Unknown Title",
      author_name: firstAuthor,
      availability_status: availability?.status || "unknown",
      copy_number: copy.copy_number,
    };
  });

  return {
    isDuplicate: true,
    existingBooks,
    suggestion: `Found ${duplicates.length} similar book(s) already in your library. Please review before adding.`,
  };
}

/**
 * Normalize author name for canonical storage
 * Converts "Last, First" to "First Last" and trims whitespace
 */
function normalizeAuthorName(name: string): {
  displayName: string;
  canonicalName: string;
} {
  const trimmed = name.trim();

  // Handle "Last, First" format
  if (trimmed.includes(",")) {
    const [last, first] = trimmed.split(",").map((part) => part.trim());
    const displayName = `${first} ${last}`.trim();
    return {
      displayName,
      canonicalName: displayName.toLowerCase(),
    };
  }

  // Handle regular "First Last" format
  return {
    displayName: trimmed,
    canonicalName: trimmed.toLowerCase(),
  };
}

/**
 * Find or create author record
 * AC: Author association with normalization
 */
async function upsertAuthor(
  authorName: string
): Promise<{ id: string; name: string; canonical_name: string }> {
  const { displayName, canonicalName } = normalizeAuthorName(authorName);

  // Try to find existing author by canonical name
  const { data: existingAuthor, error: findError } = await supabase()
    .from("authors")
    .select("id, name, canonical_name")
    .eq("canonical_name", canonicalName)
    .single();

  if (findError && findError.code !== "PGRST116") {
    throw new Error(`Author lookup failed: ${findError.message}`);
  }

  if (existingAuthor) {
    return existingAuthor;
  }

  // Create new author
  const { data: newAuthor, error: createError } = await supabase()
    .from("authors")
    .insert({
      name: displayName,
      canonical_name: canonicalName,
    })
    .select("id, name, canonical_name")
    .single();

  if (createError) {
    throw new Error(`Author creation failed: ${createError.message}`);
  }

  return newAuthor;
}

/**
 * Generate next copy number for the library
 * Format: LIB001, LIB002, etc.
 */
async function generateCopyNumber(libraryId: string): Promise<string> {
  // Get library code for copy number prefix
  const { data: library, error: libraryError } = await supabase()
    .from("libraries")
    .select("code")
    .eq("id", libraryId)
    .single();

  if (libraryError || !library) {
    throw new Error("Library not found");
  }

  // Get the highest copy number for this library
  const { data: lastCopy, error: copyError } = await supabase()
    .from("book_copies")
    .select("copy_number")
    .eq("library_id", libraryId)
    .like("copy_number", `${library.code.toUpperCase()}%`)
    .order("copy_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (copyError) {
    throw new Error(`Copy number generation failed: ${copyError.message}`);
  }

  let nextNumber = 1;

  if (lastCopy?.copy_number) {
    // Extract number from format like "LIB001"
    const match = lastCopy.copy_number.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  // Format with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, "0");
  return `${library.code.toUpperCase()}${formattedNumber}`;
}

/**
 * Create a new book with simplified pattern (no general_books)
 * AC: Direct book_editions → book_copies creation
 * AC: Automatic "available" status
 * AC: Library-scoped operations with RLS
 */
export async function createBook(
  bookData: BookCreationData
): Promise<BookCreationResult> {
  try {
    // Step 1: Check library permissions
    const { data: libraryRole, error: permissionError } = await supabase()
      .rpc("get_user_role", { 
        library_id_param: bookData.library_id 
      });

    if (permissionError) {
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }

    if (!libraryRole || !["owner", "manager", "librarian"].includes(libraryRole)) {
      throw new Error("Insufficient permissions. Owner, manager, or librarian role required.");
    }

    // Step 2: Check catalog access for creating authors/editions
    const { data: hasCatalogAccess, error: catalogError } = await supabase()
      .rpc("user_has_catalog_access");

    if (catalogError) {
      throw new Error(`Catalog access check failed: ${catalogError.message}`);
    }

    if (!hasCatalogAccess) {
      throw new Error("Insufficient permissions. Catalog access required to create books.");
    }

    // Step 3: Check for duplicates
    const duplicateCheck = await checkDuplicateBooks(
      bookData.title,
      bookData.author,
      bookData.library_id
    );

    if (duplicateCheck.isDuplicate) {
      throw new Error(
        `Potential duplicate detected: ${duplicateCheck.suggestion}`
      );
    }

    // Step 4: Find or create author
    const author = await upsertAuthor(bookData.author);

    // Step 5: Create book edition directly (no general_book)
    const editionData = {
      title: bookData.title.trim(),
      language: "en", // Default language
      isbn_13: null as string | null,
      edition_metadata: {
        publisher: bookData.publisher?.trim() || null,
        publication_year: bookData.publication_year || null,
      },
    };

    // Parse ISBN into correct format
    if (bookData.isbn && bookData.isbn.trim()) {
      const cleanIsbn = bookData.isbn.replace(/[-\s]/g, "");
      if (cleanIsbn.length === 10) {
        // ISBN-10 not supported in current schema
      } else if (cleanIsbn.length === 13) {
        editionData.isbn_13 = cleanIsbn;
      }
    }

    const { data: edition, error: editionError } = await supabase()
      .from("book_editions")
      .insert(editionData)
      .select("id, title, isbn_13")
      .single();

    if (editionError) {
      throw new Error(`Book edition creation failed: ${editionError.message}`);
    }

    // Step 6: Create book contributor relationship (edition-only)
    await supabase().from("book_contributors").insert({
      author_id: author.id,
      book_edition_id: edition.id,
      role: "author",
      sort_order: 1,
      credit_text: author.name,
    });

    // Step 7: Create book copy with automatic "available" status
    const copyNumber = await generateCopyNumber(bookData.library_id);
    const now = new Date().toISOString();

    const { data: copy, error: copyError } = await supabase()
      .from("book_copies")
      .insert({
        book_edition_id: edition.id,
        library_id: bookData.library_id,
        copy_number: copyNumber,
        availability: {
          status: "available",
          since: now,
        },
        condition_info: {
          condition: "new",
          notes: null,
        },
      })
      .select(
        `
        id,
        library_id,
        copy_number,
        availability
      `
      )
      .single();

    if (copyError) {
      throw new Error(`Book copy creation failed: ${copyError.message}`);
    }

    // Return the complete result
    const availability = copy.availability as {
      status?: string;
      since?: string;
    };
    return {
      edition: {
        id: edition.id,
        title: edition.title,
        isbn_13: edition.isbn_13 || undefined,
      },
      author: {
        id: author.id,
        name: author.name,
        canonical_name: author.canonical_name,
      },
      copy: {
        id: copy.id,
        library_id: copy.library_id,
        copy_number: copy.copy_number,
        availability: {
          status: (availability?.status || "available") as "available",
          since: availability?.since || new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("Book creation error:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error occurred during book creation");
  }
}
