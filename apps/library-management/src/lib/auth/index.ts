/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Module Index
 * Complete authentication system for Library Management System
 *
 * Exports all authentication utilities, hooks, types, and components
 * for use throughout the application.
 */

// Types and interfaces
export type {
  LibraryRole,
  Permission,
  PermissionCategory,
  UserPermissions,
} from "./permissions";

export type { AuthState, LibraryAccess } from "./hooks";

export type {
  UserSessionPreferences,
  LibrarySessionContext,
  SessionData,
} from "./session";

export type {
  AuthContextState,
  AuthContextActions,
  AuthContext,
} from "./context";

export type { LibraryStaffData } from "./server";

// Import functions needed for authHelpers
import {
  hasAnyPermission,
  type UserPermissions,
  type Permission,
} from "./permissions";

// Core permission system
export {
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  requirePermission,
  getPermissionDescription,
  PermissionError,
} from "./permissions";

// Client-side hooks
export {
  useAuth,
  useLibraryAccess,
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useUserPermissions,
  usePermissionGate,
  authUtils,
} from "./hooks";

// Session management
export {
  SessionManager,
  getSessionManager,
  useSessionManager,
  initializeSessionManagement,
} from "./session";

// Authentication context
export {
  AuthProvider,
  useAuthContext,
  withAuth,
  withLibraryAccess,
} from "./context";

// Server-side utilities
export {
  createAuthenticatedClient,
  getAuthenticatedUser,
  getUserPermissionsForLibrary,
  requireLibraryAccess,
  withAuth as withAuthMiddleware,
  withPermission,
  withLibraryScope,
  validateLibraryContext,
  getUserLibraries,
  canAccessLibrary,
} from "./server";

/**
 * Authentication system configuration
 */
export const AUTH_CONFIG = {
  // Session timeout (30 minutes)
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,

  // Local storage keys
  STORAGE_KEYS: {
    CURRENT_LIBRARY: "ezlib:library-management:current-library",
    USER_PREFERENCES: "ezlib:library-management:user-preferences",
    LAST_ACTIVITY: "ezlib:library-management:last-activity",
    SESSION_ID: "ezlib:library-management:session-id",
  },

  // Authentication routes
  ROUTES: {
    LOGIN: "/auth/login",
    CALLBACK: "/auth/callback",
    LOGOUT: "/api/auth/logout",
    UNAUTHORIZED: "/unauthorized",
  },

  // Permission levels (for UI organization)
  PERMISSION_LEVELS: {
    READ: ["view"],
    WRITE: ["add", "edit"],
    DELETE: ["delete"],
    ADMIN: ["manage", "admin", "permissions"],
  },
} as const;

/**
 * Authentication utilities for common operations
 */
export const authHelpers = {
  /**
   * Check if user has any read permission for a category
   */
  canRead: (permissions: UserPermissions, category: string): boolean => {
    const readPermissions = [`${category}:view` as Permission];
    return hasAnyPermission(permissions, readPermissions);
  },

  /**
   * Check if user has any write permission for a category
   */
  canWrite: (permissions: UserPermissions, category: string): boolean => {
    const writePermissions = [
      `${category}:add` as Permission,
      `${category}:edit` as Permission,
    ];
    return hasAnyPermission(permissions, writePermissions);
  },

  /**
   * Check if user has delete permission for a category
   */
  canDelete: (permissions: UserPermissions, category: string): boolean => {
    return hasPermission(permissions, `${category}:delete` as Permission);
  },

  /**
   * Check if user has admin-level permissions
   */
  isAdmin: (permissions: UserPermissions): boolean => {
    const adminPermissions: Permission[] = [
      "system:admin",
      "staff:permissions",
      "settings:policies",
    ];
    return hasAnyPermission(permissions, adminPermissions);
  },

  /**
   * Get user's permission level for a category
   */
  getPermissionLevel: (
    permissions: UserPermissions,
    category: string
  ): "none" | "read" | "write" | "delete" | "admin" => {
    if (authHelpers.isAdmin(permissions)) return "admin";
    if (authHelpers.canDelete(permissions, category)) return "delete";
    if (authHelpers.canWrite(permissions, category)) return "write";
    if (authHelpers.canRead(permissions, category)) return "read";
    return "none";
  },

  /**
   * Format user display name
   */
  formatDisplayName: (
    user: { email?: string; user_metadata?: any } | null
  ): string => {
    if (!user) return "Guest";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  },

  /**
   * Check if session is approaching expiration (within 5 minutes)
   */
  isSessionExpiringSoon: (sessionData: SessionData): boolean => {
    if (!sessionData.expiresAt) return false;
    const expirationTime = new Date(sessionData.expiresAt).getTime();
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return expirationTime - currentTime < fiveMinutes;
  },
} as const;
