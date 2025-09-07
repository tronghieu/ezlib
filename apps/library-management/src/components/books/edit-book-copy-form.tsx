"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useBookCopyDetail } from "@/lib/hooks/use-book-copy-detail";
import { bookCopyUpdateSchema, type BookCopyUpdateData } from "@/lib/validation/book-copy";
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
  const { data: bookCopy, isLoading, error, updateMutation } = useBookCopyDetail(bookCopyId, libraryId);

  const form = useForm<BookCopyUpdateData>({
    resolver: zodResolver(bookCopyUpdateSchema),
    defaultValues: {
      copy_number: bookCopy?.copy_number || "",
      barcode: bookCopy?.barcode || "",
      shelf_location: bookCopy?.location?.shelf || "",
      section: bookCopy?.location?.section || "",
      call_number: bookCopy?.location?.call_number || "",
      condition: bookCopy?.condition_info?.condition || "good",
      notes: bookCopy?.condition_info?.notes || "",
    },
  });

  // Update form values when book copy data loads
  if (bookCopy && !form.formState.isDirty) {
    form.reset({
      copy_number: bookCopy.copy_number,
      barcode: bookCopy.barcode || "",
      shelf_location: bookCopy.location?.shelf || "",
      section: bookCopy.location?.section || "",
      call_number: bookCopy.location?.call_number || "",
      condition: bookCopy.condition_info?.condition || "good",
      notes: bookCopy.condition_info?.notes || "",
    });
  }

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
          <h3 className="text-lg font-semibold mb-2">Error Loading Book Copy</h3>
          <p className="text-muted-foreground mb-4">
            Failed to load book copy details. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button onClick={handleCancel}>
              Back to Details
            </Button>
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
  const authorNames = authors.map(a => a.name).join(", ");

  return (
    <div className="space-y-6">
      {/* Read-Only Book Edition Information */}
      <Card>
        <CardHeader>
          <CardTitle>Book Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            The following book edition information cannot be edited from this page.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Title:</span>
                <span>{book_edition?.title || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Author(s):</span>
                <span>{authorNames || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ISBN-13:</span>
                <span className="font-mono text-sm">{book_edition?.isbn_13 || "N/A"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Language:</span>
                <span>{book_edition?.language || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Publisher:</span>
                <span>{book_edition?.edition_metadata?.publisher || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant="secondary">{bookCopy.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Copy Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Copy Information</h3>
                
                <FormField
                  control={form.control}
                  name="copy_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Copy Number *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., A-001, BK-2024-001"
                          className="max-w-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Library-specific identifier for this book copy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Location Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Location</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location.shelf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shelf</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., A1, Fiction-01"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location.section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Fiction, Science"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location.call_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 823.914 SMI, FIC-001"
                          className="max-w-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Dewey Decimal or custom classification number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Condition Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Condition</h3>
                
                <FormField
                  control={form.control}
                  name="condition_info.condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="max-w-sm">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Excellent
                            </div>
                          </SelectItem>
                          <SelectItem value="good">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              Good
                            </div>
                          </SelectItem>
                          <SelectItem value="fair">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              Fair
                            </div>
                          </SelectItem>
                          <SelectItem value="poor">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Poor
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition_info.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional notes about the book's condition, damage, or maintenance..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Add any relevant notes about the book&apos;s condition or maintenance history
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
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
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
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
    </div>
  );
}