# Database Design

EzLib uses a multi-tenant PostgreSQL database with Row Level Security (RLS) for complete data isolation between libraries. The design prioritizes operational simplicity for small/medium libraries while maintaining scalability and data integrity.

## Architecture Principles

- **Multi-tenant SaaS**: Single database, library-isolated data via RLS
- **Event-driven audit**: Complete transaction history for compliance
- **Soft deletes**: Maintain data integrity and enable restoration
- **JSONB flexibility**: Settings and metadata without rigid schemas
- **Performance-first**: Denormalized counts and strategic indexing

## Core Domains

### User Management

**Purpose**: Handle authentication, profiles, and library access control

#### `auth.users` (Supabase Managed)

Core authentication table with email, password hashing, and metadata.

#### `user_profiles`

Public user information visible to other users and libraries.

- `id` - References auth.users(id)
- `email` - User's email address
- `display_name` - Public display name
- `avatar_url` - Profile picture URL
- `bio` - User biography text
- `location` - JSONB: city, country, timezone
- `social_links` - JSONB: website, goodreads, twitter, instagram URLs
- `reading_stats` - JSONB: books_read count, reviews_written count, favorite_genres array, yearly reading goal
- `created_at`, `updated_at` - Standard timestamps

#### `user_preferences`

Private user settings and preferences.

- `id` - References auth.users(id)
- `notifications` - JSONB: email_enabled, sms_enabled, push_enabled, due_date_reminders, new_book_alerts, social_activity
- `privacy` - JSONB: profile_visibility (public/private), reading_activity visibility, review_visibility, location_sharing
- `interface` - JSONB: preferred_language, preferred_country, theme (light/dark/system), books_per_page, default_view (grid/list)
- `created_at`, `updated_at` - Standard timestamps

**Key Relationships**: One user can be a member/staff at multiple libraries

### Library Organization

**Purpose**: Multi-tenant structure for independent library operations

#### `libraries`

Core library entities representing individual library organizations.

- `id` - Primary key UUID
- `name` - Library display name
- `code` - Unique subdomain identifier (e.g., "downtown" for downtown.ezlib.com)
- `address` - JSONB: street, city, state, country, postal_code, coordinates (lat/lng)
- `contact_info` - JSONB: phone, email, website, hours (operating schedule)
- `settings` - JSONB: loan_period_days (default 14), max_renewals, max_books_per_member, allow_holds, allow_digital, membership_fee, late_fee_per_day
- `stats` - JSONB: total_books, total_members, active_loans, books_loaned_this_month (cached for performance)
- `status` - Enum: active, inactive, pending (controls public visibility)
- `created_at`, `updated_at` - Standard timestamps

#### `library_members`

Membership records linking users to libraries. Can exist independently of user accounts for walk-in patrons.

- `id` - Primary key UUID
- `user_id` - Optional reference to auth.users(id), NULL for non-digital members
- `library_id` - References libraries(id)
- `member_id` - Library-specific identifier (e.g., "M001", "CARD-12345")
- `personal_info` - JSONB: first_name, last_name, email, phone, address
- `membership_info` - JSONB: type (regular/student/senior), fees_owed, expiry_date, notes
- `borrowing_stats` - JSONB: current_loans, total_books_borrowed, overdue_items, total_late_fees (cached for performance)
- `status` - Enum: active, inactive, banned
- `is_deleted`, `deleted_at`, `deleted_by` - Soft delete fields
- `created_at`, `updated_at` - Standard timestamps
- **Constraint**: UNIQUE(library_id, member_id)

#### `library_staff`

Staff and administrative roles within libraries with granular permissions.

- `id` - Primary key UUID
- `user_id` - References auth.users(id)
- `library_id` - References libraries(id)
- `role` - Enum: owner, manager, librarian, volunteer (hierarchical permissions)
- `permissions` - JSONB: admin_settings, manage_staff, manage_members, manage_inventory, process_loans, view_reports (granular overrides)
- `employment_info` - JSONB: employee_id, hire_date, department, work_schedule
- `status` - Enum: active, inactive, terminated
- `is_deleted`, `deleted_at`, `deleted_by` - Soft delete fields
- `created_at`, `updated_at` - Standard timestamps
- **Constraint**: UNIQUE(user_id, library_id) - One role per user per library

