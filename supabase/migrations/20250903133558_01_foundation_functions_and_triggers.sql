-- =============================================================================
-- EzLib Migration: Foundation Functions and Triggers
-- =============================================================================
-- Purpose: Create common database functions, triggers, and utilities
-- Dependencies: None (foundation layer)
-- Migration: 01_foundation_functions_and_triggers.sql
-- =============================================================================

-- =============================================================================
-- COMMON UTILITY FUNCTIONS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates updated_at column when a row is modified';

-- =============================================================================
-- SOFT DELETE FUNCTIONALITY
-- =============================================================================

-- Generic soft delete function for library-scoped entities
CREATE OR REPLACE FUNCTION public.handle_member_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent actual deletion, convert to soft delete
    UPDATE public.library_members
    SET is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = (
            SELECT id FROM public.library_staff
            WHERE user_id = auth.uid()
            AND library_id = OLD.library_id
            AND is_deleted = FALSE
            LIMIT 1
        ),
        updated_at = NOW()
    WHERE id = OLD.id;

    -- Prevent the actual DELETE
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Soft delete function specifically for library staff
CREATE OR REPLACE FUNCTION public.handle_staff_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent actual deletion, convert to soft delete
    UPDATE public.library_staff
    SET is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = (
            SELECT id FROM public.library_staff
            WHERE user_id = auth.uid()
            AND library_id = OLD.library_id
            AND is_deleted = FALSE
            AND role IN ('owner', 'manager')
            LIMIT 1
        ),
        updated_at = NOW()
    WHERE id = OLD.id;

    -- Prevent the actual DELETE
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Soft delete function for book copies
CREATE OR REPLACE FUNCTION public.handle_book_copy_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent actual deletion, convert to soft delete
    UPDATE public.book_copies
    SET is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = (
            SELECT id FROM public.library_staff
            WHERE user_id = auth.uid()
            AND library_id = OLD.library_id
            AND is_deleted = FALSE
            LIMIT 1
        ),
        updated_at = NOW()
    WHERE id = OLD.id;

    -- Prevent the actual DELETE
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Function to restore soft deleted records
CREATE OR REPLACE FUNCTION public.restore_soft_deleted(
    table_name TEXT,
    record_id UUID,
    library_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_is_authorized BOOLEAN := FALSE;
BEGIN
    -- Check if user has permission to restore records for this library
    SELECT EXISTS (
        SELECT 1 FROM public.library_staff
        WHERE user_id = auth.uid()
        AND library_id = restore_soft_deleted.library_id
        AND is_deleted = FALSE
        AND role IN ('owner', 'manager')
    ) INTO user_is_authorized;

    IF NOT user_is_authorized THEN
        RAISE EXCEPTION 'Insufficient permissions to restore records';
    END IF;

    -- Restore the record based on table name
    CASE table_name
        WHEN 'library_members' THEN
            UPDATE public.library_members
            SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
            WHERE id = record_id AND library_id = restore_soft_deleted.library_id;
        WHEN 'library_staff' THEN
            UPDATE public.library_staff
            SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
            WHERE id = record_id AND library_id = restore_soft_deleted.library_id;
        WHEN 'book_copies' THEN
            UPDATE public.book_copies
            SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
            WHERE id = record_id AND library_id = restore_soft_deleted.library_id;
        ELSE
            RAISE EXCEPTION 'Invalid table name for soft delete restoration';
    END CASE;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

COMMENT ON FUNCTION public.restore_soft_deleted(TEXT, UUID, UUID) IS 'Restores soft deleted records for authorized library staff';

-- =============================================================================
-- BORROWING TRANSACTION FUNCTIONS
-- =============================================================================

-- Function to update book availability when transactions change
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update book copy availability and create audit event
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        -- Book checked out - only if book copy is active
        UPDATE public.book_copies
        SET availability = jsonb_set(
            jsonb_set(availability, '{status}', '"borrowed"'),
            '{current_borrower_id}',
            to_jsonb(NEW.member_id::text)
        )
        WHERE id = NEW.book_copy_id AND status = 'active' AND is_deleted = FALSE;

        -- Verify the update was successful (book copy must be active)
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cannot checkout book copy: book is not active or has been deleted';
        END IF;

        -- Create transaction event
        INSERT INTO public.transaction_events (transaction_id, event_type, staff_id, member_id, event_data)
        VALUES (NEW.id, 'checkout', NEW.staff_id, NEW.member_id,
                jsonb_build_object('due_date', NEW.due_date));

    ELSIF NEW.status = 'returned' AND OLD.status = 'active' THEN
        -- Book returned
        UPDATE public.book_copies
        SET availability = jsonb_set(
            jsonb_set(availability, '{status}', '"available"'),
            '{current_borrower_id}', 'null'
        )
        WHERE id = NEW.book_copy_id;

        -- Create transaction event
        INSERT INTO public.transaction_events (transaction_id, event_type, staff_id, member_id, event_data)
        VALUES (NEW.id, 'return', NEW.staff_id, NEW.member_id,
                jsonb_build_object('return_date', NEW.return_date));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

COMMENT ON FUNCTION public.update_book_availability() IS 'Updates book copy availability status when borrowing transactions change';
