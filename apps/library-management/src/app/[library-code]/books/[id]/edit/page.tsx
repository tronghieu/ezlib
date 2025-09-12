"use client";

import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EditBookCopyForm } from "@/components/books/edit-book-copy-form";
import { useLibraryContext } from "@/lib/contexts/library-provider";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface EditBookCopyPageProps {
  params: Promise<{
    "library-code": string;
    id: string;
  }>;
}

function EditBookCopyPageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2 text-sm">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </div>

      {/* Form Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditBookCopyPageContent({
  params,
}: EditBookCopyPageProps): React.JSX.Element {
  const [resolvedParams, setResolvedParams] = React.useState<{
    "library-code": string;
    id: string;
  } | null>(null);
  
  const { currentLibrary } = useLibraryContext();
  const { canEditBookCopies } = usePermissions();

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return <EditBookCopyPageSkeleton />;
  }

  if (!currentLibrary) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No library selected</p>
      </div>
    );
  }

  if (!resolvedParams.id) {
    notFound();
  }

  // Check permissions
  if (!canEditBookCopies) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to edit book copies.
          </p>
          <Button asChild>
            <Link href={`/${currentLibrary.code}/books/${resolvedParams.id}`}>
              Back to Book Details
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href={`/${currentLibrary.code}/books`}
          className="hover:text-foreground transition-colors"
        >
          Books
        </Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <Link
          href={`/${currentLibrary.code}/books/${resolvedParams.id}`}
          className="hover:text-foreground transition-colors"
        >
          Book Details
        </Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <span className="text-foreground font-medium">Edit</span>
      </nav>



      {/* Edit Form */}
      <EditBookCopyForm
        bookCopyId={resolvedParams.id}
        libraryId={currentLibrary.id}
        libraryCode={currentLibrary.code}
      />
    </div>
  );
}

export default function EditBookCopyPage({
  params,
}: EditBookCopyPageProps): React.JSX.Element {
  return (
    <Suspense fallback={<EditBookCopyPageSkeleton />}>
      <EditBookCopyPageContent params={params} />
    </Suspense>
  );
}