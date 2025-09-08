/**
 * Authentication Module Index
 * Simplified authentication system for Library Management System
 *
 * Exports only available authentication utilities and types.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Export types from existing modules
export type { AuthState, LibraryAccess } from "./hooks";
export type { LibraryStaffData } from "./server";

// Client-side hooks
export { useAuth, useLibraryAccess, authUtils } from "./hooks";

// Server-side utilities
export {
  createAuthenticatedClient,
  getAuthenticatedUser,
  requireLibraryAccess,
  withAuth as withAuthMiddleware,
  withLibraryScope,
  validateLibraryContext,
  getUserLibraries,
  canAccessLibrary,
} from "./server";

/**
 * Authentication system configuration
 */
export const AUTH_CONFIG = {
  // Authentication routes
  ROUTES: {
    LOGIN: "/auth/login",
    CALLBACK: "/auth/callback",
    LOGOUT: "/api/auth/logout",
    UNAUTHORIZED: "/unauthorized",
  },
} as const;

/**
 * Authentication utilities for common operations
 */
export const authHelpers = {
  /**
   * Format user display name
   */
  formatDisplayName: (
    user: { email?: string; user_metadata?: any } | null
  ): string => {
    if (!user) return "Guest";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  },
} as const;
