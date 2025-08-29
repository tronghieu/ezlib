/**
 * Library-Specific Layout
 * Layout for all pages within a specific library context
 */

import React from "react";
import { LibraryHeader } from "@/components/library/library-header";
import { withLibraryAccess } from "@/lib/contexts/library-context";

interface LibraryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "library-code": string }>;
}

function LibraryLayout({ children }: LibraryLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <LibraryHeader />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

// Wrap with library access requirement
export default withLibraryAccess(LibraryLayout, {
  requireLibrarySelection: true,
  redirectTo: "/",
});
