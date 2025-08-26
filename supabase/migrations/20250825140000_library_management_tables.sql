-- =============================================================================
-- EzLib Migration: Library Management System Tables
-- =============================================================================
-- Purpose: Create tables for library operations, staff, members, and transactions
-- Dependencies: Requires 001_core_book_metadata.sql and auth.users
-- Migration: 20250825140000_library_management_tables.sql
-- =============================================================================

-- Libraries (organizations that operate book lending services)
CREATE TABLE libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- Short identifier (e.g., "NYCPL-MAIN")
    address JSONB NOT NULL DEFAULT '{
        "street": null,
        "city": null,
        "state": null,
        "country": null,
        "postal_code": null,
        "coordinates": {"lat": null, "lng": null}
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
        "late_fee_per_day": 0.25,
        "membership_fee": 0,
        "allow_holds": true,
        "allow_digital": false
    }'::jsonb,
    stats JSONB NOT NULL DEFAULT '{
        "total_books": 0,
        "total_members": 0,
        "active_loans": 0,
        "books_loaned_this_month": 0
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active'
);

-- Library staff (employees with different roles and permissions)
CREATE TABLE library_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'librarian',
    permissions JSONB NOT NULL DEFAULT '{
        "manage_inventory": true,
        "manage_members": true,
        "process_loans": true,
        "view_reports": true,
        "manage_staff": false,
        "admin_settings": false
    }'::jsonb,
    employment_info JSONB NOT NULL DEFAULT '{
        "employee_id": null,
        "department": null,
        "hire_date": null,
        "work_schedule": null
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE(user_id, library_id)
);

-- Library members (people who can borrow books)
CREATE TABLE library_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional for guest cards
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL, -- Library-specific member ID (e.g., "M123456")
    personal_info JSONB NOT NULL DEFAULT '{
        "first_name": null,
        "last_name": null,
        "email": null,
        "phone": null,
        "address": {}
    }'::jsonb,
    membership_info JSONB NOT NULL DEFAULT '{
        "type": "regular",
        "expiry_date": null,
        "fees_owed": 0,
        "notes": null
    }'::jsonb,
    borrowing_stats JSONB NOT NULL DEFAULT '{
        "total_books_borrowed": 0,
        "current_loans": 0,
        "overdue_items": 0,
        "total_late_fees": 0
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE(library_id, member_id)
);

-- Physical book copies (actual inventory items that can be borrowed)
CREATE TABLE book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    book_edition_id UUID NOT NULL REFERENCES book_editions(id) ON DELETE CASCADE,
    copy_number TEXT NOT NULL, -- Library-specific identifier (e.g., "001", "002")
    barcode TEXT, -- Unique barcode for scanning
    location JSONB NOT NULL DEFAULT '{
        "section": null,
        "shelf": null,
        "call_number": null
    }'::jsonb,
    condition_info JSONB NOT NULL DEFAULT '{
        "condition": "good",
        "acquisition_date": null,
        "acquisition_price": null,
        "last_maintenance": null,
        "notes": null
    }'::jsonb,
    availability JSONB NOT NULL DEFAULT '{
        "status": "available",
        "current_borrower_id": null,
        "due_date": null,
        "hold_queue": []
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(library_id, book_edition_id, copy_number),
    UNIQUE(barcode) -- Global barcode uniqueness
);

-- Borrowing transactions (checkout, return, renewal history)
CREATE TABLE borrowing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    book_copy_id UUID NOT NULL REFERENCES book_copies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES library_staff(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL DEFAULT 'checkout',
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    return_date TIMESTAMPTZ,
    fees JSONB NOT NULL DEFAULT '{
        "late_fee": 0,
        "damage_fee": 0,
        "processing_fee": 0,
        "total": 0
    }'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraints and validations
ALTER TABLE libraries 
ADD CONSTRAINT check_library_status 
CHECK (status IN ('active', 'inactive', 'maintenance'));

ALTER TABLE library_staff 
ADD CONSTRAINT check_staff_role 
CHECK (role IN ('librarian', 'assistant', 'manager', 'admin', 'volunteer'));

ALTER TABLE library_staff 
ADD CONSTRAINT check_staff_status 
CHECK (status IN ('active', 'inactive', 'on_leave'));

ALTER TABLE library_members 
ADD CONSTRAINT check_member_status 
CHECK (status IN ('active', 'expired', 'suspended', 'cancelled'));

ALTER TABLE book_copies 
ADD CONSTRAINT check_copy_condition 
CHECK (condition_info->>'condition' IN ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost'));

ALTER TABLE book_copies 
ADD CONSTRAINT check_copy_status 
CHECK (availability->>'status' IN ('available', 'checked_out', 'on_hold', 'maintenance', 'lost', 'damaged'));

ALTER TABLE borrowing_transactions 
ADD CONSTRAINT check_transaction_type 
CHECK (transaction_type IN ('checkout', 'return', 'renewal', 'hold_placed', 'hold_cancelled', 'lost', 'damaged'));

-- Add indexes for performance
CREATE INDEX idx_libraries_code ON libraries(code);
CREATE INDEX idx_library_staff_library_id ON library_staff(library_id);
CREATE INDEX idx_library_staff_user_id ON library_staff(user_id);
CREATE INDEX idx_library_members_library_id ON library_members(library_id);
CREATE INDEX idx_library_members_user_id ON library_members(user_id);
CREATE INDEX idx_book_copies_library_id ON book_copies(library_id);
CREATE INDEX idx_book_copies_book_edition_id ON book_copies(book_edition_id);
CREATE INDEX idx_book_copies_barcode ON book_copies(barcode);
CREATE INDEX idx_book_copies_status ON book_copies((availability->>'status'));
CREATE INDEX idx_borrowing_transactions_library_id ON borrowing_transactions(library_id);
CREATE INDEX idx_borrowing_transactions_member_id ON borrowing_transactions(member_id);
CREATE INDEX idx_borrowing_transactions_book_copy_id ON borrowing_transactions(book_copy_id);
CREATE INDEX idx_borrowing_transactions_type ON borrowing_transactions(transaction_type);
CREATE INDEX idx_borrowing_transactions_date ON borrowing_transactions(transaction_date);

-- Comments for documentation
COMMENT ON TABLE libraries IS 'Library organizations that operate book lending services';
COMMENT ON TABLE library_staff IS 'Staff members with different roles and permissions within libraries';
COMMENT ON TABLE library_members IS 'Library patrons who can borrow books and access services';
COMMENT ON TABLE book_copies IS 'Physical copies of book editions available for lending';
COMMENT ON TABLE borrowing_transactions IS 'Complete history of all borrowing activities and transactions';

COMMENT ON COLUMN libraries.code IS 'Short unique identifier for the library (e.g., NYCPL-MAIN)';
COMMENT ON COLUMN libraries.settings IS 'Library-specific policies and operational settings';
COMMENT ON COLUMN library_staff.permissions IS 'Role-based permissions for system access control';
COMMENT ON COLUMN library_members.member_id IS 'Library-specific member identifier for card/account lookup';
COMMENT ON COLUMN book_copies.copy_number IS 'Library-specific copy identifier for inventory tracking';
COMMENT ON COLUMN book_copies.barcode IS 'Unique barcode for physical item scanning';
COMMENT ON COLUMN borrowing_transactions.fees IS 'All fees associated with this transaction (late, damage, etc.)';