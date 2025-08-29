/**
 * Permission System for Library Management
 * Implements AC4: Permission System Integration
 *
 * This module defines role-based permissions and validation utilities
 * for library staff access control across all library operations.
 */

// Role definitions based on library management hierarchy
export type LibraryRole = "owner" | "manager" | "librarian";

// Permission categories for granular access control
export type PermissionCategory =
  | "books" // Book inventory management
  | "members" // Member registration and management
  | "circulation" // Checkout/return operations
  | "reports" // Analytics and reporting
  | "settings" // Library configuration
  | "staff" // Staff management
  | "system"; // System administration

// Specific permission actions within each category
export type Permission =
  // Books permissions
  | "books:view"
  | "books:add"
  | "books:edit"
  | "books:delete"
  | "books:bulk"
  // Members permissions
  | "members:view"
  | "members:add"
  | "members:edit"
  | "members:delete"
  | "members:bulk"
  // Circulation permissions
  | "circulation:checkout"
  | "circulation:return"
  | "circulation:renew"
  | "circulation:holds"
  // Reports permissions
  | "reports:view"
  | "reports:export"
  | "reports:advanced"
  // Settings permissions
  | "settings:view"
  | "settings:edit"
  | "settings:policies"
  // Staff permissions
  | "staff:view"
  | "staff:invite"
  | "staff:manage"
  | "staff:permissions"
  // System permissions
  | "system:admin"
  | "system:backup"
  | "system:audit";

/**
 * Role-based permission matrix
 * Defines what permissions each role has by default
 */
export const ROLE_PERMISSIONS: Record<LibraryRole, Permission[]> = {
  // Librarian: Basic operational permissions
  librarian: [
    "books:view",
    "books:add",
    "books:edit",
    "members:view",
    "members:add",
    "members:edit",
    "circulation:checkout",
    "circulation:return",
    "circulation:renew",
    "reports:view",
    "settings:view",
  ],

  // Manager: Operational + management permissions
  manager: [
    // All librarian permissions
    ...([
      "books:view",
      "books:add",
      "books:edit",
      "books:delete",
      "books:bulk",
      "members:view",
      "members:add",
      "members:edit",
      "members:delete",
      "members:bulk",
      "circulation:checkout",
      "circulation:return",
      "circulation:renew",
      "circulation:holds",
      "reports:view",
      "reports:export",
      "reports:advanced",
      "settings:view",
      "settings:edit",
      "settings:policies",
      "staff:view",
      "staff:invite",
    ] as Permission[]),
  ],

  // Owner: Full permissions including system administration
  owner: [
    // All manager permissions plus system admin
    ...([
      "books:view",
      "books:add",
      "books:edit",
      "books:delete",
      "books:bulk",
      "members:view",
      "members:add",
      "members:edit",
      "members:delete",
      "members:bulk",
      "circulation:checkout",
      "circulation:return",
      "circulation:renew",
      "circulation:holds",
      "reports:view",
      "reports:export",
      "reports:advanced",
      "settings:view",
      "settings:edit",
      "settings:policies",
      "staff:view",
      "staff:invite",
      "staff:manage",
      "staff:permissions",
      "system:admin",
      "system:backup",
      "system:audit",
    ] as Permission[]),
  ],
};

/**
 * User permission context from database
 */
