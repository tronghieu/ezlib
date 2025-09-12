"use server";

/**
 * Server Actions for Library Data Fetching
 * Enables server-side library fetching with streaming to client components
 */

import { createClient } from "@/lib/supabase/server";
import type { LibraryWithAccess } from "@/types";

/**
 * Fetch user's accessible libraries on the server
 * Used for streaming data to client components via promises
 */
export async function getUserLibraries(): Promise<LibraryWithAccess[]> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Return empty array when user is not authenticated instead of throwing
    return [];
  }

  // Fetch user's libraries with access info
  const { data, error } = await supabase
    .from("library_staff")
    .select(
      `
      id,
      role,
      status,
      libraries (
        id,
        name,
        code,
        address,
        contact_info,
        settings,
        stats,
        status,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch libraries: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Transform data to LibraryWithAccess format
  return data
    .filter((item) => item.libraries && item.libraries.status === "active")
    .map((item) => ({
      ...item.libraries!,
      user_role: item.role,
      staff_id: item.id,
      staff_status: item.status,
    }));
}

/**
 * Validate user access to a specific library
 * Server-side validation for library switching
 */
export async function validateLibraryAccess(
  libraryId: string
): Promise<{
  hasAccess: boolean;
  role?: string;
  staffId?: string;
  error?: string;
}> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      hasAccess: false,
      error: "User not authenticated",
    };
  }

  try {
    const { data, error } = await supabase
      .from("library_staff")
      .select(
        `
        id,
        role,
        status,
        libraries (
          id,
          name,
          code,
          address,
          contact_info,
          settings,
          stats,
          status,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .eq("library_id", libraryId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return {
        hasAccess: false,
        error: error?.message || "No access to this library",
      };
    }

    return {
      hasAccess: true,
      role: data.role,
      staffId: data.id,
    };
  } catch (error) {
    return {
      hasAccess: false,
      error:
        error instanceof Error ? error.message : "Access validation failed",
    };
  }
}