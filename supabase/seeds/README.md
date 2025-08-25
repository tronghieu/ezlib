# EzLib Database Seeds

This directory contains organized seed data for the EzLib database, providing sample data for development and testing.

## Structure

```
supabase/seeds/
├── README.md              # This documentation
├── seed.sql              # Main seed file (auto-executed by Supabase)
├── 01_authors.sql        # Author seed data (5 authors)
├── 02_general_books.sql  # General book entries (8 books)
├── 03_book_editions.sql  # Book editions (9 editions)
└── 04_book_contributors.sql # Author-book relationships (9 relationships)
```

## Sample Data Overview

### Authors (5 records)
- George Orwell (1984, Animal Farm)
- Jane Austen (Pride and Prejudice, Emma)
- Isaac Asimov (Foundation, I Robot)
- Agatha Christie (Murder on the Orient Express)
- J.K. Rowling (Harry Potter series)

### Books & Editions
- **8 General Books** (language-agnostic canonical works)
- **5 Book Editions** (specific published versions with ISBNs)
- **5 Author-Book Relationships** via book_contributors

### Key Features
- Realistic metadata including publication years, subjects, social stats
- Valid ISBN-13 and ISBN-10 numbers
- Publisher information and format specifications
- Borrowing activity statistics for testing
- Proper foreign key relationships

## Usage

Seeds are automatically applied when running:
```bash
supabase db reset
```

The main `seed.sql` file:
1. Clears existing data (in reverse dependency order)
2. Inserts data in correct dependency order (authors → books → editions → contributors)
3. Maintains referential integrity throughout

## Development Notes

- All UUIDs are hardcoded for predictable testing
- Metadata includes JSON fields for flexible data storage
- Social stats simulate real-world usage metrics
- Format values must match database constraints: `hardcover`, `paperback`, `ebook`, `audiobook`, `other`

This seed data provides a solid foundation for testing book discovery, author relationships, and edition management features.