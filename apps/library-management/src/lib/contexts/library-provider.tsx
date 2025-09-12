"use client";

/**
 * Modern Library Provider using Server Components + Promise Pattern
 * Leverages React's `use` hook for streaming server data to client
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  use,
  useEffect,
  useMemo,
} from "react";
import type { LibraryWithAccess } from "@/types";
import { useAuth } from "@/lib/auth/hooks";

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface LibraryContextState {
  // Current selected library
  currentLibrary: LibraryWithAccess | null;
  
  // Available libraries (resolved from promise)
  availableLibraries: LibraryWithAccess[];
  
  // Loading states
  isLoading: boolean;
  
  // Error handling
  error: string | null;
}

interface LibraryContextActions {
  // Library selection
  selectLibrary: (library: LibraryWithAccess) => void;
  clearLibrarySelection: () => void;
  switchLibrary: (libraryId: string) => Promise<void>;
  
  // Data refresh
  refreshLibraries: () => Promise<void>;
  
  // Permission helpers
  hasRole: (requiredRoles: string[]) => boolean;
  hasMinimumRoleLevel: (minimumRole: string) => boolean;
  
  // Specific permission checks
  canManageBooks: () => boolean;
  canManageMembers: () => boolean;
  canManageStaff: () => boolean;
  canViewReports: () => boolean;
  canManageSettings: () => boolean;
  getCurrentRole: () => string | null;
}

type LibraryContextValue = LibraryContextState & LibraryContextActions;

// =============================================================================
// CONTEXT DEFINITION
// =============================================================================

const LibraryContext = createContext<LibraryContextValue | null>(null);

const LibrariesPromiseContext = createContext<Promise<LibraryWithAccess[]> | null>(null);

// =============================================================================
// ROLE CHECKING UTILITIES
// =============================================================================

const ROLE_HIERARCHY = ["volunteer", "librarian", "manager", "owner"];

function hasAnyRole(currentRole: string, requiredRoles: string[]): boolean {
  if (!currentRole || requiredRoles.length === 0) return false;
  return requiredRoles.includes(currentRole);
}

function hasMinimumRole(currentRole: string, minimumRole: string): boolean {
  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
  const minimumIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  return currentIndex >= minimumIndex;
}

// =============================================================================
// LOCAL STORAGE UTILITIES
// =============================================================================

const LIBRARY_STORAGE_KEY = "selected_library";

function saveSelectedLibraryToStorage(
  library: LibraryWithAccess | null,
  userId: string
): void {
  try {
    const key = `${LIBRARY_STORAGE_KEY}_${userId}`;
    if (library) {
      localStorage.setItem(key, JSON.stringify(library));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("Failed to save library selection to localStorage:", error);
  }
}

function loadSelectedLibraryFromStorage(
  userId: string
): LibraryWithAccess | null {
  try {
    const key = `${LIBRARY_STORAGE_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Failed to load library selection from localStorage:", error);
    return null;
  }
}

// =============================================================================
// LIBRARIES PROMISE PROVIDER (FOR SERVER-SIDE DATA)
// =============================================================================

interface LibrariesPromiseProviderProps {
  children: React.ReactNode;
  librariesPromise: Promise<LibraryWithAccess[]>;
}

export function LibrariesPromiseProvider({
  children,
  librariesPromise,
}: LibrariesPromiseProviderProps): React.JSX.Element {
  return (
    <LibrariesPromiseContext.Provider value={librariesPromise}>
      {children}
    </LibrariesPromiseContext.Provider>
  );
}

// =============================================================================
// MAIN LIBRARY PROVIDER (CLIENT-SIDE STATE MANAGEMENT)
// =============================================================================

interface LibraryProviderProps {
  children: React.ReactNode;
  fallbackLibraries?: LibraryWithAccess[]; // For client-only fallback
}

export function LibraryProvider({
  children,
  fallbackLibraries = [],
}: LibraryProviderProps): React.JSX.Element {
  // Auth context
  const { user, loading: authLoading } = useAuth();
  
  // Local state
  const [currentLibrary, setCurrentLibrary] = useState<LibraryWithAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get libraries promise from context or use fallback
  const librariesPromiseContext = useContext(LibrariesPromiseContext);
  
  // Client-side library fetching state
  const [clientLibraries, setClientLibraries] = useState<LibraryWithAccess[]>([]);
  const [clientFetchComplete, setClientFetchComplete] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Resolve libraries from promise or use fallback
  const availableLibraries = useMemo(() => {
    try {
      console.log("[Library Context] Computing availableLibraries:", {
        hasUser: !!user,
        hasPromiseContext: !!librariesPromiseContext,
        clientFetchComplete,
        clientLibrariesLength: clientLibraries.length,
        fallbackLibrariesLength: fallbackLibraries.length
      });
      
      // Prioritize client-fetched libraries if available
      if (clientFetchComplete && clientLibraries.length > 0) {
        console.log("[Library Context] Using client-fetched libraries:", clientLibraries);
        return clientLibraries;
      }
      
      // If user is authenticated, use client-fetched or try promise resolution  
      if (user) {
        if (librariesPromiseContext) {
          // For now, return fallback until we fix the promise resolution pattern
          console.log("[Library Context] Using fallback libraries (promise context exists)");
          return fallbackLibraries;
        }
        
        // If no promise context but user is authenticated, fallback to empty array
        // This will trigger client-side fetch
        console.log("[Library Context] User authenticated, using fallback libraries");
        return fallbackLibraries;
      }
      
      // No user, return empty array to avoid confusion
      console.log("[Library Context] No user, returning empty libraries");
      return [];
    } catch (error) {
      console.error("Failed to resolve libraries promise:", error);
      setError(error instanceof Error ? error.message : "Failed to load libraries");
      return fallbackLibraries;
    }
  }, [librariesPromiseContext, user, fallbackLibraries, clientLibraries, clientFetchComplete]);

  // Client-side library fetching effect
  useEffect(() => {
    async function fetchClientLibraries() {
      if (!user || authLoading) return;
      
      // Reset client library state when user changes
      if (!clientFetchComplete || clientLibraries.length === 0) {
        try {
          setIsLoading(true);
          console.log("[Library Context] Fetching libraries client-side for user:", user.id);
          
          // Import getUserLibraries dynamically to avoid SSR issues
          const { getUserLibraries } = await import("@/lib/actions/library-actions");
          const libraries = await getUserLibraries();
          
          console.log("[Library Context] Client-side fetch completed, libraries:", libraries);
          setClientLibraries(libraries);
          setClientFetchComplete(true);
          setError(null);
        } catch (err) {
          console.error("[Library Context] Client-side fetch failed:", err);
          setError(err instanceof Error ? err.message : "Failed to load libraries");
          setClientFetchComplete(true); // Mark as complete even on error to avoid retry loops
        } finally {
          setIsLoading(false);
        }
      }
    }

    // Clear client libraries when user changes or logs out
    if (!user) {
      console.log("[Library Context] User logged out, clearing client libraries");
      setClientLibraries([]);
      setClientFetchComplete(false);
      setLastUserId(null);
      setError(null);
      return;
    }

    // Clear client libraries when user ID changes (user switched)
    if (user.id !== lastUserId) {
      console.log("[Library Context] User changed from", lastUserId, "to", user.id, "- clearing client libraries");
      setClientLibraries([]);
      setClientFetchComplete(false);
      setLastUserId(user.id);
      setError(null);
    }

    fetchClientLibraries();
  }, [user, authLoading]);

  // Auto-restore selected library from localStorage when libraries are loaded
  useEffect(() => {
    if (!user || authLoading) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      if (availableLibraries.length === 0) {
        setIsLoading(false);
        return;
      }

      // Try to restore from localStorage
      const storedLibrary = loadSelectedLibraryFromStorage(user.id);
      
      if (storedLibrary) {
        // Validate stored library is still accessible
        const isStillAccessible = availableLibraries.some(
          (lib) => lib.id === storedLibrary.id
        );
        
        if (isStillAccessible) {
          const updatedLibrary = availableLibraries.find(
            (lib) => lib.id === storedLibrary.id
          );
          setCurrentLibrary(updatedLibrary || null);
        } else {
          // Stored library no longer accessible, clear it
          saveSelectedLibraryToStorage(null, user.id);
        }
      } else if (availableLibraries.length === 1) {
        // Auto-select if only one library
        setCurrentLibrary(availableLibraries[0]);
        saveSelectedLibraryToStorage(availableLibraries[0], user.id);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize library context");
      setIsLoading(false);
    }
  }, [user, authLoading, availableLibraries]);

  // Actions
  const selectLibrary = useCallback(
    (library: LibraryWithAccess): void => {
      if (!user) return;
      
      setCurrentLibrary(library);
      saveSelectedLibraryToStorage(library, user.id);
      setError(null);
    },
    [user]
  );

  const clearLibrarySelection = useCallback((): void => {
    if (!user) return;
    
    setCurrentLibrary(null);
    saveSelectedLibraryToStorage(null, user.id);
  }, [user]);

  const switchLibrary = useCallback(
    async (libraryId: string): Promise<void> => {
      if (!user) {
        throw new Error("User must be authenticated to switch libraries");
      }

      // Find the library in available libraries
      const targetLibrary = availableLibraries.find(
        (lib) => lib.id === libraryId
      );
      
      if (!targetLibrary) {
        throw new Error("Library not found in available libraries");
      }

      selectLibrary(targetLibrary);
    },
    [user, availableLibraries, selectLibrary]
  );

  const refreshLibraries = useCallback(async (): Promise<void> => {
    // In the promise-based pattern, library refreshing would typically
    // be handled by revalidating the server component that provides the promise
    // For now, we'll just reset error state
    setError(null);
  }, []);

  // Permission helpers
  const hasRole = useCallback(
    (requiredRoles: string[]): boolean => {
      if (!currentLibrary?.user_role) return false;
      return hasAnyRole(currentLibrary.user_role, requiredRoles);
    },
    [currentLibrary?.user_role]
  );

  const hasMinimumRoleLevel = useCallback(
    (minimumRole: string): boolean => {
      if (!currentLibrary?.user_role) return false;
      return hasMinimumRole(currentLibrary.user_role, minimumRole);
    },
    [currentLibrary?.user_role]
  );

  // Specific role helpers
  const canManageBooks = useCallback(
    () => hasRole(["owner", "manager", "librarian"]),
    [hasRole]
  );

  const canManageMembers = useCallback(
    () => hasRole(["owner", "manager", "librarian"]),
    [hasRole]
  );

  const canManageStaff = useCallback(() => hasRole(["owner"]), [hasRole]);

  const canViewReports = useCallback(
    () => hasRole(["owner", "manager"]),
    [hasRole]
  );

  const canManageSettings = useCallback(() => hasRole(["owner"]), [hasRole]);

  const getCurrentRole = useCallback(
    () => currentLibrary?.user_role || null,
    [currentLibrary?.user_role]
  );

  const contextValue: LibraryContextValue = {
    currentLibrary,
    availableLibraries,
    isLoading,
    error,
    selectLibrary,
    clearLibrarySelection,
    switchLibrary,
    refreshLibraries,
    hasRole,
    hasMinimumRoleLevel,
    canManageBooks,
    canManageMembers,
    canManageStaff,
    canViewReports,
    canManageSettings,
    getCurrentRole,
  };

  return (
    <LibraryContext.Provider value={contextValue}>
      {children}
    </LibraryContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

export function useLibraryContext(): LibraryContextValue {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error("useLibraryContext must be used within a LibraryProvider");
  }

  return context;
}

// =============================================================================
// MODERN HOOK-BASED LIBRARY ACCESS REQUIREMENTS
// =============================================================================

interface UseRequireLibraryOptions {
  redirectTo?: string;
  requiredRoles?: string[];
}

export function useRequireLibrary(
  options: UseRequireLibraryOptions = {}
): {
  currentLibrary: LibraryWithAccess | null;
  isLoading: boolean;
  hasAccess: boolean;
} {
  const { redirectTo = "/", requiredRoles = [] } = options;
  const {
    currentLibrary,
    isLoading,
    error,
    availableLibraries,
    hasRole,
    selectLibrary,
  } = useLibraryContext();

  // Try to auto-select library from URL
  useEffect(() => {
    if (
      !currentLibrary &&
      !isLoading &&
      availableLibraries.length > 0 &&
      typeof window !== "undefined"
    ) {
      const pathSegments = window.location.pathname.split("/");
      const libraryCode = pathSegments[1];

      if (libraryCode) {
        const libraryByCode = availableLibraries.find(
          (lib) => lib.code === libraryCode
        );
        
        if (libraryByCode) {
          selectLibrary(libraryByCode);
        }
      }
    }
  }, [currentLibrary, isLoading, availableLibraries, selectLibrary]);

  // Check if user has required roles
  const hasRequiredRoles = requiredRoles.length === 0 || hasRole(requiredRoles);

  // Redirect logic
  useEffect(() => {
    if (!isLoading && !error) {
      if (!currentLibrary) {
        // No library selected - redirect to selection
        if (typeof window !== "undefined") {
          const currentUrl = new URL(window.location.href);
          const existingRedirectTo = currentUrl.searchParams.get("redirectTo");
          
          if (existingRedirectTo && redirectTo === "/") {
            const loginUrl = new URL("/auth/login", window.location.origin);
            loginUrl.searchParams.set("redirectTo", existingRedirectTo);
            window.location.href = loginUrl.toString();
          } else {
            window.location.href = redirectTo;
          }
        }
      } else if (!hasRequiredRoles) {
        // Has library but insufficient permissions - redirect with error
        if (typeof window !== "undefined") {
          const errorUrl = new URL("/access-denied", window.location.origin);
          errorUrl.searchParams.set("reason", "insufficient_permissions");
          window.location.href = errorUrl.toString();
        }
      }
    }
  }, [currentLibrary, isLoading, error, hasRequiredRoles, redirectTo]);

  return {
    currentLibrary,
    isLoading,
    hasAccess: !!currentLibrary && hasRequiredRoles,
  };
}