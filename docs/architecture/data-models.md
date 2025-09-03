# Data Models

The core data models define the shared business entities across both reader social features and library management operations. These TypeScript interfaces will be used consistently across all frontend applications and API services.

## UserProfile

**Purpose:** Public user profile extending Supabase auth.users with social and reading features.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier linked to Supabase Auth
- `email`: string - Authentication email address  
- `display_name`: string - Public display name for social features
- `avatar_url`: string | null - Profile image
- `bio`: string | null - User biography
- `location`: UserLocation - Geographic information
- `social_links`: UserSocialLinks - External social profiles
- `reading_stats`: ReadingStats - Reading activity metrics

### TypeScript Interface
```typescript
interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: UserLocation;
  social_links: UserSocialLinks;
  reading_stats: ReadingStats;
  created_at: Date;
  updated_at: Date;
}

interface UserLocation {
  city: string | null;
  country: string | null;
  timezone: string | null;
}

interface UserSocialLinks {
  website: string | null;
  goodreads: string | null;
  twitter: string | null;
  instagram: string | null;
}

interface ReadingStats {
  books_read: number;
  reviews_written: number;
  favorite_genres: string[];
  reading_goal_yearly: number | null;
}
```

## UserPreferences

**Purpose:** Private user settings and preferences separate from public profile.

**Key Attributes:**
- `id`: string (UUID) - References auth.users
- `notifications`: NotificationSettings - Alert preferences
- `privacy`: PrivacySettings - Visibility controls
- `interface`: InterfaceSettings - UI/UX preferences

### TypeScript Interface
```typescript
interface UserPreferences {
  id: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  interface: InterfaceSettings;
  created_at: Date;
  updated_at: Date;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  due_date_reminders: boolean;
  new_book_alerts: boolean;
  social_activity: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'followers' | 'private';
  reading_activity: 'public' | 'followers' | 'private';
  review_visibility: 'public' | 'followers' | 'private';
  location_sharing: boolean;
}

interface InterfaceSettings {
  preferred_language: string; // ISO code for UI language
  preferred_country: string;  // For regional content
  theme: 'light' | 'dark' | 'system';
  books_per_page: number;
  default_view: 'grid' | 'list';
}
```

### Relationships
- **Has many:** `LibraryMember`, `LibraryStaff`, `Review`, `SocialFollow`

## LibraryMember

**Purpose:** Library membership records supporting both registered users and standalone patrons.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `user_id`: string | null - Optional link to registered user
- `library_id`: string - Reference to Library
- `member_id`: string - Library-specific member identifier
- `personal_info`: PersonalInfo - Contact and identity information
- `membership_info`: MembershipInfo - Membership terms and fees
- `borrowing_stats`: BorrowingStats - Current borrowing status

### TypeScript Interface
```typescript
interface LibraryMember {
  id: string;
  user_id: string | null; // Can be null for non-registered members
  library_id: string;
  member_id: string; // Library-specific ID (e.g., "M001", "2024-456")
  personal_info: PersonalInfo;
  membership_info: MembershipInfo;
  borrowing_stats: BorrowingStats;
  status: 'active' | 'inactive' | 'banned';
  created_at: Date;
  updated_at: Date;
}

interface PersonalInfo {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: MemberAddress;
}

interface MemberAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface MembershipInfo {
  type: 'regular' | 'student' | 'senior' | 'family' | 'institutional';
  fees_owed: number;
  expiry_date: Date | null; // null = no expiration
  notes: string | null;
}

interface BorrowingStats {
  current_loans: number;
  total_books_borrowed: number;
  overdue_items: number;
  total_late_fees: number;
}
```

### Relationships
- **Belongs to:** `UserProfile` (optional), `Library`
- **Has many:** `BorrowingTransaction`

## LibraryStaff

**Purpose:** Library staff and administrators with role-based permissions.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `user_id`: string - Reference to UserProfile
- `library_id`: string - Reference to Library
- `role`: StaffRole - Administrative level
- `permissions`: StaffPermissions - Granular access control
- `employment_info`: EmploymentInfo - HR and scheduling information

### TypeScript Interface
```typescript
interface LibraryStaff {
  id: string;
  user_id: string;
  library_id: string;
  role: StaffRole;
  permissions: StaffPermissions;
  employment_info: EmploymentInfo;
  status: 'active' | 'inactive' | 'terminated';
  created_at: Date;
  updated_at: Date;
}

type StaffRole = 'owner' | 'manager' | 'librarian' | 'volunteer';

interface StaffPermissions {
  admin_settings: boolean;
  manage_staff: boolean;
  manage_members: boolean;
  manage_inventory: boolean;
  process_loans: boolean;
  view_reports: boolean;
}

interface EmploymentInfo {
  employee_id: string | null;
  hire_date: Date | null;
  department: string | null;
  work_schedule: WorkSchedule | null;
}

interface WorkSchedule {
  hours_per_week?: number;
  schedule_notes?: string;
  shift_preferences?: string[];
}
```

