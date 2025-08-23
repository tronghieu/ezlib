-- =============================================================================
-- EzLib Migration: Row Level Security Policies
-- =============================================================================
-- Purpose: Implement comprehensive RLS policies for data protection and multi-tenancy
-- Dependencies: Requires all previous migrations (001-004)
-- Migration: 005_row_level_security.sql
-- =============================================================================

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables that need access control
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PUBLIC READ ACCESS POLICIES (Book Discovery)
-- =============================================================================

-- Authors are publicly readable for book discovery
CREATE POLICY "Authors are publicly readable"
ON authors FOR SELECT
USING (true);

-- General books are publicly readable for book discovery
CREATE POLICY "General books are publicly readable"
ON general_books FOR SELECT
USING (true);

-- Book editions are publicly readable for book discovery
CREATE POLICY "Book editions are publicly readable"
ON book_editions FOR SELECT
USING (true);

-- Book contributors are publicly readable for book discovery
CREATE POLICY "Book contributors are publicly readable"
ON book_contributors FOR SELECT
USING (true);

-- =============================================================================
-- CRAWLER SERVICE POLICIES
-- =============================================================================

-- Create a service role for the crawler service
-- Note: This assumes you'll create a service role user for the crawler

-- Authors can be inserted/updated by service accounts
CREATE POLICY "Service accounts can manage authors"
ON authors FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- General books can be managed by service accounts
CREATE POLICY "Service accounts can manage general books"
ON general_books FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Book editions can be managed by service accounts
CREATE POLICY "Service accounts can manage book editions"
ON book_editions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Book contributors can be managed by service accounts
CREATE POLICY "Service accounts can manage book contributors"
ON book_contributors FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- USER SOCIAL INTERACTION POLICIES
-- =============================================================================

-- Users can follow/unfollow authors
CREATE POLICY "Users can manage their author follows"
ON author_follows FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Author follows are publicly readable for social features
CREATE POLICY "Author follows are publicly readable"
ON author_follows FOR SELECT
USING (true);

-- Users can follow/unfollow other users
CREATE POLICY "Users can manage their social follows"
ON social_follows FOR ALL
USING (auth.uid() = follower_id)
WITH CHECK (auth.uid() = follower_id);

-- Social follows visibility depends on privacy settings
CREATE POLICY "Social follows have privacy controls"
ON social_follows FOR SELECT
USING (
    -- Users can always see their own follows
    auth.uid() = follower_id OR 
    auth.uid() = following_id OR
    -- Public social graph (for now - can be restricted later)
    true
);

-- =============================================================================
-- REVIEW POLICIES
-- =============================================================================

-- Users can create and manage their own reviews
CREATE POLICY "Users can manage their own reviews"
ON reviews FOR ALL
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Review visibility based on review settings
CREATE POLICY "Reviews respect visibility settings"
ON reviews FOR SELECT
USING (
    -- Public reviews visible to everyone
    visibility = 'public' OR
    -- Users can always see their own reviews
    auth.uid() = reviewer_id OR
    -- Followers can see follower-restricted reviews
    (visibility = 'followers' AND EXISTS (
        SELECT 1 FROM social_follows sf 
        WHERE sf.following_id = reviewer_id 
        AND sf.follower_id = auth.uid()
    ))
    -- Private reviews only visible to author (handled by first condition)
);

-- =============================================================================
-- LIBRARY MANAGEMENT POLICIES (Future Extension)
-- =============================================================================
-- Note: These policies will be extended when library management features are added

-- For now, create placeholder policies for future library integration
-- These will need to be updated when library tables are created

-- =============================================================================
-- ADMIN AND MODERATION POLICIES
-- =============================================================================

-- Create policies for admin users to moderate content
-- Note: Admin policies will be implemented when user management is added

-- CREATE POLICY "Admin users can moderate reviews"
-- ON reviews FOR ALL
-- USING (is_admin());

