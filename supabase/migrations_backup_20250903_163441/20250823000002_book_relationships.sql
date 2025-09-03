-- =============================================================================
-- EzLib Migration: Book-Author Relationships and Contributor Tables
-- =============================================================================
-- Purpose: Create junction tables for flexible book-author relationships
-- Dependencies: Requires 001_core_book_metadata.sql
-- Migration: 002_book_relationships.sql
-- =============================================================================

-- Book contributors (flexible author-book relationships)
CREATE TABLE book_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    general_book_id UUID NOT NULL REFERENCES general_books(id) ON DELETE CASCADE,
    book_edition_id UUID REFERENCES book_editions(id) ON DELETE CASCADE, -- NULL for general contributors
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'author',
    credit_text TEXT, -- Custom credit if needed (e.g., "Translated from French")
    sort_order INTEGER NOT NULL DEFAULT 0, -- For display ordering
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint for valid contributor roles
ALTER TABLE book_contributors 
ADD CONSTRAINT check_contributor_role 
CHECK (role IN (
    'author', 'co_author', 'translator', 'editor', 'illustrator',
    'photographer', 'foreword', 'afterword', 'introduction',
    'narrator', 'adapter', 'compiler', 'other'
));

-- Ensure contributors are unique per book-role combination
ALTER TABLE book_contributors 
ADD CONSTRAINT unique_book_author_role 
UNIQUE(general_book_id, book_edition_id, author_id, role);

-- Validation: either general_book_id or book_edition_id must be specified
ALTER TABLE book_contributors 
ADD CONSTRAINT check_book_reference 
CHECK (
    (general_book_id IS NOT NULL AND book_edition_id IS NULL) OR 
    (general_book_id IS NOT NULL AND book_edition_id IS NOT NULL)
);

-- Author follows (social feature for following favorite authors)
CREATE TABLE author_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    notification_preferences JSONB NOT NULL DEFAULT '{
        "new_books": true,
        "news_updates": true,
        "awards": true
    }'::jsonb,
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, author_id)
);

-- Social follows (user-to-user relationships for social discovery)
CREATE TABLE social_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- Users cannot follow themselves
);

-- Reviews (social feature linked to specific editions but aggregated for discovery)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_edition_id UUID NOT NULL REFERENCES book_editions(id) ON DELETE CASCADE,
    general_book_id UUID NOT NULL REFERENCES general_books(id) ON DELETE CASCADE, -- Denormalized for efficient querying
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    language TEXT NOT NULL DEFAULT 'en', -- Review language
    visibility TEXT NOT NULL DEFAULT 'public',
    social_metrics JSONB NOT NULL DEFAULT '{
        "like_count": 0,
        "comment_count": 0,
        "borrow_influence_count": 0,
        "share_count": 0
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(book_edition_id, reviewer_id) -- One review per edition per user
);

-- Add constraint for review visibility
ALTER TABLE reviews 
ADD CONSTRAINT check_review_visibility 
CHECK (visibility IN ('public', 'followers', 'private'));

-- Add constraint for review language format
ALTER TABLE reviews 
ADD CONSTRAINT check_review_language 
CHECK (language ~ '^[a-z]{2}$');

-- Comments for documentation
COMMENT ON TABLE book_contributors IS 'Flexible many-to-many relationships between books and authors with role specifications';
COMMENT ON TABLE author_follows IS 'User subscriptions to author updates and new book notifications';
COMMENT ON TABLE social_follows IS 'User-to-user relationships for personalized book discovery feeds';
COMMENT ON TABLE reviews IS 'User reviews linked to specific editions but aggregated for general book discovery';

COMMENT ON COLUMN book_contributors.role IS 'Contributor type: author, translator, editor, illustrator, etc.';
COMMENT ON COLUMN book_contributors.sort_order IS 'Display ordering for multiple contributors of same type';
COMMENT ON COLUMN book_contributors.credit_text IS 'Custom attribution text when standard role is insufficient';

COMMENT ON COLUMN reviews.general_book_id IS 'Denormalized reference for efficient cross-edition review aggregation';
COMMENT ON COLUMN reviews.social_metrics IS 'Engagement metrics including borrow influence tracking';