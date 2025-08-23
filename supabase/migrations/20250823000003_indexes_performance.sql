-- =============================================================================
-- EzLib Migration: Performance Indexes for Book Discovery and Crawler Operations
-- =============================================================================
-- Purpose: Create optimized indexes for fast book lookups, author searches, and social queries
-- Dependencies: Requires 001_core_book_metadata.sql and 002_book_relationships.sql
-- Migration: 003_indexes_performance.sql
-- =============================================================================

-- =============================================================================
-- AUTHOR TABLE INDEXES
-- =============================================================================

-- Primary lookup index for author deduplication and search
CREATE INDEX idx_authors_canonical_name ON authors(canonical_name);

-- Full-text search index for author names
CREATE INDEX idx_authors_name_search ON authors USING GIN (to_tsvector('english', name));

-- Index for external API ID lookups (used by crawler)
CREATE INDEX idx_authors_openlibrary_id ON authors ((metadata->'external_ids'->>'openlibrary_id')) WHERE metadata->'external_ids'->>'openlibrary_id' IS NOT NULL;
CREATE INDEX idx_authors_goodreads_id ON authors ((metadata->'external_ids'->>'goodreads_id')) WHERE metadata->'external_ids'->>'goodreads_id' IS NOT NULL;

-- Index for enrichment status tracking
CREATE INDEX idx_authors_last_enriched ON authors ((metadata->>'last_enriched_at')) WHERE metadata->>'last_enriched_at' IS NOT NULL;

-- =============================================================================
-- GENERAL BOOKS TABLE INDEXES
-- =============================================================================

-- Primary title search index
CREATE INDEX idx_general_books_title ON general_books(canonical_title);

-- Full-text search index for book discovery
CREATE INDEX idx_general_books_title_search ON general_books USING GIN (to_tsvector('english', canonical_title));

-- Publication year filtering for book discovery
CREATE INDEX idx_general_books_publication_year ON general_books(first_publication_year) WHERE first_publication_year IS NOT NULL;

-- Subject/genre filtering (GIN index for array operations)
CREATE INDEX idx_general_books_subjects ON general_books USING GIN (subjects);

-- =============================================================================
-- BOOK EDITIONS TABLE INDEXES
-- =============================================================================

