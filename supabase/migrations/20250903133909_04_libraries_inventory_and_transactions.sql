-- =============================================================================
-- EzLib Migration: Libraries, Inventory, and Transactions
-- =============================================================================
-- Purpose: Create library management tables with inventory and borrowing
-- Dependencies: Foundation functions, users, and books tables
-- Migration: 04_libraries_inventory_and_transactions.sql
-- =============================================================================

-- =============================================================================
-- LIBRARY ORGANIZATION TABLES
-- =============================================================================

-- Libraries table
CREATE TABLE public.libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- For subdomain routing (e.g., lib1.ezlib.com)
    address JSONB NOT NULL DEFAULT '{
        "street": null,
        "city": null,
        "state": null,
        "country": null,
        "postal_code": null,
        "coordinates": {
            "lat": null,
            "lng": null
        }
    }'::jsonb,
    contact_info JSONB NOT NULL DEFAULT '{
        "phone": null,
        "email": null,
        "website": null,
        "hours": {}
    }'::jsonb,
    settings JSONB NOT NULL DEFAULT '{
        "loan_period_days": 14,
        "max_renewals": 2,
        "max_books_per_member": 5,
        "allow_holds": true,
        "allow_digital": false,
        "membership_fee": 0,
        "late_fee_per_day": 0.25
    }'::jsonb,
    stats JSONB NOT NULL DEFAULT '{
        "total_books": 0,
        "total_members": 0,
        "active_loans": 0,
        "books_loaned_this_month": 0
    }'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library members (membership records - can be linked to users or standalone)
CREATE TABLE public.library_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to registered user
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL, -- Library-specific member identifier
    personal_info JSONB NOT NULL DEFAULT '{
        "first_name": null,
        "last_name": null,
        "email": null,
        "phone": null,
        "address": {}
    }'::jsonb,
    membership_info JSONB NOT NULL DEFAULT '{
        "type": "regular",
        "fees_owed": 0,
        "expiry_date": null,
        "notes": null
    }'::jsonb,
    borrowing_stats JSONB NOT NULL DEFAULT '{
        "current_loans": 0,
        "total_books_borrowed": 0,
        "overdue_items": 0,
        "total_late_fees": 0
    }'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID, -- Will reference library_staff(id) after staff table is created
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_id, member_id)
);

-- Library staff (administrators and employees)
CREATE TABLE public.library_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'librarian' CHECK (role IN ('owner', 'manager', 'librarian', 'volunteer')),
    permissions JSONB NOT NULL DEFAULT '{
        "admin_settings": false,
        "manage_staff": false,
        "manage_members": true,
        "manage_inventory": true,
        "process_loans": true,
        "view_reports": true
    }'::jsonb,
    employment_info JSONB NOT NULL DEFAULT '{
        "employee_id": null,
        "hire_date": null,
        "department": null,
        "work_schedule": null
    }'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID, -- Will reference library_staff(id) after table creation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, library_id)
);

-- Add foreign key constraint to library_members.deleted_by now that library_staff exists
ALTER TABLE public.library_members ADD CONSTRAINT fk_library_members_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES public.library_staff(id);

ALTER TABLE public.library_staff ADD CONSTRAINT fk_library_staff_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES public.library_staff(id);

-- =============================================================================
-- INVENTORY AND COLLECTIONS TABLES
-- =============================================================================

-- Book copies (individual physical book instances)
CREATE TABLE public.book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    book_edition_id UUID NOT NULL REFERENCES public.book_editions(id) ON DELETE CASCADE,
    copy_number TEXT NOT NULL, -- Library-specific copy identifier (e.g., "001", "A-001")
    barcode TEXT UNIQUE, -- Optional barcode for scanning
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    location JSONB NOT NULL DEFAULT '{
        "shelf": null,
        "section": null,
        "call_number": null
    }'::jsonb,
    condition_info JSONB NOT NULL DEFAULT '{
        "condition": "good",
        "notes": null,
        "acquisition_date": null,
        "acquisition_price": null,
        "last_maintenance": null
    }'::jsonb,
    availability JSONB NOT NULL DEFAULT '{
        "status": "available",
        "current_borrower_id": null,
        "due_date": null,
        "hold_queue": []
    }'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'damaged', 'lost', 'maintenance')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID, -- Will reference library_staff(id) after table creation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_id, book_edition_id, copy_number)
);

