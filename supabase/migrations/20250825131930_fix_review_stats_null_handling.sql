-- Fix review stats function to properly handle null values
-- Replace string 'null' with proper JSON null

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
            SELECT CASE 
                WHEN AVG(r.rating) IS NULL THEN 'null'::JSONB
                ELSE ROUND(AVG(r.rating), 2)::TEXT::JSONB
            END
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
            SELECT CASE 
                WHEN AVG(r.rating) IS NULL THEN 'null'::JSONB
                ELSE ROUND(AVG(r.rating), 2)::TEXT::JSONB
            END
            FROM reviews r 
            WHERE r.general_book_id = target_general_book_id
            AND r.visibility = 'public'
        )
    )
    WHERE id = target_general_book_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;