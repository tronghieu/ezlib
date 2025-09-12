"use client";

/**
 * Add Book Page Client Component
 * Progressive book addition workflow with search-first approach
 */

import React from "react";
import { useRouter } from "next/navigation";
import { useLibraryContext } from "@/lib/contexts/library-provider";
import { AddBookWorkflow } from "@/components/books/add-book-workflow";
import { Button } from "@/components/ui/button";
import { Book, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AddBookPageClientProps {
  libraryCode: string;
}

export function AddBookPageClient({
  libraryCode,
}: AddBookPageClientProps): React.JSX.Element {
  const router = useRouter();
  const { currentLibrary } = useLibraryContext();

  // Loading state while library context is being established
  if (!currentLibrary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Verify library code matches current library (security check)
  if (currentLibrary.code !== libraryCode) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Library code mismatch. Please contact administrator.
          </p>
        </div>
      </div>
    );
  }

  const handleComplete = (): void => {
    router.push(`/${currentLibrary.code}/books`);
  };

  const handleCancel = (): void => {
    router.push(`/${currentLibrary.code}/books`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Book className="h-8 w-8" />
            Add New Book
          </h1>
          <p className="text-muted-foreground text-sm">
            Search for existing books or add a new book to {currentLibrary.name}
            &apos;s inventory
          </p>
        </div>

        {/* Back to Books Button */}
        <Button variant="outline" asChild className="shrink-0">
          <Link href={`/${currentLibrary.code}/books`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Link>
        </Button>
      </div>

      {/* Progressive Book Addition Workflow */}
      <AddBookWorkflow onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  );
}
