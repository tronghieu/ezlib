/**
 * Test utilities for mocking context providers
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { LibraryWithAccess } from '@/lib/types';

// Create a mock User factory with all required properties
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'mock-user-id',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  confirmation_sent_at: '2024-01-01T00:00:00Z',
  recovery_sent_at: null,
  email_change_sent_at: null,
  new_email: null,
  new_phone: null,
  invited_at: null,
  action_link: null,
  email: 'test@example.com',
  phone: null,
  created_at: '2024-01-01T00:00:00Z',
  confirmed_at: '2024-01-01T00:00:00Z',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone_confirmed_at: null,
  last_sign_in_at: '2024-01-01T00:00:00Z',
  role: 'authenticated',
  updated_at: '2024-01-01T00:00:00Z',
  identities: [],
  is_anonymous: false,
  factors: [],
  ...overrides,
});

// Mock AuthProvider that accepts a value prop for testing
export function MockAuthProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    signIn: any;
    signOut: any;
    refreshSession: any;
  };
}) {
  // Create a context with the provided value
  const MockAuthContext = React.createContext(value);
  
  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Mock LibraryProvider that accepts a value prop for testing
export function MockLibraryProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: {
    currentLibrary: LibraryWithAccess | null;
    availableLibraries: LibraryWithAccess[];
    isLoading: boolean;
    error: string | null;
    selectLibrary: any;
    refreshLibraries: any;
    clearLibrarySelection: any;
    switchLibrary: any;
  };
}) {
  // Create a context with the provided value
  const MockLibraryContext = React.createContext(value);
  
  return (
    <MockLibraryContext.Provider value={value}>
      {children}
    </MockLibraryContext.Provider>
  );
}

// Test wrapper utility
export function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}