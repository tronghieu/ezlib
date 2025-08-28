/**
 * Application-specific type definitions
 * Custom composite types and helpers for the Library Management System
 * 
 * @see Database types from database.ts for generated Supabase types
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from "./database";

// =============================================================================
// CORE ENTITY TYPES (Based on actual database schema)
// =============================================================================

/**
 * Author entity - represents book authors
 */
export type Author = Tables<"authors">;
export type AuthorInsert = TablesInsert<"authors">;
export type AuthorUpdate = TablesUpdate<"authors">;

/**
 * General Book entity - represents canonical books
 */
export type GeneralBook = Tables<"general_books">;
export type GeneralBookInsert = TablesInsert<"general_books">;
export type GeneralBookUpdate = TablesUpdate<"general_books">;

/**
 * Book Edition entity - specific editions/versions of books
 */
export type BookEdition = Tables<"book_editions">;
export type BookEditionInsert = TablesInsert<"book_editions">;
export type BookEditionUpdate = TablesUpdate<"book_editions">;

/**
 * Book Contributors - links between books and authors
 */
export type BookContributor = Tables<"book_contributors">;
export type BookContributorInsert = TablesInsert<"book_contributors">;
export type BookContributorUpdate = TablesUpdate<"book_contributors">;

/**
 * Reviews - book reviews and ratings
 */
export type Review = Tables<"reviews">;
export type ReviewInsert = TablesInsert<"reviews">;
export type ReviewUpdate = TablesUpdate<"reviews">;

// =============================================================================
// LIBRARY MANAGEMENT SPECIFIC TYPES (For future implementation)
// =============================================================================

/**
 * Library entity - represents physical libraries
 * @note This will be added to database schema in future migration
 */
export interface Library {
  id: string;
  name: string;
  code: string;
  address: LibraryAddress;
  contact?: LibraryContact;
  settings: LibrarySettings;
  created_at: string;
  updated_at: string;
}

