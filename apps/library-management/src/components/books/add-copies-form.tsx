"use client";

/**
 * Add Copies Form Component
 * Final step: Create library-specific book copies
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Badge component not used in current implementation
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Package,
  AlertCircle,
  Book,
  User,
  Calendar,
  Building,
  Hash,
  Scan,
  Globe,
} from "lucide-react";
import { useLibraryContext } from "@/lib/contexts/library-context";
import { useCreateBookCopies } from "@/lib/hooks/use-book-management";
import type { BookEdition, BookCopyFormData } from "@/lib/types/books";
import { Separator } from "../ui/separator";

// Form validation schema
const copiesFormSchema = z.object({
  total_copies: z
    .number()
    .min(1, "Must add at least 1 copy")
    .max(99, "Cannot add more than 99 copies at once"),
  copy_number: z
    .string()
    .max(20, "Copy number must be less than 20 characters")
    .regex(
      /^[A-Za-z0-9\-_]*$/,
      "Copy number can only contain letters, numbers, hyphens and underscores"
    )
    .optional()
    .or(z.literal("")),
  barcode: z
    .string()
    .max(50, "Barcode must be less than 50 characters")
    .regex(
      /^[A-Za-z0-9\-_]*$/,
      "Barcode can only contain letters, numbers, hyphens and underscores"
    )
    .optional()
    .or(z.literal("")),
  shelf_location: z
    .string()
    .max(50, "Shelf location must be less than 50 characters")
    .optional(),
  section: z
    .string()
    .max(50, "Section must be less than 50 characters")
    .optional(),
  call_number: z
    .string()
    .max(50, "Call number must be less than 50 characters")
    .optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

type CopiesFormData = z.infer<typeof copiesFormSchema>;

interface AddCopiesFormProps {
  edition: BookEdition;
  onCopiesCreated: () => void;
  onCancel: () => void;
}

export function AddCopiesForm({
  edition,
  onCopiesCreated,
  onCancel,
}: AddCopiesFormProps): React.JSX.Element {
  const { currentLibrary } = useLibraryContext();
  const createBookCopies = useCreateBookCopies();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CopiesFormData>({
    resolver: zodResolver(copiesFormSchema),
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

  const totalCopies = watch("total_copies");

  const onSubmit = async (data: CopiesFormData): Promise<void> => {
    if (!currentLibrary) {
      setError("No library selected");
      return;
    }

    setError(null);

    const copyData: BookCopyFormData = {
      total_copies: data.total_copies,
      copy_number: data.copy_number?.trim() || undefined,
      barcode: data.barcode?.trim() || undefined,
      shelf_location: data.shelf_location?.trim() || undefined,
      section: data.section?.trim() || undefined,
      call_number: data.call_number?.trim() || undefined,
      condition: data.condition,
      notes: data.notes?.trim() || undefined,
    };

    createBookCopies.mutate(
      { editionId: edition.id, libraryId: currentLibrary.id, copyData },
      {
        onSuccess: () => {
          onCopiesCreated();
        },
        onError: (err) => {
          console.error("Error creating book copies:", err);
          setError(
            err instanceof Error ? err.message : "Failed to create book copies"
          );
        },
      }
    );
  };

  // Get primary author name
  const primaryAuthor = edition.authors?.[0]?.name || "Unknown Author";
  const publicationYear = edition.edition_metadata?.publication_date;
  const publisher = edition.edition_metadata?.publisher;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Add physical copies of this book to your library&apos;s inventory.
        </p>
      </div>

      {/* Book Summary */}
      <Card className="bg-muted/50">
        <CardContent>
          <div className="flex items-start gap-3">
            <Book className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-medium text-sm">{edition.title}</h4>
                {edition.subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {edition.subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {primaryAuthor}
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {edition.language.toUpperCase()}
                </div>
                {publicationYear && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {publicationYear}
                  </div>
                )}
                {publisher && (
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {publisher}
                  </div>
                )}
                {edition.isbn_13 && (
                  <div className="flex items-center gap-1">
                    ISBN: {edition.isbn_13}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Copies Form */}
      <div>
        <div className="mb-4">
          <h4 className="text-base font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Copy Details for {currentLibrary?.name}
          </h4>
        </div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Form Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Copies & Condition */}
              <div className="space-y-4 bg-muted/50 p-3 rounded-2xl border">
                {/* Number of Copies */}
                <div className="space-y-2">
                  <Label htmlFor="total_copies" className="required">
                    Number of Copies <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="total_copies"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="1"
                    {...register("total_copies", { valueAsNumber: true })}
                    aria-invalid={errors.total_copies ? "true" : "false"}
                  />
                  {errors.total_copies && (
                    <p className="text-sm text-red-600">
                      {errors.total_copies.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    How many physical copies to add to your library
                  </p>
                </div>

                {/* Condition */}
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={watch("condition")}
                    onValueChange={(
                      value: "excellent" | "good" | "fair" | "poor"
                    ) => {
                      setValue("condition", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.condition && (
                    <p className="text-sm text-red-600">
                      {errors.condition.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Management */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">
                    Management (Optional)
                  </Label>
                </div>

                {/* Auto vs Manual Info */}

                {/* Copy Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="copy_number"
                    className="flex items-center gap-2"
                  >
                    <Hash className="h-3 w-3" />
                    Identify Code
                  </Label>
                  <Input
                    id="copy_number"
                    type="text"
                    placeholder="e.g. A001, SC-01, 123"
                    {...register("copy_number")}
                    aria-invalid={errors.copy_number ? "true" : "false"}
                  />
                  {errors.copy_number && (
                    <p className="text-sm text-red-600">
                      {errors.copy_number.message}
                    </p>
                  )}
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="flex items-center gap-2">
                    <Scan className="h-3 w-3" />
                    Barcode
                  </Label>
                  <Input
                    id="barcode"
                    type="text"
                    placeholder="e.g. 1234567890123"
                    {...register("barcode")}
                    aria-invalid={errors.barcode ? "true" : "false"}
                  />
                  {errors.barcode && (
                    <p className="text-sm text-red-600">
                      {errors.barcode.message}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Auto vs Manual:</strong> If left blank, the system
                    will auto-generate a sequential identify code. Use custom
                    codes if your library has specific numbering or barcode
                    requirements.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="h-0 border-t border-dashed bg-transparent" />

            {/* Location Information */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Location Information (Optional)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Shelf Location */}
                <div className="space-y-2">
                  <Label htmlFor="shelf_location">Shelf</Label>
                  <Input
                    id="shelf_location"
                    type="text"
                    placeholder="e.g. A1, B3-Top"
                    {...register("shelf_location")}
                    aria-invalid={errors.shelf_location ? "true" : "false"}
                  />
                  {errors.shelf_location && (
                    <p className="text-sm text-red-600">
                      {errors.shelf_location.message}
                    </p>
                  )}
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    type="text"
                    placeholder="e.g. Fiction, Science"
                    {...register("section")}
                    aria-invalid={errors.section ? "true" : "false"}
                  />
                  {errors.section && (
                    <p className="text-sm text-red-600">
                      {errors.section.message}
                    </p>
                  )}
                </div>

                {/* Call Number */}
                <div className="space-y-2">
                  <Label htmlFor="call_number">Call Number</Label>
                  <Input
                    id="call_number"
                    type="text"
                    placeholder="e.g. 813.54 SMI"
                    {...register("call_number")}
                    aria-invalid={errors.call_number ? "true" : "false"}
                  />
                  {errors.call_number && (
                    <p className="text-sm text-red-600">
                      {errors.call_number.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                placeholder="Any additional notes about these copies..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                maxLength={500}
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Summary */}
            {totalCopies > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm">
                  <strong>Summary:</strong> Adding {totalCopies} cop
                  {totalCopies === 1 ? "y" : "ies"} of &quot;{edition.title}
                  &quot; to {currentLibrary?.name}. All copies will be set to
                  &quot;available&quot; status automatically.
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createBookCopies.isPending}
              >
                Back to Search
              </Button>

              <Button type="submit" disabled={createBookCopies.isPending}>
                {createBookCopies.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add {totalCopies} Cop{totalCopies === 1 ? "y" : "ies"}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>Note:</strong> All location information is optional and
              can be updated later. Each copy will be automatically assigned a
              unique copy number within your library.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
