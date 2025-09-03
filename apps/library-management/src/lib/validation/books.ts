/**
 * Book Validation Schemas
 * Zod schemas for book form validation and type inference
 */

import { z } from "zod";
import { validateISBN } from "./isbn";

/**
 * Add Book Form Validation Schema
 * Based on AC requirements: title (required), author (required), 
 * publisher (optional), publication year (optional), ISBN (optional)
 */
export const addBookSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim(),
  author: z
    .string()
    .min(1, "Author is required")
    .max(255, "Author name must be less than 255 characters")
    .trim(),
  publisher: z
    .string()
    .max(255, "Publisher name must be less than 255 characters")
    .optional(),
  publication_year: z.coerce
    .number()
    .min(1000, "Year must be after 1000")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),
  isbn: z
    .string()
    .refine((value) => !value || value === "" || validateISBN(value), {
      message: "Invalid ISBN format - must be a valid 10 or 13 digit ISBN",
    })
    .optional(),
});

export type AddBookFormData = z.infer<typeof addBookSchema>;

/**
 * Book Creation Data for API
 * Internal type for book creation with additional system fields
 */
export interface BookCreationData extends AddBookFormData {
  library_id: string;
  enrichment_status?: "pending" | "completed" | "failed" | "not_attempted";
  enrichment_source?: string;
}

/**
 * Book Creation Result
 * Returned from successful book creation API
 */
export interface BookCreationResult {
  generalBook: {
    id: string;
    canonical_title: string;
  };
  edition: {
    id: string;
    title: string;
    isbn_10?: string;
    isbn_13?: string;
  };
  author: {
    id: string;
    name: string;
    canonical_name: string;
  };
  copy: {
    id: string;
    library_id: string;
    copy_number: string;
    availability: {
      status: "available";
      since: string;
    };
  };
}

/**
 * Duplicate Detection Result
 * Used for checking existing books before creation
 */
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingBooks?: Array<{
    id: string;
    title: string;
    author_name: string;
    availability_status: string;
    copy_number: string;
  }>;
  suggestion?: string;
}