-- =============================================================================
-- EzLib Migration: Database Triggers and Functions
-- =============================================================================
-- Purpose: Create automated database functions for data integrity and statistics
-- Dependencies: Requires all previous migrations (001-003)
-- Migration: 004_triggers_functions.sql
-- =============================================================================

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Function to normalize author names for canonicalization
CREATE OR REPLACE FUNCTION normalize_author_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, remove punctuation, normalize whitespace
    RETURN TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(
            LOWER(input_name), 
            '[^\w\s]', '', 'g'  -- Remove punctuation
        ), 
        '\s+', ' ', 'g'  -- Normalize whitespace
    ));
END;
$$ LANGUAGE 'plpgsql' IMMUTABLE;

-- Function to extract ISBN-13 from ISBN-10
CREATE OR REPLACE FUNCTION isbn_10_to_13(isbn_10 TEXT)
RETURNS TEXT AS $$
DECLARE
    isbn_digits TEXT;
    check_sum INTEGER;
    i INTEGER;
    digit INTEGER;
BEGIN
    -- Remove any formatting and validate length
    isbn_digits := REGEXP_REPLACE(isbn_10, '[^0-9X]', '', 'g');
    
    IF LENGTH(isbn_digits) != 10 THEN
        RETURN NULL;
    END IF;
    
    -- Start with 978 prefix
    isbn_digits := '978' || SUBSTRING(isbn_digits, 1, 9);
    
    -- Calculate check digit
    check_sum := 0;
    FOR i IN 1..12 LOOP
        digit := CAST(SUBSTRING(isbn_digits, i, 1) AS INTEGER);
        IF i % 2 = 1 THEN
            check_sum := check_sum + digit;
        ELSE
            check_sum := check_sum + (digit * 3);
        END IF;
    END LOOP;
    
    check_sum := (10 - (check_sum % 10)) % 10;
    
    RETURN isbn_digits || check_sum::TEXT;
END;
$$ LANGUAGE 'plpgsql' IMMUTABLE;

-- =============================================================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- =============================================================================

-- Apply updated_at triggers to all tables with timestamp tracking
CREATE TRIGGER update_authors_updated_at 
    BEFORE UPDATE ON authors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_general_books_updated_at 
    BEFORE UPDATE ON general_books 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_editions_updated_at 
    BEFORE UPDATE ON book_editions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_contributors_updated_at 
    BEFORE UPDATE ON book_contributors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DATA INTEGRITY AND VALIDATION TRIGGERS
-- =============================================================================

-- Function to auto-populate canonical_name for authors
CREATE OR REPLACE FUNCTION set_author_canonical_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically generate canonical_name if not provided
    IF NEW.canonical_name IS NULL OR NEW.canonical_name = '' THEN
        NEW.canonical_name := normalize_author_name(NEW.name);
    END IF;
    
    -- Ensure canonical_name is always normalized even if provided
    NEW.canonical_name := normalize_author_name(NEW.canonical_name);
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER set_author_canonical_name_trigger 
    BEFORE INSERT OR UPDATE ON authors 
    FOR EACH ROW 
    EXECUTE FUNCTION set_author_canonical_name();

-- Function to auto-generate ISBN-13 from ISBN-10 if missing
CREATE OR REPLACE FUNCTION generate_isbn_13()
RETURNS TRIGGER AS $$
BEGIN
    -- If ISBN-13 is missing but ISBN-10 exists, try to convert
    IF NEW.isbn_13 IS NULL AND NEW.isbn_10 IS NOT NULL THEN
        NEW.isbn_13 := isbn_10_to_13(NEW.isbn_10);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER generate_isbn_13_trigger 
    BEFORE INSERT OR UPDATE ON book_editions 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_isbn_13();

