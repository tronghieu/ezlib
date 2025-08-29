/**
 * Authentication Context Provider
 * Implements AC6: Authentication State Management
 *
 * This module provides app-wide authentication state management with React context,
 * real-time state synchronization, and proper cleanup.
 */

"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session } from "@supabase/supabase-js";
import {
  SessionManager,
  getSessionManager,
  LibrarySessionContext,
  UserSessionPreferences,
} from "./session";
import {
  LibraryRole,
  UserPermissions,
  getUserPermissions,
} from "./permissions";

/**
 * Complete authentication state
 */
export interface AuthContextState {
  // Authentication state
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Library context
  currentLibrary: LibrarySessionContext | null;
  permissions: UserPermissions | null;

  // User preferences
  preferences: UserSessionPreferences;

  // Session management
  sessionManager: SessionManager;

  // State flags
  isAuthenticated: boolean;
  hasLibraryAccess: boolean;
  isInitialized: boolean;
}

/**
 * Authentication actions
 */
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_SESSION";
      payload: { user: User | null; session: Session | null };
    }
  | { type: "SET_LIBRARY"; payload: LibrarySessionContext | null }
  | { type: "SET_PREFERENCES"; payload: UserSessionPreferences }
  | { type: "SET_PERMISSIONS"; payload: UserPermissions | null }
  | { type: "INITIALIZE_COMPLETE" }
  | { type: "RESET_STATE" };

/**
 * Authentication context actions/methods
 */
export interface AuthContextActions {
  // Authentication actions
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<{
    session: Session | null;
    error: Error | null;
  }>;

  // Library management
  setCurrentLibrary: (library: LibrarySessionContext) => void;
  clearCurrentLibrary: () => void;

  // Preferences management
  updatePreferences: (preferences: Partial<UserSessionPreferences>) => void;

  // State management
  clearError: () => void;
  retry: () => Promise<void>;
}

/**
 * Combined authentication context
 */
export interface AuthContext extends AuthContextState, AuthContextActions {}

/**
 * Initial authentication state
 */
const initialState: AuthContextState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  currentLibrary: null,
  permissions: null,
  preferences: {},
  sessionManager: getSessionManager(),
  isAuthenticated: false,
  hasLibraryAccess: false,
  isInitialized: false,
};

/**
 * Authentication state reducer
 */
function authReducer(
  state: AuthContextState,
  action: AuthAction
): AuthContextState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_SESSION":
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: action.payload.user !== null,
        loading: false,
        error: null,
      };

    case "SET_LIBRARY":
      return {
        ...state,
        currentLibrary: action.payload,
        hasLibraryAccess: action.payload !== null,
      };

    case "SET_PREFERENCES":
      return { ...state, preferences: action.payload };

    case "SET_PERMISSIONS":
      return { ...state, permissions: action.payload };

    case "INITIALIZE_COMPLETE":
      return { ...state, isInitialized: true, loading: false };

    case "RESET_STATE":
      return {
        ...initialState,
        sessionManager: state.sessionManager,
        isInitialized: true,
        loading: false,
      };

    default:
      return state;
  }
}

/**
 * Authentication context
 */
