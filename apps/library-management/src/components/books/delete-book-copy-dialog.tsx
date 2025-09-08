"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDeleteBookCopy } from "@/lib/hooks/use-book-copy-detail";
import type { BookCopy } from "@/types/books";
import { toast } from "sonner";

interface DeleteBookCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookCopy: BookCopy;
  libraryId: string;
  onSuccess?: () => void;
}

export function DeleteBookCopyDialog({
  open,
  onOpenChange,
  bookCopy,
  libraryId,
  onSuccess,
}: DeleteBookCopyDialogProps): React.JSX.Element {
  const [confirmationText, setConfirmationText] = useState("");
  const deleteMutation = useDeleteBookCopy();

  const { book_edition } = bookCopy;
  const authors = book_edition?.authors || [];
  const authorNames = authors.map(a => a.name).join(", ");
  
  const isCurrentlyBorrowed = bookCopy.availability?.status === "borrowed";
  const hasHolds = bookCopy.availability?.hold_queue && bookCopy.availability.hold_queue.length > 0;
  
  const expectedConfirmation = `DELETE ${bookCopy.copy_number}`;
  const isConfirmationValid = confirmationText.trim() === expectedConfirmation;

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      toast.error("Please type the confirmation text correctly");
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        bookCopyId: bookCopy.id,
        libraryId,
      });
      
      toast.success("Book copy deleted successfully");
      onOpenChange(false);
      
      // Call success callback to navigate away
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to delete book copy:", error);
      toast.error("Failed to delete book copy. Please try again.");
    }
  };

  const handleCancel = () => {
    setConfirmationText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Book Copy
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The book copy will be permanently removed from your library inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Book Copy Information */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <div className="font-medium">
                {book_edition?.title || "Untitled"}
              </div>
              {book_edition?.subtitle && (
                <div className="text-sm text-muted-foreground">
                  {book_edition.subtitle}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                by {authorNames || "Unknown Author"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">Copy #{bookCopy.copy_number}</Badge>
                <Badge 
                  variant={bookCopy.status === "active" ? "default" : "secondary"}
                >
                  {bookCopy.status}
                </Badge>
                {bookCopy.availability && (
                  <Badge 
                    variant={bookCopy.availability.status === "available" ? "default" : "destructive"}
                  >
                    {bookCopy.availability.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {(isCurrentlyBorrowed || hasHolds) && (
            <Alert className="border-destructive bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {isCurrentlyBorrowed && (
                    <div className="font-medium text-destructive">
                      ⚠️ This book is currently borrowed and not returned yet.
                    </div>
                  )}
                  {hasHolds && (
                    <div className="font-medium text-destructive">
                      ⚠️ This book has {bookCopy.availability?.hold_queue?.length} active holds.
                    </div>
                  )}
                  <div className="text-sm">
                    Deleting this book copy may affect borrowing records and member reservations. 
                    Consider marking it as &quot;inactive&quot; instead if you want to temporarily remove it from circulation.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <code className="px-1 py-0.5 bg-muted rounded text-sm font-mono">
                {expectedConfirmation}
              </code> to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Type confirmation text here"
              disabled={deleteMutation.isPending}
            />
          </div>

          {/* Audit Trail Notice */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
            <strong>Note:</strong> This action will be logged in the audit trail with your user information and timestamp for library record keeping.
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={deleteMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Book Copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}