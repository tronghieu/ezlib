/**
 * Library Dashboard Header Tests
 * Tests for the header component with breadcrumbs and library context
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { LibraryDashboardHeader } from "../library-dashboard-header";

// Mock the dependencies
jest.mock("next/navigation");
jest.mock("@/lib/contexts/library-context");
jest.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: () => (
    <button data-testid="sidebar-trigger">Toggle Sidebar</button>
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseLibraryContext = useLibraryContext as jest.MockedFunction<
  typeof useLibraryContext
>;

const mockLibrary = {
  id: "library-1",
  code: "TEST-LIB",
  name: "Test Library",
  address: "123 Test Street",
  contact_info: { email: "test@library.com" },
  settings: {},
  stats: {},
  user_role: "librarian",
  staff_status: "active",
  status: "active",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  user_permissions: {},
  staff_id: "staff-1",
};

describe("LibraryDashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLibraryContext.mockReturnValue({
      currentLibrary: mockLibrary,
      selectLibrary: jest.fn(),
      clearLibrarySelection: jest.fn(),
      availableLibraries: [mockLibrary],
      refreshLibraries: jest.fn(),
      switchLibrary: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  describe("basic rendering", () => {
    it("should render sidebar trigger", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    });

    it("should render header actions", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      // Check for search input (disabled)
      const searchInput = screen.getByPlaceholderText(
        "Search books, members..."
      );
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toBeDisabled();

      // Check for notifications button (disabled)
      const notificationsButton = screen.getByRole("button", {
        name: /Notifications/i,
      });
      expect(notificationsButton).toBeInTheDocument();
      expect(notificationsButton).toBeDisabled();
    });

    it("should display library context information", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("librarian")).toBeInTheDocument();
    });
  });

  describe("breadcrumb navigation", () => {
    it("should show library name for dashboard route", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
    });

    it("should show inventory breadcrumb", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
    });

    it("should show members breadcrumb", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/members");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    it("should show circulation breadcrumb", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/circulation");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
    });

    it("should show reports breadcrumb", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/reports");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    it("should show settings breadcrumb", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/settings");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should show search breadcrumb", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/search");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("should show nested breadcrumbs for add pages", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory/add");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Add New")).toBeInTheDocument();
    });

    it("should show nested breadcrumbs for edit pages", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/members/edit");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("should show circulation subsection breadcrumbs", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/circulation/checkout");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });

    it("should show circulation check-in breadcrumbs", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/circulation/checkin");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Check In")).toBeInTheDocument();
    });

    it("should show circulation history breadcrumbs", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/circulation/history");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("History")).toBeInTheDocument();
    });

    it("should handle breadcrumbs with proper links", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory/add");

      render(<LibraryDashboardHeader />);

      // Library name should be a link
      const libraryLink = screen.getByRole("link", { name: "Test Library" });
      expect(libraryLink).toHaveAttribute("href", "/TEST-LIB/dashboard");

      // Inventory should be a link when we're in a subsection
      const inventoryLink = screen.getByRole("link", { name: "Inventory" });
      expect(inventoryLink).toHaveAttribute("href", "/TEST-LIB/inventory");

      // Last breadcrumb item should not be a link
      expect(
        screen.queryByRole("link", { name: "Add New" })
      ).not.toBeInTheDocument();
    });
  });

  describe("when no library is selected", () => {
    it("should handle empty breadcrumbs gracefully", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: null,
        selectLibrary: jest.fn(),
        clearLibrarySelection: jest.fn(),
        availableLibraries: [],
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        isLoading: false,
        error: null,
      });

      mockUsePathname.mockReturnValue("/some/path");

      render(<LibraryDashboardHeader />);

      // Should still render basic header structure
      expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search books, members...")
      ).toBeInTheDocument();
    });

    it("should not show library context information", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: null,
        selectLibrary: jest.fn(),
        clearLibrarySelection: jest.fn(),
        availableLibraries: [],
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        isLoading: false,
        error: null,
      });

      mockUsePathname.mockReturnValue("/some/path");

      render(<LibraryDashboardHeader />);

      expect(screen.queryByText("Test Library")).not.toBeInTheDocument();
      expect(screen.queryByText("librarian")).not.toBeInTheDocument();
    });
  });

  describe("responsive behavior", () => {
    it("should hide search input on mobile", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      const searchContainer = screen
        .getByPlaceholderText("Search books, members...")
        .closest("div");
      expect(searchContainer).toHaveClass("hidden", "md:flex");
    });

    it("should hide library context on smaller screens", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      const libraryContext = screen.getByText("Test Library").closest("div");
      expect(libraryContext).toHaveClass("hidden", "lg:flex");
    });

    it("should show breadcrumb separators conditionally", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory");

      render(<LibraryDashboardHeader />);

      // Breadcrumb separators should be hidden on mobile
      const breadcrumbList = screen.getByRole("list");
      expect(breadcrumbList).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper navigation structure", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory/add");

      render(<LibraryDashboardHeader />);

      // Should have navigation landmark
      expect(screen.getByRole("list")).toBeInTheDocument();

      // Links should have accessible names
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("should have proper button labeling", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      const notificationsButton = screen.getByRole("button", {
        name: /Notifications/i,
      });
      expect(notificationsButton).toHaveAccessibleName();
    });

    it("should have proper input labeling", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      const searchInput = screen.getByPlaceholderText(
        "Search books, members..."
      );
      expect(searchInput).toHaveAttribute(
        "placeholder",
        "Search books, members..."
      );
    });
  });

  describe("library context integration", () => {
    it("should update breadcrumbs when library changes", () => {
      const newLibrary = {
        ...mockLibrary,
        code: "NEW-LIB",
        name: "New Library",
      };

      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      const { rerender } = render(<LibraryDashboardHeader />);

      expect(screen.getByText("Test Library")).toBeInTheDocument();

      // Update library context
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: newLibrary,
        selectLibrary: jest.fn(),
        clearLibrarySelection: jest.fn(),
        availableLibraries: [newLibrary],
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Update pathname to match new library
      mockUsePathname.mockReturnValue("/NEW-LIB/dashboard");

      rerender(<LibraryDashboardHeader />);

      expect(screen.getByText("New Library")).toBeInTheDocument();
      expect(screen.queryByText("Test Library")).not.toBeInTheDocument();
    });

    it("should show different user roles", () => {
      const adminLibrary = {
        ...mockLibrary,
        user_role: "admin",
      };

      mockUseLibraryContext.mockReturnValue({
        currentLibrary: adminLibrary,
        selectLibrary: jest.fn(),
        clearLibrarySelection: jest.fn(),
        availableLibraries: [adminLibrary],
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        isLoading: false,
        error: null,
      });

      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardHeader />);

      expect(screen.getByText("admin")).toBeInTheDocument();
    });
  });
});