**Key Design**: `library_id` is the primary tenant boundary for all RLS policies

### Book Inventory

**Purpose**: Three-tier hierarchy supporting multiple copies and editions

#### `general_books`

Universal book concepts representing literary works across all editions.

- `id` - Primary key UUID
- `canonical_title` - Normalized title for deduplication (e.g., "1984")
- `first_publication_year` - Year of original publication
- `subjects` - Text array: genre/topic classifications (fiction, dystopian, classic, etc.)
- `global_stats` - JSONB: total_editions, total_reviews, global_average_rating, total_borrows, languages_available (cached across all libraries)
- `created_at`, `updated_at` - Standard timestamps

#### `book_editions`

Specific publications of a general book (different publishers, translations, formats).

- `id` - Primary key UUID
- `general_book_id` - References general_books(id)
- `isbn_13` - 13-digit ISBN (optional for rare/old books)
- `title` - Edition-specific title
- `subtitle` - Edition subtitle
- `language` - ISO 639-1 language code (en, es, fr, etc.)
- `country` - Target market/region
- `edition_metadata` - JSONB: publisher, publication_date, page_count, cover_image_url, edition_notes, format (paperback/hardcover/digital), last_enriched_at
- `social_stats` - JSONB: review_count, average_rating, language_specific_rating
- `created_at`, `updated_at` - Standard timestamps

#### `book_copies`

Individual physical book instances owned by specific libraries.

- `id` - Primary key UUID
- `library_id` - References libraries(id)
- `book_edition_id` - References book_editions(id)
- `copy_number` - Library-specific identifier (e.g., "001", "A-001")
- `barcode` - Optional barcode for scanning
- `total_copies` - Total copies of book edition in library
- `available_copies` - Available lending out copies
- `location` - JSONB: shelf, section, call_number (physical location in library)
- `condition_info` - JSONB: condition (excellent/good/fair/poor), notes, acquisition_date, acquisition_price, last_maintenance
- `availability` - JSONB: status (available/borrowed), current_borrower_id, due_date, hold_queue array
- `status` - Enum: active, inactive, damaged, lost, maintenance
- `is_deleted`, `deleted_at`, `deleted_by` - Soft delete fields
- `created_at`, `updated_at` - Standard timestamps
- **Constraint**: UNIQUE(library_id, book_edition_id, copy_number)

#### `library_book_edition_counts`

Per-library availability counts for efficient "X of Y available" display.

- `id` - Primary key UUID
- `library_id` - References libraries(id)
- `book_edition_id` - References book_editions(id)
- `total_copies` - Total copies owned by this library
- `available_copies` - Available copies at this library
- `created_at`, `updated_at` - Standard timestamps
- **Constraint**: UNIQUE(library_id, book_edition_id)
- **Maintenance**: Auto-updated via database triggers

#### `authors`

Author profiles with metadata enrichment and social features.

- `id` - Primary key UUID
- `name` - Author's display name
- `canonical_name` - Normalized name for deduplication and search
- `biography` - Author biography text
- `metadata` - JSONB: birth_date, death_date, birth_place, nationality, photo_url, official_website, genres array, aliases array, external_ids (goodreads_id, openlibrary_id, wikipedia_url, imdb_id), last_enriched_at
- `social_stats` - JSONB: total_books, total_reviews, average_rating, total_followers, languages_published array
- `created_at`, `updated_at` - Standard timestamps

#### `book_contributors`

Many-to-many relationship linking books to authors/translators/editors with role specification.

- `id` - Primary key UUID
- `general_book_id` - References general_books(id)
- `book_edition_id` - Optional reference to book_editions(id) for edition-specific contributors
- `author_id` - References authors(id)
- `role` - Enum: author, co_author, translator, editor, illustrator, photographer, foreword, afterword, introduction, narrator, adapter, compiler
- `credit_text` - Custom credit text if needed
- `sort_order` - Integer for display ordering
- `created_at` - Standard timestamp

#### `collections`

Library-curated book groupings for organization and discovery.

