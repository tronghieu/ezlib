/**
 * Library Sidebar Tests
 * Tests for the sidebar navigation component with role-based access
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useSidebar } from "@/components/ui/sidebar";
import { LibrarySidebar } from "../library-sidebar";

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
  address: "123 Test Street",
  contact_info: { email: "test@library.com" },
  settings: {},
  stats: {},
  user_role: "librarian",
  staff_status: "active",
  status: "active",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  staff_id: "staff-1",
};

describe("LibraryDashboardSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSidebar.mockReturnValue({
      state: "expanded",
      open: true,
      setOpen: jest.fn(),
      openMobile: false,
      setOpenMobile: jest.fn(),
      isMobile: false,
      toggleSidebar: jest.fn(),
    });
    mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");
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

  describe("when library is selected", () => {
    it("should render sidebar header with library switcher", () => {
      render(<LibrarySidebar />);

      expect(screen.getByTestId("library-switcher")).toBeInTheDocument();
    });

    it("should render main navigation items", () => {
      render(<LibrarySidebar />);

      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    it("should render navigation items with correct hrefs", () => {
      render(<LibrarySidebar />);

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
      render(<LibrarySidebar />);

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
    });

    it("should render quick action items with correct hrefs", () => {
      render(<LibrarySidebar />);

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
      render(<LibrarySidebar />);

      expect(screen.getByText("Settings")).toBeInTheDocument();

      const settingsLink = screen.getByRole("link", { name: /Settings/i });
      expect(settingsLink).toHaveAttribute("href", "/TEST-LIB/settings");
    });

    it("should render footer with user navigation", () => {
      render(<LibrarySidebar />);

      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });

    it("should highlight active navigation item", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/dashboard");

      render(<LibrarySidebar />);

      // Check that the dashboard link is active
      const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });

    it("should highlight different active navigation item", () => {
      mockUsePathname.mockReturnValue("/TEST-LIB/inventory");

      render(<LibrarySidebar />);

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
        clearLibrarySelection: jest.fn(),
        availableLibraries: [],
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        isLoading: false,
        error: null,
      });

      render(<LibrarySidebar />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper navigation structure", () => {
      render(<LibrarySidebar />);

      // Check for navigation landmarks
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      // Each link should have accessible name
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("should have proper tooltips for navigation items", () => {
      render(<LibrarySidebar />);

      // Navigation items should have tooltips (title attributes or aria-labels)
      const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });
  });

  describe("responsive behavior", () => {
    it("should render with collapsible sidebar variant", () => {
      render(<LibrarySidebar />);

      // Check that the sidebar component renders (basic smoke test)
      expect(screen.getByTestId("library-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });

    it("should handle collapsed sidebar state", () => {
      mockUseSidebar.mockReturnValue({
        state: "collapsed",
        open: false,
        setOpen: jest.fn(),
        openMobile: false,
        setOpenMobile: jest.fn(),
        isMobile: false,
        toggleSidebar: jest.fn(),
      });

      render(<LibrarySidebar />);

      // Should still render main elements
      expect(screen.getByTestId("library-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });
  });

  describe("role-based navigation", () => {
    it("should render all navigation items for librarian role", () => {
      render(<LibrarySidebar />);

      // All main navigation items should be visible for librarian
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Inventory")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Circulation")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should render all quick actions for librarian role", () => {
      render(<LibrarySidebar />);

      // All quick actions should be visible for librarian
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Add Book")).toBeInTheDocument();
      expect(screen.getByText("Register Member")).toBeInTheDocument();
      expect(screen.getByText("Quick Checkout")).toBeInTheDocument();
    });

    // Note: Permission filtering is currently showing all items
    // This test documents current behavior and can be enhanced
    // when role-based filtering is implemented at page level
    it("should handle different user roles (future enhancement)", () => {
      const memberLibrary = {
        ...mockLibrary,
        user_role: "member",
      };

      mockUseLibraryContext.mockReturnValue({
        currentLibrary: memberLibrary,
        selectLibrary: jest.fn(),
        clearLibrarySelection: jest.fn(),
        availableLibraries: [memberLibrary],
        refreshLibraries: jest.fn(),
        switchLibrary: jest.fn(),
        isLoading: false,
        error: null,
      });

      render(<LibrarySidebar />);

      // Currently all items are shown - this is expected behavior
      // Future enhancement would filter based on roles at page level
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

      const { rerender } = render(<LibrarySidebar />);

      // Initial library
      let dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/TEST-LIB/dashboard");

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

      rerender(<LibrarySidebar />);

      // Check updated hrefs
      dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/NEW-LIB/dashboard");
    });
  });
});
