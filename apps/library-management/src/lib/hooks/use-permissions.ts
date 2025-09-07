"use client";

import { useLibraryContext } from "@/lib/contexts/library-context";

export type StaffRole = "owner" | "manager" | "librarian" | "volunteer";
export type Permission = "read" | "create" | "update" | "delete" | "manage";

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<StaffRole, number> = {
  volunteer: 1,
  librarian: 2,
  manager: 3,
  owner: 4,
};

/**
 * Permission matrix for different features
 */
const PERMISSIONS: Record<string, Record<StaffRole, Permission[]>> = {
  books: {
    volunteer: ["read"],
    librarian: ["read", "create", "update"],
    manager: ["read", "create", "update", "delete", "manage"],
    owner: ["read", "create", "update", "delete", "manage"],
  },
  book_copies: {
    volunteer: ["read"],
    librarian: ["read", "create", "update"],
    manager: ["read", "create", "update", "delete", "manage"],
    owner: ["read", "create", "update", "delete", "manage"],
  },
  members: {
    volunteer: ["read"],
    librarian: ["read", "create", "update"],
    manager: ["read", "create", "update", "delete", "manage"],
    owner: ["read", "create", "update", "delete", "manage"],
  },
  circulation: {
    volunteer: ["read"],
    librarian: ["read", "create", "update"],
    manager: ["read", "create", "update", "delete", "manage"],
    owner: ["read", "create", "update", "delete", "manage"],
  },
  library_settings: {
    volunteer: [],
    librarian: ["read"],
    manager: ["read", "update"],
    owner: ["read", "create", "update", "delete", "manage"],
  },
  staff_management: {
    volunteer: [],
    librarian: [],
    manager: ["read", "create", "update"],
    owner: ["read", "create", "update", "delete", "manage"],
  },
};

/**
 * Hook for checking user permissions in the current library
 */
export function usePermissions() {
  const { currentStaff, currentLibrary } = useLibraryContext();

  /**
   * Check if user has a specific permission for a feature
   */
  const hasPermission = (feature: string, permission: Permission): boolean => {
    if (!currentStaff || !currentLibrary) {
      return false;
    }

    const userRole = currentStaff.role as StaffRole;
    const featurePermissions = PERMISSIONS[feature];

    if (!featurePermissions || !featurePermissions[userRole]) {
      return false;
    }

    return featurePermissions[userRole].includes(permission);
  };

  /**
   * Check if user has minimum role level
   */
  const hasMinimumRole = (minRole: StaffRole): boolean => {
    if (!currentStaff) {
      return false;
    }

    const userRole = currentStaff.role as StaffRole;
    const userLevel = ROLE_HIERARCHY[userRole];
    const minLevel = ROLE_HIERARCHY[minRole];

    return userLevel >= minLevel;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: StaffRole[]): boolean => {
    if (!currentStaff) {
      return false;
    }

    const userRole = currentStaff.role as StaffRole;
    return roles.includes(userRole);
  };

  /**
   * Get all permissions for current user
   */
  const getAllPermissions = (): Record<string, Permission[]> => {
    if (!currentStaff) {
      return {};
    }

    const userRole = currentStaff.role as StaffRole;
    const permissions: Record<string, Permission[]> = {};

    Object.entries(PERMISSIONS).forEach(([feature, rolePermissions]) => {
      permissions[feature] = rolePermissions[userRole] || [];
    });

    return permissions;
  };

  // Book-specific permissions
  const canReadBooks = hasPermission("books", "read");
  const canCreateBooks = hasPermission("books", "create");
  const canEditBooks = hasPermission("books", "update");
  const canDeleteBooks = hasPermission("books", "delete");
  const canManageBooks = hasPermission("books", "manage");

  // Book copy-specific permissions
  const canReadBookCopies = hasPermission("book_copies", "read");
  const canCreateBookCopies = hasPermission("book_copies", "create");
  const canEditBookCopies = hasPermission("book_copies", "update");
  const canDeleteBookCopies = hasPermission("book_copies", "delete");
  const canManageBookCopies = hasPermission("book_copies", "manage");

  // Member-specific permissions
  const canReadMembers = hasPermission("members", "read");
  const canCreateMembers = hasPermission("members", "create");
  const canEditMembers = hasPermission("members", "update");
  const canDeleteMembers = hasPermission("members", "delete");
  const canManageMembers = hasPermission("members", "manage");

  // Circulation-specific permissions
  const canReadCirculation = hasPermission("circulation", "read");
  const canCreateCirculation = hasPermission("circulation", "create");
  const canEditCirculation = hasPermission("circulation", "update");
  const canDeleteCirculation = hasPermission("circulation", "delete");
  const canManageCirculation = hasPermission("circulation", "manage");

  // Library settings permissions
  const canReadLibrarySettings = hasPermission("library_settings", "read");
  const canEditLibrarySettings = hasPermission("library_settings", "update");
  const canManageLibrarySettings = hasPermission("library_settings", "manage");

  // Staff management permissions
  const canReadStaff = hasPermission("staff_management", "read");
  const canCreateStaff = hasPermission("staff_management", "create");
  const canEditStaff = hasPermission("staff_management", "update");
  const canDeleteStaff = hasPermission("staff_management", "delete");
  const canManageStaff = hasPermission("staff_management", "manage");

  // Role-based shortcuts
  const isOwner = currentStaff?.role === "owner";
  const isManager = currentStaff?.role === "manager";
  const isLibrarian = currentStaff?.role === "librarian";
  const isVolunteer = currentStaff?.role === "volunteer";

  // Combined permission checks
  const isLibrarianOrHigher = hasMinimumRole("librarian");
  const isManagerOrHigher = hasMinimumRole("manager");
  const canMakeStructuralChanges = hasAnyRole(["owner", "manager"]);

  return {
    // Core permission functions
    hasPermission,
    hasMinimumRole,
    hasAnyRole,
    getAllPermissions,

    // Book permissions
    canReadBooks,
    canCreateBooks,
    canEditBooks,
    canDeleteBooks,
    canManageBooks,

    // Book copy permissions
    canReadBookCopies,
    canCreateBookCopies,
    canEditBookCopies,
    canDeleteBookCopies,
    canManageBookCopies,

    // Member permissions
    canReadMembers,
    canCreateMembers,
    canEditMembers,
    canDeleteMembers,
    canManageMembers,

    // Circulation permissions
    canReadCirculation,
    canCreateCirculation,
    canEditCirculation,
    canDeleteCirculation,
    canManageCirculation,

    // Library settings permissions
    canReadLibrarySettings,
    canEditLibrarySettings,
    canManageLibrarySettings,

    // Staff management permissions
    canReadStaff,
    canCreateStaff,
    canEditStaff,
    canDeleteStaff,
    canManageStaff,

    // Role shortcuts
    isOwner,
    isManager,
    isLibrarian,
    isVolunteer,
    isLibrarianOrHigher,
    isManagerOrHigher,
    canMakeStructuralChanges,

    // User info
    currentRole: currentStaff?.role as StaffRole | undefined,
    currentStaff,
    currentLibrary,
  };
}