-- =============================================================================
-- EzLib Migration: Core Book and Author Metadata Tables
-- =============================================================================
-- Purpose: Create the foundational tables for book and author entities
-- Dependencies: Requires auth.users from Supabase Auth
-- Migration: 001_core_book_metadata.sql
-- =============================================================================

-- Authors table with comprehensive metadata and social statistics
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    canonical_name TEXT NOT NULL UNIQUE, -- Normalized for deduplication
    biography TEXT,
    metadata JSONB NOT NULL DEFAULT '{
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
    social_stats JSONB NOT NULL DEFAULT '{
        "total_books": 0,
        "total_reviews": 0,
        "average_rating": null,
        "total_followers": 0,
        "languages_published": []
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General books (universal book entities aggregating all editions)
CREATE TABLE general_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_title TEXT NOT NULL,
    first_publication_year INTEGER,
    subjects TEXT[] NOT NULL DEFAULT '{}', -- Genre/topic classifications
    global_stats JSONB NOT NULL DEFAULT '{
        "total_editions": 0,
        "total_reviews": 0,
        "global_average_rating": null,
        "total_borrows": 0,
        "languages_available": []
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Book editions (specific editions/translations with enrichment metadata)
CREATE TABLE book_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    general_book_id UUID NOT NULL REFERENCES general_books(id) ON DELETE CASCADE,
    isbn_13 TEXT, -- Can be null for rare/old books
    isbn_10 TEXT, -- Legacy ISBN format
    title TEXT NOT NULL,
    subtitle TEXT,
    language TEXT NOT NULL DEFAULT 'en', -- ISO 639-1 code
    country TEXT, -- Target market/region
    edition_metadata JSONB NOT NULL DEFAULT '{
        "publisher": null,
        "publication_date": null,
        "page_count": null,
        "cover_image_url": null,
        "edition_notes": null,
        "format": "paperback",
        "quality_score": null,
        "last_enriched_at": null,
        "enrichment_source": null,
        "enrichment_status": "pending"
    }'::jsonb,
    social_stats JSONB NOT NULL DEFAULT '{
        "review_count": 0,
        "average_rating": null,
        "language_specific_rating": null
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraints and validations
ALTER TABLE book_editions 
ADD CONSTRAINT check_isbn_13_format 
CHECK (isbn_13 IS NULL OR isbn_13 ~ '^\d{13}$');

ALTER TABLE book_editions 
ADD CONSTRAINT check_isbn_10_format 
CHECK (isbn_10 IS NULL OR isbn_10 ~ '^\d{9}[\dX]$');

ALTER TABLE book_editions 
ADD CONSTRAINT check_language_code 
CHECK (language ~ '^[a-z]{2}$');

-- Add validation for enrichment status
ALTER TABLE book_editions 
ADD CONSTRAINT check_enrichment_status 
CHECK (edition_metadata->>'enrichment_status' IN ('pending', 'in_progress', 'completed', 'failed', 'partial'));

-- Add validation for book format
ALTER TABLE book_editions 
ADD CONSTRAINT check_book_format 
CHECK (edition_metadata->>'format' IN ('hardcover', 'paperback', 'ebook', 'audiobook', 'other'));

-- Comments for documentation
COMMENT ON TABLE authors IS 'Authors with biographical data, social statistics, and external API IDs for enrichment';
COMMENT ON TABLE general_books IS 'Universal book entities that aggregate statistics across all editions and translations';
COMMENT ON TABLE book_editions IS 'Specific book editions with ISBN, publication details, and enrichment metadata';

COMMENT ON COLUMN authors.canonical_name IS 'Normalized name for deduplication (lowercase, no punctuation)';
COMMENT ON COLUMN authors.metadata IS 'Biographical data and external API references for enrichment';
COMMENT ON COLUMN authors.social_stats IS 'Aggregated statistics across all authored books';

COMMENT ON COLUMN book_editions.isbn_13 IS 'Primary ISBN-13 identifier for book lookups and enrichment';
COMMENT ON COLUMN book_editions.isbn_10 IS 'Legacy ISBN-10 format for compatibility with older systems';
COMMENT ON COLUMN book_editions.edition_metadata IS 'Publication details, quality scores, and enrichment tracking';