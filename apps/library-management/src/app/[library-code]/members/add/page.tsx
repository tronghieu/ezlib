/**
 * Add Member Page - Library-scoped member registration
 * Provides form interface for registering new library members
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddMemberForm } from "@/components/members/add-member-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AddMemberPageProps {
  params: Promise<{
    "library-code": string;
  }>;
}

export default async function AddMemberPage({ params }: AddMemberPageProps) {
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

  // Only librarian+ roles can add members
  const allowedRoles = ["librarian", "manager", "owner"];
  const canManageMembers = staffRecord && allowedRoles.includes(staffRecord.role);

  if (!canManageMembers) {
    notFound();
  }

  // Get user profile for name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // Get user's full name for invitations
  const userName = profile?.display_name || user.email || "Library Staff";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${library.code}/members`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Member</h1>
          <p className="text-muted-foreground">
            Register a new member for {library.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AddMemberFormSkeleton />}>
            <AddMemberForm 
              libraryId={library.id}
              libraryCode={library.code}
              userId={user.id}
              userName={userName}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function AddMemberFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Member ID toggle */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Membership Info */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Metadata for the page
export async function generateMetadata({ params }: AddMemberPageProps) {
  const resolvedParams = await params;
  const libraryCode = resolvedParams["library-code"];
  
  return {
    title: `Add Member - ${libraryCode.toUpperCase()} Library`,
    description: "Register a new library member",
  };
}