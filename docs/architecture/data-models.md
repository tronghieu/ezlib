# Data Models

The core data models define the shared business entities across both reader social features and library management operations. These TypeScript interfaces will be used consistently across all frontend applications and API services.

## User

**Purpose:** Base user identity - all users are readers by default, with additional library relationships managed separately.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier linked to Supabase Auth
- `email`: string - Authentication email address
- `display_name`: string - Public display name for social features
- `avatar_url`: string | null - Profile image
- `preferences`: UserPreferences - Reading and notification preferences

### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  preferences: UserPreferences;
}

interface UserPreferences {
  notification_email: boolean;
  notification_sms: boolean;
  privacy_social_activity: 'public' | 'followers' | 'private';
  preferred_language: string; // For book edition filtering
  preferred_country: string;  // For regional book recommendations
}
```

### Relationships
- **Has many:** `LibReader`, `LibAdmin`, `Review`, `SocialFollow`

## LibReader

**Purpose:** Library membership with subscription tracking and borrowing privileges.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `user_id`: string - Reference to User
- `library_id`: string - Reference to Library
- `state`: 'active' | 'inactive' | 'banned' - Membership status
- `subscription_start`: Date - Membership start date
- `subscription_end`: Date | null - Membership expiry (null = lifetime)
- `notes`: string | null - Staff notes about member

### TypeScript Interface
```typescript
interface LibReader {
  id: string;
  user_id: string;
  library_id: string;
  state: 'active' | 'inactive' | 'banned';
  subscription_start: Date;
  subscription_end: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### Relationships
- **Belongs to:** `User`, `Library`
- **Has many:** `BorrowingTransaction`

## LibAdmin

**Purpose:** Library administration roles separate from reader memberships.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `user_id`: string - Reference to User
- `library_id`: string - Reference to Library
- `role`: 'owner' | 'manager' | 'librarian' - Administrative level
- `granted_at`: Date - When role was assigned
- `granted_by`: string - User ID who granted the role

### TypeScript Interface
```typescript
interface LibAdmin {
  id: string;
  user_id: string;
  library_id: string;
  role: 'owner' | 'manager' | 'librarian';
  granted_at: Date;
  granted_by: string;
  permissions: AdminPermissions;
}

interface AdminPermissions {
  manage_books: boolean;
  manage_members: boolean;
  manage_staff: boolean;
  view_analytics: boolean;
  manage_collections: boolean;
}
```

### Relationships
- **Belongs to:** `User`, `Library`

## Author

**Purpose:** Centralized author entity supporting author pages, bibliography management, and role-based book relationships (author, translator, editor, etc.).

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `name`: string - Primary display name
- `canonical_name`: string - Normalized name for deduplication
- `biography`: string | null - Author biographical information
- `metadata`: AuthorMetadata - Additional author details
- `social_stats`: AuthorSocialStats - Aggregated statistics across all works

### TypeScript Interface
```typescript
interface Author {
  id: string;
  name: string;
  canonical_name: string; // Normalized for matching across languages/sources
  biography: string | null;
  metadata: AuthorMetadata;
  social_stats: AuthorSocialStats;
  created_at: Date;
  updated_at: Date;
}

interface AuthorMetadata {
  birth_date: Date | null;
  death_date: Date | null;
  birth_place: string | null;
  nationality: string | null;
  photo_url: string | null;
  official_website: string | null;
  genres: string[]; // Primary genres they write in
  aliases: string[]; // Pen names, alternative spellings
  external_ids: ExternalAuthorIds;
  last_enriched_at: Date | null;
}

interface ExternalAuthorIds {
  goodreads_id: string | null;
  openlibrary_id: string | null;
  wikipedia_url: string | null;
  imdb_id: string | null; // For authors who are also screenwriters/directors
}

interface AuthorSocialStats {
  total_books: number;
  total_reviews: number;
  average_rating: number | null;
  total_followers: number; // Users following this author
  languages_published: string[];
}
```

### Relationships
- **Has many:** `BookContributor` (through junction table)
- **Has many:** `AuthorFollow` (users following author)
- **Has many:** `GeneralBook` (through book contributors)

## GeneralBook

**Purpose:** Universal book entity aggregating all editions and translations for global social features.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `canonical_title`: string - Most common title
- `first_publication_year`: number | null - Original publication year
- `subjects`: string[] - Genre/topic classifications
- `global_stats`: GlobalBookStats - Aggregated statistics across all editions

### TypeScript Interface
```typescript
interface GeneralBook {
  id: string;
  canonical_title: string;
  first_publication_year: number | null;
  subjects: string[];
  global_stats: GlobalBookStats;
  created_at: Date;
  updated_at: Date;
}

interface GlobalBookStats {
  total_editions: number;
  total_reviews: number;
  global_average_rating: number | null;
  total_borrows: number;
  languages_available: string[];
}
```

### Relationships
- **Has many:** `BookEdition`
- **Has many:** `Review` (aggregated across editions)

## BookEdition

**Purpose:** Specific edition/translation of a book with unique metadata and library ownership.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `general_book_id`: string - Reference to GeneralBook
- `isbn_13`: string | null - Edition-specific ISBN
- `title`: string - Edition-specific title
- `language`: string - Edition language code
- `edition_metadata`: EditionMetadata - Edition-specific details

### TypeScript Interface
```typescript
interface BookEdition {
  id: string;
  general_book_id: string;
  isbn_13: string | null;
  title: string;
  subtitle: string | null;
  language: string; // ISO 639-1 code
  country: string | null; // Target market
  edition_metadata: EditionMetadata;
  social_stats: EditionSocialStats;
  created_at: Date;
  updated_at: Date;
}

interface EditionMetadata {
  publisher: string | null;
  publication_date: Date | null;
  page_count: number | null;
  cover_image_url: string | null;
  edition_notes: string | null; // "Revised", "Annotated", etc.
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook' | 'other';
  last_enriched_at: Date | null;
}

interface EditionSocialStats {
  review_count: number;
  average_rating: number | null;
  language_specific_rating: number | null;
}
```

### Relationships
- **Belongs to:** `GeneralBook`
- **Has many:** `BookInventory`, `Review`
- **Has many:** `BookContributor` (edition-specific contributors like translators)
- **Has many:** `Author` (through BookContributor)

## BookContributor (Junction Table)

**Purpose:** Flexible relationship between authors and books supporting multiple roles (author, translator, editor, illustrator, etc.).

### TypeScript Interface
```typescript
interface BookContributor {
  id: string;
  general_book_id: string;
  book_edition_id: string | null; // Null for general book, specific for edition-only contributors
  author_id: string;
  role: ContributorRole;
  credit_text: string | null; // Custom credit text if needed
  sort_order: number; // For display ordering
}

type ContributorRole = 
  | 'author'
  | 'co_author'
  | 'translator'
  | 'editor'
  | 'illustrator'
  | 'photographer'
  | 'foreword'
  | 'afterword'
  | 'introduction'
  | 'narrator'      // For audiobooks
  | 'adapter'       // For adaptations
  | 'compiler';     // For compilations
```

### Relationships
- **Belongs to:** `GeneralBook`, `BookEdition` (optional), `Author`

## BookInventory

**Purpose:** Library-specific book availability and collection organization.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `book_edition_id`: string - Reference to BookEdition
- `library_id`: string - Owning library
- `availability`: InventoryAvailability - Current status
- `physical_details`: PhysicalDetails - Library-specific information

### TypeScript Interface
```typescript
interface BookInventory {
  id: string;
  book_edition_id: string;
  library_id: string;
  availability: InventoryAvailability;
  physical_details: PhysicalDetails;
  created_at: Date;
  updated_at: Date;
}

interface InventoryAvailability {
  status: 'available' | 'checked_out' | 'on_hold' | 'lost' | 'damaged' | 'withdrawn';
  total_copies: number;
  available_copies: number;
  current_borrower_id: string | null;
  due_date: Date | null;
}

interface PhysicalDetails {
  shelf_location: string | null;
  condition: 'new' | 'good' | 'fair' | 'poor';
  acquisition_date: Date | null;
  acquisition_cost: number | null;
  barcode: string | null;
}
```

### Relationships
- **Belongs to:** `BookEdition`, `Library`
- **Has many:** `BorrowingTransaction`
- **Belongs to many:** `Collection` (through junction table)

## Collection

**Purpose:** Library-defined book organization and curation system.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `library_id`: string - Owning library
- `name`: string - Collection display name
- `description`: string | null - Collection purpose/criteria
- `type`: 'genre' | 'age_group' | 'special' | 'featured' - Collection category
- `is_public`: boolean - Visible to readers in public catalog

### TypeScript Interface
```typescript
interface Collection {
  id: string;
  library_id: string;
  name: string;
  description: string | null;
  type: 'genre' | 'age_group' | 'special' | 'featured';
  is_public: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}
```

### Relationships
- **Belongs to:** `Library`
- **Belongs to many:** `BookInventory` (through `collection_books` junction table)

## BorrowingTransaction

**Purpose:** Complete borrowing lifecycle tracking from request through return, supporting both staff-initiated and reader-requested borrowing.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `book_inventory_id`: string - Reference to borrowed book inventory
- `borrower_id`: string - User who borrowed the book
- `library_id`: string - Library that owns the book
- `status`: TransactionStatus - Current transaction state
- `timeline`: TransactionEvent[] - Complete audit trail

### TypeScript Interface
```typescript
interface BorrowingTransaction {
  id: string;
  book_inventory_id: string;
  borrower_id: string;
  library_id: string;
  status: TransactionStatus;
  requested_at: Date | null;
  approved_at: Date | null;
  checked_out_at: Date | null;
  due_date: Date | null;
  returned_at: Date | null;
  renewal_count: number;
  notes: string | null;
}

type TransactionStatus = 
  | 'requested'     // Reader requested borrowing
  | 'approved'      // Staff approved request
  | 'checked_out'   // Book physically borrowed
  | 'overdue'       // Past due date
  | 'returned'      // Successfully returned
  | 'cancelled'     // Request cancelled
  | 'lost';         // Book reported lost

interface TransactionEvent {
  event_type: TransactionStatus;
  timestamp: Date;
  user_id: string;
  notes: string | null;
}
```

### Relationships
- **Belongs to:** `BookInventory`, `User` (borrower), `Library`
- **Has many:** `TransactionEvent` (audit trail)

## Review

**Purpose:** Reviews linked to specific editions but aggregated for global book discovery.

### TypeScript Interface
```typescript
interface Review {
  id: string;
  book_edition_id: string;
  general_book_id: string; // Denormalized for efficient querying
  reviewer_id: string;
  content: string;
  rating: number; // 1-5 scale
  language: string; // Review language
  visibility: 'public' | 'followers' | 'private';
  social_metrics: ReviewMetrics;
  created_at: Date;
  updated_at: Date;
}

interface ReviewMetrics {
  like_count: number;
  comment_count: number;
  borrow_influence_count: number; // How many people borrowed after this review
  share_count: number;
}
```

### Relationships
- **Belongs to:** `BookEdition`, `GeneralBook`, `User` (reviewer)
