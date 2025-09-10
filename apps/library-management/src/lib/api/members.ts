/**
 * Member API functions for database operations
 * Handles CRUD operations for library members with RLS compliance
 */

import { supabase } from "@/lib/supabase/client";
import { createMemberInvitation } from "@/lib/api/invitations";
import type { Json } from "@/types/database";
import type {
  LibraryMember,
  MemberRegistrationData,
  MemberUpdateData,
  MemberSearchParams,
  MemberListResponse,
  MemberWithCheckouts,
  CheckoutInfo,
} from "@/types/members";

// Generate automatic member ID (simple auto-increment format)
export const generateMemberID = async (libraryId: string): Promise<string> => {
  const { count, error } = await supabase()
    .from("library_members")
    .select("id", { count: "exact", head: true })
    .eq("library_id", libraryId)
    .eq("is_deleted", false);

  if (error) {
    throw new Error(`Failed to generate member ID: ${error.message}`);
  }

  const nextNumber = (count || 0) + 1;
  return `M${nextNumber.toString().padStart(3, "0")}`; // M001, M002, etc.
};

// Check for duplicate email within library
export const checkDuplicateEmail = async (
  libraryId: string,
  email: string,
  excludeMemberId?: string
): Promise<boolean> => {
  let query = supabase()
    .from("library_members")
    .select("id")
    .eq("library_id", libraryId)
    .eq("personal_info->>email", email)
    .eq("is_deleted", false);

  if (excludeMemberId) {
    query = query.neq("id", excludeMemberId);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check duplicate email: ${error.message}`);
  }

  return !!data;
};

// Create new member with invitation system integration
export const createMemberWithInvitation = async (
  memberData: MemberRegistrationData,
  libraryId: string,
  inviterUserId: string,
  inviterName: string
): Promise<LibraryMember> => {
  // Check for duplicate email
  const emailExists = await checkDuplicateEmail(libraryId, memberData.email);
  if (emailExists) {
    throw new Error("A member with this email address already exists");
  }

  // Generate member ID if not provided
  const memberId = memberData.member_id || (await generateMemberID(libraryId));

  // Prepare member data
  const newMember = {
    library_id: libraryId,
    member_id: memberId,
    personal_info: {
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      email: memberData.email,
      phone: memberData.phone || null,
      address: memberData.address || null,
    } as Json,
    membership_info: {
      type: memberData.membership_type,
      fees_owed: 0,
      notes: memberData.membership_notes || null,
    } as Json,
    borrowing_stats: {
      current_loans: 0,
      total_books_borrowed: 0,
      overdue_items: 0,
      total_late_fees: 0,
    } as Json,
    status: "active" as const,
    is_deleted: false,
  };

  const { data, error } = await supabase()
    .from("library_members")
    .insert(newMember)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member: ${error.message}`);
  }

  // Create invitation for the new member (but don't fail member creation if this fails)
  try {
    await createMemberInvitation(
      libraryId,
      inviterUserId,
      memberData.email,
      inviterName,
      `Welcome to the library! Your member ID is ${memberId}.`
    );
  } catch (invitationError) {
    console.warn("Failed to create member invitation:", invitationError);
    // Don't throw error - member creation should still succeed
  }

  return data as unknown as LibraryMember;
};

