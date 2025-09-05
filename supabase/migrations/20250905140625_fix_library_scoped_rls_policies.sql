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

-- Book copies - SCOPE 2: Library-specific with manage_inventory permission
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

CREATE POLICY "Inventory managers can modify book copies" ON public.book_copies
    FOR INSERT WITH CHECK (public.user_has_permission('manage_inventory', library_id));

CREATE POLICY "Inventory managers can update book copies" ON public.book_copies
    FOR UPDATE USING (public.user_has_permission('manage_inventory', library_id))
    WITH CHECK (public.user_has_permission('manage_inventory', library_id));

CREATE POLICY "Inventory managers can delete book copies" ON public.book_copies
    FOR DELETE USING (public.user_has_permission('manage_inventory', library_id));

-- Library members - SCOPE 2: Library-specific with manage_members permission
CREATE POLICY "Users can view own library memberships" ON public.library_members
    FOR SELECT USING (user_id = auth.uid() AND is_deleted = false);

CREATE POLICY "Staff can view library members" ON public.library_members
    FOR SELECT USING (
        library_id = ANY(public.get_user_library_ids())
    );

CREATE POLICY "Member managers can add library members" ON public.library_members
    FOR INSERT WITH CHECK (public.user_has_permission('manage_members', library_id));

CREATE POLICY "Member managers can update library members" ON public.library_members
    FOR UPDATE USING (public.user_has_permission('manage_members', library_id))
    WITH CHECK (public.user_has_permission('manage_members', library_id));

-- Note: DELETE is handled by soft delete triggers, but policy still needed
CREATE POLICY "Member managers can delete library members" ON public.library_members
    FOR DELETE USING (public.user_has_permission('manage_members', library_id));

-- Collections - SCOPE 2: Library-specific with manage_catalog permission
CREATE POLICY "Public can view public collections" ON public.collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Staff can view library collections" ON public.collections
    FOR SELECT USING (
        library_id = ANY(public.get_user_library_ids())
    );

CREATE POLICY "Catalog managers can manage collections" ON public.collections
    FOR INSERT WITH CHECK (public.user_has_permission('manage_catalog', library_id));

CREATE POLICY "Catalog managers can update collections" ON public.collections
    FOR UPDATE USING (public.user_has_permission('manage_catalog', library_id))
    WITH CHECK (public.user_has_permission('manage_catalog', library_id));

CREATE POLICY "Catalog managers can delete collections" ON public.collections
    FOR DELETE USING (public.user_has_permission('manage_catalog', library_id));

-- Collection books - SCOPE 2: Library-specific, inherits from collections
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

CREATE POLICY "Catalog managers can manage collection books" ON public.collection_books
    FOR INSERT WITH CHECK (
        collection_id IN (
            SELECT id FROM public.collections
            WHERE public.user_has_permission('manage_catalog', library_id)
        )
    );

CREATE POLICY "Catalog managers can update collection books" ON public.collection_books
    FOR UPDATE USING (
        collection_id IN (
            SELECT id FROM public.collections
            WHERE public.user_has_permission('manage_catalog', library_id)
        )
    )
    WITH CHECK (
        collection_id IN (
            SELECT id FROM public.collections
            WHERE public.user_has_permission('manage_catalog', library_id)
        )
    );

CREATE POLICY "Catalog managers can delete collection books" ON public.collection_books
    FOR DELETE USING (
        collection_id IN (
            SELECT id FROM public.collections
            WHERE public.user_has_permission('manage_catalog', library_id)
        )
    );

-- =============================================================================
-- COMMENTS FOR SECURITY DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Staff can view library inventory" ON public.book_copies IS
'Multi-tenant: Public catalog access + staff can view all inventory in their libraries only';

COMMENT ON POLICY "Inventory managers can modify book copies" ON public.book_copies IS
'Library-scoped: Only staff with manage_inventory permission in the specific library can modify';

COMMENT ON POLICY "Member managers can add library members" ON public.library_members IS
'Library-scoped: Only staff with manage_members permission in the specific library can add';

COMMENT ON POLICY "Catalog managers can manage collections" ON public.collections IS
'Library-scoped: Only staff with manage_catalog permission in the specific library can manage collections';
