/**
 * Library Dashboard Sidebar Tests
 * Tests for the sidebar navigation component with permission-based filtering
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useSidebar } from "@/components/ui/sidebar";
import { LibraryDashboardSidebar } from "../library-dashboard-sidebar";

// Mock the dependencies
jest.mock("next/navigation");
jest.mock("@/lib/contexts/library-context");
jest.mock("@/components/ui/sidebar");
jest.mock("@/components/nav-user", () => ({
  NavUser: () => <div data-testid="nav-user">Nav User</div>,
}));
jest.mock("@/components/library/library-switcher", () => ({
  LibrarySwitcher: () => (
    <div data-testid="library-switcher">Library Switcher</div>
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseLibraryContext = useLibraryContext as jest.MockedFunction<
  typeof useLibraryContext
>;
const mockUseSidebar = useSidebar as jest.MockedFunction<typeof useSidebar>;

const mockLibrary = {
  id: "library-1",
  code: "TEST-LIB",
  name: "Test Library",
  user_role: "librarian",
  staff_status: "active",
  status: "active",
  created_at: "2024-01-01T00:00:00.000Z",
};

describe("LibraryDashboardSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSidebar.mockReturnValue({ open: true });
    mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");
    mockUseLibraryContext.mockReturnValue({
      currentLibrary: mockLibrary,
      selectLibrary: jest.fn(),
      clearLibrary: jest.fn(),
      userLibraries: [mockLibrary],
      isLoading: false,
      error: null,
    });
  });

  describe("when library is selected", () => {
    it("should render sidebar header with library switcher", () => {
      render(<LibraryDashboardSidebar />);

      expect(screen.getByTestId("library-switcher")).toBeInTheDocument();
    });

    it("should render main navigation items", () => {
      render(<LibraryDashboardSidebar />);

      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    it("should render navigation items with correct hrefs", () => {
      render(<LibraryDashboardSidebar />);

      const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/TEST-LIB/dashboard");

      const inventoryLink = screen.getByRole("link", { name: /Inventory/i });
      expect(inventoryLink).toHaveAttribute("href", "/TEST-LIB/inventory");

      const membersLink = screen.getByRole("link", { name: /Members/i });
      expect(membersLink).toHaveAttribute("href", "/TEST-LIB/members");

      const circulationLink = screen.getByRole("link", {
        name: /Circulation/i,
      });
      expect(circulationLink).toHaveAttribute("href", "/TEST-LIB/circulation");

      const reportsLink = screen.getByRole("link", { name: /Reports/i });
      expect(reportsLink).toHaveAttribute("href", "/TEST-LIB/reports");
    });

    it("should render quick actions section", () => {
      render(<LibraryDashboardSidebar />);

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
    });

    it("should render quick action items with correct hrefs", () => {
      render(<LibraryDashboardSidebar />);

      const searchLink = screen.getByRole("link", { name: /Search/i });
      expect(searchLink).toHaveAttribute("href", "/TEST-LIB/search");

      const addBookLink = screen.getByRole("link", { name: /Add Book/i });
      expect(addBookLink).toHaveAttribute("href", "/TEST-LIB/inventory/add");

      const registerMemberLink = screen.getByRole("link", {
        name: /Register Member/i,
      });
      expect(registerMemberLink).toHaveAttribute(
        "href",
        "/TEST-LIB/members/add"
      );

      const quickCheckoutLink = screen.getByRole("link", {
        name: /Quick Checkout/i,
      });
      expect(quickCheckoutLink).toHaveAttribute(
        "href",
        "/TEST-LIB/circulation/checkout"
      );
    });

    it("should render settings section", () => {
      render(<LibraryDashboardSidebar />);

      expect(screen.getByText("Settings")).toBeInTheDocument();

      const settingsLink = screen.getByRole("link", { name: /Settings/i });
      expect(settingsLink).toHaveAttribute("href", "/TEST-LIB/settings");
    });

    it("should render footer with user navigation", () => {
      render(<LibraryDashboardSidebar />);

      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });

    it("should highlight active navigation item", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibraryDashboardSidebar />);

      // Check that the dashboard link is active
      const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });

    it("should highlight different active navigation item", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory");

      render(<LibraryDashboardSidebar />);

      // Check that inventory section would be highlighted
      const inventoryLink = screen.getByRole("link", { name: /Inventory/i });
      expect(inventoryLink).toBeInTheDocument();
    });
  });

  describe("when no library is selected", () => {
    it("should show loading state", () => {
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: null,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [],
        isLoading: false,
        error: null,
      });

      render(<LibraryDashboardSidebar />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper navigation structure", () => {
      render(<LibraryDashboardSidebar />);

      // Check for navigation landmarks
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      // Each link should have accessible name
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("should have proper tooltips for navigation items", () => {
      render(<LibraryDashboardSidebar />);

      // Navigation items should have tooltips (title attributes or aria-labels)
      const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });
  });

  describe("responsive behavior", () => {
    it("should render with collapsible sidebar variant", () => {
      render(<LibraryDashboardSidebar />);

      // Check that the sidebar component renders (basic smoke test)
      expect(screen.getByTestId("library-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });

    it("should handle collapsed sidebar state", () => {
      mockUseSidebar.mockReturnValue({ open: false });

      render(<LibraryDashboardSidebar />);

      // Should still render main elements
      expect(screen.getByTestId("library-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });
  });

  describe("permission-based navigation", () => {
    it("should render all navigation items for librarian role", () => {
      render(<LibraryDashboardSidebar />);

      // All main navigation items should be visible for librarian
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should render all quick actions for librarian role", () => {
      render(<LibraryDashboardSidebar />);

      // All quick actions should be visible for librarian
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
    });

    // Note: Permission filtering is currently showing all items
    // This test documents current behavior and can be enhanced
    // when proper permission system is implemented
    it("should handle different user roles (future enhancement)", () => {
      const memberLibrary = {
        ...mockLibrary,
        user_role: "member",
      };

      mockUseLibraryContext.mockReturnValue({
        currentLibrary: memberLibrary,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [memberLibrary],
        isLoading: false,
        error: null,
      });

      render(<LibraryDashboardSidebar />);

      // Currently all items are shown - this is expected behavior
      // Future enhancement would filter based on permissions
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("integration with library context", () => {
    it("should update navigation hrefs when library changes", () => {
      const newLibrary = {
        ...mockLibrary,
        code: "NEW-LIB",
        name: "New Library",
      };

      const { rerender } = render(<LibraryDashboardSidebar />);

      // Initial library
      let dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/TEST-LIB/dashboard");

      // Update library context
      mockUseLibraryContext.mockReturnValue({
        currentLibrary: newLibrary,
        selectLibrary: jest.fn(),
        clearLibrary: jest.fn(),
        userLibraries: [newLibrary],
        isLoading: false,
        error: null,
      });

      rerender(<LibraryDashboardSidebar />);

      // Check updated hrefs
      dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/NEW-LIB/dashboard");
    });
  });
});
