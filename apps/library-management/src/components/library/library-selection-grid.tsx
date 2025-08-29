"use client";

/**
 * Library Selection Grid Component
 * Displays available libraries in a responsive grid layout
 */

import React from "react";
import { LibraryCard } from "./library-card";
import { AlertCircle, Building2 } from "lucide-react";
import type { LibraryWithAccess } from "@/lib/types";

interface LibrarySelectionGridProps {
  libraries: LibraryWithAccess[];
  onLibrarySelect: (library: LibraryWithAccess) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LibrarySelectionGrid({
  libraries,
  onLibrarySelect,
  isLoading = false,
  error = null,
}: LibrarySelectionGridProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        <p className="text-gray-600">Loading your libraries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Libraries
        </h3>
        <p className="text-gray-600 text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (libraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Libraries Available
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          You don&apos;t have access to any libraries yet. Contact your system
          administrator to get access to a library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select a Library
        </h2>
        <p className="text-gray-600">
          {libraries.length === 1
            ? "You have access to 1 library"
            : `You have access to ${libraries.length} libraries`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {libraries.map((library) => (
          <LibraryCard
            key={library.id}
            library={library}
            onClick={onLibrarySelect}
            className="max-w-sm mx-auto w-full"
          />
        ))}
      </div>

      {libraries.length > 3 && (
        <div className="text-center text-sm text-gray-500 mt-6">
          Click any library card to access its management system
        </div>
      )}
    </div>
  );
}
