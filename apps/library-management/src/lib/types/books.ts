/**
 * Book-related TypeScript types
 * Based on database schema for multi-table book structure
 */

export interface Author {
  id: string;
  name: string;
  canonical_name: string;
  biography?: string | null;
  metadata?: {
    birth_date?: string;
    death_date?: string;
    birth_place?: string;
    nationality?: string;
    photo_url?: string;
    official_website?: string;
    genres?: string[];
    aliases?: string[];
    external_ids?: {
      goodreads_id?: string;
      openlibrary_id?: string;
      wikipedia_url?: string;
      imdb_id?: string;
    };
    last_enriched_at?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface GeneralBook {
  id: string;
  canonical_title: string;
  first_publication_year?: number | null;
  subjects?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BookEdition {
  id: string;
  general_book_id: string;
  isbn_13?: string | null;
  title: string;
  subtitle?: string | null;
  language: string;
  country?: string | null;
  edition_metadata?: {
    publisher?: string;
    publication_date?: string;
    page_count?: number;
    cover_image_url?: string;
    edition_notes?: string;
    format?: string;
    last_enriched_at?: string;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined data
  general_book?: GeneralBook;
  authors?: Author[];
}

export interface BookCopy {
  id: string;
  library_id: string;
  book_edition_id: string;
  copy_number: string;
  barcode?: string | null;
  location?: {
    shelf?: string;
    section?: string;
    call_number?: string;
  } | null;
  condition_info?: {
    condition: "excellent" | "good" | "fair" | "poor";
    notes?: string;
    acquisition_date?: string;
    acquisition_price?: number;
    last_maintenance?: string;
  } | null;
  availability?: {
    status: "available" | "borrowed" | "reserved" | "maintenance";
    since: string;
    current_borrower_id?: string;
    due_date?: string;
    hold_queue?: string[];
  } | null;
  status: "active" | "inactive" | "damaged" | "lost" | "maintenance";
  created_at: string;
  updated_at: string;
  // Joined data
  book_edition?: BookEdition;
}

export interface BookContributor {
  id: string;
  general_book_id: string;
  book_edition_id?: string | null;
  author_id: string;
  role: "author" | "co_author" | "translator" | "editor" | "illustrator" | "photographer" | "foreword" | "afterword" | "introduction" | "narrator" | "adapter" | "compiler";
  credit_text?: string | null;
  sort_order: number;
  created_at: string;
  // Joined data
  author?: Author;
}

// Form data types
export interface AuthorFormData {
  name: string;
  biography?: string;
}

export interface BookEditionFormData {
  title: string;
  subtitle?: string;
  language: string;
  publication_year?: number;
  publisher?: string;
  isbn?: string;
  author_id?: string;
  author_name?: string; // For new author creation
}

export interface BookCopyFormData {
  total_copies: number;
  shelf_location?: string;
  section?: string;
  call_number?: string;
  condition?: "excellent" | "good" | "fair" | "poor";
  notes?: string;
}

// Search result types
export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  publication_year?: number;
  isbn_13?: string;
}

export interface AuthorSearchResult {
  id: string;
  name: string;
  book_count?: number;
}

// API response types
export interface BookCreationResult {
  edition: {
    id: string;
    title: string;
    isbn_13?: string;
  };
  author: {
    id: string;
    name: string;
    canonical_name: string;
  };
  copy: {
    id: string;
    library_id: string;
    copy_number: string;
    availability: {
      status: "available";
      since: string;
    };
  };
}