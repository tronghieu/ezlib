/**
 * Member type definitions for Library Management System
 * Based on public.library_members table schema
 */

// Core member data structure
export interface LibraryMember {
  id: string; // Primary key UUID
  user_id?: string; // Optional reference to auth.users(id), NULL for non-digital members
  library_id: string; // References libraries(id)
  member_id: string; // Library-specific identifier (e.g., "M001", "CARD-12345")
  personal_info: PersonalInfo; // JSONB: Contact and personal details
  membership_info: MembershipInfo; // JSONB: Membership details
  borrowing_stats: BorrowingStats; // JSONB: Cached borrowing statistics for performance
  status: MemberStatus;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
}

// Personal information structure
export interface PersonalInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: Address;
}

// Address structure (compatible with Json type)
export interface Address {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
}

// Membership information structure
export interface MembershipInfo {
  type: MembershipType;
  fees_owed: number;
  expiry_date?: string;
  notes?: string;
}

// Borrowing statistics structure
export interface BorrowingStats {
  current_loans: number;
  total_books_borrowed: number;
  overdue_items: number;
  total_late_fees: number;
}

// Member status enum
export type MemberStatus = "active" | "inactive" | "banned";

// Membership type enum
export type MembershipType = "regular" | "student" | "senior";

// Form data types for member operations
export interface MemberRegistrationData {
  member_id?: string; // Optional for automatic generation
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: Address;
  membership_type: MembershipType;
  membership_notes?: string;
}

export interface MemberUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  membership_type?: MembershipType;
  membership_notes?: string;
  status?: MemberStatus;
}

// API response types
export interface MemberWithCheckouts extends LibraryMember {
  current_checkouts?: CheckoutInfo[];
}

export interface CheckoutInfo {
  id: string;
  book_title: string;
  book_id: string;
  checkout_date: string;
  due_date?: string;
  status: string;
}

// Search and filter types
export interface MemberSearchParams {
  search?: string;
  status?: MemberStatus;
  membership_type?: MembershipType;
  page?: number;
  limit?: number;
}

export interface MemberListResponse {
  members: LibraryMember[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}