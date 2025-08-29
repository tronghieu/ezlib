/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SessionManager,
  getSessionManager,
  UserSessionPreferences,
  LibrarySessionContext,
  initializeSessionManagement,
} from "../session";

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
};

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: () => mockSupabaseClient,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window location
delete (window as any).location;
window.location = { href: "" } as any;

describe("Session Management Tests", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Reset localStorage mock implementation
    localStorageMock.getItem.mockImplementation((key: string) => {
      const store = (localStorageMock as any).store || {};
      return store[key] || null;
    });
    localStorageMock.setItem.mockImplementation(
      (key: string, value: string) => {
        if (!(localStorageMock as any).store) {
          (localStorageMock as any).store = {};
        }
        (localStorageMock as any).store[key] = value;
      }
    );
    localStorageMock.removeItem.mockImplementation((key: string) => {
      if ((localStorageMock as any).store) {
        delete (localStorageMock as any).store[key];
      }
    });

    // Reset singleton instance
    (SessionManager as any).instance = undefined;
    sessionManager = getSessionManager();

    // Mock successful session by default
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-123", email: "test@library.com" },
          access_token: "token-123",
        },
      },
    });
  });

  describe("Singleton pattern", () => {
    it("should return same instance when called multiple times", () => {
      const instance1 = getSessionManager();
      const instance2 = getSessionManager();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(SessionManager);
    });
  });

  describe("Library context management", () => {
    const testLibraryContext: LibrarySessionContext = {
      libraryId: "lib-123",
      libraryName: "Test Library",
      libraryCode: "TEST-LIB",
      role: "manager",
      permissions: ["books:view", "books:edit"],
      lastAccessed: "2023-08-29T10:00:00.000Z",
    };

    it("should store and retrieve library context", () => {
      sessionManager.setCurrentLibrary(testLibraryContext);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ezlib:library-management:current-library",
        expect.stringContaining(testLibraryContext.libraryId)
      );

      const retrieved = sessionManager.getCurrentLibrary();

      expect(retrieved).toBeDefined();
      expect(retrieved?.libraryId).toBe(testLibraryContext.libraryId);
      expect(retrieved?.libraryName).toBe(testLibraryContext.libraryName);
      expect(retrieved?.role).toBe(testLibraryContext.role);
    });

    it("should update lastAccessed when setting library context", () => {
      const beforeTime = Date.now();
      sessionManager.setCurrentLibrary(testLibraryContext);
      const afterTime = Date.now();

      const retrieved = sessionManager.getCurrentLibrary();
      const lastAccessedTime = new Date(retrieved!.lastAccessed).getTime();

      expect(lastAccessedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(lastAccessedTime).toBeLessThanOrEqual(afterTime);
    });

    it("should return null when no library context is stored", () => {
      const retrieved = sessionManager.getCurrentLibrary();
      expect(retrieved).toBeNull();
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(() =>
        sessionManager.setCurrentLibrary(testLibraryContext)
      ).not.toThrow();
    });
  });

  describe("User preferences management", () => {
    const testPreferences: UserSessionPreferences = {
      theme: "dark",
      language: "en",
      dashboardLayout: "compact",
      notificationSettings: {
        overdueReminders: true,
        systemAlerts: false,
        emailNotifications: true,
      },
    };

    it("should store and retrieve user preferences", () => {
      sessionManager.setUserPreferences(testPreferences);

      const retrieved = sessionManager.getUserPreferences();

      expect(retrieved).toEqual(testPreferences);
    });

    it("should merge partial preference updates", () => {
      sessionManager.setUserPreferences({ theme: "light", language: "es" });
      sessionManager.setUserPreferences({ theme: "dark" });

      const retrieved = sessionManager.getUserPreferences();

      expect(retrieved.theme).toBe("dark");
      expect(retrieved.language).toBe("es"); // Should preserve existing value
    });

    it("should return empty object when no preferences stored", () => {
      const retrieved = sessionManager.getUserPreferences();
      expect(retrieved).toEqual({});
    });
  });

  describe("Session data retrieval", () => {
    it("should return complete session data", async () => {
      const testLibrary: LibrarySessionContext = {
        libraryId: "lib-123",
        libraryName: "Test Library",
        libraryCode: "TEST-LIB",
        role: "librarian",
        permissions: ["books:view"],
        lastAccessed: "2023-08-29T10:00:00.000Z",
      };

      const testPreferences: UserSessionPreferences = {
        theme: "light",
      };

      sessionManager.setCurrentLibrary(testLibrary);
      sessionManager.setUserPreferences(testPreferences);

      const sessionData = await sessionManager.getSessionData();

      expect(sessionData).toHaveProperty("user");
      expect(sessionData).toHaveProperty("session");
      expect(sessionData).toHaveProperty("currentLibrary");
      expect(sessionData).toHaveProperty("preferences");
      expect(sessionData).toHaveProperty("sessionId");
      expect(sessionData).toHaveProperty("lastActivity");
      expect(sessionData).toHaveProperty("expiresAt");

      expect(sessionData.currentLibrary).toEqual(
        expect.objectContaining({
          libraryId: testLibrary.libraryId,
        })
      );
      expect(sessionData.preferences).toEqual(testPreferences);
    });
  });

  describe("Logout functionality", () => {
    it("should perform complete logout", async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      sessionManager.setCurrentLibrary({
        libraryId: "lib-123",
        libraryName: "Test Library",
        libraryCode: "TEST-LIB",
        role: "manager",
        permissions: ["books:view"],
        lastAccessed: "2023-08-29T10:00:00.000Z",
      });

      const { error } = await sessionManager.logout();

      expect(error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(window.location.href).toBe("/auth/login");
    });

    it("should handle logout errors", async () => {
      const logoutError = new Error("Logout failed");
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: logoutError });

      const { error } = await sessionManager.logout();

      expect(error).toBe(logoutError);
    });

    it("should clear all localStorage data on logout", async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // Set up some session data
      sessionManager.setCurrentLibrary({
        libraryId: "lib-123",
        libraryName: "Test Library",
        libraryCode: "TEST-LIB",
        role: "manager",
        permissions: [],
        lastAccessed: "2023-08-29T10:00:00.000Z",
      });
      sessionManager.setUserPreferences({ theme: "dark" });

      await sessionManager.logout();

      // Check that localStorage.removeItem was called for each session key
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ezlib:library-management:current-library"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ezlib:library-management:user-preferences"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ezlib:library-management:last-activity"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ezlib:library-management:session-id"
      );
    });
  });

  describe("Session refresh", () => {
    it("should refresh session successfully", async () => {
      const newSession = {
        user: { id: "user-123", email: "test@library.com" },
        access_token: "new-token-456",
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      const { session, error } = await sessionManager.refreshSession();

      expect(session).toEqual(newSession);
      expect(error).toBeNull();
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
    });

    it("should handle refresh errors", async () => {
      const refreshError = new Error("Refresh failed");
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: refreshError,
      });

      const { session, error } = await sessionManager.refreshSession();

      expect(session).toBeNull();
      expect(error).toBe(refreshError);
    });
  });

  describe("Session validation", () => {
    it("should validate active session", () => {
      sessionManager.updateLastActivity();

      expect(sessionManager.isSessionValid()).toBe(true);
    });

    it("should invalidate expired session", () => {
      // Set last activity to 31 minutes ago (past timeout)
      const expiredTime = new Date(Date.now() - 31 * 60 * 1000).toISOString();
      localStorageMock.setItem(
        "ezlib:library-management:last-activity",
        expiredTime
      );

      expect(sessionManager.isSessionValid()).toBe(false);
    });

    it("should invalidate session with no activity", () => {
      expect(sessionManager.isSessionValid()).toBe(false);
    });
  });

  describe("Activity tracking", () => {
    it("should update last activity timestamp", () => {
      const beforeTime = Date.now();
      sessionManager.updateLastActivity();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ezlib:library-management:last-activity",
        expect.any(String)
      );

      // Get the stored timestamp and verify it's recent
      const calls = localStorageMock.setItem.mock.calls;
      const lastCall = calls[calls.length - 1];
      const storedTime = new Date(lastCall[1]).getTime();

      expect(storedTime).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe("Event system", () => {
    it("should dispatch and listen to session events", (done) => {
      const testData = { test: "data" };

      const removeListener = sessionManager.addEventListener(
        "library-changed",
        (data) => {
          expect(data).toEqual(testData);
          removeListener();
          done();
        }
      );

      // Simulate library change to trigger event
      sessionManager.setCurrentLibrary({
        libraryId: "new-lib",
        libraryName: "New Library",
        libraryCode: "NEW-LIB",
        role: "owner",
        permissions: [],
        lastAccessed: new Date().toISOString(),
      });
    });
  });

  describe("Initialization", () => {
    it("should initialize session management", () => {
      expect(() => initializeSessionManagement()).not.toThrow();
    });

    it("should not initialize in server environment", () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => initializeSessionManagement()).not.toThrow();

      global.window = originalWindow;
    });
  });
});
