/**
 * Library-Specific Layout
 * Protected dashboard layout for all library management pages
 */

import React from "react";
import { redirect } from "next/navigation";
import { validateLibraryAccessByCode, getUserLibraries } from "@/lib/actions/library-actions";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { LibraryHeader } from "@/components/library/library-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LibraryProvider, LibrariesPromiseProvider } from "@/lib/contexts/library-provider";

interface LibraryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "library-code": string }>;
}

export default async function LibraryLayout({ 
  children, 
  params 
}: LibraryLayoutProps): Promise<React.JSX.Element> {
  const { "library-code": libraryCode } = await params;

  // Validate user access to this specific library
  const { hasAccess, library, error } = await validateLibraryAccessByCode(libraryCode);

  if (!hasAccess) {
    if (error === "User not authenticated") {
      redirect(`/auth/login?redirectTo=/${libraryCode}`);
    } else {
      redirect(`/?error=${error === "Library not found or inactive" ? "library_not_found" : "library_access_denied"}`);
    }
  }

  if (!library) {
    redirect('/?error=library_not_found');
  }

  // Fetch ALL libraries the user has access to for the sidebar switcher
  const allLibraries = await getUserLibraries();

  return (
    <LibrariesPromiseProvider librariesPromise={Promise.resolve(allLibraries)}>
      <LibraryProvider fallbackLibraries={allLibraries} initialLibraryCode={libraryCode}>
        <div className="min-h-screen bg-background">
          <SidebarProvider>
            <LibrarySidebar />
            <SidebarInset>
              <LibraryHeader />
              <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </LibraryProvider>
    </LibrariesPromiseProvider>
  );
}
