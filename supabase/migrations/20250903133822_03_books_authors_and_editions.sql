-- =============================================================================
-- EzLib Migration: Books, Authors, and Editions
-- =============================================================================
-- Purpose: Create book-related tables with metadata and relationships
-- Dependencies: Foundation functions and triggers
-- Migration: 03_books_authors_and_editions.sql
-- =============================================================================

-- =============================================================================
-- AUTHOR TABLES
-- =============================================================================

-- Authors table
CREATE TABLE public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    canonical_name TEXT NOT NULL, -- Normalized for deduplication
    biography TEXT,
    metadata JSONB DEFAULT '{
        "birth_date": null,
        "death_date": null,
        "birth_place": null,
        "nationality": null,
        "photo_url": null,
        "official_website": null,
        "genres": [],
        "aliases": [],
        "external_ids": {
            "goodreads_id": null,
            "openlibrary_id": null,
            "wikipedia_url": null,
            "imdb_id": null
        },
        "last_enriched_at": null
    }'::jsonb,
    social_stats JSONB DEFAULT '{
        "total_books": 0,
        "total_reviews": 0,
        "average_rating": null,
        "total_followers": 0,
        "languages_published": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- BOOK TABLES
-- =============================================================================

-- General books (universal book entities)
CREATE TABLE public.general_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_title TEXT NOT NULL,
    first_publication_year INTEGER,
    subjects TEXT[] DEFAULT '{}', -- Genre/topic classifications
    global_stats JSONB DEFAULT '{
        "total_editions": 0,
        "total_reviews": 0,
        "global_average_rating": null,
        "total_borrows": 0,
        "languages_available": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book editions (specific editions/translations)
CREATE TABLE public.book_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    general_book_id UUID NOT NULL REFERENCES public.general_books(id) ON DELETE CASCADE,
    isbn_13 TEXT, -- Can be null for rare/old books
    title TEXT NOT NULL,
    subtitle TEXT,
    language TEXT NOT NULL, -- ISO 639-1 code
    country TEXT, -- Target market/region
    edition_metadata JSONB DEFAULT '{
        "publisher": null,
        "publication_date": null,
        "page_count": null,
        "cover_image_url": null,
        "edition_notes": null,
        "format": "paperback",
        "last_enriched_at": null
    }'::jsonb,
    social_stats JSONB DEFAULT '{
        "review_count": 0,
        "average_rating": null,
        "language_specific_rating": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book contributors (authors, translators, editors, etc.)
CREATE TABLE public.book_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    general_book_id UUID NOT NULL REFERENCES public.general_books(id) ON DELETE CASCADE,
    book_edition_id UUID REFERENCES public.book_editions(id) ON DELETE CASCADE, -- NULL for general contributors
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'author', 'co_author', 'translator', 'editor', 'illustrator',
        'photographer', 'foreword', 'afterword', 'introduction',
        'narrator', 'adapter', 'compiler'
    )),
    credit_text TEXT, -- Custom credit if needed
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR BOOK DISCOVERY
-- =============================================================================

-- Author indexes
CREATE INDEX idx_authors_canonical_name ON public.authors(canonical_name);
CREATE INDEX idx_authors_name ON public.authors(name);

-- General books indexes
CREATE INDEX idx_general_books_title ON public.general_books(canonical_title);
CREATE INDEX idx_general_books_year ON public.general_books(first_publication_year) WHERE first_publication_year IS NOT NULL;
CREATE INDEX idx_general_books_subjects ON public.general_books USING GIN (subjects);

-- Book editions indexes
CREATE INDEX idx_book_editions_isbn ON public.book_editions(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX idx_book_editions_language ON public.book_editions(language);
CREATE INDEX idx_book_editions_general_book ON public.book_editions(general_book_id);
CREATE INDEX idx_book_editions_title ON public.book_editions(title);

-- Book contributors indexes
CREATE INDEX idx_book_contributors_general_book ON public.book_contributors(general_book_id, role);
CREATE INDEX idx_book_contributors_edition ON public.book_contributors(book_edition_id, role) WHERE book_edition_id IS NOT NULL;
CREATE INDEX idx_book_contributors_author ON public.book_contributors(author_id, role);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Note: Books and authors are public data, no RLS needed for read access
-- Authors and general_books are public tables (no RLS needed for reads)
-- book_editions and book_contributors are also public (no RLS for reads)

-- Future: If we add user-generated content or private collections, 
-- we would add RLS policies here

-- =============================================================================
-- CONSTRAINTS AND VALIDATIONS
-- =============================================================================

-- ISBN-13 format validation
ALTER TABLE public.book_editions 
ADD CONSTRAINT check_isbn_13_format 
CHECK (isbn_13 IS NULL OR isbn_13 ~ '^\d{13}$');

-- Language code validation (ISO 639-1)
ALTER TABLE public.book_editions 
ADD CONSTRAINT check_language_code 
CHECK (language ~ '^[a-z]{2}$');

-- Book format validation
ALTER TABLE public.book_editions 
ADD CONSTRAINT check_book_format 
CHECK (edition_metadata->>'format' IN ('hardcover', 'paperback', 'ebook', 'audiobook', 'other'));

-- =============================================================================
-- APPLY UPDATE TRIGGERS
-- =============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_authors_updated_at 
    BEFORE UPDATE ON public.authors 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_general_books_updated_at 
    BEFORE UPDATE ON public.general_books 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_editions_updated_at 
    BEFORE UPDATE ON public.book_editions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.authors IS 'Authors with biographical data, social statistics, and external API IDs for enrichment';
COMMENT ON TABLE public.general_books IS 'Universal book entities that aggregate statistics across all editions and translations';
COMMENT ON TABLE public.book_editions IS 'Specific book editions with ISBN, publication details, and enrichment metadata';
COMMENT ON TABLE public.book_contributors IS 'Many-to-many relationship between books and authors with role specifications';

COMMENT ON COLUMN public.authors.canonical_name IS 'Normalized name for deduplication (lowercase, no punctuation)';
COMMENT ON COLUMN public.authors.metadata IS 'Biographical data and external API references for enrichment';
COMMENT ON COLUMN public.authors.social_stats IS 'Aggregated statistics across all authored books';

COMMENT ON COLUMN public.general_books.canonical_title IS 'Normalized title for grouping editions across languages and publishers';
COMMENT ON COLUMN public.general_books.subjects IS 'Array of genre/topic classifications for discovery';
COMMENT ON COLUMN public.general_books.global_stats IS 'Aggregated statistics across all editions of this book';

COMMENT ON COLUMN public.book_editions.isbn_13 IS 'Primary ISBN-13 identifier for book lookups and enrichment';
COMMENT ON COLUMN public.book_editions.language IS 'ISO 639-1 language code for the edition';
COMMENT ON COLUMN public.book_editions.edition_metadata IS 'Publication details, quality scores, and enrichment tracking';

COMMENT ON COLUMN public.book_contributors.role IS 'Contributor role: author, translator, editor, illustrator, etc.';
COMMENT ON COLUMN public.book_contributors.sort_order IS 'Display order for multiple contributors of the same role';