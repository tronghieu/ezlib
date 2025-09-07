import { z } from "zod";

/**
 * Validation schema for updating book copy information
 * Aligned with existing creation patterns from add-copies-form
 */
export const bookCopyUpdateSchema = z.object({
  copy_number: z
    .string()
    .max(50, "Copy number must be less than 50 characters")
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
    .optional()
    .or(z.literal("")),

  section: z
    .string()
    .max(50, "Section must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  call_number: z
    .string()
    .max(50, "Call number must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  condition: z.enum(["excellent", "good", "fair", "poor"], {
    required_error: "Condition is required",
    invalid_type_error: "Invalid condition value",
  }),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * Type definition for book copy update data
 */
export type BookCopyUpdateData = z.infer<typeof bookCopyUpdateSchema>;

/**
 * Validation schema for book copy creation (more fields required)
 */
export const bookCopyCreateSchema = bookCopyUpdateSchema.extend({
  book_edition_id: z.string().uuid("Invalid book edition ID"),
  library_id: z.string().uuid("Invalid library ID"),
  barcode: z
    .string()
    .max(50, "Barcode must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  status: z
    .enum(["active", "inactive", "damaged", "lost", "maintenance"])
    .default("active"),
});

/**
 * Type definition for book copy creation data
 */
export type BookCopyCreateData = z.infer<typeof bookCopyCreateSchema>;

/**
 * Validation schema for book copy search/filtering
 */
export const bookCopySearchSchema = z.object({
  query: z.string().optional(),
  status: z
    .enum(["active", "inactive", "damaged", "lost", "maintenance", "all"])
    .default("active"),
  condition: z
    .enum(["excellent", "good", "fair", "poor", "all"])
    .default("all"),
  availability: z
    .enum(["available", "borrowed", "reserved", "maintenance", "all"])
    .default("all"),
  shelf: z.string().optional(),
  section: z.string().optional(),
  sort_by: z
    .enum(["copy_number", "title", "author", "condition", "updated_at"])
    .default("copy_number"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

/**
 * Type definition for book copy search parameters
 */
export type BookCopySearchParams = z.infer<typeof bookCopySearchSchema>;

/**
 * Helper function to validate and transform copy number format
 */
export function validateCopyNumber(copyNumber: string, existingNumbers: string[] = []): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  // Check if it meets the basic schema requirements
  const result = z.string().min(1).max(20).safeParse(copyNumber);
  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0].message,
    };
  }

  // Check for duplicates
  if (existingNumbers.includes(copyNumber.trim())) {
    return {
      isValid: false,
      error: "Copy number already exists",
      suggestion: generateNextCopyNumber(copyNumber, existingNumbers),
    };
  }

  // Check format
  const formatResult = bookCopyUpdateSchema.shape.copy_number.safeParse(copyNumber);
  if (!formatResult.success) {
    return {
      isValid: false,
      error: formatResult.error.issues[0].message,
    };
  }

  return { isValid: true };
}

/**
 * Helper function to generate next available copy number
 */
export function generateNextCopyNumber(baseCopyNumber: string, existingNumbers: string[]): string {
  // Extract number suffix if present
  const match = baseCopyNumber.match(/^(.*?)(\d+)$/);
  
  if (match) {
    const [, prefix, numberStr] = match;
    let number = parseInt(numberStr, 10);
    let candidate: string;
    
    do {
      number++;
      candidate = `${prefix}${number.toString().padStart(numberStr.length, '0')}`;
    } while (existingNumbers.includes(candidate));
    
    return candidate;
  } else {
    // No number suffix, add one
    let number = 1;
    let candidate: string;
    
    do {
      candidate = `${baseCopyNumber}-${number.toString().padStart(3, '0')}`;
      number++;
    } while (existingNumbers.includes(candidate));
    
    return candidate;
  }
}

/**
 * Helper function to validate location information
 */
export function validateLocation(location: {
  shelf?: string;
  section?: string;
  call_number?: string;
}): { isValid: boolean; error?: string } {
  const result = bookCopyUpdateSchema.shape.location.safeParse(location);
  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0].message,
    };
  }

  return { isValid: true };
}