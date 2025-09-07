"use client";

/**
 * Add Edition Form Component
 * Progressive form for creating new book editions with author search
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Card components not used in current implementation
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookPlus, AlertCircle, User } from "lucide-react";
import { AuthorSearchCombobox } from "./author-search-combobox";
import { AddAuthorModal } from "./add-author-modal";
import { useCreateBookEdition } from "@/lib/hooks/use-book-management";
import type {
  BookEdition,
  Author,
  BookEditionFormData,
} from "@/lib/types/books";
import { Separator } from "../ui/separator";

// Form validation schema
const editionFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  subtitle: z
    .string()
    .max(255, "Subtitle must be less than 255 characters")
    .optional(),
  language: z.string().min(1, "Language is required"),
  publication_year: z
    .number()
    .min(1000, "Year must be after 1000")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),
  publisher: z
    .string()
    .max(255, "Publisher name must be less than 255 characters")
    .optional(),
  isbn: z
    .string()
    .regex(/^(?:\d{10}|\d{13}|\d{9}[\dXx])$/, "Invalid ISBN format")
    .optional()
    .or(z.literal("")),
});

type EditionFormData = z.infer<typeof editionFormSchema>;

interface AddEditionFormProps {
  suggestedTitle?: string;
  onEditionCreated: (edition: BookEdition) => void;
  onCancel: () => void;
}

export function AddEditionForm({
  suggestedTitle,
  onEditionCreated,
  onCancel,
}: AddEditionFormProps): React.JSX.Element {
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const createBookEdition = useCreateBookEdition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditionFormData>({
    resolver: zodResolver(editionFormSchema),
    defaultValues: {
      title: suggestedTitle || "",
      subtitle: "",
      language: "en", // Default to English
      publication_year: undefined,
      publisher: "",
      isbn: "",
    },
  });

  const handleAuthorSelected = (author: Author): void => {
    setSelectedAuthor(author);
    setError(null);
  };

  const handleCreateNewAuthor = (): void => {
    setIsAuthorModalOpen(true);
  };

  const handleAuthorCreated = (author: Author): void => {
    setSelectedAuthor(author);
    setIsAuthorModalOpen(false);
    setError(null);
  };

  const onSubmit = async (data: EditionFormData): Promise<void> => {
    if (!selectedAuthor) {
      setError("Please select or create an author for this book");
      return;
    }

    setError(null);

    const editionData: BookEditionFormData = {
      ...data,
      author_id: selectedAuthor.id,
      subtitle: data.subtitle || undefined,
      publication_year: data.publication_year || undefined,
      publisher: data.publisher || undefined,
      isbn: data.isbn || undefined,
    };

    createBookEdition.mutate(editionData, {
      onSuccess: (createdEdition) => {
        onEditionCreated(createdEdition);
      },
      onError: (err) => {
        console.error("Error creating book edition:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create book edition"
        );
      },
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            First, select an author or create a new one, then fill in the book
            details.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Author Selection */}
        <div>
          <h3 className="text-base flex items-center gap-2 mb-4">
            <User className="h-4 w-4" />
            Step 1: Select Author
            {selectedAuthor && <span className="text-green-600">✓</span>}
          </h3>
          <AuthorSearchCombobox
            onAuthorSelected={handleAuthorSelected}
            onCreateNewAuthor={handleCreateNewAuthor}
            selectedAuthor={selectedAuthor}
          />
        </div>

        <Separator />

        {/* Book Edition Details */}
        <div>
          <h3 className="text-base flex items-center gap-2 mb-4">
            <BookPlus className="h-4 w-4" />
            Step 2: Book Details
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title - Required */}
              <div className="md:col-span-2 space-y-2">
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

              {/* Language - Required */}
              <div className="space-y-2">
                <Label htmlFor="language" className="required">
                  Language <span className="text-red-500">*</span>
                </Label>
                <select
                  id="language"
                  {...register("language")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="en">English</option>
                  <option value="vi">Vietnamese</option>
                  <option value="zh">Chinese</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
                {errors.language && (
                  <p className="text-sm text-red-600">
                    {errors.language.message}
                  </p>
                )}
              </div>

              {/* Subtitle - Optional */}
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  type="text"
                  placeholder="Enter subtitle (if any)"
                  {...register("subtitle")}
                  aria-invalid={errors.subtitle ? "true" : "false"}
                />
                {errors.subtitle && (
                  <p className="text-sm text-red-600">
                    {errors.subtitle.message}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Publication Year */}
              <div className="space-y-2">
                <Label htmlFor="publication_year">Publication Year</Label>
                <Input
                  id="publication_year"
                  type="number"
                  placeholder="e.g. 2024"
                  min="1000"
                  max={new Date().getFullYear()}
                  {...register("publication_year", { valueAsNumber: true })}
                  aria-invalid={errors.publication_year ? "true" : "false"}
                />
                {errors.publication_year && (
                  <p className="text-sm text-red-600">
                    {errors.publication_year.message}
                  </p>
                )}
              </div>

              {/* Publisher */}
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  type="text"
                  placeholder="Publisher name"
                  {...register("publisher")}
                  aria-invalid={errors.publisher ? "true" : "false"}
                />
                {errors.publisher && (
                  <p className="text-sm text-red-600">
                    {errors.publisher.message}
                  </p>
                )}
              </div>

              {/* ISBN */}
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  type="text"
                  placeholder="10 or 13 digit ISBN"
                  {...register("isbn")}
                  aria-invalid={errors.isbn ? "true" : "false"}
                />
                {errors.isbn && (
                  <p className="text-sm text-red-600">{errors.isbn.message}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createBookEdition.isPending}
              >
                Back to Search
              </Button>

              <Button
                type="submit"
                disabled={createBookEdition.isPending || !selectedAuthor}
              >
                {createBookEdition.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Book Edition
              </Button>
            </div>

            {/* Form Help */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>Note:</strong> All fields except Title and Language are
              optional. You can add more details later. ISBN should be 10 or 13
              digits.
            </div>
          </form>
        </div>
      </div>

      {/* Add Author Modal */}
      <AddAuthorModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onAuthorCreated={handleAuthorCreated}
      />
    </>
  );
}
