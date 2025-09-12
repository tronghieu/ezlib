"use client";

/**
 * Add Book Form Component
 * Ultra-simple form with required fields: title, author, and optional fields
 */

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLibraryContext } from "@/lib/contexts/library-provider";
import { useAddBook } from "@/lib/hooks/use-add-book";
import { addBookSchema, type AddBookFormData } from "@/lib/validation/books";

// Explicit form data type to resolve Zod inference issues
type BookFormData = AddBookFormData;
import { enrichFromISBN } from "@/lib/validation/isbn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  BookPlus,
  AlertCircle,
  Search,
  CheckCircle,
} from "lucide-react";

interface AddBookFormProps {
  onCancel?: () => void;
}

export function AddBookForm({ onCancel }: AddBookFormProps): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(addBookSchema),
    defaultValues: {
      title: "",
      author: "",
      publisher: undefined,
      publication_year: undefined,
      isbn: undefined,
    },
  });

  const { mutate: addBook, isPending, error } = useAddBook();

  // ISBN lookup state
  const [isLookingUp, setIsLookingUp] = React.useState(false);
  const [lookupSuccess, setLookupSuccess] = React.useState(false);
  const [lookupMessage, setLookupMessage] = React.useState<string>("");

  // Watch ISBN field for lookup trigger
  const currentIsbn = watch("isbn");

  // Handle ISBN lookup
  const handleISBNLookup = async (): Promise<void> => {
    if (!currentIsbn?.trim()) {
      setLookupMessage("Please enter an ISBN first");
      return;
    }

    setIsLookingUp(true);
    setLookupSuccess(false);
    setLookupMessage("");

    try {
      const metadata = await enrichFromISBN(currentIsbn);

      if (metadata) {
        // Fill form fields with enriched data (only if they're empty)
        if (metadata.title && !watch("title")) {
          setValue("title", metadata.title);
        }
        if (metadata.author && !watch("author")) {
          setValue("author", metadata.author);
        }
        if (metadata.publisher && !watch("publisher")) {
          setValue("publisher", metadata.publisher);
        }
        if (metadata.publication_year && !watch("publication_year")) {
          setValue("publication_year", metadata.publication_year);
        }

        setLookupSuccess(true);
        setLookupMessage("Book information found and filled automatically!");
      } else {
        setLookupMessage(
          "No additional information found for this ISBN. You can continue entering details manually."
        );
      }
    } catch (error) {
      console.warn("ISBN lookup failed:", error);
      setLookupMessage(
        "ISBN lookup service unavailable. You can continue entering details manually."
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const onSubmit = async (data: BookFormData) => {
    if (!currentLibrary) {
      setError("root", { message: "No library selected" });
      return;
    }

    addBook({
      ...data,
      library_id: currentLibrary.id,
    });

    // Reset form for "Add Another Book" workflow - will happen in success handler
    reset();
  };

  const isLoading = isSubmitting || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookPlus className="h-5 w-5" />
          Add New Book
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-6"
        >
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {/* Required Fields Section */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Required Information
            </div>

            {/* Two-column layout on desktop, single column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Field - Required */}
              <div className="space-y-2">
                <Label htmlFor="title" className="required">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter book title"
                  {...register("title")}
                  aria-invalid={errors.title ? "true" : "false"}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Author Field - Required */}
              <div className="space-y-2">
                <Label htmlFor="author" className="required">
                  Author <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="author"
                  type="text"
                  placeholder="Enter author name"
                  {...register("author")}
                  aria-invalid={errors.author ? "true" : "false"}
                />
                {errors.author && (
                  <p className="text-sm text-red-600">
                    {errors.author.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Optional Fields Section */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Optional Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Publisher Field - Optional */}
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  type="text"
                  placeholder="Enter publisher name"
                  {...register("publisher")}
                  aria-invalid={errors.publisher ? "true" : "false"}
                />
                {errors.publisher && (
                  <p className="text-sm text-red-600">
                    {errors.publisher.message}
                  </p>
                )}
              </div>

              {/* Publication Year Field - Optional */}
              <div className="space-y-2">
                <Label htmlFor="publication_year">Publication Year</Label>
                <Input
                  id="publication_year"
                  type="number"
                  placeholder="e.g. 2024"
                  min="1000"
                  max={new Date().getFullYear()}
                  {...register("publication_year")}
                  aria-invalid={errors.publication_year ? "true" : "false"}
                />
                {errors.publication_year && (
                  <p className="text-sm text-red-600">
                    {errors.publication_year.message}
                  </p>
                )}
              </div>

              {/* ISBN Field - Optional with Lookup */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="isbn">ISBN</Label>
                <div className="flex gap-2">
                  <Input
                    id="isbn"
                    type="text"
                    placeholder="Enter 10 or 13 digit ISBN (optional)"
                    {...register("isbn")}
                    aria-invalid={errors.isbn ? "true" : "false"}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleISBNLookup}
                    disabled={isLookingUp || !currentIsbn?.trim()}
                    className="px-3"
                  >
                    {isLookingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {errors.isbn && (
                  <p className="text-sm text-red-600">{errors.isbn.message}</p>
                )}

                {/* ISBN Lookup Messages */}
                {lookupMessage && (
                  <div
                    className={`flex items-start gap-2 text-xs p-2 rounded-md ${
                      lookupSuccess
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {lookupSuccess && (
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{lookupMessage}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  ISBN is optional. Click the search button to automatically
                  fill book details if available.
                </p>
              </div>
            </div>
          </div>
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="sm:order-2 flex-1 sm:flex-none"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Book
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="sm:order-1"
              >
                Cancel
              </Button>
            )}
          </div>
          {/* Success State Instructions */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Note:</strong> After adding a book, you&apos;ll see a
            success notification with an option to &quot;Add Another Book&quot;
            or return to the books list.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
