# Library Management App - Coding Standards

<!-- Powered by BMAD™ Core -->

## Overview

This document defines the coding standards for the **EzLib Library Management System**. These standards ensure code consistency, maintainability, and alignment with the **ultra-simple MVP philosophy**.

## Core Principles

1. **Ultra-Simple First**: Start with basic functionality, add complexity incrementally
2. **Real-time by Default**: All inventory changes must sync immediately with reader app
3. **Search-First Interface**: Every list component needs prominent search functionality
4. **Mobile-Responsive Admin**: All interfaces must work perfectly on tablets (circulation desk)
5. **Cross-Domain Security**: Always validate user exists from reader platform first
6. **Permission-First**: Verify admin access before rendering sensitive UI/operations
7. **TypeScript Strict**: No `any` types, comprehensive interface definitions
8. **Performance Conscious**: Optimistic updates, proper loading states, efficient queries

## TypeScript Standards

### Strict Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Definitions
```typescript
// ✅ Good: Comprehensive interface definitions
interface BookInventory {
  id: string
  book_edition_id: string
  library_id: string
  availability: {
    status: 'available' | 'checked_out' | 'reserved' | 'maintenance'
    total_copies: number
    available_copies: number
    current_borrower_id: string | null
    due_date: string | null
  }
  physical_details: {
    shelf_location?: string
    condition: 'new' | 'good' | 'fair' | 'poor'
    acquisition_date: string
    acquisition_cost?: number
    barcode?: string
  }
  created_at: string
  updated_at: string
}

// ❌ Bad: Using any or incomplete types
interface BadBookInventory {
  id: string
  data: any // Never use any!
  status?: string // Be specific with union types
}
```

### Component Props
```typescript
// ✅ Good: Explicit prop interfaces with documentation
interface BookListProps {
  /** Library ID for filtering books */
  libraryId: string
  /** Optional search query for filtering */
  searchQuery?: string
  /** Callback when book is selected */
  onBookSelect?: (book: BookInventory) => void
  /** Show only available books */
  filterAvailable?: boolean
  className?: string
}

// ❌ Bad: Unclear or missing prop types
interface BadBookListProps {
  libraryId: string
  data?: any
  onClick?: Function
}
```

## React Component Standards

### Component Structure
```typescript
// ✅ Good: Proper component structure with forwardRef
'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'

interface BookListProps {
  libraryId: string
  className?: string
}

const BookList = forwardRef<HTMLDivElement, BookListProps>(
  ({ libraryId, className, ...props }, ref) => {
    // Permission check first
    const { canManageBooks } = useAdminPermissions(libraryId)
    
    // Early return for permissions
    if (!canManageBooks) {
      return <div>Access denied</div>
    }

    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {/* Component content */}
      </div>
    )
  }
)

BookList.displayName = "BookList"

export { BookList }
export type { BookListProps }
```

### Hooks Usage
```typescript
// ✅ Good: Proper hook usage with error handling
export function useLibraryInventory(libraryId: string) {
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['inventory', libraryId],
    queryFn: () => inventoryService.getLibraryInventory(libraryId),
    enabled: !!libraryId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })

  // Real-time updates
  useRealTimeInventory(libraryId)

  return {
    books: books || [],
    isLoading,
    error,
    isEmpty: !isLoading && (!books || books.length === 0)
  }
}

// ❌ Bad: No error handling, unclear return type
export function useBadInventory(libraryId: string) {
  const { data } = useQuery(['inventory', libraryId], () => 
    inventoryService.getLibraryInventory(libraryId)
  )
  return data
}
```

## Service Layer Standards

