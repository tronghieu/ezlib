/**
 * ! Executing this script will delete all data in your database and seed it with comprehensive test data.
 * ! This includes users, libraries, books, borrowing transactions, and social features.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from the supabase directory
dotenv.config({ path: join(__dirname, '.env') });

import { createSeedClient } from "@snaplet/seed";

// Import organized seeding functions
import { seedUsers } from "./seeds/01_users";
import { seedAuthorsAndBooks } from "./seeds/02_books";
import { seedLibraryManagement } from "./seeds/03_libraries";
import { seedInventoryAndCollections } from "./seeds/04_inventory";
import { seedTransactions } from "./seeds/05_transactions";
import { seedSocialFeatures } from "./seeds/06_social";

const main = async () => {
  const seed = await createSeedClient();

  // Skip reset as we expect fresh database after supabase db reset
  console.log("🌱 Starting comprehensive database seeding with organized structure...");

  // Seed in proper order to maintain referential integrity
  console.log("\n=== Phase 1: Users and Authentication ===");
  const createdUsers = await seedUsers();

  console.log("\n=== Phase 2: Books and Authors ===");
  const { createdAuthors, createdGeneralBooks, createdBookEditions } = await seedAuthorsAndBooks();

  console.log("\n=== Phase 3: Library Management ===");
  const { createdLibraries, createdLibraryStaff, createdLibraryMembers } = await seedLibraryManagement(createdUsers);

  console.log("\n=== Phase 4: Inventory and Collections ===");
  const { createdBookCopies } = await seedInventoryAndCollections(
    createdLibraries, 
    createdBookEditions, 
    createdLibraryMembers
  );

  console.log("\n=== Phase 5: Transactions and Events ===");
  await seedTransactions(
    createdLibraries,
    createdBookCopies,
    createdLibraryMembers,
    createdLibraryStaff
  );

  console.log("\n=== Phase 6: Social Features ===");
  const { createdReviews } = await seedSocialFeatures(
    createdUsers,
    createdAuthors,
    createdGeneralBooks,
    createdBookEditions,
    createdLibraryStaff
  );

  console.log("\n✅ Database seeded successfully!");
  console.log(`
📊 Seeding Summary:
├── Users: ${createdUsers.length}
├── Authors: ${createdAuthors.length}
├── General Books: ${createdGeneralBooks.length}
├── Book Editions: ${createdBookEditions.length}
├── Libraries: ${createdLibraries.length}
├── Library Staff: ${createdLibraryStaff.length}
├── Library Members: ${createdLibraryMembers.length}
├── Book Copies: ${createdBookCopies.length}
└── Reviews: ${createdReviews.length}

🎉 All data seeded with organized structure!
🔐 To create authenticated users for login testing, run: npx tsx create_test_users.ts
🌐 Database ready for development and testing!
  `);

  process.exit();
};

main();
