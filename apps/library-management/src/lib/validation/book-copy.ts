import { z } from "zod";

/**
 * Validation schema for updating book copy information
 * Aligned with existing creation patterns from add-copies-form
 */
export const bookCopyUpdateSchema = z
  .object({
    total_copies: z
      .number()
      .min(1, "Must have at least 1 copy")
      .max(99, "Cannot have more than 99 copies")
      .optional(),

    copy_number: z
      .string()
      .max(50, "Identify code must be less than 50 characters")
      .regex(
        /^[A-Za-z0-9\-_]*$/,
        "Identify code can only contain letters, numbers, hyphens and underscores"
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

    // Support both flat fields (for forms) AND nested objects (for tests/API consistency)
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

    condition: z
      .enum(["excellent", "good", "fair", "poor"], {
        message: "Invalid condition value",
      })
      .optional(),

    notes: z
      .string()
      .max(500, "Notes must be less than 500 characters")
      .optional()
      .or(z.literal("")),

    // Nested structure support for tests and backwards compatibility
    location: z
      .object({
        shelf: z.string().max(50).optional().or(z.literal("")),
        section: z.string().max(50).optional().or(z.literal("")),
        call_number: z.string().max(100).optional().or(z.literal("")),
      })
      .optional(),

    condition_info: z
      .object({
        condition: z.enum(["excellent", "good", "fair", "poor"]),
        notes: z.string().max(500).optional().or(z.literal("")),
      })
      .optional(),
  })
  .transform((data) => {
    // Transform nested structures to flat fields if needed for backwards compatibility
    if (data.condition_info?.condition && !data.condition) {
      data.condition = data.condition_info.condition;
    }
    if (data.condition_info?.notes && !data.notes) {
      data.notes = data.condition_info.notes;
    }
    if (data.location?.shelf && !data.shelf_location) {
      data.shelf_location = data.location.shelf;
    }
    if (data.location?.section && !data.section) {
      data.section = data.location.section;
    }
    if (data.location?.call_number && !data.call_number) {
      data.call_number = data.location.call_number;
    }
    return data;
  });

/**
 * Type definition for book copy update data
 */
export type BookCopyUpdateData = z.infer<typeof bookCopyUpdateSchema>;

/**
 * Validation schema for book copy creation (more fields required)
 */
export const bookCopyCreateSchema = z.object({
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
    message: "Invalid condition value",
  }),

  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  // Additional fields for creation
  book_edition_id: z.uuid("Invalid book edition ID"),
  library_id: z.uuid("Invalid library ID"),
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
export function validateCopyNumber(
  copyNumber: string,
  existingNumbers: string[] = []
): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  // Check if it meets the basic schema requirements
  const result = z.string().min(1).max(50).safeParse(copyNumber);
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

  // Check format using a separate schema since the main schema has transform
  const copyNumberSchema = z
    .string()
    .max(50, "Copy number must be less than 50 characters")
    .regex(
      /^[A-Za-z0-9\-_]*$/,
      "Copy number can only contain letters, numbers, hyphens and underscores"
    );

  const formatResult = copyNumberSchema.safeParse(copyNumber);
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
export function generateNextCopyNumber(
  baseCopyNumber: string,
  existingNumbers: string[]
): string {
  // Extract number suffix if present
  const match = baseCopyNumber.match(/^(.*?)(\d+)$/);

  if (match) {
    const [, prefix, numberStr] = match;
    let number = parseInt(numberStr, 10);
    let candidate: string;

    do {
      number++;
      candidate = `${prefix}${number.toString().padStart(numberStr.length, "0")}`;
    } while (existingNumbers.includes(candidate));

    return candidate;
  } else {
    // No number suffix, add one
    let number = 1;
    let candidate: string;

    do {
      candidate = `${baseCopyNumber}-${number.toString().padStart(3, "0")}`;
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
  // Create separate validation schemas since the main schema has transform
  const shelfSchema = z
    .string()
    .max(50, "Shelf location must be less than 50 characters");
  const sectionSchema = z
    .string()
    .max(50, "Section must be less than 50 characters");
  const callNumberSchema = z
    .string()
    .max(100, "Call number must be less than 100 characters");

  // Validate shelf location
  if (location.shelf) {
    const shelfResult = shelfSchema.safeParse(location.shelf);
    if (!shelfResult.success) {
      return {
        isValid: false,
        error: shelfResult.error.issues[0].message,
      };
    }
  }

  // Validate section
  if (location.section) {
    const sectionResult = sectionSchema.safeParse(location.section);
    if (!sectionResult.success) {
      return {
        isValid: false,
        error: sectionResult.error.issues[0].message,
      };
    }
  }

  // Validate call number
  if (location.call_number) {
    const callNumberResult = callNumberSchema.safeParse(location.call_number);
    if (!callNumberResult.success) {
      return {
        isValid: false,
        error: callNumberResult.error.issues[0].message,
      };
    }
  }

  return { isValid: true };
}
