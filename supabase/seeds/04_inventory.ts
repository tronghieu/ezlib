/**
 * Library Inventory Seeding - Creates book copies and collections
 * Distributes books across libraries with realistic availability states
 */
import { createSeedClient } from "@snaplet/seed";
import { faker } from "@snaplet/copycat";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { join } from "path";

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

// Initialize Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to replace faker.helpers.weighted
function weighted<T>(options: Array<{ value: T; weight: number }>): T {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  const random = Math.random() * totalWeight;
  let accumulator = 0;

  for (const option of options) {
    accumulator += option.weight;
    if (random < accumulator) {
      return option.value;
    }
  }

  return options[options.length - 1].value;
}

export const seedInventoryAndCollections = async (
  createdLibraries: any[],
  createdBookEditions: any[],
  createdLibraryMembers: any[],
) => {
  console.log("📦 Creating book copies and collections...");
  const seed = await createSeedClient();
  const createdBookCopies: any[] = [];

  // Track copy numbers per library to ensure uniqueness
  const copyNumberCounters = new Map<string, number>();
  // Track used barcodes globally to ensure uniqueness
  const usedBarcodes = new Set<string>();

  // Each library gets copies of various books
  for (const library of createdLibraries) {
    // Large libraries get more books
    const bookCount =
      library.name.includes("Central") || library.name.includes("Historic")
        ? faker.number.int({ min: 35, max: 45 })
        : faker.number.int({ min: 20, max: 30 });

    const selectedEditions = faker.helpers.arrayElements(
      createdBookEditions,
      bookCount,
    );
    let totalCopies = 0;

    for (const edition of selectedEditions) {
      // Popular books get more copies
      const copyCount = weighted([
        { value: 1, weight: 5 },
        { value: 2, weight: 3 },
        { value: 3, weight: 2 },
      ]);

      for (let i = 0; i < copyCount; i++) {
        const condition = weighted([
          { value: "good", weight: 5 },
          { value: "good", weight: 2 },
          { value: "good", weight: 2 },
          { value: "good", weight: 1 },
        ]);

        const availabilityStatus = weighted([
          { value: "available", weight: 6 },
          { value: "borrowed", weight: 3 },
          { value: "available", weight: 1 },
        ]);

        const libraryMembers = createdLibraryMembers.filter(
          (m) => m.library_id === library.id,
        );
        const currentBorrower =
          availabilityStatus === "borrowed"
            ? faker.helpers.arrayElement(libraryMembers)?.id || null
            : null;

        // Generate unique copy_number per library
        const libraryCounter = copyNumberCounters.get(library.id) || 0;
        const copyNumber = String(libraryCounter + 1).padStart(5, "0");
        copyNumberCounters.set(library.id, libraryCounter + 1);

        // Generate unique barcode with collision prevention
        let barcode: string;
        let attempts = 0;
        const maxAttempts = 100;
        do {
          barcode = `${library.code}-${faker.string.numeric(10)}`;
          attempts++;
          if (attempts > maxAttempts) {
            // Fallback: use timestamp to ensure uniqueness
            barcode = `${library.code}-${Date.now()}${faker.string.numeric(4)}`;
            break;
          }
        } while (usedBarcodes.has(barcode));
        usedBarcodes.add(barcode);

        const result = await seed.book_copies([
          {
            library_id: library.id,
            book_edition_id: edition.id,
            copy_number: copyNumber,
            barcode: barcode,
            total_copies: copyCount,
            available_copies: copyCount,
            location: {
              section: faker.helpers.arrayElement([
                "Fiction",
                "Non-Fiction",
                "Reference",
                "Young Adult",
                "Children",
                "Biography",
              ]),
              shelf:
                faker.helpers.arrayElement(["A", "B", "C", "D", "E", "F"]) +
                faker.string.numeric(2),
              call_number: `${faker.helpers.arrayElement(["FIC", "REF", "BIO", "SCI", "HIS"])} ${faker.string.numeric(3)}.${faker.string.numeric(2)}`,
            },
            condition_info: {
              condition: condition,
              acquisition_date: faker.date.past({ years: 2 }).toISOString(),
              acquisition_price: faker.number.float({
                min: 10,
                max: 50,
                fractionDigits: 2,
              }),
              last_maintenance:
                condition === "good"
                  ? null
                  : faker.date.recent({ days: 180 }).toISOString(),
              notes: condition === "damaged" ? "Minor wear on cover" : null,
            },
            availability: {
              status: availabilityStatus,
              current_borrower_id: currentBorrower,
              due_date:
                availabilityStatus === "borrowed"
                  ? faker.date.soon({ days: 14 }).toISOString()
                  : null,
              hold_queue: [],
            },
            status: "active",
          },
        ]);
        createdBookCopies.push(result.book_copies[0]);
        totalCopies++;
      }
    }

    // Update library stats
    await supabase
      .from("libraries")
      .update({
        stats: {
          total_books: totalCopies,
          total_members: createdLibraryMembers.filter(
            (m) => m.library_id === library.id,
          ).length,
          active_loans: createdBookCopies.filter(
            (c) =>
              c.library_id === library.id &&
              c.availability.status === "borrowed",
          ).length,
          books_loaned_this_month: faker.number.int({ min: 50, max: 200 }),
        },
      })
      .eq("id", library.id);
  }

  console.log(`✓ Created ${createdBookCopies.length} book copies`);

  // Create collections
  console.log("📚 Creating collections...");

  for (const library of createdLibraries) {
    const collections = [
      { name: "New Arrivals", type: "featured" },
      { name: "Staff Picks", type: "featured" },
      { name: "Mystery & Thriller", type: "genre" },
      { name: "Science Fiction & Fantasy", type: "genre" },
      { name: "Young Adult", type: "age_group" },
      { name: "Children's Books", type: "age_group" },
      { name: "Local History", type: "special" },
    ];

    for (const [index, collectionData] of collections.entries()) {
      const collectionResult = await seed.collections([
        {
          library_id: library.id,
          name: collectionData.name,
          description: `${collectionData.name} collection at ${library.name}`,
          type: collectionData.type,
          is_public: true,
          sort_order: index,
        },
      ]);

      // Add 5-15 books to each collection
      const libraryBooks = createdBookCopies.filter(
        (c) => c.library_id === library.id,
      );
      const collectionBooks = faker.helpers.arrayElements(
        libraryBooks,
        faker.number.int({ min: 5, max: 15 }),
      );

      for (const bookCopy of collectionBooks) {
        await seed.collection_books([
          {
            collection_id: collectionResult.collections[0].id,
            book_copy_id: bookCopy.id,
          },
        ]);
      }
    }
  }

  console.log(`✓ Created collections for all libraries`);

  return { createdBookCopies };
};
