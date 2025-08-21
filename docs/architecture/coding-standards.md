# EzLib Coding Standards

## Overview

This document defines the coding standards and conventions for the EzLib project, covering both the Python book crawler service and the TypeScript/Next.js frontend applications.

## General Principles

- **Consistency First** - Follow established patterns within the codebase
- **Readability Over Cleverness** - Write code that tells a story
- **Type Safety** - Use TypeScript and Python type hints extensively  
- **Test-Driven Development** - Write tests alongside implementation
- **Security by Default** - Never commit secrets, sanitize inputs, validate data

---

## Python Standards (Book Crawler Service)

### Code Style
- **Formatter**: Black with line length 88
- **Linter**: Ruff for fast linting and import sorting
- **Type Checker**: mypy with strict mode enabled
- **Import Organization**: isort compatible with Black

### Naming Conventions
```python
# Variables and functions: snake_case
book_metadata = get_book_details()

# Classes: PascalCase  
class BookCrawler:
    pass

# Constants: SCREAMING_SNAKE_CASE
API_TIMEOUT_SECONDS = 30

# Private members: _leading_underscore
def _internal_method(self):
    pass
```

### Type Annotations
```python
# Always use type hints
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

def enrich_book_metadata(
    isbn: str, 
    force_refresh: bool = False
) -> Optional[BookMetadata]:
    """Enrich book with external API data."""
    pass

# Use Pydantic for data models
class BookMetadata(BaseModel):
    title: str
    authors: List[str]
    isbn_13: Optional[str] = None
    cover_url: Optional[str] = None
```

### Error Handling
```python
# Use specific exception types
class BookNotFoundError(Exception):
    """Raised when book cannot be found in external APIs."""
    pass

# Log errors with context
import structlog
logger = structlog.get_logger()

try:
    metadata = await fetch_from_openlibrary(isbn)
except httpx.RequestError as e:
    logger.error("OpenLibrary API request failed", isbn=isbn, error=str(e))
    raise BookNotFoundError(f"Could not fetch book {isbn}")
```

### Async Patterns
```python
# Use async/await for I/O operations
async def fetch_book_data(isbn: str) -> BookMetadata:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"/books/{isbn}")
        return BookMetadata.parse_obj(response.json())

# Use asyncio.gather for concurrent requests
results = await asyncio.gather(
    fetch_from_openlibrary(isbn),
    fetch_from_google_books(isbn),
    return_exceptions=True
)
```

### File Organization
```
services/crawler/
├── main.py              # FastAPI app entry point
├── config.py           # Configuration management
├── models/             # Pydantic models
│   ├── book.py
│   └── author.py
├── services/           # Business logic
│   ├── enrichment.py
│   └── external_apis.py
├── api/                # FastAPI routers
│   └── crawler.py
└── tests/              # Test files mirror structure
    ├── test_enrichment.py
    └── test_external_apis.py
```

---

## TypeScript Standards (Frontend Applications)

### Code Style
- **Formatter**: Prettier with 2-space indentation
- **Linter**: ESLint with TypeScript rules
- **Import Organization**: Auto-sorted by ESLint

### Naming Conventions
```typescript
// Variables and functions: camelCase
const bookMetadata = getBookDetails();

// Types and interfaces: PascalCase
interface BookMetadata {
  title: string;
  authors: string[];
}

// Components: PascalCase
export function BookCard({ book }: BookCardProps) {
  return <div>{book.title}</div>;
}

// Constants: SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.ezlib.com';
```

### Component Structure
```typescript
// Use functional components with TypeScript
interface BookCardProps {
  book: Book;
  onBorrow?: (bookId: string) => void;
}

export function BookCard({ book, onBorrow }: BookCardProps) {
  const handleBorrow = useCallback(() => {
    onBorrow?.(book.id);
  }, [book.id, onBorrow]);

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <h3 className="text-lg font-semibold">{book.title}</h3>
        <Button onClick={handleBorrow}>Borrow</Button>
      </CardContent>
    </Card>
  );
}
```

