/**
 * Client-side Authentication Hooks
 * Simplified authentication state management
 */

"use client";

import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// Simplified types without complex permission system
type LibraryRole = "owner" | "manager" | "librarian";

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
    const client = supabase();

    // Get initial session
    client.auth.getSession().then(({ data: { session }, error }) => {
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
    } = client.auth.onAuthStateChange(async (event, session) => {
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
 * Hook for library access (simplified)
 */
export function useLibraryAccess(libraryId: string): LibraryAccess {
  const { user } = useAuth();
  const [access, setAccess] = useState<LibraryAccess>({
    libraryId,
    role: "librarian",
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

    // Temporary placeholder for development
    const placeholderAccess: LibraryAccess = {
      libraryId,
      role: "owner", // Grant full access during development
      loading: false,
      error: null,
    };

    setAccess(placeholderAccess);
  }, [user, libraryId]);

  return access;
}

/**
 * Authentication utilities
 */
export const authUtils = {
  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase().auth.signOut();

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
    const { error } = await supabase().auth.signInWithOtp({
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