const AuthContextProvider = createContext<AuthContext | null>(null);

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Failed to get initial session:", sessionError);
          dispatch({ type: "SET_ERROR", payload: sessionError.message });
          return;
        }

        if (!mounted) return;

        // Set initial session state
        dispatch({
          type: "SET_SESSION",
          payload: { user: session?.user || null, session },
        });

        // Load session data if authenticated
        if (session?.user) {
          await loadSessionData();
        }

        dispatch({ type: "INITIALIZE_COMPLETE" });
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          dispatch({
            type: "SET_ERROR",
            payload: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Set up real-time authentication state changes
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);

      dispatch({
        type: "SET_SESSION",
        payload: { user: session?.user || null, session },
      });

      if (event === "SIGNED_IN" && session?.user) {
        await loadSessionData();
      } else if (event === "SIGNED_OUT") {
        dispatch({ type: "RESET_STATE" });
        state.sessionManager.logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Set up session manager event listeners
   */
  useEffect(() => {
    const removeListeners: (() => void)[] = [];

    // Listen for library changes
    removeListeners.push(
      state.sessionManager.addEventListener("library-changed", (library) => {
        dispatch({ type: "SET_LIBRARY", payload: library });
        updatePermissions(library);
      })
    );

    // Listen for preference changes
    removeListeners.push(
      state.sessionManager.addEventListener(
        "preferences-changed",
        (preferences) => {
          dispatch({ type: "SET_PREFERENCES", payload: preferences });
        }
      )
    );

    // Listen for session timeout
    removeListeners.push(
      state.sessionManager.addEventListener("session-timeout", () => {
        dispatch({
          type: "SET_ERROR",
          payload: "Session expired due to inactivity",
        });
        dispatch({ type: "RESET_STATE" });
      })
    );

    return () => {
      removeListeners.forEach((remove) => remove());
    };
  }, [state.sessionManager]);

  /**
   * Load session data from session manager
   */
  async function loadSessionData() {
    try {
      const sessionData = await state.sessionManager.getSessionData();

      dispatch({ type: "SET_LIBRARY", payload: sessionData.currentLibrary });
      dispatch({ type: "SET_PREFERENCES", payload: sessionData.preferences });

      if (sessionData.currentLibrary) {
        updatePermissions(sessionData.currentLibrary);
      }
    } catch (error) {
      console.error("Failed to load session data:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load user preferences",
      });
    }
  }

  /**
   * Update user permissions based on library context
   */
  function updatePermissions(library: LibrarySessionContext | null) {
    if (!library || !state.user) {
      dispatch({ type: "SET_PERMISSIONS", payload: null });
      return;
    }

    const permissions: UserPermissions = {
      userId: state.user.id,
      libraryId: library.libraryId,
      role: library.role as LibraryRole,
      customPermissions: [], // Could be loaded from library.permissions
      deniedPermissions: [],
    };

    dispatch({ type: "SET_PERMISSIONS", payload: permissions });
  }

  /**
   * Action implementations
   */
  const actions: AuthContextActions = {
    async signOut() {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await state.sessionManager.logout();

      if (result.error) {
        dispatch({ type: "SET_ERROR", payload: result.error.message });
      } else {
        dispatch({ type: "RESET_STATE" });
      }

      return result;
    },

    async refreshSession() {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await state.sessionManager.refreshSession();

      if (result.error) {
        dispatch({ type: "SET_ERROR", payload: result.error.message });
      } else if (result.session) {
        dispatch({
          type: "SET_SESSION",
          payload: { user: result.session.user, session: result.session },
        });
      }

      return result;
    },

    setCurrentLibrary(library: LibrarySessionContext) {
      state.sessionManager.setCurrentLibrary(library);
      // Event listener will update state
    },

    clearCurrentLibrary() {
      dispatch({ type: "SET_LIBRARY", payload: null });
      dispatch({ type: "SET_PERMISSIONS", payload: null });
    },

    updatePreferences(preferences: Partial<UserSessionPreferences>) {
      state.sessionManager.setUserPreferences(preferences);
      // Event listener will update state
    },

    clearError() {
      dispatch({ type: "SET_ERROR", payload: null });
    },

    async retry() {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        dispatch({
          type: "SET_SESSION",
          payload: { user: session?.user || null, session },
        });

        if (session?.user) {
          await loadSessionData();
        }
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Retry failed",
        });
      }
    },
  };

  const contextValue: AuthContext = {
    ...state,
    ...actions,
  };

  return (
    <AuthContextProvider.Provider value={contextValue}>
      {children}
    </AuthContextProvider.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuthContext(): AuthContext {
  const context = useContext(AuthContextProvider);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}

/**
 * HOC for components that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      // This would normally redirect to login, but we'll just show a message
      return <div>Authentication required</div>;
    }

    return <Component {...props} />;
  };
}

/**
 * HOC for components that require library access
 */
export function withLibraryAccess<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function LibraryAccessComponent(props: P) {
    const { hasLibraryAccess, loading } = useAuthContext();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasLibraryAccess) {
      return <div>Library access required</div>;
    }

    return <Component {...props} />;
  };
}
