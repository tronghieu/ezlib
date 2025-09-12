"use client";

/**
 * Library-Specific Layout
 * Protected dashboard layout for all library management pages
 */

import React from "react";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { LibraryHeader } from "@/components/library/library-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useRequireLibrary } from "@/lib/contexts/library-provider";

interface LibraryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "library-code": string }>;
}

export default function LibraryLayout({ children }: LibraryLayoutProps): React.JSX.Element {
  // Use the modern hook-based approach instead of HOC
  const { currentLibrary, isLoading, hasAccess } = useRequireLibrary({
    redirectTo: "/",
    requiredRoles: ["owner", "manager", "librarian", "volunteer"], // Allow all library staff
  });

  // Loading state while checking access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Access check - redirect will happen automatically if needed
  if (!hasAccess || !currentLibrary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Checking library access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <LibrarySidebar />
        <SidebarInset>
          <LibraryHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
