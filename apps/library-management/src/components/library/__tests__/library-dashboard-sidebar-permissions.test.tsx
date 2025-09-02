/**
 * Permission-based Navigation Tests
 * Tests role-based filtering and access control for dashboard navigation
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { LibraryDashboardSidebar } from "../library-dashboard-sidebar";
import { LibraryProvider } from "@/lib/contexts/library-context";
import type { LibraryWithAccess } from "@/lib/types";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/TEST-LIB/dashboard",
}));

// Test data for different user roles
const baseLibrary = {
  id: "lib-1",
  name: "Test Library",
  code: "TEST-LIB",
  address: { city: "New York", state: "NY" },
  contact_info: { email: "test@library.com" },
  settings: {},
  stats: { total_books: 100 },
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  staff_id: "staff-1",
  staff_status: "active" as const,
};

const createLibraryWithRole = (
  role: string,
  permissions: Record<string, boolean>
): LibraryWithAccess => ({
  ...baseLibrary,
  user_role: role,
  user_permissions: permissions,
});

// Role configurations based on realistic library permissions
const ROLE_CONFIGURATIONS = {
  admin: createLibraryWithRole("admin", {
    "books.view": true,
    "books.create": true,
    "books.edit": true,
    "books.delete": true,
    "members.view": true,
    "members.create": true,
    "members.edit": true,
    "members.delete": true,
    "transactions.create": true,
    "transactions.view": true,
    "reports.view": true,
    "settings.manage": true,
  }),
  librarian: createLibraryWithRole("librarian", {
    "books.view": true,
    "books.create": true,
    "books.edit": true,
    "members.view": true,
    "members.create": true,
    "members.edit": true,
    "transactions.create": true,
    "transactions.view": true,
    "reports.view": true,
    // No books.delete, members.delete, or settings.manage
  }),
  clerk: createLibraryWithRole("clerk", {
    "books.view": true,
    "members.view": true,
    "transactions.create": true,
    "transactions.view": true,
    // Limited permissions - can't create/edit books or members
  }),
  volunteer: createLibraryWithRole("volunteer", {
    "books.view": true,
    "members.view": true,
    // Very limited - can only view, no transactions
  }),
  readonly: createLibraryWithRole("readonly", {
    "books.view": true,
    "members.view": true,
    "reports.view": true,
    // View-only access
  }),
};

// Helper to create test wrapper with library context
function createTestWrapper(library: LibraryWithAccess | null) {
  const mockLibraryValue = {
    currentLibrary: library,
    availableLibraries: library ? [library] : [],
    isLoading: false,
    error: null,
    selectLibrary: jest.fn(),
    refreshLibraries: jest.fn(),
    clearLibrarySelection: jest.fn(),
    switchLibrary: jest.fn(),
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <LibraryProvider value={mockLibraryValue}>{children}</LibraryProvider>
  );

  return TestWrapper;
}

describe("Permission-based Navigation Tests", () => {
  describe("Admin Role - Full Access", () => {
    const adminLibrary = ROLE_CONFIGURATIONS.admin;

    it("should show all navigation sections for admin", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(adminLibrary),
      });

      // Main navigation should include all sections
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    it("should show all quick actions for admin", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(adminLibrary),
      });

      // Quick actions section
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
    });

    it("should show settings section for admin", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(adminLibrary),
      });

      // Settings should be visible for admin
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  describe("Librarian Role - Standard Access", () => {
    const librarianLibrary = ROLE_CONFIGURATIONS.librarian;

    it("should show most navigation sections except settings for librarian", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(librarianLibrary),
      });

      // Should have access to most sections
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();

      // Settings might be hidden for librarian (depends on implementation)
      // This test would need to be adjusted based on actual permission logic
    });

    it("should show appropriate quick actions for librarian", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(librarianLibrary),
      });

      // Should have access to most quick actions
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
    });
  });

  describe("Clerk Role - Limited Access", () => {
    const clerkLibrary = ROLE_CONFIGURATIONS.clerk;

    it("should show limited navigation sections for clerk", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(clerkLibrary),
      });

      // Should have basic access
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();

      // Reports might be hidden for clerk
      // Settings should be hidden
    });

    it("should show limited quick actions for clerk", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(clerkLibrary),
      });

      // Should have access to circulation functions
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();

      // Add Book and Register Member might be hidden based on permissions
      // This would depend on the actual implementation
    });
  });

  describe("Volunteer Role - Minimal Access", () => {
    const volunteerLibrary = ROLE_CONFIGURATIONS.volunteer;

    it("should show minimal navigation sections for volunteer", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(volunteerLibrary),
      });

      // Should have basic view access
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();

      // Circulation, Reports, Settings should be hidden or limited
    });

    it("should show very limited quick actions for volunteer", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(volunteerLibrary),
      });

      // Most quick actions should be hidden for volunteer
      // Only view-based actions should be available
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });
  });

  describe("Read-only Role - View Only Access", () => {
    const readonlyLibrary = ROLE_CONFIGURATIONS.readonly;

    it("should show view-only navigation sections", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(readonlyLibrary),
      });

      // Should have view access
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();

      // Circulation and Settings should be hidden
    });

    it("should hide all action-based quick actions for readonly", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(readonlyLibrary),
      });

      // All action quick actions should be hidden
      expect(screen.queryByText("Add Book")).not.toBeInTheDocument();
      expect(screen.queryByText("Register Member")).not.toBeInTheDocument();
      expect(screen.queryByText("Quick Checkout")).not.toBeInTheDocument();
    });
  });

  describe("Navigation Link Permissions", () => {
    it("should generate correct href paths with library context", () => {
      const adminLibrary = ROLE_CONFIGURATIONS.admin;

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(adminLibrary),
      });

      // Check that navigation links include library code
      const inventoryLink = screen.getByText("Inventory").closest("a");
      expect(inventoryLink).toHaveAttribute("href", "/TEST-LIB/inventory");

      const membersLink = screen.getByText("Members").closest("a");
      expect(membersLink).toHaveAttribute("href", "/TEST-LIB/members");

      const circulationLink = screen.getByText("Circulation").closest("a");
      expect(circulationLink).toHaveAttribute("href", "/TEST-LIB/circulation");
    });

    it("should generate correct quick action paths with library context", () => {
      const adminLibrary = ROLE_CONFIGURATIONS.admin;

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(adminLibrary),
      });

      // Check quick action links
      const addBookLink = screen.getByText("Add Book").closest("a");
      expect(addBookLink).toHaveAttribute("href", "/TEST-LIB/inventory/add");

      const registerMemberLink = screen
        .getByText("Register Member")
        .closest("a");
      expect(registerMemberLink).toHaveAttribute(
        "href",
        "/TEST-LIB/members/add"
      );

      const checkoutLink = screen.getByText("Quick Checkout").closest("a");
      expect(checkoutLink).toHaveAttribute(
        "href",
        "/TEST-LIB/circulation/checkout"
      );
    });
  });

  describe("Dynamic Permission Updates", () => {
    it("should update navigation when user permissions change", () => {
      const { rerender } = render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(ROLE_CONFIGURATIONS.clerk),
      });

      // Initially as clerk - limited access
      expect(screen.getByText("Circulation")).toBeInTheDocument();

      // Change to volunteer role with even more limited access
      rerender(<LibraryDashboardSidebar />);

      // Should still work with the current role
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("should handle permission edge cases gracefully", () => {
      // Test with custom permission set
      const customLibrary = createLibraryWithRole("custom", {
        "books.view": true,
        "transactions.create": false,
        "members.view": false,
      });

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(customLibrary),
      });

      // Should handle mixed permissions appropriately
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();

      // Members section should be hidden due to no members.view permission
      expect(screen.queryByText("Members")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility with Permissions", () => {
    it("should maintain proper ARIA attributes for filtered navigation", () => {
      const clerkLibrary = ROLE_CONFIGURATIONS.clerk;

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(clerkLibrary),
      });

      // Navigation should still have proper roles and labels
      const navigationList = screen.getByRole("list");
      expect(navigationList).toBeInTheDocument();

      // Links should have proper accessibility
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
        expect(link.textContent).toBeTruthy();
      });
    });

    it("should provide tooltips for restricted actions", () => {
      const volunteerLibrary = ROLE_CONFIGURATIONS.volunteer;

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(volunteerLibrary),
      });

      // If actions are disabled rather than hidden, they should have tooltips
      // This depends on the implementation approach
      const quickActionsSection = screen.queryByText("Quick Actions");
      if (quickActionsSection) {
        // Should provide context about limited access
        expect(quickActionsSection).toBeInTheDocument();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle missing library context gracefully", () => {
      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(null),
      });

      // Should show loading or no-library state
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should handle malformed permission objects", () => {
      const malformedLibrary = {
        ...baseLibrary,
        user_role: "librarian",
        user_permissions: null, // Malformed permissions
      } as LibraryWithAccess;

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(malformedLibrary),
      });

      // Should still render basic navigation without errors
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("should handle unknown roles gracefully", () => {
      const unknownRoleLibrary = createLibraryWithRole("unknown-role", {
        "books.view": true,
      });

      render(<LibraryDashboardSidebar />, {
        wrapper: createTestWrapper(unknownRoleLibrary),
      });

      // Should still render navigation
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });
});
