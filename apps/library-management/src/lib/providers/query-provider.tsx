"use client";

/**
 * React Query Provider
 * Provides QueryClient for data fetching throughout the application
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && "status" in error) {
          const status = (error as { status?: number }).status;
          if (status && status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