-- Add foreign key constraint for book_copies.deleted_by
ALTER TABLE public.book_copies ADD CONSTRAINT fk_book_copies_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES public.library_staff(id);

-- Collections (library-defined book organization)
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('genre', 'age_group', 'special', 'featured')),
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection books (many-to-many junction)
CREATE TABLE public.collection_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    book_copy_id UUID NOT NULL REFERENCES public.book_copies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, book_copy_id)
);

-- =============================================================================
-- BORROWING TRANSACTION TABLES
-- =============================================================================

-- Borrowing transactions
CREATE TABLE public.borrowing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    book_copy_id UUID NOT NULL REFERENCES public.book_copies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.library_members(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.library_staff(id) ON DELETE SET NULL, -- Staff who processed the transaction
    transaction_type TEXT NOT NULL DEFAULT 'checkout' CHECK (transaction_type IN (
        'checkout', 'return', 'renewal', 'hold', 'reserve'
    )),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'returned', 'overdue', 'lost', 'cancelled'
    )),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    return_date TIMESTAMPTZ,
    fees JSONB NOT NULL DEFAULT '{
        "total": 0,
        "late_fee": 0,
        "damage_fee": 0,
        "processing_fee": 0
    }'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction events (audit trail)
CREATE TABLE public.transaction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.borrowing_transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'checkout', 'return', 'renewal', 'overdue_notice',
        'fee_assessed', 'fee_paid', 'lost_declared', 'cancelled'
    )),
    staff_id UUID REFERENCES public.library_staff(id), -- Staff who triggered the event
    member_id UUID REFERENCES public.library_members(id), -- Member involved in the event
    event_data JSONB DEFAULT '{}', -- Additional event-specific data
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Library relationship indexes
CREATE INDEX idx_library_members_user_library ON public.library_members(user_id, library_id) WHERE user_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_library_members_library_active ON public.library_members(library_id, status) WHERE status = 'active' AND is_deleted = FALSE;
CREATE INDEX idx_library_members_member_id ON public.library_members(library_id, member_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_library_members_deleted ON public.library_members(library_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;
CREATE INDEX idx_library_staff_user_library ON public.library_staff(user_id, library_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_library_staff_deleted ON public.library_staff(library_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;

-- Book copy and availability indexes
CREATE INDEX idx_book_copies_library ON public.book_copies(library_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_book_copies_library_active ON public.book_copies(library_id, status) WHERE is_deleted = FALSE AND status = 'active';
CREATE INDEX idx_book_copies_edition ON public.book_copies(book_edition_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_book_copies_barcode ON public.book_copies(barcode) WHERE barcode IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_book_copies_availability ON public.book_copies USING GIN (availability) WHERE is_deleted = FALSE AND status = 'active';
CREATE INDEX idx_book_copies_status ON public.book_copies(library_id, status, is_deleted);
CREATE INDEX idx_book_copies_deleted ON public.book_copies(library_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;

-- Borrowing workflow indexes
CREATE INDEX idx_borrowing_transactions_member ON public.borrowing_transactions(member_id, status);
CREATE INDEX idx_borrowing_transactions_library ON public.borrowing_transactions(library_id, status);
CREATE INDEX idx_borrowing_transactions_book_copy ON public.borrowing_transactions(book_copy_id);
CREATE INDEX idx_borrowing_transactions_due_date ON public.borrowing_transactions(due_date) WHERE status = 'active';
CREATE INDEX idx_borrowing_transactions_staff ON public.borrowing_transactions(staff_id) WHERE staff_id IS NOT NULL;

-- Transaction events indexes
CREATE INDEX idx_transaction_events_transaction ON public.transaction_events(transaction_id, timestamp);
CREATE INDEX idx_transaction_events_staff ON public.transaction_events(staff_id, timestamp) WHERE staff_id IS NOT NULL;

-- Collection indexes
CREATE INDEX idx_collections_library_public ON public.collections(library_id, is_public);
CREATE INDEX idx_collection_books_collection ON public.collection_books(collection_id);
CREATE INDEX idx_collection_books_copy ON public.collection_books(book_copy_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all library tables
ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;

-- Library access policies
CREATE POLICY "Public libraries visible to all" ON public.libraries
    FOR SELECT USING (status = 'active');

CREATE POLICY "Library staff can modify their libraries" ON public.libraries
    FOR ALL USING (
        id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid())
    );

-- Library member policies
CREATE POLICY "Users can view own memberships" ON public.library_members
    FOR SELECT USING (user_id = auth.uid() AND is_deleted = FALSE);

CREATE POLICY "Library staff can view deleted members" ON public.library_members
    FOR SELECT USING (
        library_id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
    );

CREATE POLICY "Library staff can manage members" ON public.library_members
    FOR ALL USING (
        library_id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
    );

-- Library staff policies
CREATE POLICY "Staff can view own employment" ON public.library_staff
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view all staff" ON public.library_staff
    FOR SELECT USING (
        library_id IN (
            SELECT library_id FROM public.library_staff
            WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = FALSE
        )
    );

CREATE POLICY "Managers can manage staff" ON public.library_staff
    FOR ALL USING (
        library_id IN (
            SELECT library_id FROM public.library_staff
            WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = FALSE
        )
    );

-- Book copy policies
CREATE POLICY "Public catalog visible to all" ON public.book_copies
    FOR SELECT USING (
        library_id IN (SELECT id FROM public.libraries WHERE status = 'active')
        AND is_deleted = FALSE
        AND status = 'active'
    );

CREATE POLICY "Library staff can view all inventory" ON public.book_copies
    FOR SELECT USING (
        library_id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
    );

CREATE POLICY "Library staff can manage inventory" ON public.book_copies
    FOR ALL USING (
        library_id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
    );

-- Borrowing transaction policies
CREATE POLICY "Members can view own transactions" ON public.borrowing_transactions
    FOR SELECT USING (
        member_id IN (SELECT id FROM public.library_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Library staff can manage transactions" ON public.borrowing_transactions
    FOR ALL USING (
        library_id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid())
    );

-- Transaction events policies
CREATE POLICY "Library staff can view transaction events" ON public.transaction_events
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM public.borrowing_transactions
            WHERE library_id IN (SELECT library_id FROM public.library_staff WHERE user_id = auth.uid())
        )
    );

-- =============================================================================
-- APPLY TRIGGERS
-- =============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_libraries_updated_at
    BEFORE UPDATE ON public.libraries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_members_updated_at
    BEFORE UPDATE ON public.library_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_staff_updated_at
    BEFORE UPDATE ON public.library_staff
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_copies_updated_at
    BEFORE UPDATE ON public.book_copies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_borrowing_transactions_updated_at
    BEFORE UPDATE ON public.borrowing_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Borrowing transaction availability trigger
CREATE TRIGGER update_copy_availability
    AFTER UPDATE ON public.borrowing_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_book_availability();

-- Soft delete triggers
CREATE TRIGGER library_members_soft_delete
    BEFORE DELETE ON public.library_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_member_soft_delete();

CREATE TRIGGER library_staff_soft_delete
    BEFORE DELETE ON public.library_staff
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_staff_soft_delete();

CREATE TRIGGER book_copies_soft_delete
    BEFORE DELETE ON public.book_copies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_book_copy_soft_delete();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.libraries IS 'Library organizations with settings, contact info, and operational statistics';
COMMENT ON TABLE public.library_members IS 'Library membership records, optionally linked to user accounts';
COMMENT ON TABLE public.library_staff IS 'Library staff and administrators with role-based permissions';
COMMENT ON TABLE public.book_copies IS 'Individual physical book instances owned by libraries';
COMMENT ON TABLE public.collections IS 'Library-defined book collections and categories';
COMMENT ON TABLE public.borrowing_transactions IS 'Book checkout, return, and renewal transactions';
COMMENT ON TABLE public.transaction_events IS 'Audit trail for all borrowing transaction events';

COMMENT ON COLUMN public.libraries.code IS 'Unique library code for subdomain routing (e.g., lib1.ezlib.com)';
COMMENT ON COLUMN public.library_members.member_id IS 'Library-specific member identifier (e.g., card number)';
COMMENT ON COLUMN public.library_staff.permissions IS 'Role-based permissions for library operations';
COMMENT ON COLUMN public.book_copies.availability IS 'Current availability status and borrower information';
COMMENT ON COLUMN public.borrowing_transactions.fees IS 'Associated fees for late returns, damages, etc.';

-- =============================================================================
-- FIX INFINITE RECURSION IN LIBRARY STAFF RLS POLICIES
-- =============================================================================
-- Purpose: Fix circular dependency in RLS policies that causes infinite recursion
-- Issue: library_staff policies reference library_staff table causing recursion
-- Solution: Create permission functions and update policies to avoid self-reference

-- Drop the recursive policies that cause infinite loops
DROP POLICY IF EXISTS "Library staff can modify their libraries" ON public.libraries;
DROP POLICY IF EXISTS "Managers can view all staff" ON public.library_staff;
DROP POLICY IF EXISTS "Managers can manage staff" ON public.library_staff;

-- Function to get library role for a user (avoiding RLS recursion)
-- This bypasses RLS by using SECURITY DEFINER and direct queries
CREATE OR REPLACE FUNCTION public.get_library_role(
    target_library_id UUID,
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
        AND library_id = target_library_id 
        AND is_deleted = FALSE 
        AND status = 'active';
    
    RETURN user_role;
END;
$$;

-- Function to check if user has permission for a library
CREATE OR REPLACE FUNCTION public.user_has_library_access(
    target_library_id UUID,
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Return false if no user provided
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's role in the library
    user_role := public.get_library_role(target_library_id, target_user_id);
    
    -- Return true if user has any active role in the library
    RETURN user_role IS NOT NULL;
END;
$$;

-- Function to check if user can manage staff in a library
CREATE OR REPLACE FUNCTION public.user_can_manage_staff(
    target_library_id UUID,
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Return false if no user provided
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's role in the library
    user_role := public.get_library_role(target_library_id, target_user_id);
    
    -- Return true if user is owner or manager
    RETURN user_role IN ('owner', 'manager');
END;
$$;

-- CREATE NEW NON-RECURSIVE POLICIES
-- Library access policies (using permission functions)
CREATE POLICY "Library staff can modify their libraries" ON public.libraries
    FOR ALL USING (
        public.user_has_library_access(id)
    );

-- Library staff policies (using permission functions to avoid recursion)
CREATE POLICY "Managers can view all staff" ON public.library_staff
    FOR SELECT USING (
        public.user_can_manage_staff(library_id) OR user_id = auth.uid()
    );

CREATE POLICY "Managers can manage staff" ON public.library_staff
    FOR ALL USING (
        public.user_can_manage_staff(library_id)
    );

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_library_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_library_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_staff(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.get_library_role(UUID, UUID) IS 'Get user role in a specific library, bypassing RLS to prevent recursion';
COMMENT ON FUNCTION public.user_has_library_access(UUID, UUID) IS 'Check if user has any access to a library';
COMMENT ON FUNCTION public.user_can_manage_staff(UUID, UUID) IS 'Check if user can manage staff in a library (owner/manager roles)';
