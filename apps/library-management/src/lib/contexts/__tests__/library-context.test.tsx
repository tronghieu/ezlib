import { MockLibraryProvider, MockAuthProvider } from "@/lib/test-utils";
/**
 * Tests for Library Context Provider
 * Validates multi-tenant state management and library selection
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  // LibraryProvider, // Using MockLibraryProvider instead
  useLibraryContext,
  withLibraryAccess,
} from "../library-context";

import { createClient } from "@/lib/supabase/client";
import type { LibraryWithAccess } from "@/types";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Test data
const mockUser = {
  id: "test-user-123",
  email: "test@library.com",
  created_at: "2024-01-01T00:00:00Z",
};

const mockLibraries: LibraryWithAccess[] = [
  {
    id: "lib-1",
    name: "Test Library 1",
    code: "TEST-LIB-1",
    address: { city: "New York", state: "NY" },
    contact_info: { email: "lib1@test.com" },
    settings: {},
    stats: { total_books: 100 },
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_role: "admin",
    staff_id: "staff-1",
    staff_status: "active",
  },
  {
    id: "lib-2",
    name: "Test Library 2",
    code: "TEST-LIB-2",
    address: { city: "Los Angeles", state: "CA" },
    contact_info: { email: "lib2@test.com" },
    settings: {},
    stats: { total_books: 200 },
    status: "active",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    user_role: "librarian",
    staff_id: "staff-2",
    staff_status: "active",
  },
];

// Helper component to test context
function TestComponent() {
  const context = useLibraryContext();
  return (
    <div>
      <div data-testid="current-library">
        {context.currentLibrary?.name || "No library selected"}
      </div>
      <div data-testid="available-count">
        {context.availableLibraries.length}
      </div>
      <div data-testid="loading">{context.isLoading.toString()}</div>
      <div data-testid="error">{context.error || "No error"}</div>
      {context.availableLibraries.map((lib) => (
        <button
          key={lib.id}
          data-testid={`select-${lib.id}`}
          onClick={() => context.selectLibrary(lib)}
        >
          Select {lib.name}
        </button>
      ))}
      <button
        data-testid="clear-selection"
        onClick={() => context.clearLibrarySelection()}
      >
        Clear Selection
      </button>
      <button data-testid="refresh" onClick={() => context.refreshLibraries()}>
        Refresh
      </button>
    </div>
  );
}

// Helper to render with providers
function renderWithProviders(
  ui: React.ReactElement,
  { user = mockUser }: { user?: typeof mockUser | null } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock auth context value
  const mockAuthValue = {
    user,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider value={mockAuthValue}>
        <MockLibraryProvider value={{}}>{ui}</MockLibraryProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  );
}

describe("LibraryContext", () => {
  let mockSupabase: {
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    single: jest.Mock;
    order: jest.Mock;
    is: jest.Mock;
    auth: {
      getUser: jest.Mock;
    };
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      auth: {
        getUser: jest.fn(),
      },
    } as jest.MockedObject<ReturnType<typeof createClient>>;

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock console methods to reduce test noise
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Provider Initialization", () => {
    it("should initialize with empty state when no user", async () => {
      renderWithProviders(<TestComponent />, { user: null });

      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "No library selected"
      );
      expect(screen.getByTestId("available-count")).toHaveTextContent("0");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("No error");
    });

    it("should fetch libraries when user is authenticated", async () => {
      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });
    });

    it("should auto-select single library", async () => {
      const singleLibrary = [mockLibraries[0]];
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: singleLibrary[0].staff_id,
            role: singleLibrary[0].user_role,
            status: singleLibrary[0].staff_status,
            libraries: {
              id: singleLibrary[0].id,
              name: singleLibrary[0].name,
              code: singleLibrary[0].code,
              address: singleLibrary[0].address,
              contact_info: singleLibrary[0].contact_info,
              settings: singleLibrary[0].settings,
              stats: singleLibrary[0].stats,
              status: singleLibrary[0].status,
              created_at: singleLibrary[0].created_at,
              updated_at: singleLibrary[0].updated_at,
            },
          },
        ],
        error: null,
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("current-library")).toHaveTextContent(
          "Test Library 1"
        );
      });

      // Verify localStorage persistence
      const stored = localStorage.getItem(`selected_library_${mockUser.id}`);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe("lib-1");
    });

    it("should handle fetch error gracefully", async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to fetch libraries: Network error"
        );
      });
    });
  });

  describe("Library Selection", () => {
    beforeEach(async () => {
      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });
    });

    it("should select library and persist to localStorage", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });

      // Select library 1
      await user.click(screen.getByTestId("select-lib-1"));

      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "Test Library 1"
      );

      // Verify localStorage
      const stored = localStorage.getItem(`selected_library_${mockUser.id}`);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe("lib-1");
    });

    it("should clear library selection", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });

      // Select then clear
      await user.click(screen.getByTestId("select-lib-1"));
      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "Test Library 1"
      );

      await user.click(screen.getByTestId("clear-selection"));
      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "No library selected"
      );

      // Verify localStorage cleared
      const stored = localStorage.getItem(`selected_library_${mockUser.id}`);
      expect(stored).toBeNull();
    });

    it("should switch between libraries", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });

      // Select library 1
      await user.click(screen.getByTestId("select-lib-1"));
      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "Test Library 1"
      );

      // Switch to library 2
      await user.click(screen.getByTestId("select-lib-2"));
      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "Test Library 2"
      );
    });
  });

  describe("Library Persistence", () => {
    it("should restore library from localStorage on mount", async () => {
      // Pre-populate localStorage
      const storedLibrary = mockLibraries[1];
      localStorage.setItem(
        `selected_library_${mockUser.id}`,
        JSON.stringify(storedLibrary)
      );

      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("current-library")).toHaveTextContent(
          "Test Library 2"
        );
      });
    });

    it("should clear invalid stored library", async () => {
      // Store library that user no longer has access to
      const invalidLibrary = {
        ...mockLibraries[0],
        id: "invalid-lib",
      };
      localStorage.setItem(
        `selected_library_${mockUser.id}`,
        JSON.stringify(invalidLibrary)
      );

      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("current-library")).toHaveTextContent(
          "No library selected"
        );
      });

      // Verify localStorage was cleared
      const stored = localStorage.getItem(`selected_library_${mockUser.id}`);
      expect(stored).toBeNull();
    });
  });

  describe("Library Switching with Validation", () => {
    it("should validate library access when switching", async () => {
      const TestSwitchComponent = () => {
        const { switchLibrary, currentLibrary, error } = useLibraryContext();
        const [switching, setSwitching] = React.useState(false);

        const handleSwitch = async () => {
          setSwitching(true);
          try {
            await switchLibrary("lib-2");
          } catch {
            // Error handled by context
          }
          setSwitching(false);
        };

        return (
          <div>
            <div data-testid="current">{currentLibrary?.id || "none"}</div>
            <div data-testid="error">{error || "none"}</div>
            <button onClick={handleSwitch} disabled={switching}>
              Switch to lib-2
            </button>
          </div>
        );
      };

      // Setup initial libraries
      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      // Mock validation check
      mockSupabase.single = jest.fn().mockResolvedValue({
        data: {
          id: "staff-2",
          role: "librarian",
          permissions: { manage_books: false },
          status: "active",
          libraries: mockLibraries[1],
        },
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<TestSwitchComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("current")).toHaveTextContent("none");
      });

      await user.click(screen.getByText("Switch to lib-2"));

      await waitFor(() => {
        expect(screen.getByTestId("current")).toHaveTextContent("lib-2");
      });
    });

    it("should handle access denied error", async () => {
      const TestSwitchComponent = () => {
        const { switchLibrary, error } = useLibraryContext();

        const handleSwitch = async () => {
          try {
            await switchLibrary("lib-denied");
          } catch {
            // Error handled by context
          }
        };

        return (
          <div>
            <div data-testid="error">{error || "none"}</div>
            <button onClick={handleSwitch}>Switch to denied</button>
          </div>
        );
      };

      // Setup initial libraries
      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      // Mock validation failure
      mockSupabase.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Access denied" },
      });

      const user = userEvent.setup();
      renderWithProviders(<TestSwitchComponent />);

      await user.click(screen.getByText("Switch to denied"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Access denied");
      });
    });
  });

  describe("withLibraryAccess HOC", () => {
    it("should render component when library is selected", async () => {
      const TestProtectedComponent = () => <div>Protected Content</div>;
      const Protected = withLibraryAccess(TestProtectedComponent);

      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: mockLibraries[0].staff_id,
            role: mockLibraries[0].user_role,
            status: mockLibraries[0].staff_status,
            libraries: {
              id: mockLibraries[0].id,
              name: mockLibraries[0].name,
              code: mockLibraries[0].code,
              address: mockLibraries[0].address,
              contact_info: mockLibraries[0].contact_info,
              settings: mockLibraries[0].settings,
              stats: mockLibraries[0].stats,
              status: mockLibraries[0].status,
              created_at: mockLibraries[0].created_at,
              updated_at: mockLibraries[0].updated_at,
            },
          },
        ],
        error: null,
      });

      renderWithProviders(<Protected />);

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("should redirect when no library selected", async () => {
      const TestProtectedComponent = () => <div>Protected Content</div>;
      const Protected = withLibraryAccess(TestProtectedComponent);

      // Mock window.location
      delete (window as typeof window).location;
      window.location = { href: "" } as Location;

      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      renderWithProviders(<Protected />);

      await waitFor(() => {
        expect(window.location.href).toBe("/");
      });
    });

    it("should show loading state", () => {
      const TestProtectedComponent = () => <div>Protected Content</div>;
      const Protected = withLibraryAccess(TestProtectedComponent);

      // Override the context to show loading
      const LoadingWrapper = () => {
        return (
          <MockLibraryProvider
            value={{
              currentLibrary: null,
              availableLibraries: [],
              isLoading: true,
              error: null,
              selectLibrary: jest.fn(),
              refreshLibraries: jest.fn(),
              clearLibrarySelection: jest.fn(),
              switchLibrary: jest.fn(),
            }}
          >
            <Protected />
          </MockLibraryProvider>
        );
      };

      renderWithProviders(<LoadingWrapper />);

      // Should show loading spinner
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should show error state", () => {
      const TestProtectedComponent = () => <div>Protected Content</div>;
      const Protected = withLibraryAccess(TestProtectedComponent);

      // Override the context to show error
      const ErrorWrapper = () => {
        return (
          <MockLibraryProvider
            value={{
              currentLibrary: null,
              availableLibraries: [],
              isLoading: false,
              error: "Test error message",
              selectLibrary: jest.fn(),
              refreshLibraries: jest.fn(),
              clearLibrarySelection: jest.fn(),
              switchLibrary: jest.fn(),
            }}
          >
            <Protected />
          </MockLibraryProvider>
        );
      };

      renderWithProviders(<ErrorWrapper />);

      expect(screen.getByText("Library Access Error")).toBeInTheDocument();
      expect(screen.getByText("Test error message")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully", async () => {
      // Mock localStorage to throw errors
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error("Storage quota exceeded");
      });

      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);

      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });

      // Selection should still work despite localStorage error
      await user.click(screen.getByTestId("select-lib-1"));
      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "Test Library 1"
      );

      // Verify console warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save library selection"),
        expect.any(Error)
      );

      // Restore original localStorage
      Storage.prototype.setItem = originalSetItem;
    });

    it("should handle corrupted localStorage data", async () => {
      // Store corrupted data
      localStorage.setItem(`selected_library_${mockUser.id}`, "invalid json");

      mockSupabase.order.mockResolvedValue({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });

      // Should still initialize properly despite corrupted storage
      expect(screen.getByTestId("current-library")).toHaveTextContent(
        "No library selected"
      );

      // Verify console warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load library selection"),
        expect.any(Error)
      );
    });
  });

  describe("Refresh Libraries", () => {
    it("should refresh library list", async () => {
      const user = userEvent.setup();

      // Initial data
      mockSupabase.order.mockResolvedValueOnce({
        data: [
          {
            id: mockLibraries[0].staff_id,
            role: mockLibraries[0].user_role,
            status: mockLibraries[0].staff_status,
            libraries: {
              id: mockLibraries[0].id,
              name: mockLibraries[0].name,
              code: mockLibraries[0].code,
              address: mockLibraries[0].address,
              contact_info: mockLibraries[0].contact_info,
              settings: mockLibraries[0].settings,
              stats: mockLibraries[0].stats,
              status: mockLibraries[0].status,
              created_at: mockLibraries[0].created_at,
              updated_at: mockLibraries[0].updated_at,
            },
          },
        ],
        error: null,
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("1");
      });

      // Mock updated data for refresh
      mockSupabase.order.mockResolvedValueOnce({
        data: mockLibraries.map((lib) => ({
          id: lib.staff_id,
          role: lib.user_role,
          status: lib.staff_status,
          libraries: {
            id: lib.id,
            name: lib.name,
            code: lib.code,
            address: lib.address,
            contact_info: lib.contact_info,
            settings: lib.settings,
            stats: lib.stats,
            status: lib.status,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
          },
        })),
        error: null,
      });

      await user.click(screen.getByTestId("refresh"));

      await waitFor(() => {
        expect(screen.getByTestId("available-count")).toHaveTextContent("2");
      });
    });
  });

  describe("Context Outside Provider", () => {
    it("should throw error when useLibraryContext is used outside provider", () => {
      const TestComponentOutside = () => {
        useLibraryContext();
        return <div>Should not render</div>;
      };

      // Suppress error output for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => render(<TestComponentOutside />)).toThrow(
        "useLibraryContext must be used within a LibraryProvider"
      );

      console.error = originalError;
    });
  });
});