### Service Classes
```typescript
// ✅ Good: Comprehensive service with error handling
export class InventoryService {
  private supabase = createAdminClient()

  async addBookToInventory(data: AddBookInventoryData): Promise<BookInventory> {
    try {
      // Validate input
      const validatedData = addBookInventorySchema.parse(data)
      
      // Database operation
      const { data: inventory, error } = await this.supabase
        .from('book_inventory')
        .insert({
          book_edition_id: validatedData.book_edition_id,
          library_id: validatedData.library_id,
          availability: {
            status: 'available',
            total_copies: validatedData.total_copies,
            available_copies: validatedData.total_copies,
            current_borrower_id: null,
            due_date: null
          }
        })
        .select()
        .single()

      if (error) {
        throw new InventoryError(`Failed to add book: ${error.message}`)
      }

      // Real-time sync with reader app
      await this.syncWithReaderApp(
        validatedData.library_id, 
        inventory.book_edition_id, 
        inventory.availability
      )

      return inventory
    } catch (error) {
      if (error instanceof InventoryError) throw error
      throw new InventoryError('Unexpected error adding book to inventory')
    }
  }

  private async syncWithReaderApp(
    libraryId: string, 
    bookId: string, 
    availability: InventoryStatus
  ): Promise<void> {
    // Implementation for real-time sync
  }
}
```

### Error Handling
```typescript
// ✅ Good: Custom error classes with context
export class InventoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'InventoryError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

// Usage in components
try {
  await inventoryService.addBook(bookData)
} catch (error) {
  if (error instanceof InventoryError) {
    toast.error(`Inventory Error: ${error.message}`)
  } else if (error instanceof AuthenticationError) {
    router.push('/login')
  } else {
    toast.error('An unexpected error occurred')
  }
}
```

## Database Integration Standards

### Query Patterns
```typescript
// ✅ Good: Efficient queries with proper filtering
export async function getLibraryInventory(libraryId: string): Promise<BookInventoryWithDetails[]> {
  const { data, error } = await supabase
    .from('book_inventory')
    .select(`
      id,
      availability,
      physical_details,
      created_at,
      updated_at,
      book_edition:book_editions!inner(
        id,
        title,
        subtitle,
        isbn_13,
        language,
        general_book:general_books!inner(
          id,
          canonical_title,
          first_publication_year
        )
      )
    `)
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false })

  if (error) throw new DatabaseError(error.message)
  return data || []
}

// ❌ Bad: Over-fetching, no error handling
export async function getBadInventory(libraryId: string) {
  const { data } = await supabase
    .from('book_inventory')
    .select('*') // Over-fetching
    .eq('library_id', libraryId)
  
  return data // No error handling
}
```