export interface UserPermissions {
  userId: string;
  libraryId: string;
  role: LibraryRole;
  customPermissions?: Permission[]; // Additional granted permissions
  deniedPermissions?: Permission[]; // Explicitly denied permissions
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userPermissions: UserPermissions,
  permission: Permission
): boolean {
  // Check if permission is explicitly denied
  if (userPermissions.deniedPermissions?.includes(permission)) {
    return false;
  }

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userPermissions.role] || [];
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check custom granted permissions
  if (userPermissions.customPermissions?.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has any of the specified permissions (OR operation)
 */
export function hasAnyPermission(
  userPermissions: UserPermissions,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Check if a user has all of the specified permissions (AND operation)
 */
export function hasAllPermissions(
  userPermissions: UserPermissions,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Get all permissions for a user (role + custom - denied)
 */
export function getUserPermissions(
  userPermissions: UserPermissions
): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[userPermissions.role] || [];
  const customPermissions = userPermissions.customPermissions || [];
  const deniedPermissions = userPermissions.deniedPermissions || [];

  // Combine role and custom permissions, then remove denied ones
  const allPermissions = [
    ...new Set([...rolePermissions, ...customPermissions]),
  ];
  return allPermissions.filter(
    (permission) => !deniedPermissions.includes(permission)
  );
}

/**
 * Permission validation error types
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public permission: Permission,
    public userId: string,
    public libraryId: string
  ) {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Validate permission or throw error
 */
export function requirePermission(
  userPermissions: UserPermissions,
  permission: Permission,
  action?: string
): void {
  if (!hasPermission(userPermissions, permission)) {
    const actionText = action ? ` to ${action}` : "";
    throw new PermissionError(
      `User ${userPermissions.userId} does not have permission '${permission}'${actionText} in library ${userPermissions.libraryId}`,
      permission,
      userPermissions.userId,
      userPermissions.libraryId
    );
  }
}

/**
 * Permission categories for UI organization
 */
export const PERMISSION_CATEGORIES: Record<
  PermissionCategory,
  {
    label: string;
    description: string;
    permissions: Permission[];
  }
> = {
  books: {
    label: "Book Management",
    description: "Manage book inventory, cataloging, and metadata",
    permissions: [
      "books:view",
      "books:add",
      "books:edit",
      "books:delete",
      "books:bulk",
    ],
  },
  members: {
    label: "Member Management",
    description: "Manage library member registration and profiles",
    permissions: [
      "members:view",
      "members:add",
      "members:edit",
      "members:delete",
      "members:bulk",
    ],
  },
  circulation: {
    label: "Circulation Operations",
    description: "Handle checkouts, returns, renewals, and holds",
    permissions: [
      "circulation:checkout",
      "circulation:return",
      "circulation:renew",
      "circulation:holds",
    ],
  },
  reports: {
    label: "Reports & Analytics",
    description: "Access usage reports and library analytics",
    permissions: ["reports:view", "reports:export", "reports:advanced"],
  },
  settings: {
    label: "Library Settings",
    description: "Configure library policies and preferences",
    permissions: ["settings:view", "settings:edit", "settings:policies"],
  },
  staff: {
    label: "Staff Management",
    description: "Manage library staff and their permissions",
    permissions: [
      "staff:view",
      "staff:invite",
      "staff:manage",
      "staff:permissions",
    ],
  },
  system: {
    label: "System Administration",
    description: "System-level administration and maintenance",
    permissions: ["system:admin", "system:backup", "system:audit"],
  },
};

/**
 * Get readable permission description
 */
export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    // Books
    "books:view": "View book inventory and details",
    "books:add": "Add new books to inventory",
    "books:edit": "Edit book information and metadata",
    "books:delete": "Delete books from inventory",
    "books:bulk": "Perform bulk book operations",

    // Members
    "members:view": "View member profiles and information",
    "members:add": "Register new library members",
    "members:edit": "Edit member profiles and details",
    "members:delete": "Delete member accounts",
    "members:bulk": "Perform bulk member operations",

    // Circulation
    "circulation:checkout": "Check out books to members",
    "circulation:return": "Process book returns",
    "circulation:renew": "Renew book loans",
    "circulation:holds": "Manage book holds and reservations",

    // Reports
    "reports:view": "View basic library reports",
    "reports:export": "Export reports and data",
    "reports:advanced": "Access advanced analytics and insights",

    // Settings
    "settings:view": "View library settings and policies",
    "settings:edit": "Edit library configuration",
    "settings:policies": "Manage loan policies and rules",

    // Staff
    "staff:view": "View staff list and basic information",
    "staff:invite": "Invite new staff members",
    "staff:manage": "Manage staff roles and status",
    "staff:permissions": "Manage staff permissions",

    // System
    "system:admin": "Full system administration access",
    "system:backup": "Access backup and restore functions",
    "system:audit": "View system audit logs and security reports",
  };

  return descriptions[permission] || `Permission: ${permission}`;
}
