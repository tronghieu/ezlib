"use client";

/**
 * Library Selection Page Component
 * Main page component for library selection with authentication
 */

import React from "react";
import { useRouter } from "next/navigation";
import { LibrarySelectionGrid } from "./library-selection-grid";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useAuthContext } from "@/lib/auth/context";
import type { LibraryWithAccess } from "@/lib/types";

export function LibrarySelectionPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuthContext();
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

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/auth/login");
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
