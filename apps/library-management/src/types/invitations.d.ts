/**
 * Invitation type definitions for Library Management System
 * Based on public.invitations table schema
 */

// Core invitation data structure
export interface Invitation {
  id: string; // Primary key UUID (auto-generated)
  library_id: string; // References libraries(id)
  inviter_id: string; // References auth.users(id) - who sent the invitation
  email: string; // Invitee's email address (required)
  role: string; // Intended role: 'volunteer', 'librarian', etc.
  invitation_type: InvitationType; // Type: 'library_member', 'library_staff'
  status: InvitationStatus; // Status: 'pending' (default), 'accepted', 'expired', 'rejected'
  token: string; // Unique invitation token (auto-generated, no dashes)
  expires_at: string; // Expiration timestamp (default: 7 days from creation)
  personal_message?: string; // Optional personal message from inviter
  metadata: InvitationMetadata; // JSONB: Additional invitation context
  created_at: string; // Auto-timestamp
  updated_at: string; // Auto-timestamp with update trigger
}

// Invitation metadata structure
export interface InvitationMetadata {
  invited_by_name?: string; // Name of person who sent invitation
  invitation_reason?: string; // Reason for invitation
  [key: string]: unknown; // Extensible for future needs
}

// Invitation type enum
export type InvitationType = "library_member" | "library_staff";

// Invitation status enum
export type InvitationStatus = "pending" | "accepted" | "expired" | "rejected";

// Common role values
export type InvitationRole = "volunteer" | "librarian" | "manager" | "owner";

// Form data types for invitation operations
export interface CreateInvitationData {
  email: string;
  role: string;
  invitation_type: InvitationType;
  personal_message?: string;
  invitation_reason?: string;
}

export interface InvitationCreateRequest {
  library_id: string;
  inviter_id: string;
  email: string;
  role: string;
  invitation_type: InvitationType;
  personal_message?: string;
  metadata?: InvitationMetadata;
}

// Search and filter types
export interface InvitationSearchParams {
  email?: string;
  status?: InvitationStatus;
  invitation_type?: InvitationType;
  role?: string;
  page?: number;
  limit?: number;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