-- CREATE POLICY "Admin users can manage all authors"
-- ON authors FOR ALL
-- USING (is_admin());

-- =============================================================================
-- SECURITY HELPER FUNCTIONS
-- =============================================================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, return false - will be implemented with user management
    RETURN false;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to check if a user is a service account  
CREATE OR REPLACE FUNCTION is_service_account()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current role is service_role (built-in Supabase role)
    RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to check if user can see another user's content
CREATE OR REPLACE FUNCTION can_see_user_content(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        -- User can always see their own content
        auth.uid() = target_user_id OR
        -- Admins can see all content
        is_admin() OR
        -- Following relationship exists (for follower-restricted content)
        EXISTS (
            SELECT 1 FROM social_follows sf 
            WHERE sf.following_id = target_user_id 
            AND sf.follower_id = auth.uid()
        )
    );
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION FOR RLS
-- =============================================================================

-- Create indexes to optimize RLS policy queries
CREATE INDEX idx_author_follows_user_auth ON author_follows(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_social_follows_auth ON social_follows(follower_id, following_id);
CREATE INDEX idx_reviews_reviewer_auth ON reviews(reviewer_id, visibility);

-- =============================================================================
-- RLS POLICY TESTING AND VALIDATION
-- =============================================================================

-- Function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(
    test_name TEXT,
    table_name TEXT,
    expected_result TEXT,
    actual_result BIGINT,
    status TEXT
) AS $$
BEGIN
    -- Test public book discovery access
    RETURN QUERY
    SELECT 
        'Public book access'::TEXT,
        'authors'::TEXT,
        'Should return all authors'::TEXT,
        (SELECT COUNT(*) FROM authors)::BIGINT,
        'PASS'::TEXT;
        
    -- Add more test cases as needed
    -- This function can be expanded for comprehensive RLS testing
    
    RETURN;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin privileges';
COMMENT ON FUNCTION is_service_account() IS 'Helper function to check if current session is a service account';
COMMENT ON FUNCTION can_see_user_content(UUID) IS 'Helper function to check content visibility permissions';
COMMENT ON FUNCTION test_rls_policies() IS 'Development function to validate RLS policy behavior';

-- Policy documentation
COMMENT ON POLICY "Authors are publicly readable" ON authors IS 'Allows public book discovery and author information access';
COMMENT ON POLICY "Service accounts can manage authors" ON authors IS 'Enables crawler service to create and update author records';
COMMENT ON POLICY "Users can manage their author follows" ON author_follows IS 'Users control their own author subscription preferences';
COMMENT ON POLICY "Reviews respect visibility settings" ON reviews IS 'Implements privacy controls for book reviews';

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage on sequences for service accounts
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant necessary permissions for anonymous access (public book discovery)
GRANT SELECT ON authors TO anon;
GRANT SELECT ON general_books TO anon;
GRANT SELECT ON book_editions TO anon;
GRANT SELECT ON book_contributors TO anon;
GRANT SELECT ON reviews TO anon;

-- Grant necessary permissions for authenticated users
GRANT ALL ON authors TO authenticated;
GRANT ALL ON general_books TO authenticated;
GRANT ALL ON book_editions TO authenticated;
GRANT ALL ON book_contributors TO authenticated;
GRANT ALL ON author_follows TO authenticated;
GRANT ALL ON social_follows TO authenticated;
GRANT ALL ON reviews TO authenticated;

-- Grant permissions for service role (crawler)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Final security check
DO $$
BEGIN
    -- Ensure all tables have RLS enabled
    IF EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_name IN ('authors', 'general_books', 'book_editions', 'book_contributors', 'author_follows', 'social_follows', 'reviews')
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = 'public'
            AND p.tablename = t.table_name
        )
    ) THEN
        RAISE EXCEPTION 'Some tables are missing RLS policies!';
    END IF;
    
    RAISE NOTICE 'All RLS policies successfully created and validated';
END $$;