- `id` - Primary key UUID
- `library_id` - References libraries(id)
- `name` - Collection display name
- `description` - Collection description text
- `type` - Enum: genre, age_group, special, featured (affects display logic)
- `is_public` - Boolean: visible in public catalog
- `sort_order` - Integer for display ordering
- `created_at`, `updated_at` - Standard timestamps

#### `collection_books`

Many-to-many junction linking collections to book copies.

- `id` - Primary key UUID
- `collection_id` - References collections(id)
- `book_copy_id` - References book_copies(id)
- `added_at` - Timestamp when book was added to collection
- **Constraint**: UNIQUE(collection_id, book_copy_id)

### Transaction Management

**Purpose**: Complete borrowing lifecycle with audit trail

#### `borrowing_transactions`

Core checkout/return records tracking the complete borrowing lifecycle.

- `id` - Primary key UUID
- `library_id` - References libraries(id)
- `book_copy_id` - References book_copies(id)
- `member_id` - References library_members(id)
- `staff_id` - Optional reference to library_staff(id) who processed the transaction
- `transaction_type` - Enum: checkout, return, renewal, hold, reserve
- `status` - Enum: active (currently borrowed), returned, overdue, lost, cancelled
- `transaction_date` - When the transaction was initiated
- `due_date` - When the book is due back
- `return_date` - Actual return date (NULL if not returned)
- `fees` - JSONB: total, late_fee, damage_fee, processing_fee (calculated amounts)
- `notes` - Optional staff notes about the transaction
- `created_at`, `updated_at` - Standard timestamps

#### `transaction_events`

Immutable audit log of all transaction state changes for compliance and debugging.

- `id` - Primary key UUID
- `transaction_id` - References borrowing_transactions(id)
- `event_type` - Enum: created, checkout, return, renewal, overdue_notice, fee_assessed, fee_paid, lost_declared, cancelled
- `staff_id` - Optional reference to staff member who triggered the event
- `member_id` - Optional reference to member involved in the event
- `event_data` - JSONB: Additional event-specific data (due dates, fee amounts, etc.)
- `timestamp` - When the event occurred
- `notes` - Optional notes about the event

**Status Flow**: `pending` → `active` → `returned`/`overdue`/`lost`

**Automatic Updates**: Database triggers maintain book_copies.availability when transaction status changes

### Staff/Member Onboarding

**Purpose**: Secure invitation-based access control

#### `invitations`

Token-based invitation system for securely adding staff and members to libraries.

- `id` - Primary key UUID
- `library_id` - References libraries(id)
- `inviter_id` - References library_staff(id) who created the invitation
- `email` - Email address of the person being invited
- `role` - Enum: owner, manager, librarian, volunteer (for staff invitations)
- `permissions` - JSONB: Granular permission overrides for the invited role
- `invitation_type` - Enum: library_staff, library_member
- `status` - Enum: pending, accepted, declined, expired, cancelled
- `token` - Secure base64url-encoded random token for accessing the invitation
- `expires_at` - Expiration timestamp (default 7 days from creation)
- `personal_message` - Optional message from the inviter
- `metadata` - JSONB: Additional invitation-specific data
- `created_at`, `updated_at` - Standard timestamps
- **Constraint**: UNIQUE(library_id, email, invitation_type) - Prevents duplicate pending invitations

#### `invitation_responses`

Audit trail of all invitation outcomes for security and compliance.

- `id` - Primary key UUID
- `invitation_id` - References invitations(id)
- `responder_user_id` - Optional reference to auth.users(id) if user was registered
- `response_type` - Enum: accepted, declined, expired
- `response_date` - When the response occurred
- `ip_address` - IP address of the responder for security logging
- `user_agent` - Browser user agent for security logging
- `notes` - Optional notes about the response
- `created_library_staff_id` - References library_staff(id) if staff record was created
- `created_library_member_id` - References library_members(id) if member record was created

**Security Features**:

- Email validation ensures invitee email matches their registered account
- Automatic expiration prevents stale invitations
- Prevents duplicate memberships
- Complete audit trail for security compliance

### Social Features

**Purpose**: Reader engagement and community building (post-MVP)

#### `reviews`

User-generated book reviews with ratings and social engagement metrics.

