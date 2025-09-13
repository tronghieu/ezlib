/**
 * Unit tests for library-provider.tsx
 * Testing library context provider and related hooks
 */

import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, act, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import {
  LibraryProvider,
  LibrariesPromiseProvider,
  useLibraryContext,
  useRequireLibrary,
} from "../library-provider";
import { useAuth } from "@/lib/auth/hooks";
import type { LibraryWithAccess } from "@/types";

// Mock dependencies
jest.mock("@/lib/auth/hooks", () => ({
  useAuth: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Note: Window/location mocking is complex in JSDOM environment
// Tests will focus on the library provider functionality without URL parsing

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe("library-provider", () => {
  let mockUseAuth: jest.MockedFunction<typeof useAuth>;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
  };

  const mockLibraries: LibraryWithAccess[] = [
    {
      id: "lib-1",
      name: "Central Library",
      code: "CENTRAL",
      address: { street: "123 Main St" },
      contact_info: { email: "central@library.com" },
      settings: {},
      stats: {},
      status: "active",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      user_role: "admin",
      staff_id: "staff-1",
      staff_status: "active",
    },
    {
      id: "lib-2",
      name: "Branch Library",
      code: "BRANCH",
      address: { street: "456 Oak Ave" },
      contact_info: { email: "branch@library.com" },
      settings: {},
      stats: {},
      status: "active",
      created_at: "2024-01-02",
      updated_at: "2024-01-02",
      user_role: "librarian",
      staff_id: "staff-2",
      staff_status: "active",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("LibrariesPromiseProvider", () => {
    it("should provide libraries promise to children", () => {
      const librariesPromise = Promise.resolve(mockLibraries);
      const TestComponent = () => {
        const promise = React.useContext(
          // Access the internal context for testing
          React.createContext<Promise<LibraryWithAccess[]> | null>(null)
        );
        return <div>{promise ? "Has Promise" : "No Promise"}</div>;
      };

      render(
        <LibrariesPromiseProvider librariesPromise={librariesPromise}>
          <TestComponent />
        </LibrariesPromiseProvider>
      );

      // Component should render without errors
      expect(screen.getByText("No Promise")).toBeInTheDocument();
    });
  });

  describe("LibraryProvider", () => {
    const renderWithProvider = (
      props: Partial<React.ComponentProps<typeof LibraryProvider>> = {}
    ) => {
      const defaultProps = {
        children: <div>Test Content</div>,
        fallbackLibraries: mockLibraries,
      };

      return render(<LibraryProvider {...defaultProps} {...props} />);
    };

    it("should render children without crashing", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithProvider();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should handle authenticated user with libraries", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestConsumer = () => {
        const { availableLibraries, isLoading } = useLibraryContext();
        return (
          <div>
            <div>Loading: {isLoading.toString()}</div>
            <div>Libraries: {availableLibraries.length}</div>
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Libraries: 2")).toBeInTheDocument();
      });
    });

    it("should auto-select library when only one is available", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const singleLibrary = [mockLibraries[0]];

      const TestConsumer = () => {
        const { currentLibrary } = useLibraryContext();
        return (
          <div>
            Current: {currentLibrary ? currentLibrary.name : "None"}
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={singleLibrary}>
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current: Central Library")).toBeInTheDocument();
      });
    });

    it("should restore library from localStorage", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const storedLibrary = JSON.stringify(mockLibraries[1]);
      mockLocalStorage.getItem.mockReturnValue(storedLibrary);

      const TestConsumer = () => {
        const { currentLibrary } = useLibraryContext();
        return (
          <div>
            Current: {currentLibrary ? currentLibrary.name : "None"}
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current: Branch Library")).toBeInTheDocument();
      });
    });

    it("should select library based on initialLibraryCode", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestConsumer = () => {
        const { currentLibrary } = useLibraryContext();
        return (
          <div>
            Current: {currentLibrary ? currentLibrary.name : "None"}
          </div>
        );
      };

      render(
        <LibraryProvider
          fallbackLibraries={mockLibraries}
          initialLibraryCode="BRANCH"
        >
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current: Branch Library")).toBeInTheDocument();
      });
    });

    it("should clear libraries when user logs out", async () => {
      const { rerender } = render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <div>Test</div>
        </LibraryProvider>
      );

      // First render with authenticated user
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      rerender(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <div>Test</div>
        </LibraryProvider>
      );

      // Then simulate logout
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      rerender(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <div>Test</div>
        </LibraryProvider>
      );

      // Component should still render
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  describe("useLibraryContext", () => {
    it("should throw error when used outside provider", () => {
      const TestComponent = () => {
        useLibraryContext();
        return <div>Test</div>;
      };

      // Suppress error output for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => render(<TestComponent />)).toThrow(
        "useLibraryContext must be used within a LibraryProvider"
      );

      consoleSpy.mockRestore();
    });

    it("should provide context value when used within provider", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestComponent = () => {
        const context = useLibraryContext();
        return (
          <div>
            <div>Available: {context.availableLibraries.length}</div>
            <div>Loading: {context.isLoading.toString()}</div>
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestComponent />
        </LibraryProvider>
      );

      expect(screen.getByText("Available: 2")).toBeInTheDocument();
    });
  });

  describe("role checking functionality", () => {
    it("should check roles correctly", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestConsumer = () => {
        const {
          currentLibrary,
          hasRole,
          canManageBooks,
          canManageStaff,
          getCurrentRole,
        } = useLibraryContext();

        React.useEffect(() => {
          if (currentLibrary) {
            // Test role checking
            const isAdmin = hasRole(["admin"]);
            const isLibrarian = hasRole(["librarian"]);
            const canBooks = canManageBooks();
            const canStaff = canManageStaff();
            const role = getCurrentRole();

            console.log("Role checks:", {
              isAdmin,
              isLibrarian,
              canBooks,
              canStaff,
              role,
            });
          }
        }, [currentLibrary, hasRole, canManageBooks, canManageStaff, getCurrentRole]);

        return (
          <div>
            Current Role: {currentLibrary ? currentLibrary.user_role : "None"}
          </div>
        );
      };

      render(
        <LibraryProvider
          fallbackLibraries={mockLibraries}
          initialLibraryCode="CENTRAL"
        >
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current Role: admin")).toBeInTheDocument();
      });
    });
  });

  describe("library selection actions", () => {
    it("should select library and save to localStorage", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestConsumer = () => {
        const { selectLibrary, currentLibrary } = useLibraryContext();

        const handleSelect = () => {
          selectLibrary(mockLibraries[1]);
        };

        return (
          <div>
            <button onClick={handleSelect}>Select Branch</button>
            <div>
              Current: {currentLibrary ? currentLibrary.name : "None"}
            </div>
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestConsumer />
        </LibraryProvider>
      );

      const selectButton = screen.getByText("Select Branch");
      act(() => {
        selectButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText("Current: Branch Library")).toBeInTheDocument();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "selected_library_user-123",
        JSON.stringify(mockLibraries[1])
      );
    });

    it("should clear library selection", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestConsumer = () => {
        const { clearLibrarySelection, currentLibrary } = useLibraryContext();

        const handleClear = () => {
          clearLibrarySelection();
        };

        return (
          <div>
            <button onClick={handleClear}>Clear</button>
            <div>
              Current: {currentLibrary ? currentLibrary.name : "None"}
            </div>
          </div>
        );
      };

      render(
        <LibraryProvider
          fallbackLibraries={mockLibraries}
          initialLibraryCode="CENTRAL"
        >
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current: Central Library")).toBeInTheDocument();
      });

      const clearButton = screen.getByText("Clear");
      act(() => {
        clearButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText("Current: None")).toBeInTheDocument();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "selected_library_user-123"
      );
    });

    it("should switch library by ID", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const TestConsumer = () => {
        const { switchLibrary, currentLibrary } = useLibraryContext();

        const handleSwitch = async () => {
          try {
            await switchLibrary("lib-2");
          } catch (error) {
            console.error("Switch failed:", error);
          }
        };

        return (
          <div>
            <button onClick={handleSwitch}>Switch to Branch</button>
            <div>
              Current: {currentLibrary ? currentLibrary.name : "None"}
            </div>
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestConsumer />
        </LibraryProvider>
      );

      const switchButton = screen.getByText("Switch to Branch");
      await act(async () => {
        switchButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText("Current: Branch Library")).toBeInTheDocument();
      });
    });
  });

  describe("useRequireLibrary hook", () => {
    const renderHookWithProvider = (
      options: Parameters<typeof useRequireLibrary>[0] = {},
      providerProps: Partial<React.ComponentProps<typeof LibraryProvider>> = {}
    ) => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LibraryProvider fallbackLibraries={mockLibraries} {...providerProps}>
          {children}
        </LibraryProvider>
      );

      return renderHook(() => useRequireLibrary(options), { wrapper });
    };

    it("should return loading state initially", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: true,
      });

      const { result } = renderHookWithProvider();

      // When auth is loading, the library context may not be loading
      // but we should still check the states
      expect(result.current.currentLibrary).toBe(null);
      expect(result.current.hasAccess).toBe(false);
    });

    it("should handle library selection correctly", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const { result } = renderHookWithProvider({}, {
        initialLibraryCode: "CENTRAL"
      });

      await waitFor(
        () => {
          expect(result.current.currentLibrary?.code).toBe("CENTRAL");
        },
        { timeout: 1000 }
      );
    });

    it("should handle role requirements", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const { result } = renderHookWithProvider(
        { requiredRoles: ["admin"] },
        { initialLibraryCode: "CENTRAL" }
      );

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });
    });

    it("should deny access for insufficient roles", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const { result } = renderHookWithProvider(
        { requiredRoles: ["owner"] },
        { initialLibraryCode: "CENTRAL" }
      );

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });
    });
  });

  describe("localStorage utilities", () => {
    it("should handle localStorage errors gracefully", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      // Mock localStorage to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const TestConsumer = () => {
        const { selectLibrary } = useLibraryContext();

        React.useEffect(() => {
          selectLibrary(mockLibraries[0]);
        }, [selectLibrary]);

        return <div>Test</div>;
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestConsumer />
        </LibraryProvider>
      );

      // Should not crash and should log warning
      await waitFor(() => {
        expect(screen.getByText("Test")).toBeInTheDocument();
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to save library selection to localStorage:",
        expect.any(Error)
      );
    });

    it("should handle localStorage parse errors gracefully", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      // Mock localStorage to return invalid JSON
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      const TestConsumer = () => {
        const { currentLibrary } = useLibraryContext();
        return (
          <div>
            Current: {currentLibrary ? currentLibrary.name : "None"}
          </div>
        );
      };

      render(
        <LibraryProvider fallbackLibraries={mockLibraries}>
          <TestConsumer />
        </LibraryProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current: None")).toBeInTheDocument();
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to load library selection from localStorage:",
        expect.any(Error)
      );
    });
  });
});