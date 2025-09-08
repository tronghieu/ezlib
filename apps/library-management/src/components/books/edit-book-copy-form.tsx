"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  Save,
  X,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  Trash2,
  Hash,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useBookCopyDetail } from "@/lib/hooks/use-book-copy-detail";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { DeleteBookCopyDialog } from "@/components/books/delete-book-copy-dialog";
import {
  bookCopyUpdateSchema,
  type BookCopyUpdateData,
} from "@/lib/validation/book-copy";
import { toast } from "sonner";

interface EditBookCopyFormProps {
  bookCopyId: string;
  libraryId: string;
  libraryCode: string;
}

export function EditBookCopyForm({
  bookCopyId,
  libraryId,
  libraryCode,
}: EditBookCopyFormProps): React.JSX.Element {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    data: bookCopy,
    isLoading,
    error,
    updateMutation,
  } = useBookCopyDetail(bookCopyId, libraryId);
  const { canDeleteBookCopies } = usePermissions();
  const hasInitialized = useRef(false);

  const form = useForm<BookCopyUpdateData>({
    resolver: zodResolver(bookCopyUpdateSchema),
    defaultValues: {
      total_copies: 1,
      copy_number: "",
      barcode: "",
      shelf_location: "",
      section: "",
      call_number: "",
      condition: "good",
      notes: "",
    },
  });

  // Update form values when book copy data loads (only once)
  useEffect(() => {
    if (bookCopy && !hasInitialized.current) {
      form.reset({
        total_copies: bookCopy.total_copies || 1,
        copy_number: bookCopy.copy_number,
        barcode: bookCopy.barcode || "",
        shelf_location: bookCopy.location?.shelf || "",
        section: bookCopy.location?.section || "",
        call_number: bookCopy.location?.call_number || "",
        condition: bookCopy.condition_info?.condition || "good",
        notes: bookCopy.condition_info?.notes || "",
      });
      hasInitialized.current = true;
    }
  }, [bookCopy, form]);

  const onSubmit = async (data: BookCopyUpdateData) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Book copy updated successfully!");
      router.push(`/${libraryCode}/books/${bookCopyId}`);
    } catch (error) {
      console.error("Failed to update book copy:", error);
      toast.error("Failed to update book copy. Please try again.");
    }
  };

  const handleCancel = () => {
    router.push(`/${libraryCode}/books/${bookCopyId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Book Copy
          </h3>
          <p className="text-muted-foreground mb-4">
            Failed to load book copy details. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button onClick={handleCancel}>Back to Details</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bookCopy) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Book copy not found.</p>
          <Button className="mt-4" onClick={handleCancel}>
            Back to Books
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { book_edition } = bookCopy;
  const authors = book_edition?.authors || [];
  const authorNames = authors.map((a) => a.name).join(", ");

  return (
    <div className="space-y-6">
      {/* Header with Book Cover, Title and Back Button */}
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
                      : `Language: ${book_edition.language}`}
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
              <div>
                <Badge variant="secondary">{bookCopy.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <ChevronLeft className="h-4 w-4" />
            Back to Details
          </Button>
        </div>
      </div>

      {/* Editable Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Copy Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update the library-specific information for this book copy.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Form Layout - Match add-copies-form structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Copies & Condition */}
                <div className="space-y-4 bg-muted/50 p-3 rounded-2xl border">
                  {/* Total Copies */}
                  <FormField
                    control={form.control}
                    name="total_copies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Total Copies <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="99"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="1"
                          />
                        </FormControl>
                        <FormDescription>
                          Total copies of this edition in your library
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Condition */}
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column: Management */}
                <div className="space-y-3">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Management (Optional)
                    </FormLabel>
                  </div>

                  {/* Identify Code */}
                  <FormField
                    control={form.control}
                    name="copy_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          Identify Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. A001, SC-01, 123"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Barcode */}
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Scan className="h-3 w-3" />
                          Barcode
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. 1234567890123"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="h-0 border-t border-dashed bg-transparent" />

              {/* Location Information */}
              <div className="space-y-3">
                <FormLabel className="text-sm font-medium">
                  Location Information (Optional)
                </FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Shelf Location */}
                  <FormField
                    control={form.control}
                    name="shelf_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shelf</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. A1, B3-Top"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Section */}
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. Fiction, Science"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Call Number */}
                  <FormField
                    control={form.control}
                    name="call_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Call Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. 813.54 SMI"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any additional notes about these copies..."
                        className="min-h-[60px] resize-none"
                        maxLength={500}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons - Delete on left, Save/Cancel on right */}
              <div className="flex justify-between items-center pt-6">
                <div>
                  {canDeleteBookCopies && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={updateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={
                      updateMutation.isPending || !form.formState.isDirty
                    }
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Dirty Form Warning */}
              {form.formState.isDirty && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  You have unsaved changes
                </div>
              )}
            </form>
          </Form>
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
          router.push(`/${libraryCode}/books`);
        }}
      />
    </div>
  );
}
