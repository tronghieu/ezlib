/**
 * Tests for Library Selection Page Component
 * Validates library selection UI and authentication integration
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibrarySelectionPage } from "../library-selection-page";
import { MockLibraryProvider, MockAuthProvider, createMockUser } from "@/lib/test-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LibraryWithAccess } from "@/lib/types";

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

// Mock library selection grid component
jest.mock("../library-selection-grid", () => ({
  LibrarySelectionGrid: ({
    libraries,
    onLibrarySelect,
    isLoading,
    error,
  }: {
    libraries: LibraryWithAccess[];
    onLibrarySelect: (lib: LibraryWithAccess) => void;
    isLoading: boolean;
    error: string | null;
  }) => (
    <div data-testid="library-selection-grid">
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {libraries.map((lib: LibraryWithAccess) => (
        <button
          key={lib.id}
          data-testid={`library-${lib.id}`}
          onClick={() => onLibrarySelect(lib)}
        >
          {lib.name}
        </button>
      ))}
    </div>
  ),
}));

// Test data
const mockUser = createMockUser({
  id: "test-user-123",
  email: "test@library.com",
  created_at: "2024-01-01T00:00:00Z",
});

const mockLibraries: LibraryWithAccess[] = [
  {
    id: "lib-1",
    name: "Central Library",
    code: "CENTRAL-LIB",
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
    code: "BRANCH-LIB",
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
];

// Helper to render with providers
function renderWithProviders(
  ui: React.ReactElement,
  {
    user = mockUser,
    libraries = mockLibraries,
    isLoading = false,
    error = null,
  }: {
    user?: typeof mockUser | null;
    libraries?: LibraryWithAccess[];
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
    user,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  };

  // Mock library context
  const mockLibraryValue = {
    currentLibrary: null,
    availableLibraries: libraries,
    isLoading,
    error,
    selectLibrary: jest.fn(),
    refreshLibraries: jest.fn(),
    clearLibrarySelection: jest.fn(),
    switchLibrary: jest.fn(),
  } as const;

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider value={mockAuthValue}>
          <MockLibraryProvider value={mockLibraryValue}>{ui}</MockLibraryProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    ),
    mockLibraryValue,
  };
}

describe("LibrarySelectionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should redirect to login when user is not authenticated", () => {
      renderWithProviders(<LibrarySelectionPage />, { user: null });

      expect(mockPush).toHaveBeenCalledWith("/auth/login");
      expect(screen.getByText("Redirecting to login...")).toBeInTheDocument();
    });

    it("should show library selection when user is authenticated", () => {
      renderWithProviders(<LibrarySelectionPage />);

      expect(mockPush).not.toHaveBeenCalledWith("/auth/login");
      expect(screen.getByTestId("library-selection-grid")).toBeInTheDocument();
    });
  });

  describe("Library Display", () => {
    it("should display all available libraries", () => {
      renderWithProviders(<LibrarySelectionPage />);

      expect(screen.getByText("Central Library")).toBeInTheDocument();
      expect(screen.getByText("Branch Library")).toBeInTheDocument();
    });

    it("should show loading state", () => {
      renderWithProviders(<LibrarySelectionPage />, { isLoading: true });

      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });

    it("should show error state", () => {
      renderWithProviders(<LibrarySelectionPage />, {
        error: "Failed to load libraries",
      });

      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to load libraries"
      );
    });

    it("should handle empty library list", () => {
      renderWithProviders(<LibrarySelectionPage />, { libraries: [] });

      expect(screen.getByTestId("library-selection-grid")).toBeInTheDocument();
      expect(screen.queryByTestId("library-lib-1")).not.toBeInTheDocument();
    });
  });

  describe("Library Selection", () => {
    it("should select library and navigate to dashboard", async () => {
      const user = userEvent.setup();
      const { mockLibraryValue } = renderWithProviders(
        <LibrarySelectionPage />
      );

      await user.click(screen.getByTestId("library-lib-1"));

      expect(mockLibraryValue.selectLibrary).toHaveBeenCalledWith(
        mockLibraries[0]
      );
      expect(mockPush).toHaveBeenCalledWith("/CENTRAL-LIB/dashboard");
    });

    it("should handle different library codes correctly", async () => {
      const user = userEvent.setup();
      const { mockLibraryValue } = renderWithProviders(
        <LibrarySelectionPage />
      );

      await user.click(screen.getByTestId("library-lib-2"));

      expect(mockLibraryValue.selectLibrary).toHaveBeenCalledWith(
        mockLibraries[1]
      );
      expect(mockPush).toHaveBeenCalledWith("/BRANCH-LIB/dashboard");
    });
  });

  describe("Multiple Libraries", () => {
    it("should handle single library", () => {
      renderWithProviders(<LibrarySelectionPage />, {
        libraries: [mockLibraries[0]],
      });

      expect(screen.getByText("Central Library")).toBeInTheDocument();
      expect(screen.queryByText("Branch Library")).not.toBeInTheDocument();
    });

    it("should handle many libraries", () => {
      const manyLibraries = Array.from({ length: 10 }, (_, i) => ({
        ...mockLibraries[0],
        id: `lib-${i}`,
        name: `Library ${i}`,
        code: `LIB-${i}`,
      }));

      renderWithProviders(<LibrarySelectionPage />, {
        libraries: manyLibraries,
      });

      manyLibraries.forEach((lib) => {
        expect(screen.getByText(lib.name)).toBeInTheDocument();
      });
    });
  });

  describe("Error Scenarios", () => {
    it("should handle library selection failure", async () => {
      const user = userEvent.setup();
      const { mockLibraryValue } = renderWithProviders(
        <LibrarySelectionPage />
      );

      mockLibraryValue.selectLibrary.mockImplementation(() => {
        throw new Error("Selection failed");
      });

      // Should not throw when library selection fails
      await expect(
        user.click(screen.getByTestId("library-lib-1"))
      ).resolves.not.toThrow();
    });

    it("should handle navigation failure gracefully", async () => {
      const user = userEvent.setup();
      mockPush.mockImplementation(() => {
        throw new Error("Navigation failed");
      });

      renderWithProviders(<LibrarySelectionPage />);

      // Should not throw when navigation fails
      await expect(
        user.click(screen.getByTestId("library-lib-1"))
      ).resolves.not.toThrow();
    });
  });

  describe("Library Roles", () => {
    it("should handle different user roles", async () => {
      const librariesWithRoles: LibraryWithAccess[] = [
        { ...mockLibraries[0], user_role: "owner" },
        { ...mockLibraries[1], user_role: "manager" },
      ];

      const user = userEvent.setup();
      const { mockLibraryValue } = renderWithProviders(
        <LibrarySelectionPage />,
        {
          libraries: librariesWithRoles,
        }
      );

      await user.click(screen.getByTestId("library-lib-1"));

      expect(mockLibraryValue.selectLibrary).toHaveBeenCalledWith(
        expect.objectContaining({ user_role: "owner" })
      );
    });
  });

  describe("Performance", () => {
    it("should handle rapid library selection", async () => {
      const user = userEvent.setup();
      const { mockLibraryValue } = renderWithProviders(
        <LibrarySelectionPage />
      );

      // Rapidly click different libraries
      await user.click(screen.getByTestId("library-lib-1"));
      await user.click(screen.getByTestId("library-lib-2"));
      await user.click(screen.getByTestId("library-lib-1"));

      expect(mockLibraryValue.selectLibrary).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenCalledTimes(3);
    });
  });
});
