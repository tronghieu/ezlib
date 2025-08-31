/**
 * ! Executing this script will delete all data in your database and seed it with comprehensive test data.
 * ! This includes users, libraries, books, borrowing transactions, and social features.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createSeedClient } from "@snaplet/seed";
import { copycat, faker } from "@snaplet/copycat";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
);

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

// Store created entities for relationships
const createdUsers: any[] = [];
const createdAuthors: any[] = [];
const createdGeneralBooks: any[] = [];
const createdBookEditions: any[] = [];
const createdLibraries: any[] = [];
const createdLibraryStaff: any[] = [];
const createdLibraryMembers: any[] = [];
const createdBookCopies: any[] = [];
const createdReviews: any[] = [];

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the database
  await seed.$resetDatabase();

  console.log("🌱 Starting comprehensive database seeding...");

  // Seed in proper order to maintain referential integrity
  await seedUsers();
  await seedAuthors();
  await seedGeneralBooks();
  await seedBookEditions();
  await seedBookContributors();
  await seedLibraries();
  await seedLibraryStaff();
  await seedLibraryMembers();
  await seedBookCopies();
  await seedBorrowingTransactions();
  await seedReviews();
  await seedSocialFeatures();

  console.log("✅ Database seeded successfully!");
  console.log(`
  📊 Seeding Summary:
  - Users: ${createdUsers.length}
  - Authors: ${createdAuthors.length}
  - General Books: ${createdGeneralBooks.length}
  - Book Editions: ${createdBookEditions.length}
  - Libraries: ${createdLibraries.length}
  - Library Staff: ${createdLibraryStaff.length}
  - Library Members: ${createdLibraryMembers.length}
  - Book Copies: ${createdBookCopies.length}
  - Reviews: ${createdReviews.length}
  `);

  process.exit();
};

const seedUsers = async () => {
  console.log("👤 Creating users...");
  const password = "Test123!@#";
  
  // Create different types of users
  const userTypes = [
    { role: 'reader', count: 15 },
    { role: 'librarian', count: 5 },
    { role: 'library_admin', count: 2 },
    { role: 'system_admin', count: 1 }
  ];

  for (const userType of userTypes) {
    for (let i = 0; i < userType.count; i++) {
      const seed = `${userType.role}-${i}`;
      const email = copycat.email(seed).toLowerCase();
      const firstName = copycat.firstName(seed);
      const lastName = copycat.lastName(seed);
      const avatar = faker.image.avatarGitHub();

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          avatar_url: avatar,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role: userType.role,
        },
      });

      if (!error && data.user) {
        createdUsers.push({
          id: data.user.id,
          email,
          role: userType.role,
          firstName,
          lastName,
        });
      }
    }
  }
  console.log(`✓ Created ${createdUsers.length} users`);
};

const seedAuthors = async () => {
  console.log("✍️ Creating authors...");
  const seed = await createSeedClient();
  
  // Famous authors with real-like data
  const famousAuthors = [
    { name: "J.K. Rowling", bio: "British author best known for the Harry Potter series", nationality: "British" },
    { name: "Stephen King", bio: "American author of horror, supernatural fiction, and suspense", nationality: "American" },
    { name: "Agatha Christie", bio: "English writer known for her detective novels", nationality: "British" },
    { name: "George R.R. Martin", bio: "American novelist and television producer, author of A Song of Ice and Fire", nationality: "American" },
    { name: "Harper Lee", bio: "American novelist known for To Kill a Mockingbird", nationality: "American" },
    { name: "Gabriel García Márquez", bio: "Colombian novelist, short-story writer, and journalist", nationality: "Colombian" },
    { name: "Haruki Murakami", bio: "Japanese writer known for surrealist fiction", nationality: "Japanese" },
    { name: "Margaret Atwood", bio: "Canadian poet, novelist, and literary critic", nationality: "Canadian" },
    { name: "Neil Gaiman", bio: "English author of fiction, horror, and fantasy", nationality: "British" },
    { name: "Toni Morrison", bio: "American novelist and Nobel Prize winner", nationality: "American" },
  ];

  for (const author of famousAuthors) {
    const result = await seed.authors([{
      name: author.name,
      canonical_name: author.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(),
      biography: author.bio,
      metadata: {
        birth_date: faker.date.birthdate({ min: 1920, max: 1990, mode: 'year' }).toISOString(),
        nationality: author.nationality,
        photo_url: faker.image.avatar(),
        genres: faker.helpers.arrayElements(['Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Thriller', 'Horror', 'Biography'], 3),
        external_ids: {
          goodreads_id: faker.string.alphanumeric(8),
          openlibrary_id: `OL${faker.string.numeric(7)}A`,
        },
      },
      social_stats: {
        total_books: faker.number.int({ min: 5, max: 50 }),
        total_reviews: faker.number.int({ min: 100, max: 10000 }),
        average_rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        total_followers: faker.number.int({ min: 1000, max: 100000 }),
      },
    }]);
    createdAuthors.push(result.authors[0]);
  }

  // Generate additional random authors
  for (let i = 0; i < 20; i++) {
    const firstName = copycat.firstName(i);
    const lastName = copycat.lastName(i);
    const fullName = `${firstName} ${lastName}`;
    
    const result = await seed.authors([{
      name: fullName,
      canonical_name: fullName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(),
      biography: faker.lorem.paragraph(),
      metadata: {
        birth_date: faker.date.birthdate({ min: 1940, max: 2000, mode: 'year' }).toISOString(),
        nationality: faker.helpers.arrayElement(['American', 'British', 'Canadian', 'Australian', 'Irish', 'French', 'German', 'Japanese']),
        photo_url: faker.image.avatar(),
        genres: faker.helpers.arrayElements(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Thriller', 'Horror', 'Biography', 'History', 'Self-Help'], 2),
      },
      social_stats: {
        total_books: faker.number.int({ min: 1, max: 20 }),
        total_reviews: faker.number.int({ min: 10, max: 5000 }),
        average_rating: faker.number.float({ min: 3.0, max: 5, fractionDigits: 1 }),
        total_followers: faker.number.int({ min: 100, max: 50000 }),
      },
    }]);
    createdAuthors.push(result.authors[0]);
  }
  
  console.log(`✓ Created ${createdAuthors.length} authors`);
};

const seedGeneralBooks = async () => {
  console.log("📚 Creating general books...");
  const seed = await createSeedClient();
  
  // Classic and popular books
  const popularBooks = [
    { title: "Harry Potter and the Philosopher's Stone", year: 1997, subjects: ['Fantasy', 'Young Adult', 'Adventure'] },
    { title: "The Shining", year: 1977, subjects: ['Horror', 'Thriller', 'Supernatural'] },
    { title: "Murder on the Orient Express", year: 1934, subjects: ['Mystery', 'Crime', 'Classic'] },
    { title: "A Game of Thrones", year: 1996, subjects: ['Fantasy', 'Epic Fantasy', 'Adventure'] },
    { title: "To Kill a Mockingbird", year: 1960, subjects: ['Classic', 'Legal Drama', 'Coming of Age'] },
    { title: "One Hundred Years of Solitude", year: 1967, subjects: ['Magical Realism', 'Classic', 'Latin American Literature'] },
    { title: "Norwegian Wood", year: 1987, subjects: ['Literary Fiction', 'Romance', 'Japanese Literature'] },
    { title: "The Handmaid's Tale", year: 1985, subjects: ['Dystopian', 'Feminist Fiction', 'Science Fiction'] },
    { title: "American Gods", year: 2001, subjects: ['Fantasy', 'Mythology', 'Contemporary Fantasy'] },
    { title: "Beloved", year: 1987, subjects: ['Historical Fiction', 'African American Literature', 'Literary Fiction'] },
    { title: "1984", year: 1949, subjects: ['Dystopian', 'Political Fiction', 'Classic'] },
    { title: "Pride and Prejudice", year: 1813, subjects: ['Romance', 'Classic', 'British Literature'] },
    { title: "The Great Gatsby", year: 1925, subjects: ['Classic', 'American Literature', 'Tragedy'] },
    { title: "The Lord of the Rings", year: 1954, subjects: ['Fantasy', 'Epic Fantasy', 'Adventure'] },
    { title: "The Catcher in the Rye", year: 1951, subjects: ['Coming of Age', 'Classic', 'American Literature'] },
  ];

  for (const book of popularBooks) {
    const result = await seed.general_books([{
      canonical_title: book.title,
      first_publication_year: book.year,
      subjects: book.subjects,
      global_stats: {
        total_editions: faker.number.int({ min: 5, max: 50 }),
        total_reviews: faker.number.int({ min: 1000, max: 50000 }),
        global_average_rating: faker.number.float({ min: 3.8, max: 4.9, fractionDigits: 1 }),
        total_borrows: faker.number.int({ min: 10000, max: 500000 }),
        languages_available: faker.helpers.arrayElements(['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'pt', 'ru', 'ar'], faker.number.int({ min: 3, max: 8 })),
      },
    }]);
    createdGeneralBooks.push(result.general_books[0]);
  }

  // Generate additional random books
  for (let i = 0; i < 35; i++) {
    const bookTitle = faker.lorem.sentence({ min: 2, max: 5 }).slice(0, -1);
    const result = await seed.general_books([{
      canonical_title: bookTitle,
      first_publication_year: faker.number.int({ min: 1850, max: 2024 }),
      subjects: faker.helpers.arrayElements(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Thriller', 'Horror', 'Biography', 'History', 'Self-Help', 'Technology', 'Science', 'Philosophy', 'Poetry'], faker.number.int({ min: 2, max: 4 })),
      global_stats: {
        total_editions: faker.number.int({ min: 1, max: 20 }),
        total_reviews: faker.number.int({ min: 10, max: 10000 }),
        global_average_rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
        total_borrows: faker.number.int({ min: 100, max: 50000 }),
        languages_available: faker.helpers.arrayElements(['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'pt'], faker.number.int({ min: 1, max: 4 })),
      },
    }]);
    createdGeneralBooks.push(result.general_books[0]);
  }
  
  console.log(`✓ Created ${createdGeneralBooks.length} general books`);
};

const seedBookEditions = async () => {
  console.log("📖 Creating book editions...");
  const seed = await createSeedClient();
  
  // Create 2-5 editions for each general book
  for (const generalBook of createdGeneralBooks) {
    const editionCount = faker.number.int({ min: 1, max: 4 });
    
    for (let i = 0; i < editionCount; i++) {
      const isbn13 = faker.string.numeric(13);
      const isbn10 = faker.string.numeric(9) + faker.helpers.arrayElement(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X']);
      const languages = ['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'pt', 'ru', 'ar'];
      const language = faker.helpers.arrayElement(languages);
      const formats = ['hardcover', 'paperback', 'ebook', 'audiobook'];
      const format = faker.helpers.arrayElement(formats);
      
      const result = await seed.book_editions([{
        general_book_id: generalBook.id,
        isbn_13: isbn13,
        isbn_10: isbn10,
        title: generalBook.canonical_title,
        subtitle: i === 0 ? null : faker.helpers.maybe(() => faker.lorem.sentence({ min: 3, max: 6 }).slice(0, -1), { probability: 0.3 }),
        language: language,
        country: faker.helpers.arrayElement(['US', 'GB', 'CA', 'AU', 'FR', 'DE', 'JP', 'CN', 'ES', 'IT']),
        edition_metadata: {
          publisher: faker.company.name(),
          publication_date: faker.date.between({ from: new Date(generalBook.first_publication_year || 2000, 0, 1), to: new Date() }).toISOString(),
          page_count: faker.number.int({ min: 100, max: 1200 }),
          cover_image_url: faker.image.url(),
          edition_notes: i === 0 ? 'First Edition' : `Edition ${i + 1}`,
          format: format,
          quality_score: faker.number.float({ min: 70, max: 100, fractionDigits: 1 }),
          enrichment_status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'partial', 'pending']),
        },
        social_stats: {
          review_count: faker.number.int({ min: 10, max: 5000 }),
          average_rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
          language_specific_rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
        },
      }]);
      createdBookEditions.push(result.book_editions[0]);
    }
  }
  
  console.log(`✓ Created ${createdBookEditions.length} book editions`);
};

const seedBookContributors = async () => {
  console.log("🤝 Creating book contributors...");
  const seed = await createSeedClient();
  
  // Assign authors to books (ensuring popular books get their correct authors)
  const bookAuthorPairs = [
    { bookIndex: 0, authorIndex: 0 }, // Harry Potter - J.K. Rowling
    { bookIndex: 1, authorIndex: 1 }, // The Shining - Stephen King
    { bookIndex: 2, authorIndex: 2 }, // Murder on Orient Express - Agatha Christie
    { bookIndex: 3, authorIndex: 3 }, // Game of Thrones - George R.R. Martin
    { bookIndex: 4, authorIndex: 4 }, // To Kill a Mockingbird - Harper Lee
    { bookIndex: 5, authorIndex: 5 }, // One Hundred Years - García Márquez
    { bookIndex: 6, authorIndex: 6 }, // Norwegian Wood - Murakami
    { bookIndex: 7, authorIndex: 7 }, // Handmaid's Tale - Atwood
    { bookIndex: 8, authorIndex: 8 }, // American Gods - Gaiman
    { bookIndex: 9, authorIndex: 9 }, // Beloved - Morrison
  ];

  // Create specific author-book relationships
  for (const pair of bookAuthorPairs) {
    if (createdGeneralBooks[pair.bookIndex] && createdAuthors[pair.authorIndex]) {
      await seed.book_contributors([{
        general_book_id: createdGeneralBooks[pair.bookIndex].id,
        book_edition_id: null,
        author_id: createdAuthors[pair.authorIndex].id,
        role: 'author',
        sort_order: 0,
      }]);
    }
  }

  // Randomly assign authors to remaining books
  for (let i = bookAuthorPairs.length; i < createdGeneralBooks.length; i++) {
    const book = createdGeneralBooks[i];
    const primaryAuthor = faker.helpers.arrayElement(createdAuthors);
    
    await seed.book_contributors([{
      general_book_id: book.id,
      book_edition_id: null,
      author_id: primaryAuthor.id,
      role: 'author',
      sort_order: 0,
    }]);

    // Sometimes add co-authors, translators, or editors
    if (faker.datatype.boolean({ probability: 0.2 })) {
      const secondaryAuthor = faker.helpers.arrayElement(createdAuthors.filter(a => a.id !== primaryAuthor.id));
      const role = faker.helpers.arrayElement(['co_author', 'translator', 'editor']);
      
      await seed.book_contributors([{
        general_book_id: book.id,
        book_edition_id: null,
        author_id: secondaryAuthor.id,
        role: role,
        credit_text: role === 'translator' ? `Translated from ${faker.helpers.arrayElement(['Spanish', 'French', 'German', 'Italian'])}` : null,
        sort_order: 1,
      }]);
    }
  }
  
  console.log(`✓ Created book contributors`);
};

const seedLibraries = async () => {
  console.log("🏛️ Creating libraries...");
  const seed = await createSeedClient();
  
  const libraries = [
    {
      name: "Central City Library",
      code: "CCL-MAIN",
      city: "New York",
      state: "NY",
      type: "large",
      loan_period: 21,
      max_books: 10,
    },
    {
      name: "Westside Community Library",
      code: "WCL-001",
      city: "Los Angeles",
      state: "CA",
      type: "medium",
      loan_period: 14,
      max_books: 5,
    },
    {
      name: "University District Library",
      code: "UDL-MAIN",
      city: "Boston",
      state: "MA",
      type: "academic",
      loan_period: 30,
      max_books: 15,
    },
    {
      name: "Riverside Public Library",
      code: "RPL-001",
      city: "Chicago",
      state: "IL",
      type: "medium",
      loan_period: 14,
      max_books: 7,
    },
    {
      name: "Historic Downtown Library",
      code: "HDL-MAIN",
      city: "San Francisco",
      state: "CA",
      type: "large",
      loan_period: 21,
      max_books: 10,
    },
  ];

  for (const lib of libraries) {
    const result = await seed.libraries([{
      name: lib.name,
      code: lib.code,
      address: {
        street: faker.location.streetAddress(),
        city: lib.city,
        state: lib.state,
        country: "USA",
        postal_code: faker.location.zipCode(),
        coordinates: {
          lat: parseFloat(faker.location.latitude()),
          lng: parseFloat(faker.location.longitude()),
        },
      },
      contact_info: {
        phone: faker.phone.number(),
        email: faker.internet.email({ provider: 'library.org' }),
        website: `https://www.${lib.code.toLowerCase()}.library.org`,
        hours: {
          monday: "9:00 AM - 8:00 PM",
          tuesday: "9:00 AM - 8:00 PM",
          wednesday: "9:00 AM - 8:00 PM",
          thursday: "9:00 AM - 8:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "10:00 AM - 5:00 PM",
          sunday: "12:00 PM - 5:00 PM",
        },
      },
      settings: {
        loan_period_days: lib.loan_period,
        max_renewals: 2,
        max_books_per_member: lib.max_books,
        late_fee_per_day: 0.25,
        membership_fee: lib.type === 'academic' ? 0 : faker.helpers.arrayElement([0, 25, 50]),
        allow_holds: true,
        allow_digital: lib.type === 'large',
      },
      stats: {
        total_books: 0, // Will be updated when we add book copies
        total_members: 0, // Will be updated when we add members
        active_loans: 0,
        books_loaned_this_month: faker.number.int({ min: 100, max: 1000 }),
      },
      status: 'active',
    }]);
    createdLibraries.push(result.libraries[0]);
  }
  
  console.log(`✓ Created ${createdLibraries.length} libraries`);
};

const seedLibraryStaff = async () => {
  console.log("👨‍💼 Creating library staff...");
  const seed = await createSeedClient();
  
  // Assign librarians and admins to libraries
  const librarians = createdUsers.filter(u => u.role === 'librarian');
  const admins = createdUsers.filter(u => u.role === 'library_admin');
  
  // Distribute staff across libraries
  for (let i = 0; i < createdLibraries.length; i++) {
    const library = createdLibraries[i];
    
    // Assign 1 admin per library (cycling through available admins)
    if (admins.length > 0) {
      const admin = admins[i % admins.length];
      const result = await seed.library_staff([{
        user_id: admin.id,
        library_id: library.id,
        role: 'admin',
        permissions: {
          manage_inventory: true,
          manage_members: true,
          process_loans: true,
          view_reports: true,
          manage_staff: true,
          admin_settings: true,
        },
        employment_info: {
          employee_id: `EMP${faker.string.numeric(6)}`,
          department: 'Administration',
          hire_date: faker.date.past({ years: 5 }).toISOString(),
          work_schedule: 'Full-time',
        },
        status: 'active',
      }]);
      createdLibraryStaff.push(result.library_staff[0]);
    }
    
    // Assign 2-3 librarians per library
    const librarianCount = faker.number.int({ min: 2, max: 3 });
    for (let j = 0; j < librarianCount && j < librarians.length; j++) {
      const librarian = librarians[(i * 3 + j) % librarians.length];
      const role = faker.helpers.arrayElement(['librarian', 'assistant', 'manager']);
      
      const result = await seed.library_staff([{
        user_id: librarian.id,
        library_id: library.id,
        role: role,
        permissions: {
          manage_inventory: true,
          manage_members: role !== 'assistant',
          process_loans: true,
          view_reports: role === 'manager',
          manage_staff: role === 'manager',
          admin_settings: false,
        },
        employment_info: {
          employee_id: `EMP${faker.string.numeric(6)}`,
          department: faker.helpers.arrayElement(['Circulation', 'Reference', 'Youth Services', 'Technical Services']),
          hire_date: faker.date.past({ years: 3 }).toISOString(),
          work_schedule: faker.helpers.arrayElement(['Full-time', 'Part-time']),
        },
        status: weighted([
          { value: 'active', weight: 9 },
          { value: 'on_leave', weight: 1 },
        ]),
      }]);
      createdLibraryStaff.push(result.library_staff[0]);
    }
  }
  
  console.log(`✓ Created ${createdLibraryStaff.length} library staff members`);
};

const seedLibraryMembers = async () => {
  console.log("👥 Creating library members...");
  const seed = await createSeedClient();
  
  // All readers become library members
  const readers = createdUsers.filter(u => u.role === 'reader');
  
  for (const reader of readers) {
    // Each reader joins 1-2 libraries
    const libraryCount = weighted([
      { value: 1, weight: 7 },
      { value: 2, weight: 3 },
    ]);
    
    const selectedLibraries = faker.helpers.arrayElements(createdLibraries, libraryCount);
    
    for (const library of selectedLibraries) {
      const membershipType = weighted([
        { value: 'regular', weight: 7 },
        { value: 'student', weight: 2 },
        { value: 'senior', weight: 1 },
      ]);
      
      const result = await seed.library_members([{
        user_id: reader.id,
        library_id: library.id,
        member_id: `M${library.code.substring(0, 3)}${faker.string.numeric(6)}`,
        personal_info: {
          first_name: reader.firstName,
          last_name: reader.lastName,
          email: reader.email,
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            postal_code: faker.location.zipCode(),
          },
        },
        membership_info: {
          type: membershipType,
          expiry_date: faker.date.future({ years: 1 }).toISOString(),
          fees_owed: weighted([
            { value: 0, weight: 8 },
            { value: faker.number.float({ min: 0.5, max: 25, fractionDigits: 2 }), weight: 2 },
          ]),
          notes: null,
        },
        borrowing_stats: {
          total_books_borrowed: faker.number.int({ min: 0, max: 100 }),
          current_loans: 0, // Will be updated when we add transactions
          overdue_items: 0,
          total_late_fees: faker.number.float({ min: 0, max: 50, fractionDigits: 2 }),
        },
        status: weighted([
          { value: 'active', weight: 9 },
          { value: 'expired', weight: 1 },
        ]),
      }]);
      createdLibraryMembers.push(result.library_members[0]);
    }
  }
  
  // Also create some guest members (without user accounts)
  for (const library of createdLibraries) {
    const guestCount = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < guestCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      const result = await seed.library_members([{
        user_id: null, // Guest member
        library_id: library.id,
        member_id: `G${library.code.substring(0, 3)}${faker.string.numeric(6)}`,
        personal_info: {
          first_name: firstName,
          last_name: lastName,
          email: faker.internet.email({ firstName, lastName }),
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            postal_code: faker.location.zipCode(),
          },
        },
        membership_info: {
          type: 'guest',
          expiry_date: faker.date.future({ years: 1 }).toISOString(),
          fees_owed: 0,
          notes: 'Guest membership - limited privileges',
        },
        borrowing_stats: {
          total_books_borrowed: faker.number.int({ min: 0, max: 10 }),
          current_loans: 0,
          overdue_items: 0,
          total_late_fees: 0,
        },
        status: 'active',
      }]);
      createdLibraryMembers.push(result.library_members[0]);
    }
  }
  
  console.log(`✓ Created ${createdLibraryMembers.length} library members`);
};

const seedBookCopies = async () => {
  console.log("📦 Creating book copies...");
  const seed = await createSeedClient();
  
  // Each library gets copies of various books
  for (const library of createdLibraries) {
    // Large libraries get more books
    const bookCount = library.name.includes('Central') || library.name.includes('Historic') 
      ? faker.number.int({ min: 35, max: 45 })
      : faker.number.int({ min: 20, max: 30 });
    
    const selectedEditions = faker.helpers.arrayElements(createdBookEditions, bookCount);
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
          { value: 'excellent', weight: 2 },
          { value: 'good', weight: 5 },
          { value: 'fair', weight: 2 },
          { value: 'poor', weight: 1 },
        ]);
        
        const status = weighted([
          { value: 'available', weight: 6 },
          { value: 'checked_out', weight: 3 },
          { value: 'on_hold', weight: 1 },
        ]);
        
        const result = await seed.book_copies([{
          library_id: library.id,
          book_edition_id: edition.id,
          copy_number: String(i + 1).padStart(3, '0'),
          barcode: `${library.code}-${faker.string.numeric(10)}`,
          location: {
            section: faker.helpers.arrayElement(['Fiction', 'Non-Fiction', 'Reference', 'Young Adult', 'Children', 'Biography']),
            shelf: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E', 'F']) + faker.string.numeric(2),
            call_number: `${faker.helpers.arrayElement(['FIC', 'REF', 'BIO', 'SCI', 'HIS'])} ${faker.string.numeric(3)}.${faker.string.numeric(2)}`,
          },
          condition_info: {
            condition: condition,
            acquisition_date: faker.date.past({ years: 2 }).toISOString(),
            acquisition_price: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
            last_maintenance: condition === 'excellent' ? null : faker.date.recent({ days: 180 }).toISOString(),
            notes: condition === 'poor' ? 'Needs rebinding' : null,
          },
          availability: {
            status: status,
            current_borrower_id: status === 'checked_out' ? faker.helpers.arrayElement(createdLibraryMembers.filter(m => m.library_id === library.id))?.id || null : null,
            due_date: status === 'checked_out' ? faker.date.future({ years: 0.1 }).toISOString() : null,
            hold_queue: status === 'on_hold' ? [faker.helpers.arrayElement(createdLibraryMembers.filter(m => m.library_id === library.id))?.id].filter(Boolean) : [],
          },
        }]);
        createdBookCopies.push(result.book_copies[0]);
        totalCopies++;
      }
    }
    
    // Update library stats
    await supabase
      .from('libraries')
      .update({ 
        stats: {
          total_books: totalCopies,
          total_members: createdLibraryMembers.filter(m => m.library_id === library.id).length,
          active_loans: createdBookCopies.filter(c => c.library_id === library.id && c.availability.status === 'checked_out').length,
          books_loaned_this_month: faker.number.int({ min: 50, max: 200 }),
        }
      })
      .eq('id', library.id);
  }
  
  console.log(`✓ Created ${createdBookCopies.length} book copies`);
};

const seedBorrowingTransactions = async () => {
  console.log("📋 Creating borrowing transactions...");
  const seed = await createSeedClient();
  
  // Create transaction history for checked out books
  const checkedOutCopies = createdBookCopies.filter(c => c.availability.status === 'checked_out');
  
  for (const copy of checkedOutCopies) {
    const member = createdLibraryMembers.find(m => m.id === copy.availability.current_borrower_id);
    if (!member) continue;
    
    const staff = createdLibraryStaff.find(s => s.library_id === copy.library_id);
    const checkoutDate = faker.date.recent({ days: 20 });
    const dueDate = new Date(checkoutDate);
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Current checkout
    await seed.borrowing_transactions([{
      library_id: copy.library_id,
      book_copy_id: copy.id,
      member_id: member.id,
      staff_id: staff?.id || null,
      transaction_type: 'checkout',
      transaction_date: checkoutDate.toISOString(),
      due_date: dueDate.toISOString(),
      return_date: null,
      fees: {
        late_fee: 0,
        damage_fee: 0,
        processing_fee: 0,
        total: 0,
      },
      notes: null,
    }]);
  }
  
  // Create historical transactions (returned books)
  for (const library of createdLibraries) {
    const libraryMembers = createdLibraryMembers.filter(m => m.library_id === library.id);
    const libraryCopies = createdBookCopies.filter(c => c.library_id === library.id);
    const libraryStaff = createdLibraryStaff.filter(s => s.library_id === library.id);
    
    // Generate 20-50 historical transactions per library
    const transactionCount = faker.number.int({ min: 20, max: 50 });
    
    for (let i = 0; i < transactionCount; i++) {
      const member = faker.helpers.arrayElement(libraryMembers);
      const copy = faker.helpers.arrayElement(libraryCopies);
      const staff = faker.helpers.arrayElement(libraryStaff);
      
      const checkoutDate = faker.date.past({ years: 1 });
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + 14);
      
      const returnDate = faker.date.between({ from: checkoutDate, to: new Date() });
      const isLate = returnDate > dueDate;
      const daysLate = isLate ? Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const lateFee = daysLate * 0.25;
      
      // Checkout transaction
      await seed.borrowing_transactions([{
        library_id: library.id,
        book_copy_id: copy.id,
        member_id: member.id,
        staff_id: staff?.id || null,
        transaction_type: 'checkout',
        transaction_date: checkoutDate.toISOString(),
        due_date: dueDate.toISOString(),
        return_date: null,
        fees: {
          late_fee: 0,
          damage_fee: 0,
          processing_fee: 0,
          total: 0,
        },
        notes: null,
      }]);
      
      // Return transaction
      await seed.borrowing_transactions([{
        library_id: library.id,
        book_copy_id: copy.id,
        member_id: member.id,
        staff_id: staff?.id || null,
        transaction_type: 'return',
        transaction_date: returnDate.toISOString(),
        due_date: null,
        return_date: returnDate.toISOString(),
        fees: {
          late_fee: lateFee,
          damage_fee: 0,
          processing_fee: 0,
          total: lateFee,
        },
        notes: isLate ? `Returned ${daysLate} days late` : null,
      }]);
      
      // Sometimes add renewal transactions
      if (faker.datatype.boolean({ probability: 0.3 })) {
        const renewalDate = faker.date.between({ from: checkoutDate, to: dueDate });
        const newDueDate = new Date(renewalDate);
        newDueDate.setDate(newDueDate.getDate() + 14);
        
        await seed.borrowing_transactions([{
          library_id: library.id,
          book_copy_id: copy.id,
          member_id: member.id,
          staff_id: staff?.id || null,
          transaction_type: 'renewal',
          transaction_date: renewalDate.toISOString(),
          due_date: newDueDate.toISOString(),
          return_date: null,
          fees: {
            late_fee: 0,
            damage_fee: 0,
            processing_fee: 0,
            total: 0,
          },
          notes: 'First renewal',
        }]);
      }
    }
  }
  
  console.log(`✓ Created borrowing transactions`);
};

const seedReviews = async () => {
  console.log("⭐ Creating reviews...");
  const seed = await createSeedClient();
  
  // Create reviews from readers
  const readers = createdUsers.filter(u => u.role === 'reader');
  
  for (const reader of readers) {
    // Each reader reviews 3-10 books
    const reviewCount = faker.number.int({ min: 3, max: 10 });
    const reviewedEditions = faker.helpers.arrayElements(createdBookEditions, reviewCount);
    
    for (const edition of reviewedEditions) {
      const generalBook = createdGeneralBooks.find(gb => gb.id === edition.general_book_id);
      if (!generalBook) continue;
      
      const rating = weighted([
        { value: 5, weight: 3 },
        { value: 4, weight: 4 },
        { value: 3, weight: 2 },
        { value: 2, weight: 0.5 },
        { value: 1, weight: 0.5 },
      ]);
      
      const result = await seed.reviews([{
        book_edition_id: edition.id,
        general_book_id: generalBook.id,
        reviewer_id: reader.id,
        content: faker.lorem.paragraphs({ min: 1, max: 3 }),
        rating: rating,
        language: 'en',
        visibility: weighted([
          { value: 'public', weight: 8 },
          { value: 'followers', weight: 1 },
          { value: 'private', weight: 1 },
        ]),
        social_metrics: {
          like_count: faker.number.int({ min: 0, max: 100 }),
          comment_count: faker.number.int({ min: 0, max: 20 }),
          borrow_influence_count: faker.number.int({ min: 0, max: 50 }),
          share_count: faker.number.int({ min: 0, max: 10 }),
        },
      }]);
      createdReviews.push(result.reviews[0]);
    }
  }
  
  console.log(`✓ Created ${createdReviews.length} reviews`);
};

const seedSocialFeatures = async () => {
  console.log("🤝 Creating social features...");
  const seed = await createSeedClient();
  
  // Create author follows
  const readers = createdUsers.filter(u => u.role === 'reader');
  
  for (const reader of readers) {
    // Each reader follows 2-5 authors
    const followCount = faker.number.int({ min: 2, max: 5 });
    const followedAuthors = faker.helpers.arrayElements(createdAuthors, followCount);
    
    for (const author of followedAuthors) {
      await seed.author_follows([{
        user_id: reader.id,
        author_id: author.id,
        notification_preferences: {
          new_books: faker.datatype.boolean({ probability: 0.8 }),
          news_updates: faker.datatype.boolean({ probability: 0.6 }),
          awards: faker.datatype.boolean({ probability: 0.7 }),
        },
        followed_at: faker.date.past({ years: 1 }).toISOString(),
      }]);
    }
  }
  
  // Create social follows (user to user)
  for (const reader of readers) {
    // Each reader follows 1-5 other readers
    const followCount = faker.number.int({ min: 1, max: 5 });
    const potentialFollows = readers.filter(r => r.id !== reader.id);
    const followedUsers = faker.helpers.arrayElements(potentialFollows, Math.min(followCount, potentialFollows.length));
    
    for (const followedUser of followedUsers) {
      try {
        await seed.social_follows([{
          follower_id: reader.id,
          following_id: followedUser.id,
          followed_at: faker.date.past({ years: 1 }).toISOString(),
        }]);
      } catch (error) {
        // Ignore duplicate follow errors
      }
    }
  }
  
  console.log(`✓ Created social features (author follows and user follows)`);
};

main();
