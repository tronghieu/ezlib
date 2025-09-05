-- =============================================================================
-- EzLib Migration: Add Universal Permission Function
-- =============================================================================
-- Purpose: Create reusable permission checking function for multi-tenant system
-- Benefits: Single function for all permission checks, library-scoped or global
-- Migration: 20250905134502_add_user_has_permission_function.sql
-- =============================================================================

-- =============================================================================
-- UNIVERSAL PERMISSION FUNCTION
-- =============================================================================

-- Function to check if user has specific permission in library or globally
CREATE OR REPLACE FUNCTION public.user_has_permission(
    permission_name TEXT,
    library_id_param UUID DEFAULT NULL,
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
    
    -- Service role has all permissions (for system operations)
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- Check permission based on scope
    IF library_id_param IS NOT NULL THEN
        -- Library-specific permission check
        RETURN EXISTS (
            SELECT 1 
            FROM library_staff
            WHERE user_id = target_user_id
            AND library_id = library_id_param
            AND is_deleted = FALSE
            AND status = 'active'
            AND (permissions->>permission_name)::boolean = true
        );
    ELSE
        -- Global permission check - user has permission in ANY library
        RETURN EXISTS (
            SELECT 1 
            FROM library_staff
            WHERE user_id = target_user_id
            AND is_deleted = FALSE
            AND status = 'active'
            AND (permissions->>permission_name)::boolean = true
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION public.user_has_permission(TEXT, UUID, UUID) IS 
'Universal permission checker: library-specific when library_id provided, global when NULL. Supports all permission types: manage_members, manage_inventory, process_loans, manage_staff, admin_settings, manage_catalog, view_reports';

-- =============================================================================
-- USAGE EXAMPLES (in comments for reference)
-- =============================================================================

/*
-- Library-specific permission checks (for most operations)
SELECT user_has_permission('manage_inventory', 'library-uuid-here'); -- current user
SELECT user_has_permission('process_loans', 'library-uuid', 'user-uuid'); -- specific user

-- Global permission checks (for catalog management, cross-library operations)
SELECT user_has_permission('manage_catalog'); -- any library
SELECT user_has_permission('view_reports'); -- system-wide reports

-- Usage in RLS policies:

-- Library-scoped policy
CREATE POLICY "Staff can manage inventory" ON book_copies
FOR ALL USING (user_has_permission('manage_inventory', library_id));

-- Global catalog policy  
CREATE POLICY "Catalog managers can edit authors" ON authors
FOR ALL USING (user_has_permission('manage_catalog'));

-- Mixed policy (library access + specific permission)
CREATE POLICY "Members can view transactions" ON borrowing_transactions
FOR SELECT USING (
    member_id IN (SELECT id FROM library_members WHERE user_id = auth.uid())
    OR user_has_permission('process_loans', library_id)
);
*/

-- =============================================================================
-- PERMISSION TYPES SUPPORTED
-- =============================================================================

/*
Supported permission_name values:
- 'manage_members': Add, edit, delete (soft delete) library members
- 'manage_inventory': Add, edit, delete (soft delete) book copies  
- 'process_loans': Create and manage borrowing transactions
- 'manage_staff': Add, edit, remove library staff
- 'admin_settings': Modify library settings and configuration
- 'manage_catalog': Edit global book content and metadata & collections
- 'view_reports': Access library analytics and reports
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
-- RESTRICTED WRITE ACCESS POLICIES
-- =============================================================================

-- Authors table - only catalog managers can modify
CREATE POLICY "Catalog managers can insert authors" ON public.authors
    FOR INSERT WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can update authors" ON public.authors
    FOR UPDATE USING (public.user_has_permission('manage_catalog'))
    WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can delete authors" ON public.authors
    FOR DELETE USING (public.user_has_permission('manage_catalog'));

-- General books table - only catalog managers can modify
CREATE POLICY "Catalog managers can insert general books" ON public.general_books
    FOR INSERT WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can update general books" ON public.general_books
    FOR UPDATE USING (public.user_has_permission('manage_catalog'))
    WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can delete general books" ON public.general_books
    FOR DELETE USING (public.user_has_permission('manage_catalog'));

-- Book editions table - only catalog managers can modify
CREATE POLICY "Catalog managers can insert book editions" ON public.book_editions
    FOR INSERT WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can update book editions" ON public.book_editions
    FOR UPDATE USING (public.user_has_permission('manage_catalog'))
    WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can delete book editions" ON public.book_editions
    FOR DELETE USING (public.user_has_permission('manage_catalog'));

-- Book contributors table - only catalog managers can modify
CREATE POLICY "Catalog managers can insert book contributors" ON public.book_contributors
    FOR INSERT WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can update book contributors" ON public.book_contributors
    FOR UPDATE USING (public.user_has_permission('manage_catalog'))
    WITH CHECK (public.user_has_permission('manage_catalog'));

CREATE POLICY "Catalog managers can delete book contributors" ON public.book_contributors
    FOR DELETE USING (public.user_has_permission('manage_catalog'));

-- =============================================================================
-- COMMENTS FOR SECURITY DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Anyone can read authors" ON public.authors IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog managers can insert authors" ON public.authors IS 
'Only users with manage_catalog permission in any library can add authors';

COMMENT ON POLICY "Anyone can read general books" ON public.general_books IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog managers can insert general books" ON public.general_books IS 
'Only users with manage_catalog permission in any library can add general books';

COMMENT ON POLICY "Anyone can read book editions" ON public.book_editions IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog managers can insert book editions" ON public.book_editions IS 
'Only users with manage_catalog permission in any library can add book editions';

COMMENT ON POLICY "Anyone can read book contributors" ON public.book_contributors IS 
'Public read access for catalog browsing - no authentication required';

COMMENT ON POLICY "Catalog managers can insert book contributors" ON public.book_contributors IS 
'Only users with manage_catalog permission in any library can add book contributors';