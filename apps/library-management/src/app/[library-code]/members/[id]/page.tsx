/**
 * Member Profile Page - Library-scoped member detail view
 * Displays comprehensive member information, current checkouts, and management options
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberProfile } from "@/components/members/member-profile";

interface MemberProfilePageProps {
  params: Promise<{
    "library-code": string;
    id: string;
  }>;
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const resolvedParams = await params;
  const libraryCode = resolvedParams["library-code"];
  const memberId = resolvedParams.id;

  if (!memberId || memberId === "add" || memberId === "edit") {
    notFound();
  }

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
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<MemberProfileSkeleton />}>
        <MemberProfile
          memberId={memberId}
          libraryId={library.id}
          libraryCode={library.code}
          canManageMembers={canManageMembers}
        />
      </Suspense>
    </div>
  );
}

function MemberProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}