export interface LibraryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface LibraryContact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface LibrarySettings {
  defaultLoanPeriodDays: number;
  maxRenewals: number;
  finePerDayAmount: number;
  maxFineAmount: number;
  allowHolds: boolean;
  operatingHours?: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

/**
 * Library Staff entity - staff members with roles
 * @note This will be added to database schema in future migration
 */
export interface LibraryStaff {
  id: string;
  user_id: string;
  library_id: string;
  role: StaffRole;
  permissions: StaffPermissions;
  created_at: string;
  updated_at: string;
}

export type StaffRole = "owner" | "manager" | "librarian";

export interface StaffPermissions {
  books: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  members: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  transactions: {
    checkout: boolean;
    return: boolean;
    renew: boolean;
    fine: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  settings: {
    view: boolean;
    update: boolean;
  };
}

/**
 * Library Member entity - library patrons
 * @note This will be added to database schema in future migration
 */
export interface LibraryMember {
  id: string;
  library_id: string;
  member_id: string; // Library-specific ID
  personal_info: MemberPersonalInfo;
  address?: MemberAddress;
  membership: MembershipInfo;
  preferences: MemberPreferences;
  borrowing_stats: BorrowingStats;
  created_at: string;
  updated_at: string;
}

export interface MemberPersonalInfo {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
}

export interface MemberAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface MembershipInfo {
  type: "adult" | "child" | "senior" | "student";
  status: "active" | "expired" | "suspended";
  registration_date: string;
  expiration_date: string;
}

export interface MemberPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  hold_notifications: boolean;
}

export interface BorrowingStats {
  total_checkouts: number;
  current_checkouts: number;
  overdue_books: number;
  total_fines: number;
  last_checkout_date?: string;
}

/**
 * Book Copy entity - physical book copies in library inventory
 * @note This will be added to database schema in future migration
 */
export interface BookCopy {
  id: string;
  library_id: string;
  book_edition_id: string;
  barcode: string;
  condition: BookCondition;
  location?: string;
  availability: AvailabilityStatus;
  created_at: string;
  updated_at: string;
}

export type BookCondition = "new" | "excellent" | "good" | "fair" | "poor" | "damaged";

export interface AvailabilityStatus {
  status: "available" | "checked_out" | "on_hold" | "lost" | "damaged" | "withdrawn";
  due_date?: string;
  member_id?: string;
  hold_queue?: HoldRequest[];
}

export interface HoldRequest {
  member_id: string;
  requested_at: string;
  priority: number;
}

/**
 * Borrowing Transaction entity - checkout/return history
 * @note This will be added to database schema in future migration
 */
export interface BorrowingTransaction {
  id: string;
  library_id: string;
  book_copy_id: string;
  member_id: string;
  transaction_type: TransactionType;
  checkout_date?: string;
  due_date?: string;
  return_date?: string;
  fees: TransactionFees;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "checkout" | "return" | "renewal" | "hold_request" | "hold_fulfillment";

export interface TransactionFees {
  late_fee: number;
  damage_fee: number;
  lost_fee: number;
  total_fee: number;
  paid: boolean;
  payment_date?: string;
}

// =============================================================================
// DOMAIN-SPECIFIC TYPE HELPERS
// =============================================================================

/**
 * Create author data (for insertions)
 */
export type CreateAuthorData = Omit<Author, "id" | "created_at" | "updated_at">;

/**
 * Update author data (for partial updates)
 */
export type UpdateAuthorData = Partial<Omit<Author, "id" | "created_at" | "updated_at">>;

/**
 * Create book edition data (for insertions)
 */
export type CreateBookEditionData = Omit<BookEdition, "id" | "created_at" | "updated_at">;

/**
 * Update book edition data (for partial updates)  
 */
export type UpdateBookEditionData = Partial<Omit<BookEdition, "id" | "created_at" | "updated_at">>;

/**
 * Author with related books for joined queries
 */
export interface AuthorWithBooks extends Author {
  books: BookEdition[];
}

/**
 * Book edition with authors for joined queries
 */
export interface BookEditionWithAuthor extends BookEdition {
  authors: Author[];
}

// =============================================================================
// COMPOSITE TYPES FOR UI COMPONENTS
// =============================================================================

/**
 * Book with full details for display
 */
export interface BookWithDetails extends BookEdition {
  general_book: GeneralBook;
  contributors: (BookContributor & {
    author: Author;
  })[];
  copies?: BookCopy[];
  reviews?: Review[];
}

/**
 * Library Member with borrowing history
 */
export interface MemberWithHistory extends LibraryMember {
  current_loans: (BorrowingTransaction & {
    book_copy: BookCopy & {
      book_edition: BookEdition;
    };
  })[];
  history: BorrowingTransaction[];
}

/**
 * Staff member with library details
 */
export interface StaffWithLibrary extends LibraryStaff {
  library: Library;
  user_profile?: {
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Book creation form data
 */
export interface BookFormData {
  title: string;
  subtitle?: string;
  authors: string[];
  isbn_10?: string;
  isbn_13?: string;
  language: string;
  country?: string;
  subjects: string[];
  copies: {
    barcode: string;
    condition: BookCondition;
    location?: string;
  }[];
}

/**
 * Member registration form data
 */
export interface MemberFormData {
  member_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  membership_type: MemberPersonalInfo["membership_type"];
}

/**
 * Checkout form data
 */
export interface CheckoutFormData {
  member_id: string;
  book_copies: string[]; // Array of book copy IDs
  due_date?: string;
  notes?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Search response with filters
 */
export interface SearchResponse<T> extends PaginatedResponse<T> {
  filters: {
    applied: Record<string, unknown>;
    available: Record<string, unknown[]>;
  };
}

// =============================================================================
// REAL-TIME TYPES
// =============================================================================

/**
 * Real-time event types for Supabase subscriptions
 */
export interface RealtimeEvent<T = Record<string, unknown>> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  new?: T;
  old?: T;
  errors?: string[];
}

/**
 * Book inventory change events
 */
export type BookInventoryEvent = RealtimeEvent<BookCopy>;

/**
 * Transaction events
 */
export type TransactionEvent = RealtimeEvent<BorrowingTransaction>;

/**
 * Member activity events
 */
export type MemberActivityEvent = RealtimeEvent<LibraryMember>;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract ID from entity types
 */
export type EntityId<T> = T extends { id: infer U } ? U : never;

/**
 * Database table names
 */
export type TableName = keyof Database["public"]["Tables"];

/**
 * Environment configuration type
 */
export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  app: {
    name: string;
    version: string;
    environment: "development" | "staging" | "production";
    baseUrl: string;
  };
  features: {
    dueDates: boolean;
    fines: boolean;
    holds: boolean;
    advancedSearch: boolean;
  };
}