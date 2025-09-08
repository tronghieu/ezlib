"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Edit,
  BookOpen,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CirculationHistory } from "@/components/books/circulation-history";
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
  const {
    data: bookCopy,
    isLoading,
    error,
  } = useBookCopyDetail(bookCopyId, libraryId);
  const { canEditBookCopies } = usePermissions();

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
  const authorNames = authors.map((a) => a.name).join(", ");

  return (
    <div className="space-y-6">
      {/* Header with Book Cover, Title and Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-row gap-3 sm:gap-6">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {book_edition?.edition_metadata?.cover_image_url ? (
              <div className="relative w-32 h-48 md:w-40 md:h-60 rounded-lg overflow-hidden shadow-md">
                <Image
                  src={book_edition.edition_metadata.cover_image_url}
                  alt={`Cover of ${book_edition?.title || "book"}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 128px, 160px"
                  priority
                />
              </div>
            ) : (
              <div className="w-20 h-28 sm:w-32 sm:h-48 md:w-40 md:h-60 bg-muted border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs">No Cover</p>
                </div>
              </div>
            )}
          </div>

          {/* Book Information */}
          <div className="space-y-2 flex-1 min-w-0">
            <h1 className="flex items-center text-lg sm:text-2xl md:text-3xl font-bold tracking-tight break-words gap-2 sm:gap-3">
              {book_edition?.title || "Untitled"}
              <span className="text-muted-foreground">
                #{bookCopy.copy_number}
              </span>
            </h1>
            {book_edition?.subtitle && (
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground break-words">
                {book_edition.subtitle}
              </p>
            )}
            <div className="space-y-1 text-sm text-muted-foreground">
              {authorNames && <p>by {authorNames}</p>}
              {book_edition?.isbn_13 && (
                <p className="font-mono">ISBN: {book_edition.isbn_13}</p>
              )}
              {(book_edition?.country || book_edition?.language) && (
                <p>
                  {book_edition?.country && book_edition?.language 
                    ? `Country: ${book_edition.country} (${book_edition.language})`
                    : book_edition?.country 
                    ? `Country: ${book_edition.country}`
                    : `Language: ${book_edition.language}`
                  }
                </p>
              )}
              {book_edition.edition_metadata?.page_count && (
                <p>Pages: {book_edition.edition_metadata.page_count}</p>
              )}
              {book_edition.edition_metadata?.format && (
                <p>Format: {book_edition.edition_metadata.format}</p>
              )}
              {book_edition.edition_metadata?.publisher && (
                <p>
                  Publisher: {book_edition.edition_metadata.publisher}{" "}
                  {book_edition.edition_metadata?.publication_date && (
                    <span>
                      (
                      {new Date(
                        book_edition.edition_metadata.publication_date
                      ).getFullYear()}
                      )
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${libraryCode}/books`}>
              <ChevronLeft className="h-4 w-4" />
              Back to Books
            </Link>
          </Button>
          {canEditBookCopies && (
            <Button asChild>
              <Link href={`/${libraryCode}/books/${bookCopyId}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Copy-Specific Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Copy Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Barcode:</span>
                <span className="font-mono text-xs">
                  {bookCopy.barcode || "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Status:</span>
                <Badge className={`${getStatusColor(bookCopy.status)} text-xs`}>
                  {bookCopy.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Availability:</span>
                <Badge
                  className={`${getAvailabilityColor(availability?.status || "unknown")} text-xs`}
                >
                  {availability?.status || "unknown"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {location && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Shelf:</span>
                    <span>{location.shelf || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Section:</span>
                    <span>{location.section || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Call Number:</span>
                    <span className="font-mono text-xs">
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" />
              Condition & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Condition:</span>
                  <Badge
                    className={`${getConditionColor(condition_info.condition)} text-xs`}
                  >
                    {condition_info.condition}
                  </Badge>
                </div>
                {condition_info.acquisition_date && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Acquired:</span>
                    <span>
                      {new Date(
                        condition_info.acquisition_date
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {condition_info.acquisition_price && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Price:</span>
                    <span>${condition_info.acquisition_price.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {condition_info.last_maintenance && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Last Maintenance:</span>
                    <span>
                      {new Date(
                        condition_info.last_maintenance
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {condition_info.notes && (
              <div className="space-y-2">
                <span className="font-medium text-sm">Notes:</span>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs">{condition_info.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Circulation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Circulation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CirculationHistory bookCopyId={bookCopyId} libraryId={libraryId} />
        </CardContent>
      </Card>
    </div>
  );
}
