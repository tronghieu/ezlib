/**
 * Book Editions API Functions
 * Search and create book editions with shared data reuse
 */

import { supabase } from "@/lib/supabase/client";
import type { BookSearchResult, BookEdition, BookEditionFormData } from "@/lib/types/books";

/**
 * Search for existing book editions by title using optimized view
 * @param searchTerm - Search query (minimum 3 characters)
 * @returns Array of book search results
 */
export async function searchBookEditions(searchTerm: string): Promise<BookSearchResult[]> {
  if (searchTerm.length < 3) {
    return [];
  }

  try {
    console.log("Making search API call for:", searchTerm);
    
    // Use book_search_view for optimized searching with pre-computed fields
    // Note: Using DISTINCT on book_edition_id to avoid duplicates from multiple copies
    const { data, error } = await supabase()
      .from("book_search_view")
      .select("book_edition_id, title, isbn_13, authors_display, edition_metadata")
      .or(`title_search.ilike.%${searchTerm.toLowerCase()}%,authors_search.ilike.%${searchTerm.toLowerCase()}%,isbn_13.ilike.%${searchTerm}%`)
      .order('title')
      .limit(20); // Increase limit since we'll dedupe in JS

    console.log("API response:", { data, error });

    if (error) {
      console.error("Error searching book editions:", error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // Deduplicate by book_edition_id and transform the view data into search results
    const uniqueEditions = data ? 
      data.filter((edition, index, arr) => 
        arr.findIndex(e => e.book_edition_id === edition.book_edition_id) === index
      ) : [];
    
    const results = uniqueEditions.map((edition) => ({
      id: edition.book_edition_id,
      title: edition.title,
      authors: edition.authors_display ? edition.authors_display.split(", ") : [],
      publication_year: edition.edition_metadata?.publication_date ? parseInt(edition.edition_metadata.publication_date) : undefined,
      isbn_13: edition.isbn_13 || undefined,
    })).slice(0, 10); // Limit final results to 10
    
    console.log("Search results transformation:", { data, results });
    return results;
  } catch (error) {
    console.error("Book search error:", error);
    throw error;
  }
}


/**
 * Create a new book edition with author
 * @param editionData - Book edition form data
 * @returns Created book edition with full details
 */
export async function createBookEdition(editionData: BookEditionFormData): Promise<BookEdition> {
  try {
    // 1. Check catalog access role for creating editions and authors
    const { data: hasCatalogAccess, error: catalogError } = await supabase()
      .rpc("user_has_catalog_access");

    if (catalogError) {
      throw new Error(`Catalog access check failed: ${catalogError.message}`);
    }

    if (!hasCatalogAccess) {
      throw new Error("Insufficient role access. Catalog access required to create book editions.");
    }

    // 2. Start a transaction-like operation
    let authorId = editionData.author_id;
    
    // 3. Create or find author if needed
    if (!authorId && editionData.author_name) {
      const { data: existingAuthor } = await supabase()
        .from("authors")
        .select("id")
        .eq("canonical_name", editionData.author_name.toLowerCase())
        .single();

      if (existingAuthor) {
        authorId = existingAuthor.id;
      } else {
        // Create new author
        const { data: newAuthor, error: authorError } = await supabase()
          .from("authors")
          .insert({
            name: editionData.author_name,
            canonical_name: editionData.author_name.toLowerCase(),
          })
          .select("*")
          .single();

        if (authorError) {
          throw new Error(`Failed to create author: ${authorError.message}`);
        }
        
        authorId = newAuthor.id;
      }
    }

    if (!authorId) {
      throw new Error("Author is required for book edition");
    }

    // 4. Create book edition directly (no general_book needed)
    const { data: edition, error: editionError } = await supabase()
      .from("book_editions")
      .insert({
        title: editionData.title,
        subtitle: editionData.subtitle,
        language: editionData.language,
        isbn_13: editionData.isbn,
        edition_metadata: {
          publisher: editionData.publisher,
          publication_date: editionData.publication_year?.toString(),
        },
      })
      .select("*")
      .single();

    if (editionError) {
      throw new Error(`Failed to create book edition: ${editionError.message}`);
    }

    // 5. Link author to book edition directly
    const { error: contributorError } = await supabase()
      .from("book_contributors")
      .insert({
        book_edition_id: edition.id,
        author_id: authorId,
        role: "author",
        sort_order: 1,
      });

    if (contributorError) {
      throw new Error(`Failed to link author to book: ${contributorError.message}`);
    }

    // 6. Get author details to return complete edition
    const { data: author } = await supabase()
      .from("authors")
      .select("*")
      .eq("id", authorId)
      .single();

    // 7. Return complete edition with author data
    return {
      ...edition,
      edition_metadata: edition.edition_metadata || {},
      authors: author ? [{ ...author, metadata: author.metadata || {} }] : [],
    } as BookEdition;
  } catch (error) {
    console.error("Error creating book edition:", error);
    throw error;
  }
}