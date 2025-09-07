"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit, Trash2, BookOpen, MapPin, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CirculationHistory } from "@/components/books/circulation-history";
import { DeleteBookCopyDialog } from "@/components/books/delete-book-copy-dialog";
import { useBookCopyDetail } from "@/lib/hooks/use-book-copy-detail";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface BookCopyDetailProps {
  bookCopyId: string;
  libraryId: string;
  libraryCode: string;
}

function getConditionColor(condition: string): string {
  switch (condition) {
    case "excellent":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "good":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "fair":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "poor":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case "damaged":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case "lost":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "maintenance":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

function getAvailabilityColor(status: string): string {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "borrowed":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "reserved":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "maintenance":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

export function BookCopyDetail({
  bookCopyId,
  libraryId,
  libraryCode,
}: BookCopyDetailProps): React.JSX.Element {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: bookCopy, isLoading, error } = useBookCopyDetail(bookCopyId, libraryId);
  const { canEditBookCopies, canDeleteBookCopies } = usePermissions();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Failed to load book copy details. Please try again.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!bookCopy) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Book copy not found.</p>
        </CardContent>
      </Card>
    );
  }

  const { book_edition, condition_info, location, availability } = bookCopy;
  const authors = book_edition?.authors || [];
  const authorNames = authors.map(a => a.name).join(", ");

  return (
    <div className="space-y-6">
      {/* Header with Book Title and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            {book_edition?.title || "Untitled"}
          </h1>
          {book_edition?.subtitle && (
            <p className="text-xl text-muted-foreground">{book_edition.subtitle}</p>
          )}
          <p className="text-muted-foreground">
            Copy #{bookCopy.copy_number} • {authorNames}
          </p>
        </div>

        {/* Action Buttons */}
        {(canEditBookCopies || canDeleteBookCopies) && (
          <div className="flex gap-2">
            {canEditBookCopies && (
              <Button asChild>
                <Link href={`/${libraryCode}/books/${bookCopyId}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canDeleteBookCopies && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Book Edition Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Book Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Title:</span>
                <span>{book_edition?.title || "N/A"}</span>
              </div>
              {book_edition?.subtitle && (
                <div className="flex justify-between">
                  <span className="font-medium">Subtitle:</span>
                  <span>{book_edition.subtitle}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Author(s):</span>
                <span>{authorNames || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ISBN-13:</span>
                <span className="font-mono text-sm">
                  {book_edition?.isbn_13 || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Language:</span>
                <span>{book_edition?.language || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-3">
              {book_edition?.edition_metadata && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Publisher:</span>
                    <span>{book_edition.edition_metadata.publisher || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Publication Date:</span>
                    <span>
                      {book_edition.edition_metadata.publication_date 
                        ? new Date(book_edition.edition_metadata.publication_date).getFullYear()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Pages:</span>
                    <span>{book_edition.edition_metadata.page_count || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Format:</span>
                    <span>{book_edition.edition_metadata.format || "N/A"}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Country:</span>
                <span>{book_edition?.country || "N/A"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copy-Specific Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Copy Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Copy Number:</span>
                <Badge variant="secondary">{bookCopy.copy_number}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Barcode:</span>
                <span className="font-mono text-sm">
                  {bookCopy.barcode || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(bookCopy.status)}>
                  {bookCopy.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Availability:</span>
                <Badge className={getAvailabilityColor(availability?.status || "unknown")}>
                  {availability?.status || "unknown"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {location && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Shelf:</span>
                    <span>{location.shelf || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Section:</span>
                    <span>{location.section || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Call Number:</span>
                    <span className="font-mono text-sm">
                      {location.call_number || "N/A"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condition Information */}
      {condition_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Condition & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Condition:</span>
                  <Badge className={getConditionColor(condition_info.condition)}>
                    {condition_info.condition}
                  </Badge>
                </div>
                {condition_info.acquisition_date && (
                  <div className="flex justify-between">
                    <span className="font-medium">Acquired:</span>
                    <span>
                      {new Date(condition_info.acquisition_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {condition_info.acquisition_price && (
                  <div className="flex justify-between">
                    <span className="font-medium">Price:</span>
                    <span>${condition_info.acquisition_price.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {condition_info.last_maintenance && (
                  <div className="flex justify-between">
                    <span className="font-medium">Last Maintenance:</span>
                    <span>
                      {new Date(condition_info.last_maintenance).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {condition_info.notes && (
              <div className="space-y-2">
                <span className="font-medium">Notes:</span>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{condition_info.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Circulation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Circulation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CirculationHistory 
            bookCopyId={bookCopyId} 
            libraryId={libraryId} 
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteBookCopyDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        bookCopy={bookCopy}
        libraryId={libraryId}
        onSuccess={() => {
          // Navigate back to books list after successful deletion
          window.location.href = `/${libraryCode}/books`;
        }}
      />
    </div>
  );
}