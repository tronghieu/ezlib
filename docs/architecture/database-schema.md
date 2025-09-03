# Database Schema

Converting the conceptual data models into a concrete PostgreSQL schema optimized for Supabase with Row Level Security, performance indexes, and multi-tenant isolation.

```sql
-- =============================================================================
-- CORE USER AND AUTHENTICATION SCHEMA
-- =============================================================================
-- Note: Supabase provides auth.users automatically, we extend it with profile tables

-- User profiles (public user information)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location JSONB DEFAULT '{
        "city": null,
        "country": null,
        "timezone": null
    }'::jsonb,
    social_links JSONB DEFAULT '{
        "website": null,
        "goodreads": null,
        "twitter": null,
        "instagram": null
    }'::jsonb,
    reading_stats JSONB DEFAULT '{
        "books_read": 0,
        "reviews_written": 0,
        "favorite_genres": [],
        "reading_goal_yearly": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences (private user settings)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications JSONB NOT NULL DEFAULT '{
        "email_enabled": true,
        "sms_enabled": false,
        "push_enabled": true,
        "due_date_reminders": true,
        "new_book_alerts": true,
        "social_activity": true
    }'::jsonb,
    privacy JSONB NOT NULL DEFAULT '{
        "profile_visibility": "public",
        "reading_activity": "public",
        "review_visibility": "public",
        "location_sharing": false
    }'::jsonb,
    interface JSONB NOT NULL DEFAULT '{
        "preferred_language": "en",
        "preferred_country": "US",
        "theme": "system",
        "books_per_page": 20,
        "default_view": "grid"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LIBRARY AND ORGANIZATION SCHEMA
-- =============================================================================

-- Libraries table
CREATE TABLE libraries (
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
CREATE TABLE library_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to registered user
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
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
    deleted_by UUID REFERENCES library_staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_id, member_id)
);

-- Library staff (administrators and employees)
CREATE TABLE library_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
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
    deleted_by UUID REFERENCES library_staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, library_id)
);

-- =============================================================================
-- BOOK AND AUTHOR SCHEMA
-- =============================================================================

-- Authors table
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    canonical_name TEXT NOT NULL, -- Normalized for deduplication
    biography TEXT,
    metadata JSONB DEFAULT '{
        "birth_date": null,
        "death_date": null,
        "birth_place": null,
        "nationality": null,
        "photo_url": null,
        "official_website": null,
        "genres": [],
        "aliases": [],
        "external_ids": {
            "goodreads_id": null,
            "openlibrary_id": null,
            "wikipedia_url": null,
            "imdb_id": null
        },
        "last_enriched_at": null
    }'::jsonb,
    social_stats JSONB DEFAULT '{
        "total_books": 0,
        "total_reviews": 0,
        "average_rating": null,
        "total_followers": 0,
        "languages_published": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- General books (universal book entities)
CREATE TABLE general_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_title TEXT NOT NULL,
    first_publication_year INTEGER,
    subjects TEXT[] DEFAULT '{}', -- Genre/topic classifications
    global_stats JSONB DEFAULT '{
        "total_editions": 0,
        "total_reviews": 0,
        "global_average_rating": null,
        "total_borrows": 0,
        "languages_available": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book editions (specific editions/translations)
CREATE TABLE book_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    general_book_id UUID NOT NULL REFERENCES general_books(id) ON DELETE CASCADE,
    isbn_13 TEXT, -- Can be null for rare/old books
    title TEXT NOT NULL,
    subtitle TEXT,
    language TEXT NOT NULL, -- ISO 639-1 code
    country TEXT, -- Target market/region
    edition_metadata JSONB DEFAULT '{
        "publisher": null,
        "publication_date": null,
        "page_count": null,
        "cover_image_url": null,
        "edition_notes": null,
        "format": "paperback",
        "last_enriched_at": null
    }'::jsonb,
    social_stats JSONB DEFAULT '{
        "review_count": 0,
        "average_rating": null,
        "language_specific_rating": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book contributors (authors, translators, editors, etc.)
CREATE TABLE book_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    general_book_id UUID NOT NULL REFERENCES general_books(id) ON DELETE CASCADE,
    book_edition_id UUID REFERENCES book_editions(id) ON DELETE CASCADE, -- NULL for general contributors
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'author', 'co_author', 'translator', 'editor', 'illustrator',
        'photographer', 'foreword', 'afterword', 'introduction',
        'narrator', 'adapter', 'compiler'
    )),
    credit_text TEXT, -- Custom credit if needed
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LIBRARY INVENTORY AND COLLECTIONS
-- =============================================================================

-- Book copies (individual physical book instances)
CREATE TABLE book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    book_edition_id UUID NOT NULL REFERENCES book_editions(id) ON DELETE CASCADE,
    copy_number TEXT NOT NULL, -- Library-specific copy identifier (e.g., "001", "A-001")
    barcode TEXT UNIQUE, -- Optional barcode for scanning
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
    deleted_by UUID REFERENCES library_staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_id, book_edition_id, copy_number)
);

-- Collections (library-defined book organization)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('genre', 'age_group', 'special', 'featured')),
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection books (many-to-many junction)
CREATE TABLE collection_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    book_copy_id UUID NOT NULL REFERENCES book_copies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, book_copy_id)
);

-- =============================================================================
-- BORROWING AND TRANSACTIONS
-- =============================================================================

-- Borrowing transactions
CREATE TABLE borrowing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    book_copy_id UUID NOT NULL REFERENCES book_copies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES library_staff(id) ON DELETE SET NULL, -- Staff who processed the transaction
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
CREATE TABLE transaction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'checkout', 'return', 'renewal', 'overdue_notice', 
        'fee_assessed', 'fee_paid', 'lost_declared', 'cancelled'
    )),
    staff_id UUID REFERENCES library_staff(id), -- Staff who triggered the event
    member_id UUID REFERENCES library_members(id), -- Member involved in the event
    event_data JSONB DEFAULT '{}', -- Additional event-specific data
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- =============================================================================
-- SOCIAL FEATURES
-- =============================================================================

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_edition_id UUID NOT NULL REFERENCES book_editions(id) ON DELETE CASCADE,
    general_book_id UUID NOT NULL REFERENCES general_books(id) ON DELETE CASCADE, -- Denormalized for efficient querying
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    language TEXT NOT NULL DEFAULT 'en', -- Review language
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    social_metrics JSONB DEFAULT '{
        "like_count": 0,
        "comment_count": 0,
        "borrow_influence_count": 0,
        "share_count": 0
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_edition_id, reviewer_id) -- One review per edition per user
);

-- Author follows
CREATE TABLE author_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{
        "new_books": true,
        "news_updates": true,
        "awards": true
    }'::jsonb,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, author_id)
);

-- Social follows (user to user)
CREATE TABLE social_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================================================
-- INVITATION SYSTEM
-- =============================================================================

-- Invitations for library staff and members
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES library_staff(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'librarian', 'volunteer')),
    permissions JSONB DEFAULT '{}', -- For granular permissions override
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('library_staff', 'library_member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'), -- Secure invitation token
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    personal_message TEXT,
    metadata JSONB DEFAULT '{}', -- Additional invitation-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_id, email, invitation_type) -- Prevent duplicate pending invitations
);

-- Invitation responses (audit trail)
CREATE TABLE invitation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    responder_user_id UUID REFERENCES auth.users(id), -- NULL if not yet registered
    response_type TEXT NOT NULL CHECK (response_type IN ('accepted', 'declined', 'expired')),
    response_date TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    created_library_staff_id UUID REFERENCES library_staff(id), -- Created staff record if accepted
    created_library_member_id UUID REFERENCES library_members(id) -- Created member record if accepted
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- User profile indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- Library relationship indexes
CREATE INDEX idx_library_members_user_library ON library_members(user_id, library_id) WHERE user_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_library_members_library_active ON library_members(library_id, status) WHERE status = 'active' AND is_deleted = FALSE;
CREATE INDEX idx_library_members_member_id ON library_members(library_id, member_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_library_members_deleted ON library_members(library_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;
CREATE INDEX idx_library_staff_user_library ON library_staff(user_id, library_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_library_staff_deleted ON library_staff(library_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;

-- Book discovery indexes
CREATE INDEX idx_authors_canonical_name ON authors(canonical_name);
CREATE INDEX idx_general_books_title ON general_books(canonical_title);
CREATE INDEX idx_book_editions_isbn ON book_editions(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX idx_book_editions_language ON book_editions(language);
CREATE INDEX idx_book_contributors_general_book ON book_contributors(general_book_id, role);
CREATE INDEX idx_book_contributors_author ON book_contributors(author_id, role);

-- Book copy and availability indexes
CREATE INDEX idx_book_copies_library ON book_copies(library_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_book_copies_library_active ON book_copies(library_id, status) WHERE is_deleted = FALSE AND status = 'active';
CREATE INDEX idx_book_copies_edition ON book_copies(book_edition_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_book_copies_barcode ON book_copies(barcode) WHERE barcode IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_book_copies_availability ON book_copies USING GIN (availability) WHERE is_deleted = FALSE AND status = 'active';
CREATE INDEX idx_book_copies_status ON book_copies(library_id, status, is_deleted);
CREATE INDEX idx_book_copies_deleted ON book_copies(library_id, is_deleted, deleted_at) WHERE is_deleted = TRUE;

-- Borrowing workflow indexes
CREATE INDEX idx_borrowing_transactions_member ON borrowing_transactions(member_id, status);
CREATE INDEX idx_borrowing_transactions_library ON borrowing_transactions(library_id, status);
CREATE INDEX idx_borrowing_transactions_book_copy ON borrowing_transactions(book_copy_id);
CREATE INDEX idx_borrowing_transactions_due_date ON borrowing_transactions(due_date) WHERE status = 'active';
CREATE INDEX idx_borrowing_transactions_staff ON borrowing_transactions(staff_id) WHERE staff_id IS NOT NULL;

-- Transaction events indexes
CREATE INDEX idx_transaction_events_transaction ON transaction_events(transaction_id, timestamp);
CREATE INDEX idx_transaction_events_staff ON transaction_events(staff_id, timestamp) WHERE staff_id IS NOT NULL;

-- Social feature indexes
CREATE INDEX idx_reviews_general_book ON reviews(general_book_id, visibility);
CREATE INDEX idx_reviews_edition ON reviews(book_edition_id, visibility);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id, created_at DESC);
CREATE INDEX idx_author_follows_user ON author_follows(user_id);
CREATE INDEX idx_social_follows_follower ON social_follows(follower_id);

-- Collection indexes
CREATE INDEX idx_collections_library_public ON collections(library_id, is_public);
CREATE INDEX idx_collection_books_collection ON collection_books(collection_id);
CREATE INDEX idx_collection_books_copy ON collection_books(book_copy_id);

-- Invitation system indexes
CREATE INDEX idx_invitations_library_status ON invitations(library_id, status) WHERE status = 'pending';
CREATE INDEX idx_invitations_token ON invitations(token) WHERE status = 'pending';
CREATE INDEX idx_invitations_email_library ON invitations(email, library_id, invitation_type);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id, created_at DESC);
CREATE INDEX idx_invitations_expires ON invitations(expires_at) WHERE status = 'pending';
CREATE INDEX idx_invitation_responses_invitation ON invitation_responses(invitation_id, response_date DESC);
CREATE INDEX idx_invitation_responses_responder ON invitation_responses(responder_user_id) WHERE responder_user_id IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_responses ENABLE ROW LEVEL SECURITY;

-- User access policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view public profiles" ON user_profiles FOR SELECT USING (true); -- Public profiles visible to all

CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = id);

-- Library access policies
CREATE POLICY "Public libraries visible to all" ON libraries FOR SELECT USING (status = 'active');
CREATE POLICY "Library staff can modify their libraries" ON libraries FOR ALL USING (
    id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid())
);

-- Library member policies
CREATE POLICY "Users can view own memberships" ON library_members FOR SELECT USING (user_id = auth.uid() AND is_deleted = FALSE);
CREATE POLICY "Library staff can view deleted members" ON library_members FOR SELECT USING (
    library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
);
CREATE POLICY "Library staff can manage members" ON library_members FOR INSERT, UPDATE USING (
    library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
);

-- Library staff policies
CREATE POLICY "Staff can view own employment" ON library_staff FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Managers can view all staff" ON library_staff FOR SELECT USING (
    library_id IN (
        SELECT library_id FROM library_staff 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = FALSE
    )
);
CREATE POLICY "Managers can manage staff" ON library_staff FOR INSERT, UPDATE USING (
    library_id IN (
        SELECT library_id FROM library_staff 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = FALSE
    )
);

-- Book copy policies
CREATE POLICY "Public catalog visible to all" ON book_copies FOR SELECT USING (
    library_id IN (SELECT id FROM libraries WHERE status = 'active') 
    AND is_deleted = FALSE 
    AND status = 'active'
);
CREATE POLICY "Library staff can view all inventory" ON book_copies FOR SELECT USING (
    library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
);
CREATE POLICY "Library staff can manage inventory" ON book_copies FOR INSERT, UPDATE USING (
    library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
);

-- Borrowing transaction policies
CREATE POLICY "Members can view own transactions" ON borrowing_transactions FOR SELECT USING (
    member_id IN (SELECT id FROM library_members WHERE user_id = auth.uid())
);
CREATE POLICY "Library staff can manage transactions" ON borrowing_transactions FOR ALL USING (
    library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid())
);

-- Transaction events policies
CREATE POLICY "Library staff can view transaction events" ON transaction_events FOR SELECT USING (
    transaction_id IN (
        SELECT id FROM borrowing_transactions 
        WHERE library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid())
    )
);

-- Review policies
CREATE POLICY "Public reviews visible to all" ON reviews FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can manage own reviews" ON reviews FOR ALL USING (reviewer_id = auth.uid());

-- Invitation policies
CREATE POLICY "Staff can view library invitations" ON invitations FOR SELECT USING (
    library_id IN (SELECT library_id FROM library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
);
CREATE POLICY "Public can view pending invitations by token" ON invitations FOR SELECT USING (
    status = 'pending' AND expires_at > NOW()
);
CREATE POLICY "Staff can manage invitations" ON invitations FOR INSERT, UPDATE USING (
    library_id IN (
        SELECT library_id FROM library_staff 
        WHERE user_id = auth.uid() 
        AND is_deleted = FALSE 
        AND (
            role IN ('owner', 'manager') 
            OR (invitation_type = 'library_staff' AND permissions->>'manage_staff' = 'true')
            OR (invitation_type = 'library_member' AND permissions->>'manage_members' = 'true')
        )
    )
);
CREATE POLICY "Inviters can delete own invitations" ON invitations FOR DELETE USING (
    inviter_id IN (SELECT id FROM library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
    OR library_id IN (
        SELECT library_id FROM library_staff 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = FALSE
    )
);

-- Invitation response policies
CREATE POLICY "Staff can view invitation responses" ON invitation_responses FOR SELECT USING (
    invitation_id IN (
        SELECT id FROM invitations 
        WHERE library_id IN (
            SELECT library_id FROM library_staff 
            WHERE user_id = auth.uid() AND is_deleted = FALSE
        )
    )
);
CREATE POLICY "Users can view own invitation responses" ON invitation_responses FOR SELECT USING (
    responder_user_id = auth.uid()
);
CREATE POLICY "System can create invitation responses" ON invitation_responses FOR INSERT USING (true);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_libraries_updated_at BEFORE UPDATE ON libraries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_members_updated_at BEFORE UPDATE ON library_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_staff_updated_at BEFORE UPDATE ON library_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_editions_updated_at BEFORE UPDATE ON book_editions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_copies_updated_at BEFORE UPDATE ON book_copies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_borrowing_transactions_updated_at BEFORE UPDATE ON borrowing_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update book availability when transactions change
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update book copy availability and create audit event
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        -- Book checked out - only if book copy is active
        UPDATE book_copies 
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
        INSERT INTO transaction_events (transaction_id, event_type, staff_id, member_id, event_data)
        VALUES (NEW.id, 'checkout', NEW.staff_id, NEW.member_id, 
                jsonb_build_object('due_date', NEW.due_date));
                
    ELSIF NEW.status = 'returned' AND OLD.status = 'active' THEN
        -- Book returned
        UPDATE book_copies 
        SET availability = jsonb_set(
            jsonb_set(availability, '{status}', '"available"'),
            '{current_borrower_id}', 'null'
        )
        WHERE id = NEW.book_copy_id;
        
        -- Create transaction event
        INSERT INTO transaction_events (transaction_id, event_type, staff_id, member_id, event_data)
        VALUES (NEW.id, 'return', NEW.staff_id, NEW.member_id, 
                jsonb_build_object('return_date', NEW.return_date));
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_copy_availability 
    AFTER UPDATE ON borrowing_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_book_availability();

-- =============================================================================
-- SOFT DELETE FUNCTIONALITY
-- =============================================================================

-- Function to handle soft delete operations
CREATE OR REPLACE FUNCTION handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent actual deletion, convert to soft delete
    UPDATE library_members 
    SET is_deleted = TRUE, 
        deleted_at = NOW(),
        deleted_by = (
            SELECT id FROM library_staff 
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
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to handle soft delete for library_staff
CREATE OR REPLACE FUNCTION handle_staff_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent actual deletion, convert to soft delete
    UPDATE library_staff 
    SET is_deleted = TRUE, 
        deleted_at = NOW(),
        deleted_by = (
            SELECT id FROM library_staff 
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
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to handle soft delete for book_copies
CREATE OR REPLACE FUNCTION handle_book_copy_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent actual deletion, convert to soft delete
    UPDATE book_copies 
    SET is_deleted = TRUE, 
        deleted_at = NOW(),
        deleted_by = (
            SELECT id FROM library_staff 
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
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to restore soft deleted records (undelete)
CREATE OR REPLACE FUNCTION restore_soft_deleted(
    table_name TEXT,
    record_id UUID,
    library_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_is_authorized BOOLEAN := FALSE;
BEGIN
    -- Check if user has permission to restore records for this library
    SELECT EXISTS (
        SELECT 1 FROM library_staff 
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
            UPDATE library_members 
            SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
            WHERE id = record_id AND library_id = restore_soft_deleted.library_id;
        WHEN 'library_staff' THEN
            UPDATE library_staff 
            SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
            WHERE id = record_id AND library_id = restore_soft_deleted.library_id;
        WHEN 'book_copies' THEN
            UPDATE book_copies 
            SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
            WHERE id = record_id AND library_id = restore_soft_deleted.library_id;
        ELSE
            RAISE EXCEPTION 'Invalid table name for soft delete restoration';
    END CASE;
    
    RETURN TRUE;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Apply soft delete triggers
CREATE TRIGGER library_members_soft_delete 
    BEFORE DELETE ON library_members 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_soft_delete();

CREATE TRIGGER library_staff_soft_delete 
    BEFORE DELETE ON library_staff 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_staff_soft_delete();

CREATE TRIGGER book_copies_soft_delete 
    BEFORE DELETE ON book_copies 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_book_copy_soft_delete();

-- =============================================================================
-- USER PROFILE SYNCHRONIZATION TRIGGERS
-- =============================================================================

-- Function to automatically create user profile from auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO user_profiles (
        id, 
        email, 
        display_name, 
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create user preferences with defaults
    INSERT INTO user_preferences (id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update user profile when auth.users changes
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user profile if relevant fields changed
    IF (OLD.email IS DISTINCT FROM NEW.email) OR 
       (OLD.raw_user_meta_data->>'display_name' IS DISTINCT FROM NEW.raw_user_meta_data->>'display_name') OR
       (OLD.raw_user_meta_data->>'full_name' IS DISTINCT FROM NEW.raw_user_meta_data->>'full_name') OR
       (OLD.raw_user_meta_data->>'avatar_url' IS DISTINCT FROM NEW.raw_user_meta_data->>'avatar_url') THEN
        
        UPDATE user_profiles SET
            email = NEW.email,
            display_name = COALESCE(
                NEW.raw_user_meta_data->>'display_name', 
                NEW.raw_user_meta_data->>'full_name', 
                split_part(NEW.email, '@', 1)
            ),
            avatar_url = NEW.raw_user_meta_data->>'avatar_url',
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Triggers for auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_user_update();

-- Function to handle user profile cleanup on auth user deletion
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Cascade delete will handle user_profiles and user_preferences
    -- but we can add custom cleanup logic here if needed
    
    -- Log deletion event or perform other cleanup
    -- Example: Archive user data before deletion
    
    RETURN OLD;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_user_delete();

-- =============================================================================
-- INVITATION SYSTEM FUNCTIONS
-- =============================================================================

-- Function to handle invitation expiration
CREATE OR REPLACE FUNCTION handle_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically expire invitations that have passed their expiry date
    IF NEW.expires_at <= NOW() AND OLD.status = 'pending' THEN
        NEW.status = 'expired';
        
        -- Create audit trail
        INSERT INTO invitation_responses (invitation_id, response_type, notes)
        VALUES (NEW.id, 'expired', 'Automatically expired');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to process invitation acceptance
CREATE OR REPLACE FUNCTION process_invitation_acceptance(
    invitation_token TEXT,
    accepting_user_id UUID,
    response_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    created_staff_id UUID;
    created_member_id UUID;
    result JSONB;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired invitation token'
        );
    END IF;
    
    -- Check if user email matches invitation email
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = accepting_user_id 
        AND email = invitation_record.email
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email does not match invitation'
        );
    END IF;
    
    -- Process based on invitation type
    IF invitation_record.invitation_type = 'library_staff' THEN
        -- Check if staff record already exists
        IF EXISTS (
            SELECT 1 FROM library_staff 
            WHERE user_id = accepting_user_id 
            AND library_id = invitation_record.library_id
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is already a staff member of this library'
            );
        END IF;
        
        -- Create library staff record
        INSERT INTO library_staff (
            user_id, 
            library_id, 
            role, 
            permissions,
            employment_info
        ) VALUES (
            accepting_user_id,
            invitation_record.library_id,
            invitation_record.role,
            COALESCE(invitation_record.permissions, '{}'),
            jsonb_build_object('hire_date', NOW()::date)
        ) RETURNING id INTO created_staff_id;
        
    ELSIF invitation_record.invitation_type = 'library_member' THEN
        -- Check if member record already exists
        IF EXISTS (
            SELECT 1 FROM library_members 
            WHERE user_id = accepting_user_id 
            AND library_id = invitation_record.library_id
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is already a member of this library'
            );
        END IF;
        
        -- Create library member record
        INSERT INTO library_members (
            user_id,
            library_id,
            member_id,
            personal_info
        ) VALUES (
            accepting_user_id,
            invitation_record.library_id,
            'INV-' || substring(invitation_record.token from 1 for 8),
            jsonb_build_object(
                'first_name', (SELECT display_name FROM user_profiles WHERE id = accepting_user_id),
                'email', invitation_record.email
            )
        ) RETURNING id INTO created_member_id;
    END IF;
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Create response record
    INSERT INTO invitation_responses (
        invitation_id,
        responder_user_id,
        response_type,
        notes,
        created_library_staff_id,
        created_library_member_id
    ) VALUES (
        invitation_record.id,
        accepting_user_id,
        'accepted',
        response_notes,
        created_staff_id,
        created_member_id
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'invitation_type', invitation_record.invitation_type,
        'library_id', invitation_record.library_id,
        'role', invitation_record.role,
        'created_staff_id', created_staff_id,
        'created_member_id', created_member_id
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to decline invitation
CREATE OR REPLACE FUNCTION decline_invitation(
    invitation_token TEXT,
    declining_user_id UUID DEFAULT NULL,
    response_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'declined', updated_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Create response record
    INSERT INTO invitation_responses (
        invitation_id,
        responder_user_id,
        response_type,
        notes
    ) VALUES (
        invitation_record.id,
        declining_user_id,
        'declined',
        response_notes
    );
    
    RETURN true;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Apply invitation triggers
CREATE TRIGGER invitation_expiration_check 
    BEFORE UPDATE ON invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_invitation_expiration();
```
