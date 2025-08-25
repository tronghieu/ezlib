# Database Schema

Converting the conceptual data models into a concrete PostgreSQL schema optimized for Supabase with Row Level Security, performance indexes, and multi-tenant isolation.

```sql
-- =============================================================================
-- CORE USER AND AUTHENTICATION SCHEMA
-- =============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    preferences JSONB NOT NULL DEFAULT '{
        "notification_email": true,
        "notification_sms": false,
        "privacy_social_activity": "public",
        "preferred_language": "en",
        "preferred_country": "US"
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
    slug TEXT NOT NULL UNIQUE, -- For subdomain routing
    description TEXT,
    address JSONB NOT NULL, -- {street, city, state, postal_code, country}
    contact_info JSONB NOT NULL, -- {phone, email, website}
    settings JSONB NOT NULL DEFAULT '{
        "max_borrow_duration_days": 21,
        "max_renewals": 2,
        "max_books_per_member": 5,
        "allow_holds": true,
        "public_catalog": true,
        "social_features_enabled": true
    }'::jsonb,
    owner_id UUID NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library readers (membership)
CREATE TABLE lib_readers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'inactive', 'banned')),
    subscription_start DATE NOT NULL DEFAULT CURRENT_DATE,
    subscription_end DATE, -- NULL = lifetime membership
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, library_id)
);

-- Library administrators
CREATE TABLE lib_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'librarian')),
    permissions JSONB NOT NULL DEFAULT '{
        "manage_books": true,
        "manage_members": true,
        "manage_staff": false,
        "view_analytics": true,
        "manage_collections": true
    }'::jsonb,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID NOT NULL REFERENCES users(id),
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

-- Book inventory (library-specific book copies)
CREATE TABLE book_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_edition_id UUID NOT NULL REFERENCES book_editions(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    availability JSONB NOT NULL DEFAULT '{
        "status": "available",
        "total_copies": 1,
        "available_copies": 1,
        "current_borrower_id": null,
        "due_date": null
    }'::jsonb,
    physical_details JSONB DEFAULT '{
        "shelf_location": null,
        "condition": "good",
        "acquisition_date": null,
        "acquisition_cost": null,
        "barcode": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_edition_id, library_id)
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
    book_inventory_id UUID NOT NULL REFERENCES book_inventory(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, book_inventory_id)
);

-- =============================================================================
-- BORROWING AND TRANSACTIONS
-- =============================================================================

-- Borrowing transactions
CREATE TABLE borrowing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_inventory_id UUID NOT NULL REFERENCES book_inventory(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested', 'approved', 'checked_out', 'overdue', 'returned', 'cancelled', 'lost'
    )),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    renewal_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction events (audit trail)
CREATE TABLE transaction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'requested', 'approved', 'checked_out', 'overdue', 'returned', 'cancelled', 'lost'
    )),
    user_id UUID NOT NULL REFERENCES users(id),
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
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- User and authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_display_name ON users(display_name);

-- Library relationship indexes
CREATE INDEX idx_lib_readers_user_library ON lib_readers(user_id, library_id);
CREATE INDEX idx_lib_readers_library_active ON lib_readers(library_id, state) WHERE state = 'active';
CREATE INDEX idx_lib_admins_user_library ON lib_admins(user_id, library_id);

-- Book discovery indexes
CREATE INDEX idx_authors_canonical_name ON authors(canonical_name);
CREATE INDEX idx_general_books_title ON general_books(canonical_title);
CREATE INDEX idx_book_editions_isbn ON book_editions(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX idx_book_editions_language ON book_editions(language);
CREATE INDEX idx_book_contributors_general_book ON book_contributors(general_book_id, role);
CREATE INDEX idx_book_contributors_author ON book_contributors(author_id, role);

-- Inventory and availability indexes
CREATE INDEX idx_book_inventory_library ON book_inventory(library_id);
CREATE INDEX idx_book_inventory_edition ON book_inventory(book_edition_id);
CREATE INDEX idx_book_inventory_availability ON book_inventory USING GIN (availability);

-- Borrowing workflow indexes
CREATE INDEX idx_borrowing_transactions_borrower ON borrowing_transactions(borrower_id, status);
CREATE INDEX idx_borrowing_transactions_library ON borrowing_transactions(library_id, status);
CREATE INDEX idx_borrowing_transactions_book ON borrowing_transactions(book_inventory_id);
CREATE INDEX idx_borrowing_transactions_due_date ON borrowing_transactions(due_date) WHERE status = 'checked_out';

-- Social feature indexes
CREATE INDEX idx_reviews_general_book ON reviews(general_book_id, visibility);
CREATE INDEX idx_reviews_edition ON reviews(book_edition_id, visibility);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id, created_at DESC);
CREATE INDEX idx_author_follows_user ON author_follows(user_id);
CREATE INDEX idx_social_follows_follower ON social_follows(follower_id);

-- Collection indexes
CREATE INDEX idx_collections_library_public ON collections(library_id, is_public);
CREATE INDEX idx_collection_books_collection ON collection_books(collection_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lib_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lib_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- User access policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Library access policies
CREATE POLICY "Public libraries visible to all" ON libraries FOR SELECT USING (status = 'active');
CREATE POLICY "Library admins can modify their libraries" ON libraries FOR ALL USING (
    id IN (SELECT library_id FROM lib_admins WHERE user_id = auth.uid())
);

-- Library reader policies
CREATE POLICY "Users can view own memberships" ON lib_readers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Library admins can manage members" ON lib_readers FOR ALL USING (
    library_id IN (SELECT library_id FROM lib_admins WHERE user_id = auth.uid())
);

-- Book inventory policies
CREATE POLICY "Public catalog visible to all" ON book_inventory FOR SELECT USING (
    library_id IN (SELECT id FROM libraries WHERE status = 'active')
);
CREATE POLICY "Library admins can manage inventory" ON book_inventory FOR ALL USING (
    library_id IN (SELECT library_id FROM lib_admins WHERE user_id = auth.uid())
);

-- Borrowing transaction policies
CREATE POLICY "Users can view own transactions" ON borrowing_transactions FOR SELECT USING (borrower_id = auth.uid());
CREATE POLICY "Users can create borrowing requests" ON borrowing_transactions FOR INSERT WITH CHECK (borrower_id = auth.uid());
CREATE POLICY "Library admins can manage transactions" ON borrowing_transactions FOR ALL USING (
    library_id IN (SELECT library_id FROM lib_admins WHERE user_id = auth.uid())
);

-- Review policies
CREATE POLICY "Public reviews visible to all" ON reviews FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can manage own reviews" ON reviews FOR ALL USING (reviewer_id = auth.uid());

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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_libraries_updated_at BEFORE UPDATE ON libraries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_editions_updated_at BEFORE UPDATE ON book_editions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_inventory_updated_at BEFORE UPDATE ON book_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_borrowing_transactions_updated_at BEFORE UPDATE ON borrowing_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update book availability when transactions change
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update availability based on transaction status
    IF NEW.status = 'checked_out' THEN
        UPDATE book_inventory 
        SET availability = jsonb_set(
            jsonb_set(availability, '{current_borrower_id}', to_jsonb(NEW.borrower_id::text)),
            '{available_copies}', 
            to_jsonb(COALESCE((availability->>'available_copies')::int - 1, 0))
        )
        WHERE id = NEW.book_inventory_id;
    ELSIF NEW.status = 'returned' AND OLD.status = 'checked_out' THEN
        UPDATE book_inventory 
        SET availability = jsonb_set(
            jsonb_set(availability, '{current_borrower_id}', 'null'),
            '{available_copies}', 
            to_jsonb(LEAST((availability->>'total_copies')::int, (availability->>'available_copies')::int + 1))
        )
        WHERE id = NEW.book_inventory_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_availability 
    AFTER UPDATE ON borrowing_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_book_availability();
```
