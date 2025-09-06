-- =============================================================================
-- EzLib Migration: Fix Library-Scoped RLS Policies
-- =============================================================================
-- Purpose: Fix multi-tenant RLS policies to properly check library-specific permissions
-- Critical Fix: Current policies only check staff membership, not specific permissions
-- Migration: 20250905140625_fix_library_scoped_rls_policies.sql
-- =============================================================================

-- =============================================================================
-- REUSABLE HELPER FUNCTIONS
-- =============================================================================

-- Function to get all library IDs where user is active staff
CREATE OR REPLACE FUNCTION public.get_user_library_ids(
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return empty array if no user provided
    IF target_user_id IS NULL THEN
        RETURN ARRAY[]::UUID[];
    END IF;

    -- Return array of library IDs where user is active staff
    RETURN ARRAY(
        SELECT library_id
        FROM public.library_staff
        WHERE user_id = target_user_id
        AND is_deleted = false
        AND status = 'active'
    );
END;
$$;

COMMENT ON FUNCTION public.get_user_library_ids(UUID) IS
'Returns array of library IDs where user is active staff member. Used in RLS policies for multi-tenant access control.';

-- =============================================================================
-- DROP INCORRECT EXISTING POLICIES
-- =============================================================================

-- Book copies - current policies don't check manage_inventory permission
DROP POLICY IF EXISTS "Library staff can manage inventory" ON public.book_copies;
DROP POLICY IF EXISTS "Library staff can view all inventory" ON public.book_copies;

-- Library members - current policies don't check manage_members permission
DROP POLICY IF EXISTS "Library staff can manage members" ON public.library_members;
DROP POLICY IF EXISTS "Library staff can view deleted members" ON public.library_members;

-- Collections - check if any exist and drop if incorrect
DROP POLICY IF EXISTS "Library staff can manage collections" ON public.collections;
DROP POLICY IF EXISTS "Library staff can view collections" ON public.collections;

-- Collection books - check if any exist and drop if incorrect
DROP POLICY IF EXISTS "Library staff can manage collection books" ON public.collection_books;
DROP POLICY IF EXISTS "Library staff can view collection books" ON public.collection_books;

-- =============================================================================
-- CORRECTED LIBRARY-SCOPED POLICIES
-- =============================================================================

-- Book copies - Library-specific with role-based access
CREATE POLICY "Staff can view library inventory" ON public.book_copies
    FOR SELECT USING (
        -- Public catalog access (active libraries, active books only)
        (library_id IN (SELECT id FROM public.libraries WHERE status = 'active')
         AND is_deleted = false
         AND status = 'active')
        OR
        -- Staff can see all inventory in their libraries (including inactive/deleted)
        (library_id = ANY(public.get_user_library_ids()))
    );

CREATE POLICY "Library staff can modify book copies" ON public.book_copies
    FOR INSERT WITH CHECK (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

CREATE POLICY "Library staff can update book copies" ON public.book_copies
    FOR UPDATE USING (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'))
    WITH CHECK (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

CREATE POLICY "Library staff can delete book copies" ON public.book_copies
    FOR DELETE USING (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

-- Library members - Library-specific with role-based access
CREATE POLICY "Users can view own library memberships" ON public.library_members
    FOR SELECT USING (user_id = auth.uid() AND is_deleted = false);

CREATE POLICY "Staff can view library members" ON public.library_members
    FOR SELECT USING (
        library_id = ANY(public.get_user_library_ids())
    );

CREATE POLICY "Library staff can add library members" ON public.library_members
    FOR INSERT WITH CHECK (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

CREATE POLICY "Library staff can update library members" ON public.library_members
    FOR UPDATE USING (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'))
    WITH CHECK (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

-- Note: DELETE is handled by soft delete triggers, but policy still needed
CREATE POLICY "Library staff can delete library members" ON public.library_members
    FOR DELETE USING (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

-- Collections - Library-specific with role-based access
CREATE POLICY "Public can view public collections" ON public.collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Staff can view library collections" ON public.collections
    FOR SELECT USING (
        library_id = ANY(public.get_user_library_ids())
    );

CREATE POLICY "Library staff can manage collections" ON public.collections
    FOR INSERT WITH CHECK (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

CREATE POLICY "Library staff can update collections" ON public.collections
    FOR UPDATE USING (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'))
    WITH CHECK (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

CREATE POLICY "Library staff can delete collections" ON public.collections
    FOR DELETE USING (public.get_user_role(library_id) IN ('owner', 'manager', 'librarian'));

-- Collection books - Library-specific, inherits from collections
CREATE POLICY "Public can view public collection books" ON public.collection_books
    FOR SELECT USING (
        collection_id IN (
            SELECT id FROM public.collections
            WHERE is_public = true
        )
    );

CREATE POLICY "Staff can view library collection books" ON public.collection_books
    FOR SELECT USING (
        collection_id IN (
            SELECT id FROM public.collections
            WHERE library_id = ANY(public.get_user_library_ids())
        )
    );

CREATE POLICY "Library staff can manage collection books" ON public.collection_books
    FOR INSERT WITH CHECK (
        collection_id IN (
            SELECT id FROM public.collections c
            WHERE public.get_user_role(c.library_id) IN ('owner', 'manager', 'librarian')
        )
    );

CREATE POLICY "Library staff can update collection books" ON public.collection_books
    FOR UPDATE USING (
        collection_id IN (
            SELECT id FROM public.collections c
            WHERE public.get_user_role(c.library_id) IN ('owner', 'manager', 'librarian')
        )
    )
    WITH CHECK (
        collection_id IN (
            SELECT id FROM public.collections c
            WHERE public.get_user_role(c.library_id) IN ('owner', 'manager', 'librarian')
        )
    );

CREATE POLICY "Library staff can delete collection books" ON public.collection_books
    FOR DELETE USING (
        collection_id IN (
            SELECT id FROM public.collections c
            WHERE public.get_user_role(c.library_id) IN ('owner', 'manager', 'librarian')
        )
    );

-- =============================================================================
-- COMMENTS FOR SECURITY DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Staff can view library inventory" ON public.book_copies IS
'Multi-tenant: Public catalog access + staff can view all inventory in their libraries only';

COMMENT ON POLICY "Library staff can modify book copies" ON public.book_copies IS
'Library-scoped: Only staff with owner/manager/librarian roles in the specific library can modify';

COMMENT ON POLICY "Library staff can add library members" ON public.library_members IS
'Library-scoped: Only staff with owner/manager/librarian roles in the specific library can add';

COMMENT ON POLICY "Library staff can manage collections" ON public.collections IS
'Library-scoped: Only staff with owner/manager/librarian roles in the specific library can manage collections';