- `id` - Primary key UUID
- `book_edition_id` - References book_editions(id)
- `general_book_id` - References general_books(id) (denormalized for efficient querying)
- `reviewer_id` - References auth.users(id)
- `content` - Review text content
- `rating` - Integer 1-5 star rating
- `language` - ISO 639-1 code of the review language
- `visibility` - Enum: public, followers, private
- `social_metrics` - JSONB: like_count, comment_count, borrow_influence_count, share_count
- `created_at`, `updated_at` - Standard timestamps
- **Constraint**: UNIQUE(book_edition_id, reviewer_id) - One review per edition per user

#### `author_follows`

User subscriptions to authors for notifications about new books and updates.

- `id` - Primary key UUID
- `user_id` - References auth.users(id)
- `author_id` - References authors(id)
- `notification_preferences` - JSONB: new_books, news_updates, awards (boolean flags)
- `followed_at` - Timestamp when the follow relationship was created
- **Constraint**: UNIQUE(user_id, author_id)

#### `social_follows`

User-to-user following relationships for social discovery.

- `id` - Primary key UUID
- `follower_id` - References auth.users(id) (user doing the following)
- `following_id` - References auth.users(id) (user being followed)
- `followed_at` - Timestamp when the follow relationship was created
- **Constraints**:
  - UNIQUE(follower_id, following_id)
  - CHECK(follower_id != following_id) - Prevents self-following

## Multi-Copy Book Management

### Problem Solved

Libraries need to track multiple copies of the same book (e.g., "6 copies of Gone with the Wind, 2 borrowed, 4 available").

### Solution Architecture

1. **Individual Tracking**: Each physical book is a `book_copies` record
2. **Aggregate Counts**: `library_book_edition_counts` stores computed totals per library
3. **Automatic Maintenance**: Database triggers update counts when availability changes
4. **Performance**: No need for real-time COUNT queries in application code

### Example Data Flow

- Library adds 6 copies of "Gone with the Wind" → 6 `book_copies` records created
- Triggers update `library_book_edition_counts`: `total_copies = 6, available_copies = 6`
- 2 books checked out → availability status changes → triggers update counts to `available_copies = 4`
- UI displays: "4 of 6 copies available"

## Row Level Security (RLS) Strategy

### Tenant Isolation

All sensitive tables use `library_id` for data isolation:

- Library staff can only see their library's data
- Public data (book catalog) visible to all for discovery
- User data accessible only to the owning user

### Permission Hierarchy

- **Public**: Read active library catalogs
- **Users**: Manage own profiles and view own transactions
- **Library Members**: View own borrowing history
- **Library Staff**: Full access to library operations
- **Library Managers**: Staff management capabilities

## Performance Optimizations

### Strategic Denormalization

- Book availability counts cached at edition level
- Library stats (total books/members) cached in library record
- Author/book social metrics denormalized for fast display

### Key Indexes

- **Multi-column**: `(library_id, book_edition_id)` for copy lookups
- **Partial**: Only index active, non-deleted records
- **GIN**: JSONB fields for complex queries on metadata
- **Functional**: Search-optimized indexes on canonical names

### Real-time Updates

- Supabase subscriptions for live availability updates
- Trigger-maintained counts eliminate expensive aggregation queries
- Event sourcing via transaction_events for complete audit without performance impact

## Data Integrity

### Soft Deletes

Critical records (members, staff, books) are soft-deleted to:

- Maintain referential integrity in transaction history
- Enable audit trails and restoration
- Prevent accidental data loss

### Audit Trail

- All user actions logged via `transaction_events`
- Invitation system maintains complete response history
- Timestamp triggers on all mutable tables
- Staff attribution for all administrative actions

### Validation

- Database-level constraints on enum fields
- Foreign key relationships enforce data consistency
- RLS policies prevent unauthorized access
- Trigger validation for business rules (e.g., availability limits)

## Scalability Considerations

### Current Scale Targets (NFR6)

- 5,000 books per library
- 1,000 active members per library
- 10+ concurrent staff users per library

### Growth Path

- Partitioning strategy ready for library_id sharding
- Read replicas for public book discovery
- Materialized views for complex reporting
- Background job framework for maintenance tasks