-- =============================================================================
-- STATISTICS MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to update author statistics when books are added/removed
CREATE OR REPLACE FUNCTION update_author_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total books count for the author
    UPDATE authors 
    SET social_stats = jsonb_set(
        social_stats, 
        '{total_books}', 
        (
            SELECT COUNT(DISTINCT bc.general_book_id)::TEXT::JSONB
            FROM book_contributors bc 
            WHERE bc.author_id = COALESCE(NEW.author_id, OLD.author_id)
            AND bc.role = 'author'
        )
    )
    WHERE id = COALESCE(NEW.author_id, OLD.author_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_author_stats_trigger
    AFTER INSERT OR DELETE ON book_contributors
    FOR EACH ROW
    EXECUTE FUNCTION update_author_stats();

-- Function to update general book statistics when editions are added/removed
CREATE OR REPLACE FUNCTION update_general_book_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total editions count and available languages
    UPDATE general_books 
    SET global_stats = jsonb_set(
        jsonb_set(
            global_stats, 
            '{total_editions}', 
            (
                SELECT COUNT(*)::TEXT::JSONB
                FROM book_editions be 
                WHERE be.general_book_id = COALESCE(NEW.general_book_id, OLD.general_book_id)
            )
        ),
        '{languages_available}', 
        (
            SELECT COALESCE(jsonb_agg(DISTINCT be.language), '[]'::jsonb)
            FROM book_editions be 
            WHERE be.general_book_id = COALESCE(NEW.general_book_id, OLD.general_book_id)
        )
    )
    WHERE id = COALESCE(NEW.general_book_id, OLD.general_book_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_general_book_stats_trigger
    AFTER INSERT OR DELETE ON book_editions
    FOR EACH ROW
    EXECUTE FUNCTION update_general_book_stats();

-- Function to update review statistics when reviews are added/updated/deleted
CREATE OR REPLACE FUNCTION update_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_edition_id UUID;
    target_general_book_id UUID;
BEGIN
    -- Determine which book to update
    target_edition_id := COALESCE(NEW.book_edition_id, OLD.book_edition_id);
    target_general_book_id := COALESCE(NEW.general_book_id, OLD.general_book_id);
    
    -- Update book edition statistics
    UPDATE book_editions 
    SET social_stats = jsonb_set(
        jsonb_set(
            social_stats, 
            '{review_count}', 
            (
                SELECT COUNT(*)::TEXT::JSONB
                FROM reviews r 
                WHERE r.book_edition_id = target_edition_id
                AND r.visibility = 'public'
            )
        ),
        '{average_rating}', 
        (
            SELECT COALESCE(ROUND(AVG(r.rating), 2), 'null')::TEXT::JSONB
            FROM reviews r 
            WHERE r.book_edition_id = target_edition_id
            AND r.visibility = 'public'
        )
    )
    WHERE id = target_edition_id;
    
    -- Update general book statistics (aggregated across all editions)
    UPDATE general_books 
    SET global_stats = jsonb_set(
        jsonb_set(
            global_stats, 
            '{total_reviews}', 
            (
                SELECT COUNT(*)::TEXT::JSONB
                FROM reviews r 
                WHERE r.general_book_id = target_general_book_id
                AND r.visibility = 'public'
            )
        ),
        '{global_average_rating}', 
        (
            SELECT COALESCE(ROUND(AVG(r.rating), 2), 'null')::TEXT::JSONB
            FROM reviews r 
            WHERE r.general_book_id = target_general_book_id
            AND r.visibility = 'public'
        )
    )
    WHERE id = target_general_book_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_review_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_stats();

-- Function to update author follow statistics
CREATE OR REPLACE FUNCTION update_author_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total followers count for the author
    UPDATE authors 
    SET social_stats = jsonb_set(
        social_stats, 
        '{total_followers}', 
        (
            SELECT COUNT(*)::TEXT::JSONB
            FROM author_follows af 
            WHERE af.author_id = COALESCE(NEW.author_id, OLD.author_id)
        )
    )
    WHERE id = COALESCE(NEW.author_id, OLD.author_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_author_follow_stats_trigger
    AFTER INSERT OR DELETE ON author_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_author_follow_stats();

-- =============================================================================
-- ENRICHMENT TRACKING FUNCTIONS
-- =============================================================================

-- Function to track when books are enriched
CREATE OR REPLACE FUNCTION track_enrichment_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If enrichment metadata is being updated, set last_enriched_at
    IF OLD.edition_metadata->>'last_enriched_at' IS DISTINCT FROM NEW.edition_metadata->>'last_enriched_at' THEN
        NEW.edition_metadata := jsonb_set(
            NEW.edition_metadata,
            '{last_enriched_at}',
            to_jsonb(NOW()::TEXT)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER track_enrichment_update_trigger
    BEFORE UPDATE ON book_editions
    FOR EACH ROW
    WHEN (OLD.edition_metadata IS DISTINCT FROM NEW.edition_metadata)
    EXECUTE FUNCTION track_enrichment_update();

-- =============================================================================
-- UTILITY FUNCTIONS FOR CRAWLER SERVICE
-- =============================================================================

-- Function to find books needing enrichment
CREATE OR REPLACE FUNCTION get_books_needing_enrichment(limit_count INTEGER DEFAULT 100)
RETURNS TABLE(
    edition_id UUID,
    isbn_13 TEXT,
    title TEXT,
    general_book_id UUID,
    enrichment_status TEXT,
    last_enriched_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        be.id,
        be.isbn_13,
        be.title,
        be.general_book_id,
        be.edition_metadata->>'enrichment_status' AS enrichment_status,
        (be.edition_metadata->>'last_enriched_at')::TIMESTAMPTZ AS last_enriched_at
    FROM book_editions be
    WHERE be.isbn_13 IS NOT NULL
    AND (
        be.edition_metadata->>'enrichment_status' IN ('pending', 'failed')
        OR be.edition_metadata->>'last_enriched_at' IS NULL
        OR (be.edition_metadata->>'last_enriched_at')::TIMESTAMPTZ < NOW() - INTERVAL '30 days'
    )
    ORDER BY 
        CASE be.edition_metadata->>'enrichment_status'
            WHEN 'pending' THEN 1
            WHEN 'failed' THEN 2
            ELSE 3
        END,
        be.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE 'plpgsql';

-- Function to mark enrichment status
CREATE OR REPLACE FUNCTION update_enrichment_status(
    edition_id UUID,
    new_status TEXT,
    quality_score DECIMAL DEFAULT NULL,
    enrichment_source TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_metadata JSONB;
BEGIN
    -- Build the updated metadata step by step
    SELECT edition_metadata INTO updated_metadata
    FROM book_editions 
    WHERE id = edition_id;
    
    -- Update status and timestamp
    updated_metadata := jsonb_set(
        jsonb_set(
            updated_metadata,
            '{enrichment_status}',
            to_jsonb(new_status)
        ),
        '{last_enriched_at}',
        to_jsonb(NOW()::TEXT)
    );
    
    -- Update quality score if provided
    IF quality_score IS NOT NULL THEN
        updated_metadata := jsonb_set(
            updated_metadata,
            '{quality_score}',
            to_jsonb(quality_score)
        );
    END IF;
    
    -- Update enrichment source if provided
    IF enrichment_source IS NOT NULL THEN
        updated_metadata := jsonb_set(
            updated_metadata,
            '{enrichment_source}',
            to_jsonb(enrichment_source)
        );
    END IF;
    
    -- Apply the final update
    UPDATE book_editions
    SET edition_metadata = updated_metadata
    WHERE id = edition_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE 'plpgsql';

-- Comments for documentation
COMMENT ON FUNCTION normalize_author_name(TEXT) IS 'Normalizes author names for deduplication and canonical matching';
COMMENT ON FUNCTION isbn_10_to_13(TEXT) IS 'Converts ISBN-10 to ISBN-13 format with proper check digit calculation';
COMMENT ON FUNCTION get_books_needing_enrichment(INTEGER) IS 'Returns books that need metadata enrichment, prioritized by status';
COMMENT ON FUNCTION update_enrichment_status(UUID, TEXT, DECIMAL, TEXT) IS 'Updates book enrichment status and quality metrics';