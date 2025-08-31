/**
 * Tests for Library Switcher Component
 * Validates library switching UI and multi-library navigation
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibrarySwitcher } from "../library-switcher";
import { LibraryProvider } from "@/lib/contexts/library-context";
import { AuthProvider } from "@/lib/auth/context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LibraryWithAccess } from "@/lib/types";

// Mock window.location
const mockLocation = {
  href: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Test data
const mockUser = {
  id: "test-user-123",
  email: "test@library.com",
  created_at: "2024-01-01T00:00:00Z",
};

const mockLibraries: LibraryWithAccess[] = [
  {
    id: "lib-1",
    name: "Central Library",
    code: "CENTRAL",
    address: { city: "New York", state: "NY" },
    contact_info: { email: "central@library.com" },
    settings: {},
    stats: { total_books: 1000 },
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_role: "admin",
    user_permissions: { manage_books: true },
    staff_id: "staff-1",
    staff_status: "active",
  },
  {
    id: "lib-2",
    name: "Branch Library",
    code: "BRANCH",
    address: { city: "Brooklyn", state: "NY" },
    contact_info: { email: "branch@library.com" },
    settings: {},
    stats: { total_books: 500 },
    status: "active",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    user_role: "librarian",
    user_permissions: { manage_books: false },
    staff_id: "staff-2",
    staff_status: "active",
  },
  {
    id: "lib-3",
    name: "Downtown Library",
    code: "DOWNTOWN",
    address: { city: "Manhattan", state: "NY" },
    contact_info: { email: "downtown@library.com" },
    settings: {},
    stats: { total_books: 750 },
    status: "active",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
    user_role: "manager",
    user_permissions: { manage_books: true },
    staff_id: "staff-3",
    staff_status: "active",
  },
];

// Helper to render with providers
function renderWithProviders(
  ui: React.ReactElement,
  {
    currentLibrary = mockLibraries[0],
    availableLibraries = mockLibraries,
    isLoading = false,
    error = null,
  }: {
    currentLibrary?: LibraryWithAccess | null;
    availableLibraries?: LibraryWithAccess[];
    isLoading?: boolean;
    error?: string | null;
  } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock auth context
  const mockAuthValue = {
    user: mockUser,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  };

  // Mock library context
  const mockSelectLibrary = jest.fn();
  const mockLibraryValue = {
    currentLibrary,
    availableLibraries,
    isLoading,
    error,
    selectLibrary: mockSelectLibrary,
    refreshLibraries: jest.fn(),
    clearLibrarySelection: jest.fn(),
    switchLibrary: jest.fn(),
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={mockAuthValue}>
          <LibraryProvider value={mockLibraryValue}>{ui}</LibraryProvider>
        </AuthProvider>
      </QueryClientProvider>
    ),
    mockSelectLibrary,
  };
}

describe("LibrarySwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = "";
  });

  describe("Loading State", () => {
    it("should show loading indicator when libraries are loading", () => {
      renderWithProviders(<LibrarySwitcher />, { isLoading: true });

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("No Library Selected", () => {
    it("should show select library button when no library is selected", () => {
      renderWithProviders(<LibrarySwitcher />, { currentLibrary: null });

      const selectButton = screen.getByRole("button", {
        name: /select library/i,
      });
      expect(selectButton).toBeInTheDocument();
    });

    it("should redirect to library selection page when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />, { currentLibrary: null });

      await user.click(screen.getByRole("button", { name: /select library/i }));

      expect(mockLocation.href).toBe("/");
    });
  });

  describe("Single Library Access", () => {
    it("should show simple display when user has access to only one library", () => {
      renderWithProviders(<LibrarySwitcher />, {
        currentLibrary: mockLibraries[0],
        availableLibraries: [mockLibraries[0]],
      });

      expect(screen.getByText("Central Library")).toBeInTheDocument();
      // Should not show dropdown trigger
      expect(
        screen.queryByRole("button", { name: /central library/i })
      ).not.toBeInTheDocument();
    });

    it("should display library icon in single library view", () => {
      const { container } = renderWithProviders(<LibrarySwitcher />, {
        currentLibrary: mockLibraries[0],
        availableLibraries: [mockLibraries[0]],
      });

      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Multiple Libraries Access", () => {
    it("should show dropdown when user has access to multiple libraries", () => {
      renderWithProviders(<LibrarySwitcher />);

      const dropdownTrigger = screen.getByRole("button");
      expect(dropdownTrigger).toHaveTextContent("Central Library");
    });

    it("should open dropdown menu on click", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      const dropdownTrigger = screen.getByRole("button");
      await user.click(dropdownTrigger);

      expect(screen.getByText("Available Libraries")).toBeInTheDocument();
      expect(screen.getByText("Branch Library")).toBeInTheDocument();
      expect(screen.getByText("Downtown Library")).toBeInTheDocument();
    });

    it("should show current library with check mark", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));

      // Find the current library item
      const currentLibraryItem = screen
        .getByText("Central Library")
        .closest('[role="menuitem"]');
      expect(currentLibraryItem).toBeInTheDocument();

      // Note: The actual implementation uses Check icon from lucide-react
      // which may not have data-testid, so we check for the structure
      expect(currentLibraryItem?.innerHTML).toContain("Check");
    });

    it("should display library details in dropdown", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));

      // Check library codes
      expect(screen.getByText("CENTRAL")).toBeInTheDocument();
      expect(screen.getByText("BRANCH")).toBeInTheDocument();
      expect(screen.getByText("DOWNTOWN")).toBeInTheDocument();

      // Check user roles
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("librarian")).toBeInTheDocument();
      expect(screen.getByText("manager")).toBeInTheDocument();
    });
  });

  describe("Library Selection", () => {
    it("should select library and navigate to dashboard", async () => {
      const user = userEvent.setup();
      const { mockSelectLibrary } = renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Branch Library"));

      expect(mockSelectLibrary).toHaveBeenCalledWith(mockLibraries[1]);
      expect(mockLocation.href).toBe("/BRANCH/dashboard");
    });

    it("should close dropdown after selection", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));
      expect(screen.getByText("Available Libraries")).toBeInTheDocument();

      await user.click(screen.getByText("Branch Library"));

      await waitFor(() => {
        expect(
          screen.queryByText("Available Libraries")
        ).not.toBeInTheDocument();
      });
    });

    it("should handle selecting the current library", async () => {
      const user = userEvent.setup();
      const { mockSelectLibrary } = renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Central Library"));

      expect(mockSelectLibrary).toHaveBeenCalledWith(mockLibraries[0]);
      expect(mockLocation.href).toBe("/CENTRAL/dashboard");
    });
  });

  describe("View All Libraries", () => {
    it("should show view all libraries option", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("View All Libraries")).toBeInTheDocument();
    });

    it("should navigate to library selection page", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("View All Libraries"));

      expect(mockLocation.href).toBe("/");
    });
  });

  describe("Long Library Names", () => {
    it("should truncate long library names in trigger button", () => {
      const longNameLibrary = {
        ...mockLibraries[0],
        name: "Very Long Library Name That Should Be Truncated In The Display",
      };

      renderWithProviders(<LibrarySwitcher />, {
        currentLibrary: longNameLibrary,
        availableLibraries: [longNameLibrary, mockLibraries[1]],
      });

      const button = screen.getByRole("button");
      expect(button.querySelector(".truncate")).toBeInTheDocument();
    });

    it("should truncate long library names in dropdown items", async () => {
      const user = userEvent.setup();
      const longNameLibrary = {
        ...mockLibraries[1],
        name: "Another Very Long Library Name That Should Be Truncated",
      };

      renderWithProviders(<LibrarySwitcher />, {
        availableLibraries: [mockLibraries[0], longNameLibrary],
      });

      await user.click(screen.getByRole("button"));

      const libraryItem = screen.getByText(longNameLibrary.name);
      expect(libraryItem.classList.contains("truncate")).toBe(true);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation in dropdown", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      // Open dropdown with Enter
      const trigger = screen.getByRole("button");
      trigger.focus();
      await user.keyboard("{Enter}");

      expect(screen.getByText("Available Libraries")).toBeInTheDocument();

      // Navigate with arrow keys
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // Should have selected a library
      expect(mockLocation.href).toBeTruthy();
    });

    it("should close dropdown with Escape", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));
      expect(screen.getByText("Available Libraries")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(
          screen.queryByText("Available Libraries")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("should handle empty available libraries list", () => {
      renderWithProviders(<LibrarySwitcher />, {
        currentLibrary: null,
        availableLibraries: [],
      });

      expect(
        screen.getByRole("button", { name: /select library/i })
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveAttribute("aria-haspopup");

      await user.click(trigger);

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it("should have descriptive labels", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LibrarySwitcher />);

      await user.click(screen.getByRole("button"));

      // Check for descriptive content
      expect(screen.getByText("Available Libraries")).toBeInTheDocument();
      mockLibraries.forEach((library) => {
        expect(screen.getByText(library.name)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing library code gracefully", async () => {
      const libraryWithoutCode = {
        ...mockLibraries[0],
        code: "",
      };

      renderWithProviders(<LibrarySwitcher />, {
        currentLibrary: libraryWithoutCode,
        availableLibraries: [libraryWithoutCode],
      });

      // Should still render
      expect(screen.getByText(libraryWithoutCode.name)).toBeInTheDocument();
    });

    it("should handle library selection errors gracefully", async () => {
      const user = userEvent.setup();
      const { mockSelectLibrary } = renderWithProviders(<LibrarySwitcher />);

      mockSelectLibrary.mockImplementation(() => {
        throw new Error("Selection failed");
      });

      await user.click(screen.getByRole("button"));

      // Should not throw when selection fails
      await expect(
        user.click(screen.getByText("Branch Library"))
      ).resolves.not.toThrow();
    });
  });
});