### Relationships
- **Belongs to:** `UserProfile`, `Library`
- **Has many:** `BorrowingTransaction` (as processor)

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

## BookCopy

**Purpose:** Individual physical book instances with unique tracking and location management.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `library_id`: string - Owning library
- `book_edition_id`: string - Reference to BookEdition
- `copy_number`: string - Library-specific copy identifier
- `barcode`: string | null - Optional barcode for scanning
- `location`: CopyLocation - Physical location in library
- `condition_info`: ConditionInfo - Physical condition and maintenance
- `availability`: CopyAvailability - Current borrowing status

### TypeScript Interface
```typescript
interface BookCopy {
  id: string;
  library_id: string;
  book_edition_id: string;
  copy_number: string; // e.g., "001", "A-001", "Main-Fiction-0123"
  barcode: string | null;
  location: CopyLocation;
  condition_info: ConditionInfo;
  availability: CopyAvailability;
  created_at: Date;
  updated_at: Date;
}

interface CopyLocation {
  shelf: string | null;
  section: string | null; // e.g., "Fiction", "Reference", "Children"
  call_number: string | null; // Dewey Decimal or custom classification
}

interface ConditionInfo {
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  notes: string | null;
  acquisition_date: Date | null;
  acquisition_price: number | null;
  last_maintenance: Date | null;
}

interface CopyAvailability {
  status: 'available' | 'borrowed' | 'reserved' | 'maintenance' | 'lost' | 'withdrawn';
  current_borrower_id: string | null;
  due_date: Date | null;
  hold_queue: string[]; // Array of member IDs with holds
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
- **Belongs to many:** `BookCopy` (through `collection_books` junction table)

## BorrowingTransaction

**Purpose:** Complete borrowing lifecycle tracking supporting staff-processed transactions and member borrowing history.

**Key Attributes:**
- `id`: string (UUID) - Primary identifier
- `library_id`: string - Library that owns the book
- `book_copy_id`: string - Reference to specific book copy
- `member_id`: string - Library member who borrowed the book
- `staff_id`: string | null - Staff member who processed the transaction
- `transaction_type`: TransactionType - Type of transaction
- `status`: TransactionStatus - Current state
- `fees`: TransactionFees - Financial information

### TypeScript Interface
```typescript
interface BorrowingTransaction {
  id: string;
  library_id: string;
  book_copy_id: string;
  member_id: string;
  staff_id: string | null; // Staff who processed the transaction
  transaction_type: TransactionType;
  status: TransactionStatus;
  transaction_date: Date;
  due_date: Date | null;
  return_date: Date | null;
  fees: TransactionFees;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

type TransactionType = 
  | 'checkout'      // Regular book checkout
  | 'return'        // Book return
  | 'renewal'       // Loan renewal
  | 'hold'          // Place book on hold
  | 'reserve';      // Reserve specific copy

type TransactionStatus = 
  | 'active'        // Currently checked out
  | 'returned'      // Successfully returned
  | 'overdue'       // Past due date
  | 'lost'          // Book reported lost
  | 'cancelled';    // Transaction cancelled

interface TransactionFees {
  total: number;
  late_fee: number;
  damage_fee: number;
  processing_fee: number;
}
```

## TransactionEvent

**Purpose:** Detailed audit trail for borrowing transactions providing complete history tracking.

### TypeScript Interface
```typescript
interface TransactionEvent {
  id: string;
  transaction_id: string;
  event_type: TransactionEventType;
  staff_id: string | null;
  member_id: string | null;
  event_data: Record<string, any>; // Additional event-specific data
  timestamp: Date;
  notes: string | null;
}

type TransactionEventType =
  | 'created'         // Transaction created
  | 'checkout'        // Book checked out
  | 'return'          // Book returned
  | 'renewal'         // Loan renewed
  | 'overdue_notice'  // Overdue notification sent
  | 'fee_assessed'    // Fee charged
  | 'fee_paid'        // Fee payment received
  | 'lost_declared'   // Book declared lost
  | 'cancelled';      // Transaction cancelled
```

### Relationships
- **Belongs to:** `BookCopy`, `LibraryMember`, `Library`, `LibraryStaff` (optional)
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
- **Belongs to:** `BookEdition`, `GeneralBook`, `UserProfile` (reviewer)
