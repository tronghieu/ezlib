/**
 * Invitation API functions for database operations
 * Handles invitation CRUD operations for member registration workflow
 */

import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type {
  Invitation,
  InvitationCreateRequest,
  InvitationSearchParams,
  InvitationListResponse,
} from "@/types/invitations";

// Create invitation for new member registration
export const createMemberInvitation = async (
  libraryId: string,
  inviterUserId: string,
  email: string,
  inviterName: string,
  personalMessage?: string
): Promise<Invitation> => {
  const invitationData = {
    library_id: libraryId,
    inviter_id: inviterUserId,
    email,
    role: "member", // Default role for library members
    invitation_type: "library_member" as const,
    personal_message: personalMessage,
    metadata: {
      invited_by_name: inviterName,
      invitation_reason: "New member registration",
    } as Json,
  };

  const { data, error } = await supabase()
    .from("invitations")
    .insert(invitationData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member invitation: ${error.message}`);
  }

  return data as Invitation;
};

// Check for existing invitation during member registration
export const findPendingInvitation = async (
  email: string,
  libraryId: string
): Promise<Invitation | null> => {
  const { data, error } = await supabase()
    .from("invitations")
    .select("*")
    .eq("email", email)
    .eq("library_id", libraryId)
    .eq("invitation_type", "library_member")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to find pending invitation: ${error.message}`);
  }

  if (!data) return null;

  return data as Invitation;
};

// Create invitation (general function)
export const createInvitation = async (
  request: InvitationCreateRequest
): Promise<Invitation> => {
  const insertData = {
    ...request,
    metadata: request.metadata as Json,
  };

  const { data, error } = await supabase()
    .from("invitations")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  return data as Invitation;
};

// Fetch invitations with filtering
export const fetchInvitations = async (
  libraryId: string,
  params: InvitationSearchParams = {}
): Promise<InvitationListResponse> => {
  const { email, status, invitation_type, role, page = 1, limit = 20 } = params;

  let query = supabase()
    .from("invitations")
    .select("*", { count: "exact" })
    .eq("library_id", libraryId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (email) {
    query = query.ilike("email", `%${email}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (invitation_type) {
    query = query.eq("invitation_type", invitation_type);
  }

  if (role) {
    query = query.eq("role", role);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }

  const total = count || 0;
  const hasMore = from + limit < total;

  return {
    invitations: (data || []) as Invitation[],
    total,
    page,
    limit,
    hasMore,
  };
};

// Update invitation status
export const updateInvitationStatus = async (
  invitationId: string,
  status: "accepted" | "rejected" | "expired",
  libraryId: string
): Promise<Invitation> => {
  const { data, error } = await supabase()
    .from("invitations")
    .update({ status })
    .eq("id", invitationId)
    .eq("library_id", libraryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update invitation status: ${error.message}`);
  }

  return data as Invitation;
};

// Delete invitation
export const deleteInvitation = async (
  invitationId: string,
  libraryId: string
): Promise<void> => {
  const { error } = await supabase()
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("library_id", libraryId);

  if (error) {
    throw new Error(`Failed to delete invitation: ${error.message}`);
  }
};

// Get invitation by token (for accepting invitations)
export const getInvitationByToken = async (
  token: string
): Promise<Invitation | null> => {
  const { data, error } = await supabase()
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get invitation by token: ${error.message}`);
  }

  return (data as Invitation) || null;
};

// Expire old invitations (utility function)
export const expireOldInvitations = async (
  libraryId: string
): Promise<number> => {
  const { count, error } = await supabase()
    .from("invitations")
    .update({ status: "expired" })
    .eq("library_id", libraryId)
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  if (error) {
    throw new Error(`Failed to expire old invitations: ${error.message}`);
  }

  return count || 0;
};
