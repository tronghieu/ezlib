-- =============================================================================
-- EzLib Migration: Simple Role-Based Access Function
-- =============================================================================
-- Purpose: Single function for role-based access control
-- Benefits: Direct role checks in RLS policies, simple and clear
-- Migration: 20250905134502_add_user_has_permission_function.sql
-- =============================================================================

-- =============================================================================
-- SINGLE ROLE CHECK FUNCTION
-- =============================================================================

-- Function to get user's role in a specific library
-- Returns the role string or NULL if no access
CREATE OR REPLACE FUNCTION public.get_user_role(
    library_id_param UUID,
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Return null if no user provided
    IF target_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get user's role in the specified library (bypasses RLS)
    SELECT role INTO user_role
    FROM library_staff
    WHERE user_id = target_user_id 
        AND library_id = library_id_param 
        AND is_deleted = FALSE 
        AND status = 'active';
    
    RETURN user_role;
END;
$$;

-- Helper function to check if user has catalog management access (any library)
-- Returns true if user has owner, manager, or librarian role in ANY library
CREATE OR REPLACE FUNCTION public.user_has_catalog_access(
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return false if no user provided
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Service role has all permissions
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has catalog management role in any library
    RETURN EXISTS (
        SELECT 1 
        FROM library_staff
        WHERE user_id = target_user_id
        AND is_deleted = FALSE
        AND status = 'active'
        AND role IN ('owner', 'manager', 'librarian')
    );
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_catalog_access(UUID) TO authenticated;

-- =============================================================================
-- FUNCTION DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.get_user_role(UUID, UUID) IS 
'Returns user role in specific library: owner, manager, librarian, volunteer, or NULL';

COMMENT ON FUNCTION public.user_has_catalog_access(UUID) IS 
'Returns true if user can manage global catalog (has owner/manager/librarian role in any library)';

-- =============================================================================
-- USAGE EXAMPLES (in comments for reference)
-- =============================================================================

/*
-- Get user's role in a library
SELECT get_user_role('library-uuid'); -- returns 'owner', 'manager', 'librarian', 'volunteer', or NULL

-- Check catalog access
SELECT user_has_catalog_access(); -- returns true/false

-- Usage in RLS policies:

-- Library-scoped policy for inventory (owner, manager, librarian only)
CREATE POLICY "Staff can manage inventory" ON book_copies
FOR ALL USING (get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

-- Global catalog policy
CREATE POLICY "Catalog managers can edit authors" ON authors
FOR ALL USING (user_has_catalog_access());

-- Circulation policy (all roles including volunteer)
CREATE POLICY "Staff can manage circulation" ON borrowing_transactions
FOR ALL USING (get_user_role(library_id) IN ('owner', 'manager', 'librarian', 'volunteer'));

-- Owner-only policy for staff management
CREATE POLICY "Owners can manage staff" ON library_staff
FOR ALL USING (get_user_role(library_id) = 'owner');
*/

-- =============================================================================
-- APPLY RLS POLICIES TO GLOBAL BOOK TABLES
-- =============================================================================

-- Enable RLS on global book content tables (previously missing)
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_contributors ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PUBLIC READ ACCESS POLICIES
-- =============================================================================

-- Anyone can read authors (public catalog browsing)
CREATE POLICY "Anyone can read authors" ON public.authors
    FOR SELECT USING (true);

-- Anyone can read general books (public catalog browsing)
CREATE POLICY "Anyone can read general books" ON public.general_books
    FOR SELECT USING (true);

-- Anyone can read book editions (public catalog browsing)
CREATE POLICY "Anyone can read book editions" ON public.book_editions
    FOR SELECT USING (true);

-- Anyone can read book contributors (public catalog browsing)
CREATE POLICY "Anyone can read book contributors" ON public.book_contributors
    FOR SELECT USING (true);

-- =============================================================================
-- SIMPLIFIED ROLE-BASED WRITE ACCESS POLICIES
-- =============================================================================

-- Authors table - only catalog staff (owner, manager, librarian from any library) can modify
CREATE POLICY "Catalog staff can insert authors" ON public.authors
    FOR INSERT WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can update authors" ON public.authors
    FOR UPDATE USING (public.user_has_catalog_access())
    WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can delete authors" ON public.authors
    FOR DELETE USING (public.user_has_catalog_access());

-- General books table - only catalog staff can modify
CREATE POLICY "Catalog staff can insert general books" ON public.general_books
    FOR INSERT WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can update general books" ON public.general_books
    FOR UPDATE USING (public.user_has_catalog_access())
    WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can delete general books" ON public.general_books
    FOR DELETE USING (public.user_has_catalog_access());

-- Book editions table - only catalog staff can modify
CREATE POLICY "Catalog staff can insert book editions" ON public.book_editions
    FOR INSERT WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can update book editions" ON public.book_editions
    FOR UPDATE USING (public.user_has_catalog_access())
    WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can delete book editions" ON public.book_editions
    FOR DELETE USING (public.user_has_catalog_access());

-- Book contributors table - only catalog staff can modify
CREATE POLICY "Catalog staff can insert book contributors" ON public.book_contributors
    FOR INSERT WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can update book contributors" ON public.book_contributors
    FOR UPDATE USING (public.user_has_catalog_access())
    WITH CHECK (public.user_has_catalog_access());

CREATE POLICY "Catalog staff can delete book contributors" ON public.book_contributors
    FOR DELETE USING (public.user_has_catalog_access());

-- =============================================================================
-- COMMENTS FOR SECURITY DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Anyone can read authors" ON public.authors IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog staff can insert authors" ON public.authors IS 
'Only staff with owner/manager/librarian role from any library can add authors';

COMMENT ON POLICY "Anyone can read general books" ON public.general_books IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog staff can insert general books" ON public.general_books IS 
'Only staff with owner/manager/librarian role from any library can add general books';

COMMENT ON POLICY "Anyone can read book editions" ON public.book_editions IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog staff can insert book editions" ON public.book_editions IS 
'Only staff with owner/manager/librarian role from any library can add book editions';

COMMENT ON POLICY "Anyone can read book contributors" ON public.book_contributors IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog staff can insert book contributors" ON public.book_contributors IS 
'Only staff with owner/manager/librarian role from any library can add book contributors';