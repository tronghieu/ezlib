"use client";

/**
 * Books List Page
 * Ultra-simple book list interface with search, pagination and status indicators
 */

import React, { Suspense } from "react";
import { useLibraryContext } from "@/lib/contexts/library-provider";
import { BooksTable } from "@/components/books/books-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, BookPlus } from "lucide-react";
import Link from "next/link";

export default function BooksPage(): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();

  if (!currentLibrary) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No library selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Book className="h-8 w-8" />
            Books
          </h1>
          <p className="text-muted-foreground">
            Manage your library&apos;s book inventory and availability
          </p>
        </div>

        {/* Add New Book Button - Prominently displayed */}
        <Button asChild size="default" className="shrink-0">
          <Link href={`/${currentLibrary.code}/books/add`}>
            <BookPlus className="h-4 w-4" />
            Add New Book
          </Link>
        </Button>
      </div>

      {/* Books Table */}
      <Suspense fallback={<BooksTableSkeleton />}>
        <BooksTable />
      </Suspense>
    </div>
  );
}

/**
 * Loading skeleton for books table
 */
function BooksTableSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Search and controls skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Table header skeleton */}
      <div className="border rounded-lg">
        <div className="border-b p-4">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Table rows skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-b-0">
            <div className="grid grid-cols-6 gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-8" />
          <Skeleton className="h-9 w-8" />
          <Skeleton className="h-9 w-8" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </div>
  );
}
