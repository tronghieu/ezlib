/**
 * Server-Side Library Actions
 * Server components and server actions only
 */

import { createClient } from "@/lib/supabase/server";
import type { LibraryWithAccess } from "@/types";

/**
 * Fetch user's accessible libraries
 * Server-side only
 */
export async function getUserLibraries(): Promise<LibraryWithAccess[]> {
  // Use server client for server-side calls
  const supabaseClient = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    // Return empty array when user is not authenticated instead of throwing
    return [];
  }

  // Fetch user's libraries with access info
  const { data, error } = await supabaseClient
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
 * Validate user access to a specific library (server-side only)
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
  const supabaseClient = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return {
      hasAccess: false,
      error: "User not authenticated",
    };
  }

  try {
    const { data, error } = await supabaseClient
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

/**
 * Validate user access to a library by code (server-side only)
 * Used in server components for authentication checks
 */
export async function validateLibraryAccessByCode(
  libraryCode: string
): Promise<{
  hasAccess: boolean;
  library?: LibraryWithAccess;
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
    // First get the library by code
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('id, name, code, address, contact_info, settings, stats, status, created_at, updated_at')
      .eq('code', libraryCode)
      .eq('status', 'active')
      .single();

    if (libraryError || !library) {
      return {
        hasAccess: false,
        error: libraryError?.message || "Library not found or inactive",
      };
    }

    // Check if user has staff access to this library
    const { data: staffData, error: staffError } = await supabase
      .from('library_staff')
      .select('id, role, status')
      .eq('user_id', user.id)
      .eq('library_id', library.id)
      .eq('status', 'active')
      .single();

    if (staffError || !staffData) {
      return {
        hasAccess: false,
        error: staffError?.message || "No access to this library",
      };
    }

    // Return the library with user role
    const libraryWithAccess: LibraryWithAccess = {
      ...library,
      user_role: staffData.role,
      staff_id: staffData.id,
      staff_status: staffData.status,
    };

    return {
      hasAccess: true,
      library: libraryWithAccess,
      role: staffData.role,
      staffId: staffData.id,
    };
  } catch (error) {
    return {
      hasAccess: false,
      error:
        error instanceof Error ? error.message : "Access validation failed",
    };
  }
}