-- Critical ISBN lookup indexes (used heavily by crawler)
CREATE UNIQUE INDEX idx_book_editions_isbn_13 ON book_editions(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX idx_book_editions_isbn_10 ON book_editions(isbn_10) WHERE isbn_10 IS NOT NULL;

-- Compound index for ISBN + general book (efficient for crawler operations)
CREATE INDEX idx_book_editions_isbn_book ON book_editions(isbn_13, general_book_id) WHERE isbn_13 IS NOT NULL;

-- Language and country filtering for edition selection
CREATE INDEX idx_book_editions_language ON book_editions(language);
CREATE INDEX idx_book_editions_language_country ON book_editions(language, country) WHERE country IS NOT NULL;

-- Title search within editions
CREATE INDEX idx_book_editions_title_search ON book_editions USING GIN (to_tsvector('english', title));

-- Enrichment status tracking (crucial for crawler operations)
CREATE INDEX idx_book_editions_enrichment_status ON book_editions ((edition_metadata->>'enrichment_status'));
CREATE INDEX idx_book_editions_last_enriched ON book_editions ((edition_metadata->>'last_enriched_at')) WHERE edition_metadata->>'last_enriched_at' IS NOT NULL;

-- Quality score filtering (for displaying best editions first)
CREATE INDEX idx_book_editions_quality_score ON book_editions ((edition_metadata->>'quality_score')) WHERE edition_metadata->>'quality_score' IS NOT NULL;

-- Publication date filtering within editions
CREATE INDEX idx_book_editions_publication_date ON book_editions ((edition_metadata->>'publication_date')) WHERE edition_metadata->>'publication_date' IS NOT NULL;

-- Publisher and format filtering
CREATE INDEX idx_book_editions_publisher ON book_editions ((edition_metadata->>'publisher')) WHERE edition_metadata->>'publisher' IS NOT NULL;
CREATE INDEX idx_book_editions_format ON book_editions ((edition_metadata->>'format'));

-- =============================================================================
-- BOOK CONTRIBUTORS TABLE INDEXES
-- =============================================================================

-- Primary relationship lookups
CREATE INDEX idx_book_contributors_general_book ON book_contributors(general_book_id, role, sort_order);
CREATE INDEX idx_book_contributors_edition ON book_contributors(book_edition_id, role, sort_order) WHERE book_edition_id IS NOT NULL;
CREATE INDEX idx_book_contributors_author ON book_contributors(author_id, role);

-- Author bibliography queries (all books by an author)
CREATE INDEX idx_book_contributors_author_general ON book_contributors(author_id, general_book_id) WHERE book_edition_id IS NULL;

-- Reverse lookup: find all contributors for a book
CREATE INDEX idx_book_contributors_book_all_roles ON book_contributors(general_book_id, sort_order);

-- =============================================================================
-- SOCIAL FEATURES INDEXES
-- =============================================================================

-- Author follows indexes
CREATE INDEX idx_author_follows_user ON author_follows(user_id, followed_at DESC);
CREATE INDEX idx_author_follows_author ON author_follows(author_id, followed_at DESC);

-- Social follows indexes
CREATE INDEX idx_social_follows_follower ON social_follows(follower_id, followed_at DESC);
CREATE INDEX idx_social_follows_following ON social_follows(following_id, followed_at DESC);

-- Review indexes for social discovery
CREATE INDEX idx_reviews_general_book_visible ON reviews(general_book_id, visibility, created_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_reviews_edition_visible ON reviews(book_edition_id, visibility, created_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating, created_at DESC);

-- Full-text search on review content
CREATE INDEX idx_reviews_content_search ON reviews USING GIN (to_tsvector('english', content)) WHERE visibility = 'public';

-- =============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- Book discovery with language preference
CREATE INDEX idx_book_discovery_lang_rating ON book_editions(language, ((social_stats->>'average_rating')::numeric), created_at DESC) WHERE social_stats->>'average_rating' IS NOT NULL;

-- Author-book relationship with publication ordering
CREATE INDEX idx_author_books_chronological ON book_contributors(author_id, general_book_id) INCLUDE (created_at);

-- Recent enrichment tracking for crawler management
CREATE INDEX idx_recent_enrichments ON book_editions((edition_metadata->>'last_enriched_at'), (edition_metadata->>'enrichment_status')) WHERE edition_metadata->>'last_enriched_at' IS NOT NULL;

-- =============================================================================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- =============================================================================

-- Only index books that need enrichment
CREATE INDEX idx_editions_needs_enrichment ON book_editions(isbn_13, created_at) WHERE edition_metadata->>'enrichment_status' IN ('pending', 'failed');

-- Only index books with quality scores (enriched books)
CREATE INDEX idx_editions_quality_rated ON book_editions(((edition_metadata->>'quality_score')::numeric), language) WHERE edition_metadata->>'quality_score' IS NOT NULL;

-- Only index public reviews for discovery
CREATE INDEX idx_reviews_public_recent ON reviews(general_book_id, created_at DESC, rating) WHERE visibility = 'public';

-- =============================================================================
-- STATISTICS AND MAINTENANCE
-- =============================================================================

-- Update table statistics for query planner optimization
ANALYZE authors;
ANALYZE general_books;
ANALYZE book_editions;
ANALYZE book_contributors;
ANALYZE author_follows;
ANALYZE social_follows;
ANALYZE reviews;

-- Comments for index documentation
COMMENT ON INDEX idx_book_editions_isbn_13 IS 'Unique constraint and lookup index for ISBN-13 identifiers - critical for crawler operations';
COMMENT ON INDEX idx_book_editions_enrichment_status IS 'Tracks books by enrichment status for crawler job management';
COMMENT ON INDEX idx_authors_canonical_name IS 'Enforces author deduplication and enables fast author name lookups';
COMMENT ON INDEX idx_book_contributors_general_book IS 'Optimizes author-book relationship queries with role and ordering';
COMMENT ON INDEX idx_reviews_content_search IS 'Enables full-text search within review content for book discovery';