/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  AuthProvider,
  useAuthContext,
  withAuth,
  withLibraryAccess,
} from "../context";
import { getSessionManager } from "../session";

// Mock Supabase client
const mockSupabaseAuth = {
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  signOut: jest.fn(),
};

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
};

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: () => mockSupabaseClient,
}));

// Mock SessionManager
const mockSessionManager = {
  getSessionData: jest.fn(),
  setCurrentLibrary: jest.fn(),
  setUserPreferences: jest.fn(),
  logout: jest.fn(),
  addEventListener: jest.fn(),
  refreshSession: jest.fn(),
};

jest.mock("../session", () => ({
  getSessionManager: jest.fn(() => mockSessionManager),
}));

// Test components
function TestComponent() {
  const auth = useAuthContext();

  return (
    <div>
      <div data-testid="loading">
        {auth.loading ? "loading" : "not-loading"}
      </div>
      <div data-testid="authenticated">
        {auth.isAuthenticated ? "authenticated" : "not-authenticated"}
      </div>
      <div data-testid="library-access">
        {auth.hasLibraryAccess ? "has-access" : "no-access"}
      </div>
      <div data-testid="user-email">{auth.user?.email || "no-user"}</div>
      <div data-testid="error">{auth.error || "no-error"}</div>
      <button onClick={() => auth.signOut()}>Sign Out</button>
      <button onClick={() => auth.clearError()}>Clear Error</button>
    </div>
  );
}

const AuthenticatedTestComponent = withAuth(() => (
  <div data-testid="protected">Protected Content</div>
));
const LibraryAccessTestComponent = withLibraryAccess(() => (
  <div data-testid="library-content">Library Content</div>
));

describe("AuthContext Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful session mock
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-123", email: "test@library.com" },
          access_token: "token-123",
        },
      },
      error: null,
    });

    // Default auth state change subscription mock
    mockSupabaseAuth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });

    // Default session manager mocks
    mockSessionManager.getSessionData.mockResolvedValue({
      user: { id: "user-123", email: "test@library.com" },
      session: null,
      currentLibrary: null,
      preferences: {},
      sessionId: "session-123",
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

    mockSessionManager.addEventListener.mockImplementation(() => () => {}); // Return cleanup function
    mockSessionManager.logout.mockResolvedValue({ error: null });
    mockSessionManager.refreshSession.mockResolvedValue({
      session: null,
      error: null,
    });
  });

  describe("AuthProvider initialization", () => {
    it("should initialize with loading state", async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("loading");

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });
    });

    it("should load user session on initialization", async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "authenticated"
        );
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          "test@library.com"
        );
      });

      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
      expect(mockSessionManager.getSessionData).toHaveBeenCalled();
    });

    it("should handle initialization errors", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Session error");
      });
    });
  });

  describe("Authentication state management", () => {
    it("should handle user not authenticated", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "not-authenticated"
        );
        expect(screen.getByTestId("user-email")).toHaveTextContent("no-user");
      });
    });

    it("should handle auth state changes", async () => {
      let authCallback: (event: string, session: unknown) => void = () => {};

      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate sign in
      await act(async () => {
        authCallback("SIGNED_IN", {
          user: { id: "user-456", email: "new@library.com" },
          access_token: "new-token",
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          "new@library.com"
        );
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "authenticated"
        );
      });
    });

    it("should handle sign out events", async () => {
      let authCallback: (event: string, session: unknown) => void = () => {};

      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "authenticated"
        );
      });

      // Simulate sign out
      await act(async () => {
        authCallback("SIGNED_OUT", null);
      });

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "not-authenticated"
        );
        expect(screen.getByTestId("user-email")).toHaveTextContent("no-user");
      });
    });
  });

  describe("Library context management", () => {
    it("should handle library access state", async () => {
      mockSessionManager.getSessionData.mockResolvedValue({
        user: { id: "user-123", email: "test@library.com" },
        session: null,
        currentLibrary: {
          libraryId: "lib-123",
          libraryName: "Test Library",
          libraryCode: "TEST",
          role: "manager",
          permissions: ["books:view"],
          lastAccessed: new Date().toISOString(),
        },
        preferences: {},
        sessionId: "session-123",
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("library-access")).toHaveTextContent(
          "has-access"
        );
      });
    });

    it("should handle library context actions", async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "authenticated"
        );
      });

      // Test library context would be handled by session manager
      expect(mockSessionManager.addEventListener).toHaveBeenCalledWith(
        "library-changed",
        expect.any(Function)
      );
    });
  });

  describe("Context actions", () => {
    it("should handle sign out action", async () => {
      mockSessionManager.logout.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "authenticated"
        );
      });

      const signOutButton = screen.getByText("Sign Out");

      await act(async () => {
        signOutButton.click();
      });

      expect(mockSessionManager.logout).toHaveBeenCalled();
    });

    it("should handle error clearing", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Test error" },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Test error");
      });

      const clearErrorButton = screen.getByText("Clear Error");

      await act(async () => {
        clearErrorButton.click();
      });

      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });
  });

  describe("Higher-Order Components", () => {
    it("should show loading for withAuth when loading", async () => {
      mockSupabaseAuth.getSession.mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(
        <AuthProvider>
          <AuthenticatedTestComponent />
        </AuthProvider>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show authentication required for withAuth when not authenticated", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <AuthenticatedTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Authentication required")).toBeInTheDocument();
      });
    });

    it("should show protected content for withAuth when authenticated", async () => {
      render(
        <AuthProvider>
          <AuthenticatedTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("protected")).toHaveTextContent(
          "Protected Content"
        );
      });
    });

    it("should show library access required for withLibraryAccess when no library access", async () => {
      render(
        <AuthProvider>
          <LibraryAccessTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Library access required")).toBeInTheDocument();
      });
    });

    it("should show library content for withLibraryAccess when has access", async () => {
      mockSessionManager.getSessionData.mockResolvedValue({
        user: { id: "user-123", email: "test@library.com" },
        session: null,
        currentLibrary: {
          libraryId: "lib-123",
          libraryName: "Test Library",
          libraryCode: "TEST",
          role: "manager",
          permissions: ["books:view"],
          lastAccessed: new Date().toISOString(),
        },
        preferences: {},
        sessionId: "session-123",
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      render(
        <AuthProvider>
          <LibraryAccessTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("library-content")).toHaveTextContent(
          "Library Content"
        );
      });
    });
  });

  describe("Error handling", () => {
    it("should throw error when useAuthContext is used outside provider", () => {
      // Suppress console error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuthContext must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });
});
