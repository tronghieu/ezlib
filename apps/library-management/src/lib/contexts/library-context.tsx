"use client";

/**
 * Library Context Provider
 * Manages library selection and multi-tenant state throughout the application
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import type {
  LibraryContextValue,
  LibraryContextState,
  LibraryWithAccess,
  LibraryAccessValidation,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/lib/auth/context";

// =============================================================================
// CONTEXT DEFINITION
// =============================================================================

const LibraryContext = createContext<LibraryContextValue | null>(null);

// =============================================================================
// REDUCER FOR STATE MANAGEMENT
// =============================================================================

type LibraryAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_AVAILABLE_LIBRARIES"; payload: LibraryWithAccess[] }
  | { type: "SET_CURRENT_LIBRARY"; payload: LibraryWithAccess | null }
  | { type: "CLEAR_LIBRARY_SELECTION" };

const initialState: LibraryContextState = {
  currentLibrary: null,
  availableLibraries: [],
  isLoading: false,
  error: null,
};

function libraryReducer(
  state: LibraryContextState,
  action: LibraryAction
): LibraryContextState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_AVAILABLE_LIBRARIES":
      return { ...state, availableLibraries: action.payload, isLoading: false };
    case "SET_CURRENT_LIBRARY":
      return { ...state, currentLibrary: action.payload, error: null };
    case "CLEAR_LIBRARY_SELECTION":
      return { ...state, currentLibrary: null };
    default:
      return state;
  }
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
// LIBRARY ACCESS VALIDATION
// =============================================================================

async function validateLibraryAccess(
  libraryId: string,
  userId: string
): Promise<LibraryAccessValidation> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("library_staff")
      .select(
        `
        id,
        role,
        permissions,
        status,
        libraries (
          id,
          name,
          code,
          address,
          contact_info,
          settings,
          stats,
          status,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", userId)
      .eq("library_id", libraryId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return {
        hasAccess: false,
        error: error?.message || "No access to this library",
      };
    }

    return {
      hasAccess: true,
      role: data.role,
      permissions: data.permissions,
      staffId: data.id,
    };
  } catch (error) {
    return {
      hasAccess: false,
      error:
        error instanceof Error ? error.message : "Access validation failed",
    };
  }
}

// =============================================================================
// LIBRARY DATA FETCHING
// =============================================================================

async function fetchUserLibraries(
  userId: string
): Promise<LibraryWithAccess[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("library_staff")
    .select(
      `
      id,
      role,
      permissions,
      status,
      libraries (
        id,
        name,
        code,
        address,
        contact_info,
        settings,
        stats,
        status,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch libraries: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Transform data to LibraryWithAccess format
  return data
    .filter((item) => item.libraries && item.libraries.status === "active")
    .map((item) => ({
      ...item.libraries!,
      user_role: item.role,
      user_permissions: item.permissions,
      staff_id: item.id,
      staff_status: item.status,
    }));
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface LibraryProviderProps {
  children: React.ReactNode;
}

export function LibraryProvider({
  children,
}: LibraryProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(libraryReducer, initialState);
  const { user, isLoading: authLoading } = useAuthContext();

  // Fetch libraries when user authentication changes
  const refreshLibraries = useCallback(async (): Promise<void> => {
    if (!user) {
      dispatch({ type: "SET_AVAILABLE_LIBRARIES", payload: [] });
      dispatch({ type: "CLEAR_LIBRARY_SELECTION" });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const libraries = await fetchUserLibraries(user.id);
      dispatch({ type: "SET_AVAILABLE_LIBRARIES", payload: libraries });

      // Auto-restore selected library from storage
      const storedLibrary = loadSelectedLibraryFromStorage(user.id);
      if (storedLibrary) {
        // Validate stored library is still accessible
        const isStillAccessible = libraries.some(
          (lib) => lib.id === storedLibrary.id
        );
        if (isStillAccessible) {
          const updatedLibrary = libraries.find(
            (lib) => lib.id === storedLibrary.id
          );
          dispatch({
            type: "SET_CURRENT_LIBRARY",
            payload: updatedLibrary || null,
          });
        } else {
          // Stored library no longer accessible, clear it
          saveSelectedLibraryToStorage(null, user.id);
        }
      } else if (libraries.length === 1) {
        // Auto-select if only one library
        dispatch({ type: "SET_CURRENT_LIBRARY", payload: libraries[0] });
        saveSelectedLibraryToStorage(libraries[0], user.id);
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to fetch libraries",
      });
    }
  }, [user]);

  // Initialize libraries when user authentication is ready
  useEffect(() => {
    if (!authLoading) {
      refreshLibraries();
    }
  }, [refreshLibraries, authLoading]);

  // Actions
  const selectLibrary = useCallback(
    (library: LibraryWithAccess): void => {
      if (!user) return;

      dispatch({ type: "SET_CURRENT_LIBRARY", payload: library });
      saveSelectedLibraryToStorage(library, user.id);
    },
    [user]
  );

  const clearLibrarySelection = useCallback((): void => {
    if (!user) return;

    dispatch({ type: "CLEAR_LIBRARY_SELECTION" });
    saveSelectedLibraryToStorage(null, user.id);
  }, [user]);

  const switchLibrary = useCallback(
    async (libraryId: string): Promise<void> => {
      if (!user) {
        throw new Error("User must be authenticated to switch libraries");
      }

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        // Validate access to the target library
        const validation = await validateLibraryAccess(libraryId, user.id);

        if (!validation.hasAccess) {
          throw new Error(validation.error || "Access denied to library");
        }

        // Find the library in available libraries
        const targetLibrary = state.availableLibraries.find(
          (lib) => lib.id === libraryId
        );
        if (!targetLibrary) {
          throw new Error("Library not found in available libraries");
        }

        selectLibrary(targetLibrary);
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to switch library",
        });
        throw error;
      }
    },
    [user, state.availableLibraries, selectLibrary]
  );

  const contextValue: LibraryContextValue = {
    ...state,
    selectLibrary,
    refreshLibraries,
    clearLibrarySelection,
    switchLibrary,
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
// HOC FOR LIBRARY ACCESS REQUIREMENTS
// =============================================================================

interface WithLibraryAccessOptions {
  requireLibrarySelection?: boolean;
  redirectTo?: string;
}

export function withLibraryAccess<P extends object>(
  Component: React.ComponentType<P>,
  options: WithLibraryAccessOptions = {}
) {
  const { requireLibrarySelection = true, redirectTo = "/" } = options;

  return function WrappedComponent(props: P) {
    const { currentLibrary, isLoading, error } = useLibraryContext();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Library Access Error
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    if (requireLibrarySelection && !currentLibrary) {
      // Redirect to library selection page
      if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
      return null;
    }

    return <Component {...props} />;
  };
}
