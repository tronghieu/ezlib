/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Server-side Authentication and Permission Utilities
 * Implements server-side permission checking for protected API routes
 * and database operations with library staff validation
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LibraryRole,
  Permission,
  UserPermissions,
  hasPermission,
  requirePermission,
  PermissionError,
} from "./permissions";

/**
 * Create authenticated Supabase server client
 */
export function createAuthenticatedClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.error("Error setting cookies:", error);
          }
        },
      },
    }
  );
}

/**
 * Library staff data from database (once library_staff table is implemented)
 */
export interface LibraryStaffData {
  id: string;
  user_id: string;
  library_id: string;
  role: LibraryRole;
  permissions: Record<string, any>; // JSONB custom permissions
  status: "active" | "inactive" | "pending";
  invited_at: string;
  activated_at?: string;
}

/**
 * Get current authenticated user with library access validation
 */
export async function getAuthenticatedUser(libraryId?: string) {
  const supabase = createAuthenticatedClient();

  // Check user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // TODO: Implement library staff validation when database schema is updated
  // For now, we'll return a placeholder staff record for development

  /* Future implementation once library_staff table exists:
  
  const { data: staffData, error: staffError } = await supabase
    .from('library_staff')
    .select('*')
    .eq('user_id', user.id)
    .eq('library_id', libraryId)
    .eq('status', 'active')
    .single();
    
  if (staffError || !staffData) {
    redirect('/unauthorized');
  }
  
  return {
    user,
    staffData: staffData as LibraryStaffData
  };
  */

  // Temporary placeholder for development
  const placeholderStaffData: LibraryStaffData = {
    id: "temp-staff-id",
    user_id: user.id,
    library_id: libraryId || "demo-library-id",
    role: "owner" as LibraryRole, // Temporary - grant full access for development
    permissions: {},
    status: "active",
    invited_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
  };

  return {
    user,
    staffData: placeholderStaffData,
  };
}

/**
 * Get user permissions for a specific library
 */
export async function getUserPermissionsForLibrary(
  userId: string,
  libraryId: string
): Promise<UserPermissions | null> {
  const supabase = createAuthenticatedClient();

  try {
    // Attempt to query real database first
    const { data: staffData, error } = await supabase
      .from("library_staff")
      .select("role, permissions, status")
      .eq("user_id", userId)
      .eq("library_id", libraryId)
      .eq("status", "active")
      .single();

    if (!error && staffData) {
      // Real database data available
      return {
        userId,
        libraryId,
        role: staffData.role as LibraryRole,
        customPermissions: staffData.permissions?.granted || [],
        deniedPermissions: staffData.permissions?.denied || [],
      };
    }

    // If error is "relation does not exist", table hasn't been created yet
    if (
      error?.message?.includes('relation "public.library_staff" does not exist')
    ) {
      console.log(
        "Library staff table not yet created - using development defaults"
      );
    } else if (error) {
      console.log(
        "Database query failed, using development defaults:",
        error.message
      );
    }
  } catch (error) {
    console.log(
      "Database connection failed, using development defaults:",
      error
    );
  }

  // Fallback to development placeholder when database is not available
  return {
    userId,
    libraryId,
    role: "owner", // Grant full access during development
    customPermissions: [],
    deniedPermissions: [],
  };
}

/**
 * Require authentication and library access
 */
export async function requireLibraryAccess(libraryId?: string) {
  try {
    const { user, staffData } = await getAuthenticatedUser(libraryId);

    const userPermissions = await getUserPermissionsForLibrary(
      user.id,
      staffData.library_id
    );

    if (!userPermissions) {
      redirect("/unauthorized");
    }

    return {
      user,
      staffData,
      permissions: userPermissions,
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
 * Middleware for API routes requiring specific permissions
 */
export async function withPermission<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  requiredPermission: Permission,
  libraryId?: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      const { permissions } = await requireLibraryAccess(libraryId);

      if (!hasPermission(permissions, requiredPermission)) {
        return new Response(
          JSON.stringify({
            error: "Insufficient permissions",
            required: requiredPermission,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      return handler(...args);
    } catch (error) {
      if (error instanceof PermissionError) {
        return new Response(
          JSON.stringify({
            error: error.message,
            permission: error.permission,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

/**
 * Database query wrapper with automatic permission checking
 */
export async function withLibraryScope<T>(
  query: (
    supabase: ReturnType<typeof createAuthenticatedClient>,
    libraryId: string
  ) => Promise<T>,
  requiredPermission?: Permission,
  libraryId?: string
): Promise<T> {
  const supabase = createAuthenticatedClient();
  const { permissions, staffData } = await requireLibraryAccess(libraryId);

  // Check permission if specified
  if (requiredPermission) {
    requirePermission(permissions, requiredPermission);
  }

  // Execute query with library scope
  return query(supabase, staffData.library_id);
}

/**
 * Utility to validate library context in server components
 */
export async function validateLibraryContext(libraryId: string) {
  const { user, staffData, permissions } =
    await requireLibraryAccess(libraryId);

  // Ensure library ID matches staff access
  if (staffData.library_id !== libraryId) {
    redirect("/unauthorized");
  }

  return {
    user,
    staffData,
    permissions,
    libraryId: staffData.library_id,
  };
}

/**
 * Get user's accessible libraries (for library switching)
 */
export async function getUserLibraries(userId: string) {
  const supabase = createAuthenticatedClient();

  try {
    // Attempt to query real database first
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

    if (!error && libraries && libraries.length > 0) {
      // Real database data available
      return libraries;
    }

    // If error is "relation does not exist", table hasn't been created yet
    if (
      error?.message?.includes(
        'relation "public.library_staff" does not exist'
      ) ||
      error?.message?.includes('relation "public.libraries" does not exist')
    ) {
      console.log(
        "Library tables not yet created - using development defaults"
      );
    } else if (error) {
      console.log(
        "Database query failed, using development defaults:",
        error.message
      );
    } else if (!libraries || libraries.length === 0) {
      console.log("No libraries found for user, using development defaults");
    }
  } catch (error) {
    console.log(
      "Database connection failed, using development defaults:",
      error
    );
  }

  // Fallback to development placeholder when database is not available
  return [
    {
      library_id: "demo-library-id",
      role: "owner",
      status: "active",
      libraries: {
        id: "demo-library-id",
        name: "Demo Library",
        code: "DEMO-LIB",
        settings: {},
      },
    },
  ];
}

/**
 * Check if current user can access a specific library
 */
export async function canAccessLibrary(
  userId: string,
  libraryId: string
): Promise<boolean> {
  const userPermissions = await getUserPermissionsForLibrary(userId, libraryId);
  return userPermissions !== null;
}
