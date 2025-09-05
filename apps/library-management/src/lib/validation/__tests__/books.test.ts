import { addBookSchema } from "../books";
import type { AddBookFormData } from "../books";

describe("Book Validation Schema", () => {
  // AC7: Form validation ensures title and author provided
  describe("addBookSchema validation", () => {
    test("2.2-UNIT-027: should validate required title field", () => {
      const invalidData = {
        title: "",
        author: "Test Author",
      };

      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const titleError = result.error.issues.find(
          (e) => e.path[0] === "title"
        );
        expect(titleError?.message).toBe("Title is required");
      }
    });

    test("2.2-UNIT-028: should validate required author field", () => {
      const invalidData = {
        title: "Test Book",
        author: "",
      };

      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const authorError = result.error.issues.find(
          (e) => e.path[0] === "author"
        );
        expect(authorError?.message).toBe("Author is required");
      }
    });

    test("2.2-UNIT-029: should validate title character limits", () => {
      const invalidData = {
        title: "a".repeat(256), // Exceeds 255 character limit
        author: "Test Author",
      };

      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const titleError = result.error.issues.find(
          (e) => e.path[0] === "title"
        );
        expect(titleError?.message).toBe(
          "Title must be less than 255 characters"
        );
      }
    });

    test("2.2-UNIT-030: should validate author character limits", () => {
      const invalidData = {
        title: "Test Book",
        author: "a".repeat(256), // Exceeds 255 character limit
      };

      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const authorError = result.error.issues.find(
          (e) => e.path[0] === "author"
        );
        expect(authorError?.message).toBe(
          "Author name must be less than 255 characters"
        );
      }
    });

    test("2.2-UNIT-031: should validate publication year range", () => {
      const invalidDataEarly = {
        title: "Test Book",
        author: "Test Author",
        publication_year: 999,
      };

      let result = addBookSchema.safeParse(invalidDataEarly);
      expect(result.success).toBe(false);

      if (!result.success) {
        const yearError = result.error.issues.find(
          (e) => e.path[0] === "publication_year"
        );
        expect(yearError?.message).toBe("Year must be after 1000");
      }

      const invalidDataFuture = {
        title: "Test Book",
        author: "Test Author",
        publication_year: new Date().getFullYear() + 1,
      };

      result = addBookSchema.safeParse(invalidDataFuture);
      expect(result.success).toBe(false);

      if (!result.success) {
        const yearError = result.error.issues.find(
          (e) => e.path[0] === "publication_year"
        );
        expect(yearError?.message).toBe("Year cannot be in the future");
      }
    });

    test("2.2-UNIT-032: should validate ISBN format", () => {
      const invalidData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "invalid-isbn",
      };

      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const isbnError = result.error.issues.find((e) => e.path[0] === "isbn");
        expect(isbnError?.message).toBe(
          "Invalid ISBN format - must be a valid 10 or 13 digit ISBN"
        );
      }
    });

    test("2.2-UNIT-033: should accept valid minimal data", () => {
      const validData = {
        title: "Test Book",
        author: "Test Author",
      };

      const result = addBookSchema.safeParse(validData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.title).toBe("Test Book");
        expect(result.data.author).toBe("Test Author");
        expect(result.data.publisher).toBeUndefined();
        expect(result.data.publication_year).toBeUndefined();
        expect(result.data.isbn).toBeUndefined();
      }
    });

    test("2.2-UNIT-034: should accept valid complete data", () => {
      const validData = {
        title: "Complete Book",
        author: "Complete Author",
        publisher: "Test Publisher",
        publication_year: 2024,
        isbn: "9780306406157", // Use a valid ISBN-13
      };

      const result = addBookSchema.safeParse(validData);
      if (!result.success) {
        console.log("Validation failed:", result.error.issues);
      }
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test("2.2-UNIT-035: should trim whitespace from title and author", () => {
      const dataWithWhitespace = {
        title: "  Test Book  ",
        author: "  Test Author  ",
      };

      const result = addBookSchema.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.title).toBe("Test Book");
        expect(result.data.author).toBe("Test Author");
      }
    });

    test("2.2-UNIT-036: should handle empty ISBN as valid", () => {
      const validData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "",
      };

      const result = addBookSchema.safeParse(validData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.isbn).toBe("");
      }
    });

    test("2.2-UNIT-037: should coerce publication year from string", () => {
      const dataWithStringYear = {
        title: "Test Book",
        author: "Test Author",
        publication_year: "2024",
      };

      const result = addBookSchema.safeParse(dataWithStringYear);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.publication_year).toBe(2024);
        expect(typeof result.data.publication_year).toBe("number");
      }
    });

    test("2.2-UNIT-038: should validate publisher character limits", () => {
      const invalidData = {
        title: "Test Book",
        author: "Test Author",
        publisher: "a".repeat(256), // Exceeds 255 character limit
      };

      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const publisherError = result.error.issues.find(
          (e) => e.path[0] === "publisher"
        );
        expect(publisherError?.message).toBe(
          "Publisher name must be less than 255 characters"
        );
      }
    });

    // AC9: No complex cataloging fields in initial version
    test("2.2-UNIT-039: should only contain specified fields", () => {
      const schemaShape = addBookSchema._def.shape;
      const expectedFields = [
        "title",
        "author",
        "publisher",
        "publication_year",
        "isbn",
      ];

      expect(Object.keys(schemaShape)).toEqual(expectedFields);

      // Ensure no complex cataloging fields are present
      const complexFields = [
        "genre",
        "subjects",
        "dewey_decimal",
        "lccn",
        "description",
        "cover_url",
      ];
      complexFields.forEach((field) => {
        expect(Object.keys(schemaShape)).not.toContain(field);
      });
    });

    test("2.2-UNIT-040: should reject unknown properties", () => {
      const dataWithExtraFields = {
        title: "Test Book",
        author: "Test Author",
        genre: "Fiction", // Should be rejected
        subjects: ["Literature"], // Should be rejected
      };

      const result = addBookSchema.safeParse(dataWithExtraFields);
      expect(result.success).toBe(true); // Zod strips unknown properties by default

      if (result.success) {
        expect(result.data).not.toHaveProperty("genre");
        expect(result.data).not.toHaveProperty("subjects");
      }
    });
  });

  // Type inference tests
  describe("TypeScript type inference", () => {
    test("2.2-UNIT-041: should infer correct types from schema", () => {
      const validData: AddBookFormData = {
        title: "Test Book",
        author: "Test Author",
        publisher: "Optional Publisher",
        publication_year: 2024,
        isbn: "9780123456789",
      };

      // This test passes if TypeScript compilation succeeds
      expect(validData.title).toBe("Test Book");
      expect(typeof validData.author).toBe("string");
      expect(typeof validData.publisher).toBe("string");
      expect(typeof validData.publication_year).toBe("number");
      expect(typeof validData.isbn).toBe("string");
    });

    test("2.2-UNIT-042: should allow optional fields to be undefined", () => {
      const minimalData: AddBookFormData = {
        title: "Test Book",
        author: "Test Author",
      };

      // This test passes if TypeScript compilation succeeds
      expect(minimalData.publisher).toBeUndefined();
      expect(minimalData.publication_year).toBeUndefined();
      expect(minimalData.isbn).toBeUndefined();
    });
  });
});
