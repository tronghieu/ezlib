/**
 * Members Page - Library-scoped member management
 * Displays member list with search, filtering, and management capabilities
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembersTable } from "@/components/members/members-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface MembersPageProps {
  params: Promise<{
    "library-code": string;
  }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const resolvedParams = await params;
  const libraryCode = resolvedParams["library-code"];
  
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get library information and verify access
  const { data: library, error: libraryError } = await supabase
    .from("libraries")
    .select("id, name, code")
    .eq("code", libraryCode)
    .single();

  if (libraryError || !library) {
    notFound();
  }

  // Check user permissions for this library
  const { data: staffRecord } = await supabase
    .from("library_staff")
    .select("role")
    .eq("library_id", library.id)
    .eq("user_id", user.id)
    .single();

  // Only librarian+ roles can access member management
  const allowedRoles = ["librarian", "manager", "owner"];
  const canManageMembers = staffRecord && allowedRoles.includes(staffRecord.role);

  if (!canManageMembers) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<MembersPageSkeleton />}>
        <MembersTable
          libraryId={library.id}
          libraryCode={library.code}
          canManageMembers={canManageMembers}
        />
      </Suspense>
    </div>
  );
}

function MembersPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search and Filters Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Metadata for the page
export async function generateMetadata({ params }: MembersPageProps) {
  const resolvedParams = await params;
  const libraryCode = resolvedParams["library-code"];
  
  return {
    title: `Members - ${libraryCode.toUpperCase()} Library`,
    description: "Manage library members and their information",
  };
}