// Create new member (legacy function for backwards compatibility)
export const createMember = async (
  memberData: MemberRegistrationData,
  libraryId: string
): Promise<LibraryMember> => {
  // Check for duplicate email
  const emailExists = await checkDuplicateEmail(libraryId, memberData.email);
  if (emailExists) {
    throw new Error("A member with this email address already exists");
  }

  // Generate member ID if not provided
  const memberId = memberData.member_id || (await generateMemberID(libraryId));

  // Prepare member data
  const newMember = {
    library_id: libraryId,
    member_id: memberId,
    personal_info: {
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      email: memberData.email,
      phone: memberData.phone || null,
      address: memberData.address || null,
    } as Json,
    membership_info: {
      type: memberData.membership_type,
      fees_owed: 0,
      notes: memberData.membership_notes || null,
    } as Json,
    borrowing_stats: {
      current_loans: 0,
      total_books_borrowed: 0,
      overdue_items: 0,
      total_late_fees: 0,
    } as Json,
    status: "active" as const,
    is_deleted: false,
  };

  const { data, error } = await supabase()
    .from("library_members")
    .insert(newMember)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member: ${error.message}`);
  }

  return data as unknown as LibraryMember;
};

// Fetch members with search and pagination
export const fetchMembers = async (
  libraryId: string,
  params: MemberSearchParams = {}
): Promise<MemberListResponse> => {
  const { search, status, membership_type, page = 1, limit = 20 } = params;

  let query = supabase()
    .from("library_members")
    .select(
      `
      id,
      member_id,
      personal_info,
      membership_info,
      borrowing_stats,
      status,
      created_at,
      updated_at
    `,
      { count: "exact" }
    )
    .eq("library_id", libraryId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`
      member_id.ilike.%${search}%,
      personal_info->>first_name.ilike.%${search}%,
      personal_info->>last_name.ilike.%${search}%,
      personal_info->>email.ilike.%${search}%
    `);
  }

  // Apply status filter
  if (status) {
    query = query.eq("status", status);
  }

  // Apply membership type filter
  if (membership_type) {
    query = query.eq("membership_info->>type", membership_type);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  const total = count || 0;
  const hasMore = from + limit < total;

  return {
    members: (data || []) as unknown as LibraryMember[],
    total,
    page,
    limit,
    hasMore,
  };
};

// Fetch single member profile with checkout information
export const fetchMemberProfile = async (
  memberId: string,
  libraryId: string
): Promise<MemberWithCheckouts> => {
  const { data: member, error: memberError } = await supabase()
    .from("library_members")
    .select("*")
    .eq("id", memberId)
    .eq("library_id", libraryId)
    .eq("is_deleted", false)
    .single();

  if (memberError) {
    throw new Error(`Failed to fetch member profile: ${memberError.message}`);
  }

  // Fetch current checkouts
  const { data: checkouts, error: checkoutError } = await supabase()
    .from("borrowing_transactions")
    .select(
      `
      id,
      transaction_date,
      due_date,
      status,
      book_copies!inner (
        id,
        book_editions!inner (
          title,
          general_books!inner (
            id
          )
        )
      )
    `
    )
    .eq("member_id", memberId)
    .eq("status", "checked_out");

  if (checkoutError) {
    console.warn("Failed to fetch member checkouts:", checkoutError.message);
  }

  const current_checkouts =
    checkouts?.map(
      (checkout: {
        id: string;
        transaction_date: string | null;
        due_date: string | null;
        status: string;
        book_copies: {
          id: string;
          book_editions: {
            title: string;
            general_books: {
              id: string;
            };
          };
        };
      }) => ({
        id: checkout.id,
        book_title: checkout.book_copies.book_editions.title,
        book_id: checkout.book_copies.book_editions.general_books.id,
        checkout_date: checkout.transaction_date || "",
        due_date: checkout.due_date,
        status: checkout.status,
      })
    ) || [];

  return {
    ...(member as unknown as LibraryMember),
    current_checkouts: current_checkouts as CheckoutInfo[],
  } as MemberWithCheckouts;
};

// Update member information
export const updateMember = async (
  memberId: string,
  memberData: MemberUpdateData,
  libraryId: string
): Promise<LibraryMember> => {
  // Check for duplicate email if email is being updated
  if (memberData.email) {
    const emailExists = await checkDuplicateEmail(
      libraryId,
      memberData.email,
      memberId
    );
    if (emailExists) {
      throw new Error("A member with this email address already exists");
    }
  }

  // Build update object with only changed fields
  const updateData: Record<string, unknown> = {};

  // Update personal info if any personal fields are provided
  const personalFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address",
  ];
  const hasPersonalUpdates = personalFields.some(
    (field) => memberData[field as keyof MemberUpdateData] !== undefined
  );

  if (hasPersonalUpdates) {
    // First get current personal_info
    const { data: currentMember } = await supabase()
      .from("library_members")
      .select("personal_info")
      .eq("id", memberId)
      .eq("library_id", libraryId)
      .single();

    updateData.personal_info = {
      ...(currentMember?.personal_info as object),
      ...(memberData.first_name !== undefined && {
        first_name: memberData.first_name,
      }),
      ...(memberData.last_name !== undefined && {
        last_name: memberData.last_name,
      }),
      ...(memberData.email !== undefined && { email: memberData.email }),
      ...(memberData.phone !== undefined && { phone: memberData.phone }),
      ...(memberData.address !== undefined && { address: memberData.address }),
    } as Json;
  }

  // Update membership info if any membership fields are provided
  const membershipFields = ["membership_type", "membership_notes"];
  const hasMembershipUpdates = membershipFields.some(
    (field) => memberData[field as keyof MemberUpdateData] !== undefined
  );

  if (hasMembershipUpdates) {
    // First get current membership_info
    const { data: currentMember } = await supabase()
      .from("library_members")
      .select("membership_info")
      .eq("id", memberId)
      .eq("library_id", libraryId)
      .single();

    updateData.membership_info = {
      ...(currentMember?.membership_info as object),
      ...(memberData.membership_type !== undefined && {
        type: memberData.membership_type,
      }),
      ...(memberData.membership_notes !== undefined && {
        notes: memberData.membership_notes,
      }),
    } as Json;
  }

  const { data, error } = await supabase()
    .from("library_members")
    .update(updateData)
    .eq("id", memberId)
    .eq("library_id", libraryId)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  return data as unknown as LibraryMember;
};

// Update member status
export const updateMemberStatus = async (
  memberId: string,
  status: "active" | "inactive" | "banned",
  libraryId: string
): Promise<LibraryMember> => {
  const { data, error } = await supabase()
    .from("library_members")
    .update({ status })
    .eq("id", memberId)
    .eq("library_id", libraryId)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member status: ${error.message}`);
  }

  return data as unknown as LibraryMember;
};

// Soft delete member
export const deleteMember = async (
  memberId: string,
  libraryId: string,
  deletedBy: string
): Promise<void> => {
  const { error } = await supabase()
    .from("library_members")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("id", memberId)
    .eq("library_id", libraryId);

  if (error) {
    throw new Error(`Failed to delete member: ${error.message}`);
  }
};
