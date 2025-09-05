/**
 * ISBN Validation and Processing Utilities
 * Handles ISBN-10 and ISBN-13 validation, formatting, and conversion
 */

/**
 * Validate ISBN-10 format with check digit verification
 */
function validateISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(isbn[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * (10 - i);
  }

  const checkDigit = isbn[9];
  const remainder = sum % 11;
  const expectedCheck = (11 - remainder) % 11;
  const expectedCheckChar =
    expectedCheck === 10 ? "X" : expectedCheck.toString();

  return checkDigit.toUpperCase() === expectedCheckChar;
}

/**
 * Validate ISBN-13 format with check digit verification
 */
function validateISBN13(isbn: string): boolean {
  if (isbn.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = parseInt(isbn[12], 10);
  if (isNaN(checkDigit)) return false;

  const expectedCheck = (10 - (sum % 10)) % 10;
  return checkDigit === expectedCheck;
}

/**
 * Main ISBN validation function - supports both ISBN-10 and ISBN-13
 */
export function validateISBN(isbn: string): boolean {
  if (!isbn) return false;

  const cleanISBN = isbn.replace(/[-\s]/g, "");

  if (cleanISBN.length === 10) {
    return validateISBN10(cleanISBN);
  } else if (cleanISBN.length === 13) {
    return validateISBN13(cleanISBN);
  }

  return false;
}

/**
 * Convert ISBN-10 to ISBN-13 by adding 978 prefix and recalculating check digit
 */
function isbn10ToIsbn13(isbn10: string): string {
  const base = "978" + isbn10.substring(0, 9);

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

/**
 * Convert ISBN-13 to ISBN-10 (only if it starts with 978)
 */
function isbn13ToIsbn10(isbn13: string): string | null {
  if (!isbn13.startsWith("978")) return null;

  const base = isbn13.substring(3, 12);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i], 10) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = (11 - remainder) % 11;
  const checkChar = checkDigit === 10 ? "X" : checkDigit.toString();

  return base + checkChar;
}

/**
 * Format ISBN string and provide both ISBN-10 and ISBN-13 versions when possible
 */
export function formatISBN(isbn: string): {
  isbn10?: string;
  isbn13?: string;
  isValid: boolean;
} {
  if (!validateISBN(isbn)) {
    return { isValid: false };
  }

  const cleanISBN = isbn.replace(/[-\s]/g, "");

  if (cleanISBN.length === 10) {
    const isbn13 = isbn10ToIsbn13(cleanISBN);
    return {
      isbn10: cleanISBN,
      isbn13,
      isValid: true,
    };
  } else if (cleanISBN.length === 13) {
    const isbn10 = isbn13ToIsbn10(cleanISBN);
    return {
      isbn10: isbn10 || undefined,
      isbn13: cleanISBN,
      isValid: true,
    };
  }

  return { isValid: false };
}

/**
 * Book metadata structure from external enrichment service
 */
export interface BookMetadata {
  title?: string;
  author?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  cover_image_url?: string;
  isbn_10?: string;
  isbn_13?: string;
}

/**
 * Check if crawler service is available
 */
async function isCrawlerServiceAvailable(): Promise<boolean> {
  try {
    // In production, this would be an environment variable
    const crawlerUrl =
      process.env.NEXT_PUBLIC_CRAWLER_SERVICE_URL || "http://localhost:8000";

    const response = await fetch(`${crawlerUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    return response.ok;
  } catch (error) {
    console.warn("Crawler service unavailable:", error);
    return false;
  }
}

/**
 * Enrich book metadata from ISBN using crawler service
 * AC: Optional ISBN lookup with graceful degradation
 */
export async function enrichFromISBN(
  isbn: string
): Promise<BookMetadata | null> {
  if (!validateISBN(isbn)) {
    return null;
  }

  try {
    // Check if service is available first
    const isAvailable = await isCrawlerServiceAvailable();
    if (!isAvailable) {
      console.info("Crawler service unavailable, skipping ISBN enrichment");
      return null;
    }

    const cleanISBN = isbn.replace(/[-\s]/g, "");
    const crawlerUrl =
      process.env.NEXT_PUBLIC_CRAWLER_SERVICE_URL || "http://localhost:8000";

    const response = await fetch(`${crawlerUrl}/api/enrich/isbn/${cleanISBN}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(
        "ISBN enrichment failed:",
        response.status,
        response.statusText
      );
      return null;
    }

    const metadata = await response.json();

    // Validate the response structure
    if (!metadata || typeof metadata !== "object") {
      console.warn("Invalid metadata response from crawler service");
      return null;
    }

    return {
      title: metadata.title || undefined,
      author: metadata.author || undefined,
      publisher: metadata.publisher || undefined,
      publication_year: metadata.publication_year || undefined,
      description: metadata.description || undefined,
      cover_image_url: metadata.cover_image_url || undefined,
      isbn_10: metadata.isbn_10 || undefined,
      isbn_13: metadata.isbn_13 || undefined,
    };
  } catch (error) {
    console.warn("ISBN enrichment error:", error);
    return null;
  }
}

/**
 * Clean and normalize ISBN input for storage and validation
 */
export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").toUpperCase();
}

/**
 * Format ISBN for display with standard hyphens
 */
export function formatISBNForDisplay(isbn: string): string {
  const clean = normalizeISBN(isbn);

  if (clean.length === 10) {
    // Format: 0-123-45678-9
    return `${clean.substring(0, 1)}-${clean.substring(1, 4)}-${clean.substring(4, 9)}-${clean.substring(9, 10)}`;
  } else if (clean.length === 13) {
    // Format: 978-0-123-45678-9
    return `${clean.substring(0, 3)}-${clean.substring(3, 4)}-${clean.substring(4, 7)}-${clean.substring(7, 12)}-${clean.substring(12, 13)}`;
  }

  return isbn; // Return original if not valid length
}
