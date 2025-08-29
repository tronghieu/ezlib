/**
 * @jest-environment node
 */

import {
  LibraryRole,
  Permission,
  UserPermissions,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  requirePermission,
  PermissionError,
  getPermissionDescription,
  PERMISSION_CATEGORIES,
} from "../permissions";

describe("Permission System Tests", () => {
  // Test data
  const testLibraryId = "test-library-123";
  const testUserId = "test-user-456";

  const librarianUser: UserPermissions = {
    userId: testUserId,
    libraryId: testLibraryId,
    role: "librarian",
    customPermissions: [],
    deniedPermissions: [],
  };

  const managerUser: UserPermissions = {
    userId: testUserId,
    libraryId: testLibraryId,
    role: "manager",
    customPermissions: [],
    deniedPermissions: [],
  };

  const ownerUser: UserPermissions = {
    userId: testUserId,
    libraryId: testLibraryId,
    role: "owner",
    customPermissions: [],
    deniedPermissions: [],
  };

  describe("Role-based permission matrix", () => {
    it("should define correct permissions for librarian role", () => {
      const librarianPermissions = ROLE_PERMISSIONS.librarian;

      // Librarians should have basic operational permissions
      expect(librarianPermissions).toContain("books:view");
      expect(librarianPermissions).toContain("books:add");
      expect(librarianPermissions).toContain("members:view");
      expect(librarianPermissions).toContain("circulation:checkout");
      expect(librarianPermissions).toContain("reports:view");

      // Librarians should NOT have destructive permissions
      expect(librarianPermissions).not.toContain("books:delete");
      expect(librarianPermissions).not.toContain("members:delete");
      expect(librarianPermissions).not.toContain("system:admin");
    });

    it("should define correct permissions for manager role", () => {
      const managerPermissions = ROLE_PERMISSIONS.manager;

      // Managers should have all librarian permissions plus management
      expect(managerPermissions).toContain("books:view");
      expect(managerPermissions).toContain("books:delete");
      expect(managerPermissions).toContain("members:bulk");
      expect(managerPermissions).toContain("reports:advanced");
      expect(managerPermissions).toContain("settings:edit");
      expect(managerPermissions).toContain("staff:invite");

      // Managers should NOT have system admin permissions
      expect(managerPermissions).not.toContain("system:admin");
      expect(managerPermissions).not.toContain("staff:permissions");
    });

    it("should define correct permissions for owner role", () => {
      const ownerPermissions = ROLE_PERMISSIONS.owner;

      // Owners should have full permissions including system admin
      expect(ownerPermissions).toContain("books:delete");
      expect(ownerPermissions).toContain("members:delete");
      expect(ownerPermissions).toContain("system:admin");
      expect(ownerPermissions).toContain("staff:permissions");
      expect(ownerPermissions).toContain("system:backup");
      expect(ownerPermissions).toContain("system:audit");
    });
  });

  describe("hasPermission function", () => {
    it("should return true for role-based permissions", () => {
      expect(hasPermission(librarianUser, "books:view")).toBe(true);
      expect(hasPermission(managerUser, "books:delete")).toBe(true);
      expect(hasPermission(ownerUser, "system:admin")).toBe(true);
    });

    it("should return false for permissions not granted to role", () => {
      expect(hasPermission(librarianUser, "books:delete")).toBe(false);
      expect(hasPermission(librarianUser, "system:admin")).toBe(false);
      expect(hasPermission(managerUser, "system:admin")).toBe(false);
    });

    it("should handle custom permissions", () => {
      const userWithCustomPermissions: UserPermissions = {
        ...librarianUser,
        customPermissions: ["reports:export"],
      };

      expect(hasPermission(userWithCustomPermissions, "reports:export")).toBe(
        true
      );
      expect(hasPermission(librarianUser, "reports:export")).toBe(false);
    });

    it("should handle denied permissions", () => {
      const userWithDeniedPermissions: UserPermissions = {
        ...managerUser,
        deniedPermissions: ["books:delete"],
      };

      expect(hasPermission(userWithDeniedPermissions, "books:delete")).toBe(
        false
      );
      expect(hasPermission(managerUser, "books:delete")).toBe(true);
    });

    it("should prioritize denied permissions over granted ones", () => {
      const userWithConflictingPermissions: UserPermissions = {
        ...ownerUser,
        customPermissions: ["system:backup"],
        deniedPermissions: ["system:backup"],
      };

      expect(
        hasPermission(userWithConflictingPermissions, "system:backup")
      ).toBe(false);
    });
  });

  describe("hasAnyPermission function", () => {
    it("should return true if user has any of the specified permissions", () => {
      expect(
        hasAnyPermission(librarianUser, ["books:view", "system:admin"])
      ).toBe(true);
      expect(
        hasAnyPermission(librarianUser, ["system:admin", "staff:manage"])
      ).toBe(false);
    });

    it("should return false if user has none of the specified permissions", () => {
      expect(
        hasAnyPermission(librarianUser, ["system:admin", "books:delete"])
      ).toBe(false);
    });
  });

  describe("hasAllPermissions function", () => {
    it("should return true if user has all specified permissions", () => {
      expect(
        hasAllPermissions(librarianUser, ["books:view", "members:view"])
      ).toBe(true);
      expect(
        hasAllPermissions(ownerUser, ["books:delete", "system:admin"])
      ).toBe(true);
    });

    it("should return false if user is missing any specified permission", () => {
      expect(
        hasAllPermissions(librarianUser, ["books:view", "books:delete"])
      ).toBe(false);
    });
  });

  describe("getUserPermissions function", () => {
    it("should return all permissions for a role", () => {
      const permissions = getUserPermissions(librarianUser);

      expect(permissions).toContain("books:view");
      expect(permissions).toContain("members:view");
      expect(permissions).not.toContain("books:delete");
    });

    it("should include custom permissions", () => {
      const userWithCustom: UserPermissions = {
        ...librarianUser,
        customPermissions: ["reports:export", "settings:edit"],
      };

      const permissions = getUserPermissions(userWithCustom);

      expect(permissions).toContain("reports:export");
      expect(permissions).toContain("settings:edit");
    });

    it("should exclude denied permissions", () => {
      const userWithDenied: UserPermissions = {
        ...ownerUser,
        deniedPermissions: ["system:admin", "books:delete"],
      };

      const permissions = getUserPermissions(userWithDenied);

      expect(permissions).not.toContain("system:admin");
      expect(permissions).not.toContain("books:delete");
      expect(permissions).toContain("books:view"); // Should still have other permissions
    });

    it("should not include duplicate permissions", () => {
      const userWithDuplicates: UserPermissions = {
        ...librarianUser,
        customPermissions: ["books:view"], // Already in role permissions
      };

      const permissions = getUserPermissions(userWithDuplicates);
      const bookViewCount = permissions.filter(
        (p) => p === "books:view"
      ).length;

      expect(bookViewCount).toBe(1);
    });
  });

  describe("requirePermission function", () => {
    it("should not throw for valid permissions", () => {
      expect(() =>
        requirePermission(librarianUser, "books:view")
      ).not.toThrow();
      expect(() => requirePermission(ownerUser, "system:admin")).not.toThrow();
    });

    it("should throw PermissionError for invalid permissions", () => {
      expect(() => requirePermission(librarianUser, "system:admin")).toThrow(
        PermissionError
      );
      expect(() => requirePermission(managerUser, "system:admin")).toThrow(
        PermissionError
      );
    });

    it("should include relevant error details", () => {
      try {
        requirePermission(librarianUser, "system:admin", "access admin panel");
        fail("Should have thrown PermissionError");
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect(error.message).toContain("system:admin");
        expect(error.message).toContain("access admin panel");
        expect(error.permission).toBe("system:admin");
        expect(error.userId).toBe(testUserId);
        expect(error.libraryId).toBe(testLibraryId);
      }
    });
  });

  describe("Permission descriptions and categories", () => {
    it("should provide descriptions for all permissions", () => {
      const allPermissions: Permission[] = [
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
      ];

      allPermissions.forEach((permission) => {
        const description = getPermissionDescription(permission);
        expect(description).toBeTruthy();
        expect(description).not.toBe(`Permission: ${permission}`);
      });
    });

    it("should organize permissions into categories", () => {
      expect(PERMISSION_CATEGORIES.books.permissions).toContain("books:view");
      expect(PERMISSION_CATEGORIES.members.permissions).toContain(
        "members:add"
      );
      expect(PERMISSION_CATEGORIES.circulation.permissions).toContain(
        "circulation:checkout"
      );
      expect(PERMISSION_CATEGORIES.system.permissions).toContain(
        "system:admin"
      );
    });

    it("should provide category metadata", () => {
      expect(PERMISSION_CATEGORIES.books.label).toBe("Book Management");
      expect(PERMISSION_CATEGORIES.books.description).toBeTruthy();
      expect(PERMISSION_CATEGORIES.system.label).toBe("System Administration");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle undefined custom permissions", () => {
      const userWithoutCustom: UserPermissions = {
        userId: testUserId,
        libraryId: testLibraryId,
        role: "librarian",
        // customPermissions and deniedPermissions are undefined
      };

      expect(() =>
        hasPermission(userWithoutCustom, "books:view")
      ).not.toThrow();
      expect(hasPermission(userWithoutCustom, "books:view")).toBe(true);
    });

    it("should handle invalid roles gracefully", () => {
      const userWithInvalidRole: UserPermissions = {
        userId: testUserId,
        libraryId: testLibraryId,
        role: "invalid-role" as LibraryRole,
      };

      expect(hasPermission(userWithInvalidRole, "books:view")).toBe(false);
      expect(getUserPermissions(userWithInvalidRole)).toEqual([]);
    });

    it("should handle empty permission arrays", () => {
      expect(hasAnyPermission(librarianUser, [])).toBe(false);
      expect(hasAllPermissions(librarianUser, [])).toBe(true);
    });
  });

  describe("Permission system integration scenarios", () => {
    it("should support complex permission combinations", () => {
      const complexUser: UserPermissions = {
        userId: testUserId,
        libraryId: testLibraryId,
        role: "manager",
        customPermissions: ["system:backup"],
        deniedPermissions: ["books:delete"],
      };

      // Should have manager permissions
      expect(hasPermission(complexUser, "reports:advanced")).toBe(true);

      // Should have custom permission
      expect(hasPermission(complexUser, "system:backup")).toBe(true);

      // Should not have denied permission even though role grants it
      expect(hasPermission(complexUser, "books:delete")).toBe(false);

      // Should still have other manager permissions
      expect(hasPermission(complexUser, "settings:edit")).toBe(true);
    });

    it("should support role escalation scenarios", () => {
      // Librarian with manager-level custom permissions
      const escalatedLibrarian: UserPermissions = {
        userId: testUserId,
        libraryId: testLibraryId,
        role: "librarian",
        customPermissions: ["settings:edit", "reports:advanced"],
      };

      expect(hasPermission(escalatedLibrarian, "books:view")).toBe(true); // Role permission
      expect(hasPermission(escalatedLibrarian, "settings:edit")).toBe(true); // Custom permission
      expect(hasPermission(escalatedLibrarian, "system:admin")).toBe(false); // Still restricted
    });
  });
});
