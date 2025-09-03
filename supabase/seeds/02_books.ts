/**
 * Book Seeding - Creates authors, general books, editions, and contributors
 * Includes both famous authors/books and generated content
 */
import { createSeedClient } from "@snaplet/seed";
import { copycat, faker } from "@snaplet/copycat";

export const seedAuthorsAndBooks = async () => {
  console.log("✍️📚 Creating authors and books...");
  const seed = await createSeedClient();
  const createdAuthors: any[] = [];
  const createdGeneralBooks: any[] = [];
  const createdBookEditions: any[] = [];
  
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

  // Create famous authors
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

  // Create popular general books
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

  // Create book editions
  console.log("📖 Creating book editions...");
  
  // Create 1-4 editions for each general book
  for (const generalBook of createdGeneralBooks) {
    const editionCount = faker.number.int({ min: 1, max: 4 });
    
    for (let i = 0; i < editionCount; i++) {
      const isbn13 = faker.string.numeric(13);
      const languages = ['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'pt', 'ru', 'ar'];
      const language = faker.helpers.arrayElement(languages);
      const formats = ['hardcover', 'paperback', 'ebook', 'audiobook'];
      const format = faker.helpers.arrayElement(formats);
      
      const result = await seed.book_editions([{
        general_book_id: generalBook.id,
        isbn_13: isbn13,
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

  // Create book contributors
  console.log("🤝 Creating book contributors...");
  
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

  return { createdAuthors, createdGeneralBooks, createdBookEditions };
};