/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Server-side Authentication and Role Utilities
 * Implements server-side role checking for protected API routes
 * and database operations with library staff validation
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.d";

/**
 * Library staff roles in hierarchy order (most to least privileged)
 */
export type LibraryRole = "owner" | "manager" | "librarian" | "volunteer";

/**
 * Library staff data from database (using actual schema)
 */
export type LibraryStaffData = Database["public"]["Tables"]["library_staff"]["Row"];

/**
 * Get current authenticated user with library access validation
 */
export async function getAuthenticatedUser(libraryId?: string) {
  const supabase = await createClient();

  // Check user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Real library staff validation - no more placeholders!
  if (libraryId) {
    const { data: staffData, error: staffError } = await supabase
      .from('library_staff')
      .select('*')
      .eq('user_id', user.id)
      .eq('library_id', libraryId)
      .eq('status', 'active')
      .single();
      
    if (staffError) {
      console.error('Library staff validation failed:', staffError.message);
      redirect('/auth/login?error=no-library-access');
    }
    
    if (!staffData) {
      console.error(`User ${user.email} has no access to library ${libraryId}`);
      redirect('/auth/login?error=no-library-access');
    }
    
    return {
      user,
      staffData: staffData
    };
  }

  // If no specific library requested, return basic user info
  return {
    user,
    staffData: null
  };
}

/**
 * Get user role for a specific library
 */
export async function getUserRoleForLibrary(
  userId: string,
  libraryId: string
): Promise<LibraryRole | null> {
  const supabase = await createClient();

  // Query real database - no more development fallbacks!
  const { data: staffData, error } = await supabase
    .from("library_staff")
    .select("role, status")
    .eq("user_id", userId)
    .eq("library_id", libraryId)
    .eq("status", "active")
    .single();

  if (error) {
    console.error(`Failed to get user role for library ${libraryId}:`, error.message);
    return null;
  }

  if (!staffData) {
    console.error(`No active staff record found for user ${userId} in library ${libraryId}`);
    return null;
  }

  return staffData.role as LibraryRole;
}

/**
 * Require authentication and library access
 */
export async function requireLibraryAccess(libraryId?: string) {
  try {
    const { user, staffData } = await getAuthenticatedUser(libraryId);

    if (!libraryId || !staffData) {
      redirect("/auth/login");
    }

    const userRole = await getUserRoleForLibrary(
      user.id,
      libraryId
    );

    if (!userRole) {
      redirect("/unauthorized");
    }

    return {
      user,
      staffData,
      role: userRole,
    };
  } catch (error) {
    console.error("Library access validation failed:", error);
    redirect("/auth/login");
  }
}

/**
 * Middleware for API routes requiring authentication
 */
export async function withAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  libraryId?: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireLibraryAccess(libraryId);
      return handler(...args);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

/**
 * Middleware for API routes requiring specific roles
 */
export async function withRole<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  requiredRoles: LibraryRole[],
  libraryId?: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      const { role } = await requireLibraryAccess(libraryId);

      if (!requiredRoles.includes(role)) {
        return new Response(
          JSON.stringify({
            error: "Insufficient role access",
            required: `Role must be one of: ${requiredRoles.join(", ")}`,
            current: role,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      return handler(...args);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

/**
 * Database query wrapper with automatic role checking
 */
export async function withLibraryScope<T>(
  query: (
    supabase: Awaited<ReturnType<typeof createClient>>,
    libraryId: string
  ) => Promise<T>,
  requiredRoles?: LibraryRole[],
  libraryId?: string
): Promise<T> {
  const supabase = await createClient();
  const { role, staffData } = await requireLibraryAccess(libraryId);

  if (!staffData) {
    throw new Error("Library staff data not found");
  }

  // Check role if specified
  if (requiredRoles && !requiredRoles.includes(role)) {
    throw new Error(
      `Insufficient role access. Required: ${requiredRoles.join(", ")}, Current: ${role}`
    );
  }

  // Execute query with library scope
  return query(supabase, staffData.library_id);
}

/**
 * Utility to validate library context in server components
 */
export async function validateLibraryContext(libraryId: string) {
  const { user, staffData, role } = await requireLibraryAccess(libraryId);

  if (!staffData) {
    redirect("/unauthorized");
  }

  // Ensure library ID matches staff access
  if (staffData.library_id !== libraryId) {
    redirect("/unauthorized");
  }

  return {
    user,
    staffData,
    role,
    libraryId: staffData.library_id,
  };
}

/**
 * Get user's accessible libraries (for library switching)
 */
export async function getUserLibraries(userId: string) {
  const supabase = await createClient();

  // Query real database - no more development fallbacks!
  const { data: libraries, error } = await supabase
    .from("library_staff")
    .select(
      `
      library_id,
      role,
      status,
      libraries (
        id,
        name,
        code,
        settings
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error(`Failed to get libraries for user ${userId}:`, error.message);
    return [];
  }

  if (!libraries || libraries.length === 0) {
    console.warn(`No active library access found for user ${userId}`);
    return [];
  }

  return libraries;
}

/**
 * Check if current user can access a specific library
 */
export async function canAccessLibrary(
  userId: string,
  libraryId: string
): Promise<boolean> {
  const userRole = await getUserRoleForLibrary(userId, libraryId);
  return userRole !== null;
}
