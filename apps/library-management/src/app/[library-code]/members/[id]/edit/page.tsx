/**
 * Member Edit Page - Library-scoped member information editing
 * Allows editing of member personal information and membership details
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditMemberForm } from "@/components/members/edit-member-form";

interface MemberEditPageProps {
  params: Promise<{
    "library-code": string;
    id: string;
  }>;
}

export default async function MemberEditPage({ params }: MemberEditPageProps) {
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

  // Only librarian+ roles can edit members
  const allowedRoles = ["librarian", "manager", "owner"];
  const canEditMembers = staffRecord && allowedRoles.includes(staffRecord.role);

  if (!canEditMembers) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<EditMemberFormSkeleton />}>
        <EditMemberForm
          memberId={memberId}
          libraryId={library.id}
          libraryCode={library.code}
        />
      </Suspense>
    </div>
  );
}

function EditMemberFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}