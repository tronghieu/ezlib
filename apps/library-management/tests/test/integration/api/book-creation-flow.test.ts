/**
 * Integration Tests: Book Creation Flow
 * Tests the complete API flow from author creation to book copies
 */

import { supabase } from "@/lib/supabase/client";
import { createAuthor, searchAuthors } from "@/lib/api/authors";
import { createBookEdition, searchBookEditions } from "@/lib/api/book-editions";
import { createBookCopies } from "@/lib/api/book-copies";
import type { AuthorFormData, BookEditionFormData, BookCopyFormData } from "@/types/books";

// This requires Supabase to be running locally
describe("Book Creation Flow Integration", () => {
  let testAuthorId: string;
  let testEditionId: string;
  let testLibraryId: string;

  beforeAll(async () => {
    // Set up test library (assume it exists or create it)
    testLibraryId = "test-lib-integration";
  });

  afterEach(async () => {
    // Clean up test data
    if (testEditionId) {
      await supabase().from("book_copies").delete().eq("book_edition_id", testEditionId);
      await supabase().from("book_contributors").delete().eq("book_edition_id", testEditionId);
      await supabase().from("book_editions").delete().eq("id", testEditionId);
    }
    
    if (testAuthorId) {
      await supabase().from("authors").delete().eq("id", testAuthorId);
    }
  });

  it("should complete the full book creation workflow", async () => {
    // Step 1: Create author
    const authorData: AuthorFormData = {
      name: "Integration Test Author",
      biography: "A test author for integration testing",
    };

    const createdAuthor = await createAuthor(authorData);
    testAuthorId = createdAuthor.id;

    expect(createdAuthor.name).toBe(authorData.name);
    expect(createdAuthor.biography).toBe(authorData.biography);
    expect(createdAuthor.canonical_name).toBe(authorData.name.toLowerCase());

    // Step 2: Search for the created author
    const authorSearchResults = await searchAuthors("Integration Test");
    expect(authorSearchResults).toHaveLength(1);
    expect(authorSearchResults[0].id).toBe(createdAuthor.id);

    // Step 3: Create book edition
    const editionData: BookEditionFormData = {
      title: "Integration Test Book",
      subtitle: "A Test Subtitle",
      language: "en",
      author_id: createdAuthor.id,
      isbn: "9781234567890",
      publication_year: 2023,
      publisher: "Test Publisher",
    };

    const createdEdition = await createBookEdition(editionData);
    testEditionId = createdEdition.id;

    expect(createdEdition.title).toBe(editionData.title);
    expect(createdEdition.language).toBe(editionData.language);
    expect(createdEdition.isbn_13).toBe(editionData.isbn);
    expect(createdEdition.authors).toHaveLength(1);
    expect(createdEdition.authors?.[0].id).toBe(createdAuthor.id);

    // Step 4: Search for the created book
    const bookSearchResults = await searchBookEditions("Integration Test Book");
    expect(bookSearchResults).toHaveLength(1);
    expect(bookSearchResults[0].id).toBe(createdEdition.id);
    expect(bookSearchResults[0].authors).toContain("Integration Test Author");

    // Step 5: Create book copies
    const copyData: BookCopyFormData = {
      total_copies: 3,
      shelf_location: "Test-A1",
      section: "Integration Testing",
      call_number: "TEST.001",
      condition: "excellent",
      notes: "Integration test copies",
    };

    const createdCopies = await createBookCopies(
      createdEdition.id,
      testLibraryId,
      copyData
    );

    expect(createdCopies).toHaveLength(3);
    expect(createdCopies[0].book_edition_id).toBe(createdEdition.id);
    expect(createdCopies[0].library_id).toBe(testLibraryId);
    expect(createdCopies[0].copy_number).toBe("001");
    expect(createdCopies[1].copy_number).toBe("002");
    expect(createdCopies[2].copy_number).toBe("003");

    // Verify location data
    expect(createdCopies[0].location?.shelf).toBe("Test-A1");
    expect(createdCopies[0].location?.section).toBe("Integration Testing");
    expect(createdCopies[0].location?.call_number).toBe("TEST.001");

    // Verify condition data
    expect(createdCopies[0].condition_info?.condition).toBe("excellent");
    expect(createdCopies[0].condition_info?.notes).toBe("Integration test copies");

    // Verify availability
    expect(createdCopies[0].availability?.status).toBe("available");
    expect(createdCopies[0].availability?.current_borrower_id).toBeNull();

    // Copies created successfully - test complete
  });

  it("should handle duplicate author creation", async () => {
    // Create first author
    const authorData: AuthorFormData = {
      name: "Duplicate Test Author",
      biography: "Original author",
    };

    const firstAuthor = await createAuthor(authorData);
    testAuthorId = firstAuthor.id;

    // Attempt to create duplicate author
    const duplicateData: AuthorFormData = {
      name: "Duplicate Test Author", // Same name
      biography: "Duplicate attempt",
    };

    await expect(createAuthor(duplicateData)).rejects.toThrow(/already exists/);
  });

  it("should handle sequential copy numbering", async () => {
    // Create author and edition first
    const authorData: AuthorFormData = {
      name: "Numbering Test Author",
    };
    const createdAuthor = await createAuthor(authorData);
    testAuthorId = createdAuthor.id;

    const editionData: BookEditionFormData = {
      title: "Numbering Test Book",
      language: "en",
      author_id: createdAuthor.id,
    };
    const createdEdition = await createBookEdition(editionData);
    testEditionId = createdEdition.id;

    // Create first batch of copies
    const firstBatch = await createBookCopies(
      createdEdition.id,
      testLibraryId,
      { total_copies: 2, condition: "good" }
    );

    expect(firstBatch[0].copy_number).toBe("001");
    expect(firstBatch[1].copy_number).toBe("002");

    // Create second batch - should continue numbering
    const secondBatch = await createBookCopies(
      createdEdition.id,
      testLibraryId,
      { total_copies: 2, condition: "good" }
    );

    expect(secondBatch[0].copy_number).toBe("003");
    expect(secondBatch[1].copy_number).toBe("004");
  });

  it("should handle missing optional fields", async () => {
    // Create minimal author
    const authorData: AuthorFormData = {
      name: "Minimal Test Author",
      // No biography
    };

    const createdAuthor = await createAuthor(authorData);
    testAuthorId = createdAuthor.id;

    expect(createdAuthor.biography).toBeNull();

    // Create minimal edition
    const editionData: BookEditionFormData = {
      title: "Minimal Test Book",
      language: "en",
      author_id: createdAuthor.id,
      // No optional fields
    };

    const createdEdition = await createBookEdition(editionData);
    testEditionId = createdEdition.id;

    expect(createdEdition.subtitle).toBeNull();
    expect(createdEdition.isbn_13).toBeNull();

    // Create minimal copies
    const copyData: BookCopyFormData = {
      total_copies: 1,
      condition: "good",
      // No optional location/notes
    };

    const createdCopies = await createBookCopies(
      createdEdition.id,
      testLibraryId,
      copyData
    );

    expect(createdCopies[0].location).toBeNull();
    expect(createdCopies[0].condition_info?.notes).toBeNull();
  });

  it("should validate required fields", async () => {
    // Test missing author name
    await expect(createAuthor({ name: "" } as AuthorFormData))
      .rejects.toThrow();

    // Create valid author for edition tests
    const authorData: AuthorFormData = {
      name: "Validation Test Author",
    };
    const createdAuthor = await createAuthor(authorData);
    testAuthorId = createdAuthor.id;

    // Test missing edition title
    await expect(createBookEdition({
      title: "",
      language: "en",
      author_id: createdAuthor.id,
    } as BookEditionFormData)).rejects.toThrow();

    // Test invalid author_id
    await expect(createBookEdition({
      title: "Valid Title",
      language: "en",
      author_id: "invalid-uuid",
    })).rejects.toThrow();
  });
});