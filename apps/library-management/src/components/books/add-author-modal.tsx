"use client";

/**
 * Add Author Modal Component
 * Modal for creating new authors with name and optional biography
 */

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
import { useCreateAuthor } from "@/lib/hooks/use-author-search";
import type { Author, AuthorFormData } from "@/lib/types/books";

// Form validation schema
const authorFormSchema = z.object({
  name: z
    .string()
    .min(1, "Author name is required")
    .max(255, "Name must be less than 255 characters")
    .trim(),
  biography: z
    .string()
    .max(1000, "Biography must be less than 1000 characters")
    .optional(),
});

type AuthorFormDataType = z.infer<typeof authorFormSchema>;

interface AddAuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorCreated: (author: Author) => void;
  prefillName?: string;
}

export function AddAuthorModal({
  isOpen,
  onClose,
  onAuthorCreated,
  prefillName,
}: AddAuthorModalProps): React.JSX.Element {
  const createAuthor = useCreateAuthor();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AuthorFormDataType>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: {
      name: "",
      biography: "",
    },
  });

  // Prefill name when modal opens
  useEffect(() => {
    if (isOpen && prefillName) {
      setValue("name", prefillName);
    }
  }, [isOpen, prefillName, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: AuthorFormDataType): Promise<void> => {
    setError(null);

    const authorData: AuthorFormData = {
      name: data.name,
      biography: data.biography?.trim() || undefined,
    };

    createAuthor.mutate(authorData, {
      onSuccess: (createdAuthor) => {
        onAuthorCreated(createdAuthor);
        onClose();
      },
      onError: (err) => {
        console.error("Error creating author:", err);
        setError(err instanceof Error ? err.message : "Failed to create author");
      },
    });
  };

  const handleClose = (): void => {
    if (!createAuthor.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Author
          </DialogTitle>
          <DialogDescription>
            Create a new author profile that can be used across all libraries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Author Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="author-name" className="required">
              Author Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="author-name"
              type="text"
              placeholder="Enter author's full name"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
              disabled={createAuthor.isPending}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use the author&apos;s commonly known name (e.g., &quot;Mark Twain&quot; or &quot;Samuel Clemens&quot;)
            </p>
          </div>

          {/* Biography - Optional */}
          <div className="space-y-2">
            <Label htmlFor="author-biography">Biography (Optional)</Label>
            <Textarea
              id="author-biography"
              placeholder="Brief biography or description of the author..."
              className="min-h-[80px] resize-none"
              maxLength={1000}
              {...register("biography")}
              aria-invalid={errors.biography ? "true" : "false"}
              disabled={createAuthor.isPending}
            />
            {errors.biography && (
              <p className="text-sm text-red-600">{errors.biography.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional. You can add a brief biography or leave empty to fill later.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createAuthor.isPending}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAuthor.isPending}
              className="sm:w-auto"
            >
              {createAuthor.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Author
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Note:</strong> Authors are shared across all libraries in the system. 
            Check if the author already exists before creating a new one to avoid duplicates.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}