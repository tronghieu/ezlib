"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookCopyDetail } from "@/components/books/book-copy-detail";
import { useLibraryContext } from "@/lib/contexts/library-context";

interface BookDetailPageProps {
  params: Promise<{
    "library-code": string;
    id: string;
  }>;
}

function BookDetailPageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2 text-sm">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Content Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BookDetailPageContent({
  params,
}: BookDetailPageProps): React.JSX.Element {
  const resolvedParams = React.use(params);
  const { currentLibrary } = useLibraryContext();

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
        <span className="text-foreground font-medium">Book Details</span>
      </nav>

      {/* Book Copy Detail Component */}
      <BookCopyDetail
        bookCopyId={resolvedParams.id}
        libraryId={currentLibrary.id}
        libraryCode={currentLibrary.code}
      />
    </div>
  );
}

export default function BookDetailPage({
  params,
}: BookDetailPageProps): React.JSX.Element {
  return (
    <Suspense fallback={<BookDetailPageSkeleton />}>
      <BookDetailPageContent params={params} />
    </Suspense>
  );
}
