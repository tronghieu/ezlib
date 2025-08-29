/**
 * Session Management for Library Management System
 * Implements AC5: Cross-Domain Session Management
 * 
 * This module handles session persistence, cleanup, and synchronization
 * for the library management application domain.
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Session storage keys for browser persistence
 */
const SESSION_KEYS = {
  CURRENT_LIBRARY: 'ezlib:library-management:current-library',
  USER_PREFERENCES: 'ezlib:library-management:user-preferences',
  LAST_ACTIVITY: 'ezlib:library-management:last-activity',
  SESSION_ID: 'ezlib:library-management:session-id'
} as const;

/**
 * Session timeout configuration (30 minutes)
 */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * User preferences stored in session
 */
export interface UserSessionPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  dashboardLayout?: 'compact' | 'comfortable';
  notificationSettings?: {
    overdueReminders: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
  };
}

/**
 * Current library context stored in session
 */
export interface LibrarySessionContext {
  libraryId: string;
  libraryName: string;
  libraryCode: string;
  role: string;
  permissions: string[];
  lastAccessed: string;
}

/**
 * Complete session data structure
 */
export interface SessionData {
  user: User | null;
  session: Session | null;
  currentLibrary: LibrarySessionContext | null;
  preferences: UserSessionPreferences;
  sessionId: string;
  lastActivity: string;
  expiresAt: string;
}

/**
 * Session manager class for handling all session operations
 */
export class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session management
   */
  initialize(): void {
    this.startSessionMonitoring();
    this.updateLastActivity();
    this.cleanupExpiredSessions();
  }

  /**
   * Store current library context in session
   */
  setCurrentLibrary(library: LibrarySessionContext): void {
    try {
      localStorage.setItem(SESSION_KEYS.CURRENT_LIBRARY, JSON.stringify({
        ...library,
        lastAccessed: new Date().toISOString()
      }));
      
      this.updateLastActivity();
      this.dispatchSessionEvent('library-changed', library);
    } catch (error) {
      console.error('Failed to store library context:', error);
    }
  }

  /**
   * Get current library context from session
   */
  getCurrentLibrary(): LibrarySessionContext | null {
    try {
      const stored = localStorage.getItem(SESSION_KEYS.CURRENT_LIBRARY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve library context:', error);
      return null;
    }
  }

  /**
   * Store user preferences in session
   */
  setUserPreferences(preferences: Partial<UserSessionPreferences>): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      
      localStorage.setItem(SESSION_KEYS.USER_PREFERENCES, JSON.stringify(updated));
      this.updateLastActivity();
      this.dispatchSessionEvent('preferences-changed', updated);
    } catch (error) {
      console.error('Failed to store user preferences:', error);
    }
  }

  /**
   * Get user preferences from session
   */
  getUserPreferences(): UserSessionPreferences {
    try {
      const stored = localStorage.getItem(SESSION_KEYS.USER_PREFERENCES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return {};
    }
  }

  /**
   * Get complete session data
   */
  async getSessionData(): Promise<SessionData> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    return {
      user: session?.user || null,
      session,
      currentLibrary: this.getCurrentLibrary(),
      preferences: this.getUserPreferences(),
      sessionId: this.getSessionId(),
      lastActivity: this.getLastActivity(),
      expiresAt: this.getExpirationTime()
    };
  }

  /**
   * Clear all session data and logout
   */
  async logout(): Promise<{ error: Error | null }> {
    try {
      // Clear Supabase session
      const { error: supabaseError } = await this.supabase.auth.signOut();
      
      if (supabaseError) {
        console.error('Supabase logout error:', supabaseError);
      }

      // Clear local session data
      this.clearLocalSession();
      
      // Stop session monitoring
      this.stopSessionMonitoring();
      
      // Dispatch logout event
      this.dispatchSessionEvent('session-ended', null);
      
      // Redirect to login page
      window.location.href = '/auth/login';
      
      return { error: supabaseError };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Refresh session and extend expiration
   */
  async refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      
      if (session) {
        this.updateLastActivity();
        this.dispatchSessionEvent('session-refreshed', session);
      }
      
      return { session, error };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return false;

    const timeSinceActivity = Date.now() - new Date(lastActivity).getTime();
    return timeSinceActivity < SESSION_TIMEOUT_MS;
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, now);
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Listen for session events
   */
  addEventListener(
    event: 'session-ended' | 'session-refreshed' | 'library-changed' | 'preferences-changed' | 'session-timeout',
    callback: (data: any) => void
  ): () => void {
    const handleEvent = (e: CustomEvent) => {
      callback(e.detail);
    };

    window.addEventListener(`ezlib:session:${event}`, handleEvent as EventListener);

    return () => {
      window.removeEventListener(`ezlib:session:${event}`, handleEvent as EventListener);
    };
  }

  /**
   * Start monitoring session for timeout and activity
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(() => {
      if (!this.isSessionValid()) {
        console.log('Session expired due to inactivity');
        this.handleSessionTimeout();
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    this.dispatchSessionEvent('session-timeout', null);
    await this.logout();
  }

  /**
   * Clear local session storage
   */
  private clearLocalSession(): void {
    try {
      Object.values(SESSION_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear local session:', error);
    }
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    try {
      let sessionId = localStorage.getItem(SESSION_KEYS.SESSION_ID);
      
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_KEYS.SESSION_ID, sessionId);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Failed to manage session ID:', error);
      return `session-${Date.now()}`;
    }
  }

  /**
   * Get last activity timestamp
   */
  private getLastActivity(): string {
    try {
      return localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY) || '';
    } catch (error) {
      console.error('Failed to get last activity:', error);
      return '';
    }
  }

  /**
   * Get session expiration time
   */
  private getExpirationTime(): string {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return '';

    const expirationTime = new Date(new Date(lastActivity).getTime() + SESSION_TIMEOUT_MS);
    return expirationTime.toISOString();
  }

  /**
   * Dispatch custom session events
   */
  private dispatchSessionEvent(eventName: string, data: any): void {
    try {
      const event = new CustomEvent(`ezlib:session:${eventName}`, {
        detail: data
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to dispatch session event:', error);
    }
  }

  /**
   * Clean up expired sessions on startup
   */
  private cleanupExpiredSessions(): void {
    if (!this.isSessionValid()) {
      console.log('Cleaning up expired session data');
      this.clearLocalSession();
    }
  }
}

/**
 * Convenience function to get session manager instance
 */
export function getSessionManager(): SessionManager {
  return SessionManager.getInstance();
}

/**
 * React hook for session management
 */
export function useSessionManager() {
  const sessionManager = getSessionManager();

  return {
    setCurrentLibrary: sessionManager.setCurrentLibrary.bind(sessionManager),
    getCurrentLibrary: sessionManager.getCurrentLibrary.bind(sessionManager),
    setUserPreferences: sessionManager.setUserPreferences.bind(sessionManager),
    getUserPreferences: sessionManager.getUserPreferences.bind(sessionManager),
    getSessionData: sessionManager.getSessionData.bind(sessionManager),
    logout: sessionManager.logout.bind(sessionManager),
    refreshSession: sessionManager.refreshSession.bind(sessionManager),
    updateLastActivity: sessionManager.updateLastActivity.bind(sessionManager),
    addEventListener: sessionManager.addEventListener.bind(sessionManager)
  };
}

/**
 * Initialize session management (call once in app root)
 */
export function initializeSessionManagement(): void {
  if (typeof window !== 'undefined') {
    const sessionManager = getSessionManager();
    sessionManager.initialize();

    // Add activity listeners to update session
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      sessionManager.updateLastActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      sessionManager.updateLastActivity();
    });
  }
}