/**
 * Client-side Authentication and Permission Hooks
 * Provides React hooks for managing authentication state and permission-based UI
 */

"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session } from "@supabase/supabase-js";
import {
  LibraryRole,
  Permission,
  UserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
} from "./permissions";

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

/**
 * Library access context
 */
export interface LibraryAccess {
  libraryId: string;
  role: LibraryRole;
  permissions: UserPermissions;
  loading: boolean;
  error: string | null;
}

/**
 * Main authentication hook
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState((prev) => ({ ...prev, error: error.message, loading: false }));
      } else {
        setState((prev) => ({
          ...prev,
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user || null,
        session,
        loading: false,
        error: null,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Hook for library access and permissions
 */
export function useLibraryAccess(libraryId: string): LibraryAccess {
  const { user } = useAuth();
  const [access, setAccess] = useState<LibraryAccess>({
    libraryId,
    role: "librarian",
    permissions: {
      userId: "",
      libraryId,
      role: "librarian",
      customPermissions: [],
      deniedPermissions: [],
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setAccess((prev) => ({
        ...prev,
        loading: false,
        error: "Not authenticated",
      }));
      return;
    }

    // TODO: Implement actual library access fetching when API endpoints exist

    /* Future implementation:
    
    const fetchLibraryAccess = async () => {
      try {
        const response = await fetch(`/api/libraries/${libraryId}/access`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch library access');
        }
        
        const data = await response.json();
        
        setAccess({
          libraryId,
          role: data.role,
          permissions: {
            userId: user.id,
            libraryId,
            role: data.role,
            customPermissions: data.customPermissions || [],
            deniedPermissions: data.deniedPermissions || []
          },
          loading: false,
          error: null
        });
      } catch (error) {
        setAccess(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };
    
    fetchLibraryAccess();
    */

    // Temporary placeholder for development
    const placeholderAccess: LibraryAccess = {
      libraryId,
      role: "owner", // Grant full access during development
      permissions: {
        userId: user.id,
        libraryId,
        role: "owner",
        customPermissions: [],
        deniedPermissions: [],
      },
      loading: false,
      error: null,
    };

    setAccess(placeholderAccess);
  }, [user, libraryId]);

  return access;
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(
  permission: Permission,
  libraryId: string
): {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const { permissions, loading, error } = useLibraryAccess(libraryId);

  return {
    hasPermission: loading ? false : hasPermission(permissions, permission),
    loading,
    error,
  };
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(
  permissions: Permission[],
  libraryId: string
): {
  hasAnyPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const {
    permissions: userPermissions,
    loading,
    error,
  } = useLibraryAccess(libraryId);

  return {
    hasAnyPermission: loading
      ? false
      : hasAnyPermission(userPermissions, permissions),
    loading,
    error,
  };
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useAllPermissions(
  permissions: Permission[],
  libraryId: string
): {
  hasAllPermissions: boolean;
  loading: boolean;
  error: string | null;
} {
  const {
    permissions: userPermissions,
    loading,
    error,
  } = useLibraryAccess(libraryId);

  return {
    hasAllPermissions: loading
      ? false
      : hasAllPermissions(userPermissions, permissions),
    loading,
    error,
  };
}

/**
 * Hook to get all user permissions
 */
export function useUserPermissions(libraryId: string): {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
} {
  const {
    permissions: userPermissions,
    loading,
    error,
  } = useLibraryAccess(libraryId);

  return {
    permissions: loading ? [] : getUserPermissions(userPermissions),
    loading,
    error,
  };
}

/**
 * Hook for permission-based conditional rendering
 */
export function usePermissionGate(
  permission: Permission,
  libraryId: string
): {
  canRender: boolean;
  loading: boolean;
} {
  const { hasPermission, loading } = usePermission(permission, libraryId);

  return {
    canRender: hasPermission,
    loading,
  };
}

/**
 * Authentication utilities
 */
export const authUtils = {
  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { error } = await supabase.auth.signOut();

    if (!error) {
      // Redirect to login page after successful logout
      window.location.href = "/auth/login";
    }

    return { error };
  },

  /**
   * Send magic link to email
   */
  async sendMagicLink(
    email: string,
    redirectTo?: string
  ): Promise<{ error: Error | null }> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          redirectTo || `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(user: User | null): boolean {
    return user !== null;
  },

  /**
   * Get user's display name
   */
  getUserDisplayName(user: User | null): string {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email || "User";
  },

  /**
   * Get user's avatar URL
   */
  getUserAvatarUrl(user: User | null): string | null {
    if (!user) return null;
    return user.user_metadata?.avatar_url || null;
  },
};
