"use client";

/**
 * Library-Specific Layout
 * Protected dashboard layout for all library management pages
 */

import React from "react";
import { LibraryDashboardSidebar } from "@/components/library/library-dashboard-sidebar";
import { LibraryDashboardHeader } from "@/components/library/library-dashboard-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { withLibraryAccess } from "@/lib/contexts/library-context";

interface LibraryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "library-code": string }>;
}

function LibraryLayout({ children }: LibraryLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <LibraryDashboardSidebar />
        <SidebarInset>
          <LibraryDashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// Wrap with library access requirement - ensures authentication and library context
export default withLibraryAccess(LibraryLayout, {
  requireLibrarySelection: true,
  redirectTo: "/",
});