### Real-time Subscriptions
```typescript
// ✅ Good: Managed subscriptions with cleanup
export function useRealTimeInventory(libraryId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!libraryId) return

    const channel = supabase
      .channel(`inventory-${libraryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_inventory',
          filter: `library_id=eq.${libraryId}`
        },
        (payload) => {
          // Update React Query cache optimistically
          queryClient.setQueryData(
            ['inventory', libraryId],
            (oldData: BookInventory[] | undefined) => {
              if (!oldData) return oldData
              
              switch (payload.eventType) {
                case 'UPDATE':
                  return oldData.map(book => 
                    book.id === payload.new.id ? payload.new as BookInventory : book
                  )
                case 'INSERT':
                  return [...oldData, payload.new as BookInventory]
                case 'DELETE':
                  return oldData.filter(book => book.id !== payload.old.id)
                default:
                  return oldData
              }
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [libraryId, queryClient])
}
```

## Form Validation Standards

### Zod Schemas
```typescript
// ✅ Good: Comprehensive validation schemas
import { z } from 'zod'

export const addBookInventorySchema = z.object({
  book_edition_id: z.string().uuid('Invalid book edition ID'),
  library_id: z.string().uuid('Invalid library ID'),
  total_copies: z.number().min(1, 'Must have at least 1 copy'),
  shelf_location: z.string().optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor']).default('good'),
  acquisition_date: z.string().datetime(),
  acquisition_cost: z.number().positive().optional(),
  barcode: z.string().optional()
})

export type AddBookInventoryData = z.infer<typeof addBookInventorySchema>

// Form usage
const form = useForm<AddBookInventoryData>({
  resolver: zodResolver(addBookInventorySchema),
  defaultValues: {
    condition: 'good',
    total_copies: 1
  }
})
```

## UI/UX Standards

### Ultra-Simple MVP Interface
```typescript
// ✅ Good: Ultra-simple table for MVP
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Author</TableHead>
      <TableHead>ISBN</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {books.map((book) => (
      <TableRow key={book.id}>
        <TableCell>{book.book_edition.title}</TableCell>
        <TableCell>{book.book_edition.general_book.canonical_title}</TableCell>
        <TableCell className="font-mono">{book.book_edition.isbn_13}</TableCell>
        <TableCell>
          <StatusBadge status={book.availability.status} />
        </TableCell>
        <TableCell>
          <BookQuickActions book={book} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// ❌ Bad: Complex table for MVP (save for post-MVP)
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Author</TableHead>
      <TableHead>Due Date</TableHead> {/* Too complex for MVP */}
      <TableHead>Fine Amount</TableHead> {/* Too complex for MVP */}
      <TableHead>Hold Queue</TableHead> {/* Too complex for MVP */}
      <TableHead>Borrower Details</TableHead> {/* Too complex for MVP */}
    </TableRow>
  </TableHeader>
</Table>
```

### Loading States & Error Boundaries
```typescript
// ✅ Good: Comprehensive loading and error states
export function BookList({ libraryId }: BookListProps) {
  const { books, isLoading, error, isEmpty } = useLibraryInventory(libraryId)

  if (isLoading) {
    return <BookListSkeleton />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load books"
        description={error.message}
        action={
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        }
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="No books found"
        description="Start by adding your first book to the inventory"
        action={
          <AddBookButton libraryId={libraryId} />
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <BookSearch libraryId={libraryId} />
      <BookTable books={books} />
    </div>
  )
}
```

## Testing Standards

### Component Testing
```typescript
// ✅ Good: Comprehensive component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BookList } from '@/components/inventory/book-list'
import { createMockBooks } from '@/test-utils/mock-data'

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

jest.mock('@/lib/services/inventory-service')

describe('BookList', () => {
  const mockLibraryId = 'lib-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders book list with ultra-simple columns only', async () => {
    render(<BookList libraryId={mockLibraryId} />, {
      wrapper: createTestWrapper()
    })

    // Verify MVP columns
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Author')).toBeInTheDocument() 
    expect(screen.getByText('Status')).toBeInTheDocument()
    
    // Ensure complex columns are NOT present in MVP
    expect(screen.queryByText('Due Date')).not.toBeInTheDocument()
    expect(screen.queryByText('Fine Amount')).not.toBeInTheDocument()
  })

  it('handles book search correctly', async () => {
    render(<BookList libraryId={mockLibraryId} />, {
      wrapper: createTestWrapper()
    })

    const searchInput = screen.getByPlaceholderText('Search books...')
    fireEvent.change(searchInput, { target: { value: 'Harry Potter' } })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Harry Potter')).toBeInTheDocument()
    })
  })
})
```

## Performance Standards

### Query Optimization
```typescript
// ✅ Good: Optimized React Query usage
const { data: books } = useQuery({
  queryKey: ['inventory', libraryId, searchQuery],
  queryFn: () => inventoryService.searchBooks(libraryId, searchQuery),
  enabled: !!libraryId,
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
  refetchOnWindowFocus: false,
  keepPreviousData: true // For smooth pagination
})

// ❌ Bad: No optimization, frequent refetching
const { data: books } = useQuery(
  ['inventory'],
  () => inventoryService.getBooks()
  // No optimization options
)
```

### Bundle Optimization
```typescript
// ✅ Good: Lazy loading for non-critical components
const ReportsPage = lazy(() => import('@/pages/reports'))
const SettingsPage = lazy(() => import('@/pages/settings'))

// Usage with Suspense
<Suspense fallback={<PageSkeleton />}>
  <ReportsPage />
</Suspense>

// ✅ Good: Code splitting for large libraries
const ChartLibrary = dynamic(() => import('recharts'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
```

## Security Standards

### Permission Validation
```typescript
// ✅ Good: Server-side permission validation
export async function requireAdminAccess(
  libraryId: string,
  requiredPermission?: AdminPermission
): Promise<AdminRole> {
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const adminRole = await getAdminRole(session.user.id, libraryId)
  
  if (!adminRole) {
    throw new Error('Library admin access required')
  }

  if (requiredPermission && !hasPermission(adminRole.role, requiredPermission)) {
    throw new Error(`Missing ${requiredPermission} permission`)
  }

  return adminRole
}

// Page usage
export default async function InventoryPage({ params }: { params: { libraryId: string } }) {
  await requireAdminAccess(params.libraryId, 'manage_books')
  return <InventoryPageClient libraryId={params.libraryId} />
}
```

### Data Sanitization
```typescript
// ✅ Good: Input sanitization and validation
export function sanitizeBookTitle(title: string): string {
  return title
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .slice(0, 255) // Limit length
}

// Form submission
const handleSubmit = (data: AddBookData) => {
  const sanitizedData = {
    ...data,
    title: sanitizeBookTitle(data.title),
    isbn: data.isbn?.replace(/[^0-9X]/g, '') // Only numbers and X
  }
  
  submitBook(sanitizedData)
}
```

## Code Organization Standards

### File Structure
```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── forms/             # Form-specific components
│   ├── data-tables/       # Table components
│   └── layout/            # Layout components
├── lib/                   # Core utilities
│   ├── auth/              # Authentication logic
│   ├── services/          # Business logic services
│   ├── validation/        # Zod schemas
│   └── utils.ts           # Common utilities
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
└── types/                 # TypeScript definitions
```

### Import Organization
```typescript
// ✅ Good: Organized imports
// React imports first
import { useState, useEffect } from 'react'

// External library imports
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

// Internal imports (absolute paths)
import { Button } from '@/components/ui/button'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { inventoryService } from '@/lib/services/inventory-service'
import type { BookInventory } from '@/types/admin'

// ❌ Bad: Mixed import order, relative paths
import type { BookInventory } from '../../../types/admin'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
```

## Documentation Standards

### Component Documentation
```typescript
/**
 * BookList displays the library's book inventory with search and filtering capabilities.
 * 
 * @remarks
 * This component follows the ultra-simple MVP philosophy:
 * - Shows only essential columns (Title, Author, ISBN, Status)
 * - Real-time updates via Supabase subscriptions
 * - Search-first interface with prominent search bar
 * - Mobile-responsive for tablet use at circulation desk
 * 
 * @param libraryId - The ID of the library to display books for
 * @param searchQuery - Optional search query to filter books
 * @param onBookSelect - Callback when a book is selected
 * 
 * @example
 * ```tsx
 * <BookList 
 *   libraryId="lib-123"
 *   searchQuery="harry potter"
 *   onBookSelect={(book) => console.log('Selected:', book.title)}
 * />
 * ```
 */
export function BookList({ libraryId, searchQuery, onBookSelect }: BookListProps) {
  // Implementation
}
```

## Version Control Standards

### Commit Messages
```bash
# ✅ Good: Clear, descriptive commit messages
feat(inventory): add real-time book availability sync with reader app
fix(auth): resolve cross-domain login session persistence issue  
refactor(search): optimize global search performance for large inventories
docs(api): update inventory service documentation

# ❌ Bad: Vague commit messages
fix stuff
update code
changes
wip
```

### Branch Naming
```bash
# ✅ Good: Descriptive branch names
feature/ultra-simple-checkout-flow
fix/real-time-inventory-sync
refactor/search-performance-optimization
hotfix/auth-session-timeout

# ❌ Bad: Unclear branch names
feature/new-stuff
fix/bug
update
```

## Performance Monitoring

### Key Metrics to Track
- **Page Load Time**: < 3 seconds for dashboard
- **API Response Time**: < 500ms for inventory queries
- **Real-time Update Latency**: < 100ms for status changes
- **Search Response Time**: < 200ms for basic queries
- **Bundle Size**: < 1MB for initial load

These standards ensure we build a **reliable, maintainable, and performant** library management system that can grow from ultra-simple MVP to comprehensive post-MVP functionality.