### State Management
```typescript
// Use Zustand for global state
interface BookStore {
  books: Book[];
  isLoading: boolean;
  addBook: (book: Book) => void;
  fetchBooks: () => Promise<void>;
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  isLoading: false,
  addBook: (book) => set((state) => ({ 
    books: [...state.books, book] 
  })),
  fetchBooks: async () => {
    set({ isLoading: true });
    try {
      const books = await api.getBooks();
      set({ books, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      // Handle error appropriately
    }
  },
}));
```

### API Integration
```typescript
// Use consistent error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}
```

### File Organization (Next.js App Router)
```
apps/reader/
├── app/                    # Next.js 14 app router
│   ├── (auth)/            # Route groups
│   ├── books/
│   │   └── [id]/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── book/
│       └── BookCard.tsx
├── lib/                  # Utilities and configurations
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
└── types/                # Type definitions
    └── book.ts
```

---

## Database Standards

### Supabase Integration
```typescript
// Use typed Supabase client
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Use RLS policies for security
const { data: books, error } = await supabase
  .from('books')
  .select('*')
  .eq('library_id', libraryId); // RLS ensures user can only see allowed data
```

### Migration Standards
```sql
-- Always include descriptive comments
-- Migration: 2024-08-21-001-add-book-crawler-metadata.sql

-- Add metadata tracking for book enrichment
ALTER TABLE book_editions 
ADD COLUMN last_enriched_at TIMESTAMPTZ,
ADD COLUMN external_ids JSONB DEFAULT '{}'::jsonb;

-- Add index for performance
CREATE INDEX idx_book_editions_enrichment 
ON book_editions(last_enriched_at) 
WHERE last_enriched_at IS NOT NULL;

-- Add RLS policy
CREATE POLICY "Public books readable by all" 
ON book_editions FOR SELECT 
USING (true);
```

---

## Testing Standards

### Python Testing
```python
# Use pytest with async support
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_enrich_book_success():
    # Arrange
    mock_client = AsyncMock()
    mock_client.get.return_value.json.return_value = {
        "title": "Test Book",
        "authors": ["Test Author"]
    }
    
    # Act
    result = await enrich_book_metadata("1234567890")
    
    # Assert
    assert result.title == "Test Book"
    assert "Test Author" in result.authors
```

### TypeScript Testing
```typescript
// Use Jest + Testing Library
import { render, screen } from '@testing-library/react';
import { BookCard } from './BookCard';

describe('BookCard', () => {
  const mockBook = {
    id: '1',
    title: 'Test Book',
    authors: ['Test Author']
  };

  it('displays book information', () => {
    render(<BookCard book={mockBook} />);
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });
});
```

---

## Security Standards

### Environment Variables
```bash
# Never commit these to version control
# Use .env.local for development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key

# Use separate environments
DATABASE_URL_PRODUCTION=postgresql://...
DATABASE_URL_STAGING=postgresql://...
```

### Input Validation
```python
# Always validate external data
from pydantic import BaseModel, validator

class BookCreateRequest(BaseModel):
    isbn: str
    title: str
    
    @validator('isbn')
    def validate_isbn(cls, v):
        # Remove hyphens and validate format
        isbn = v.replace('-', '')
        if len(isbn) not in [10, 13] or not isbn.isdigit():
            raise ValueError('Invalid ISBN format')
        return isbn
```

### API Security
```typescript
// Rate limiting and authentication
export async function POST(request: Request) {
  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Validate input
  const body = await request.json();
  const validatedData = BookCreateRequest.parse(body);
  
  // Process request...
}
```

---

## Documentation Standards

### Code Comments
```python
def enrich_book_metadata(isbn: str, force_refresh: bool = False) -> Optional[BookMetadata]:
    """
    Enrich book metadata from external APIs.
    
    Args:
        isbn: 13-digit ISBN of the book to enrich
        force_refresh: Skip cache and fetch fresh data
        
    Returns:
        BookMetadata object or None if book not found
        
    Raises:
        BookNotFoundError: When book cannot be found in any external API
        ApiError: When external API requests fail
    """
```

### README Structure
```markdown
# Component/Service Name

## Purpose
Brief description of what this component does.

## Setup
```bash
npm install
# or
pip install -r requirements.txt
```

## Usage
Basic usage examples.

## API Reference
Key functions/endpoints with examples.

## Testing
How to run tests.
```

This coding standards document ensures consistency across the EzLib codebase and provides clear guidelines for the development team.