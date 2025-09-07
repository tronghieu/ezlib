/**
 * Authors API Functions
 * Search and create authors with fuzzy matching
 */

import { supabase } from "@/lib/supabase/client";
import type { Author, AuthorSearchResult, AuthorFormData } from "@/lib/types/books";

/**
 * Search for existing authors by name
 * @param searchTerm - Search query (minimum 3 characters)
 * @returns Array of author search results
 */
export async function searchAuthors(searchTerm: string): Promise<AuthorSearchResult[]> {
  if (searchTerm.length < 3) {
    return [];
  }

  console.log("Making author search API call for:", searchTerm);

  try {
    const { data, error } = await supabase()
      .from("authors")
      .select(`
        id,
        name,
        book_contributors (
          id
        )
      `)
      .or(`name.ilike.%${searchTerm}%,canonical_name.ilike.%${searchTerm}%`)
      .limit(10);

    console.log("Author search API response:", { data, error });

    if (error) {
      console.error("Error searching authors:", error);
      throw new Error(`Author search failed: ${error.message}`);
    }

    // Transform the joined data into search results
    const results = (data || []).map((author) => ({
      id: author.id,
      name: author.name,
      book_count: author.book_contributors?.length || 0,
    }));

    console.log("Author search results transformation:", { data, results });

    return results;
  } catch (error) {
    console.error("Author search error:", error);
    throw error;
  }
}

/**
 * Get full author details by ID
 * @param authorId - Author ID
 * @returns Full author with metadata
 */
export async function getAuthorById(authorId: string): Promise<Author | null> {
  try {
    const { data, error } = await supabase()
      .from("authors")
      .select("*")
      .eq("id", authorId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get author: ${error.message}`);
    }

    return data as Author;
  } catch (error) {
    console.error("Error getting author:", error);
    throw error;
  }
}

/**
 * Create a new author
 * @param authorData - Author form data
 * @returns Created author
 */
export async function createAuthor(authorData: AuthorFormData): Promise<Author> {
  try {
    // Check for existing author with same canonical name
    const { data: existingAuthor } = await supabase()
      .from("authors")
      .select("id, name")
      .eq("canonical_name", authorData.name.toLowerCase())
      .single();

    if (existingAuthor) {
      throw new Error(`An author named "${existingAuthor.name}" already exists`);
    }

    // Create new author
    const { data, error } = await supabase()
      .from("authors")
      .insert({
        name: authorData.name,
        canonical_name: authorData.name.toLowerCase(),
        biography: authorData.biography || null,
        metadata: null, // Can be enriched later
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create author: ${error.message}`);
    }

    return data as Author;
  } catch (error) {
    console.error("Error creating author:", error);
    throw error;
  }
}

/**
 * Update an existing author
 * @param authorId - Author ID
 * @param authorData - Updated author data
 * @returns Updated author
 */
export async function updateAuthor(authorId: string, authorData: Partial<AuthorFormData>): Promise<Author> {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (authorData.name) {
      updateData.name = authorData.name;
      updateData.canonical_name = authorData.name.toLowerCase();
    }
    
    if (authorData.biography !== undefined) {
      updateData.biography = authorData.biography || null;
    }

    const { data, error } = await supabase()
      .from("authors")
      .update(updateData)
      .eq("id", authorId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update author: ${error.message}`);
    }

    return data as Author;
  } catch (error) {
    console.error("Error updating author:", error);
    throw error;
  }
}

/**
 * Get authors by book edition ID
 * @param editionId - Book edition ID
 * @returns Array of authors for the book
 */
export async function getAuthorsByEdition(editionId: string): Promise<Author[]> {
  try {
    const { data, error } = await supabase()
      .from("book_contributors")
      .select(`
        authors (*)
      `)
      .eq("book_edition_id", editionId)
      .order("sort_order");

    if (error) {
      throw new Error(`Failed to get authors for edition: ${error.message}`);
    }

    return (data || [])
      .map((contributor) => contributor.authors)
      .filter(Boolean) as Author[];
  } catch (error) {
    console.error("Error getting authors by edition:", error);
    throw error;
  }
}