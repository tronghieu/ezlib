"use client";

/**
 * Library Selection Page Component
 * Main page component for library selection with authentication
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LibrarySelectionGrid } from "./library-selection-grid";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useAuthContext } from "@/lib/auth/context";
import type { LibraryWithAccess } from "@/lib/types";

export function LibrarySelectionPage(): React.JSX.Element {
  const router = useRouter();
  const { user, loading, isInitialized } = useAuthContext();
  const {
    availableLibraries,
    isLoading: libraryLoading,
    error,
    selectLibrary,
  } = useLibraryContext();

  const handleLibrarySelect = (library: LibraryWithAccess): void => {
    // Select the library in context
    selectLibrary(library);

    // Navigate to library-specific dashboard
    router.push(`/${library.code}/dashboard`);
  };

  // Redirect to login if not authenticated - but only after auth is initialized
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/auth/login");
    }
  }, [user, isInitialized, router]);

  // Show loading state while authentication is initializing
  if (loading || !isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-600">Loading your libraries...</p>
      </div>
    );
  }

  // Show redirect message only after we've confirmed user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <LibrarySelectionGrid
      libraries={availableLibraries}
      onLibrarySelect={handleLibrarySelect}
      isLoading={libraryLoading}
      error={error}
    />
  );
}
