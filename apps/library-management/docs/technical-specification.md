# Library Management App - Technical Specification (Legacy)

<!-- Powered by BMAD™ Core -->

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-24 | 1.1 | Restructured as legacy documentation according to BMad Method | BMad Orchestrator |
| 2025-08-24 | 1.0 | Initial technical specification | Original Author |

## ⚠️ Legacy Document Notice

**This document has been superseded by BMad Method-compliant documentation:**
- **Primary Reference**: [Frontend Architecture](./frontend-architecture.md) - Current implementation patterns
- **Integration Details**: [API Integration](./api-integration.md) - Service connections and data access
- **User Experience**: [User Workflows](./user-workflows.md) - Staff interaction patterns

**This document remains for:**
- Historical reference
- Migration planning
- Code examples and implementation details not yet moved to new structure

## Architecture Overview

The Library Management App follows a **bounded context** approach within the EzLib monorepo, providing administrative capabilities for library staff while maintaining clear separation from the reader-facing application.

### Bounded Context Definition

**Domain**: Library Operations and Administration
**Responsibility**: Internal library management processes
**Users**: Library staff (owners, managers, librarians)
**Data Scope**: Administrative views of books, members, and transactions

## Technical Architecture

### Application Structure

```
apps/library-management/
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── (auth)/                   # Authentication group
│   │   ├── dashboard/                # Main dashboard
│   │   ├── inventory/                # Book management
│   │   ├── members/                  # Member management  
│   │   ├── transactions/             # Borrowing operations
│   │   ├── collections/              # Collection management
│   │   ├── analytics/                # Reports and insights
│   │   └── settings/                 # Library configuration
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── data-tables/              # Complex table components
│   │   ├── forms/                    # Form components
│   │   └── charts/                   # Analytics visualization
│   ├── lib/
│   │   ├── supabase/                 # Database client
│   │   ├── auth/                     # Authentication logic
│   │   ├── permissions/              # Role-based access control
│   │   └── validation/               # Form and data validation
│   └── types/
│       ├── database.ts               # Generated Supabase types
│       ├── admin.ts                  # Admin-specific types
│       └── forms.ts                  # Form validation schemas
```

### Data Access Patterns

#### 1. Direct Supabase Integration

```typescript
// lib/supabase/admin-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export const createAdminClient = () => {
  return createClientComponentClient<Database>()
}

// Enhanced with admin-specific queries
export const adminQueries = {
  getLibraryInventory: async (libraryId: string) => {
    const supabase = createAdminClient()
    return supabase
      .from('book_inventory')
      .select(`
        *,
        book_edition:book_editions(
          title,
          subtitle,
          isbn_13,
          general_book:general_books(
            canonical_title,
            book_contributors(
              author:authors(name, id),
              role
            )
          )
        )
      `)
      .eq('library_id', libraryId)
  }
}
```

#### 2. Role-Based Data Access

```typescript
// lib/permissions/admin-permissions.ts
export const AdminPermissions = {
  canManageBooks: (userRole: LibAdminRole) => 
    ['owner', 'manager', 'librarian'].includes(userRole),
  
  canManageMembers: (userRole: LibAdminRole) =>
    ['owner', 'manager'].includes(userRole),
    
  canManageStaff: (userRole: LibAdminRole) =>
    ['owner'].includes(userRole)
}

// Hook for permission checking
export const useAdminPermissions = (libraryId: string) => {
  const { data: adminRole } = useQuery({
    queryKey: ['admin-role', libraryId],
    queryFn: () => getAdminRole(libraryId)
  })
  
  return {
    canManageBooks: AdminPermissions.canManageBooks(adminRole?.role),
    canManageMembers: AdminPermissions.canManageMembers(adminRole?.role),
    canManageStaff: AdminPermissions.canManageStaff(adminRole?.role)
  }
}
```

### Component Architecture

#### 1. Data Tables with Server Actions

```typescript
// components/inventory/inventory-table.tsx
'use client'

import { DataTable } from '@/components/ui/data-table'
import { inventoryColumns } from './inventory-columns'
import { useInventoryData } from '@/hooks/use-inventory-data'

export function InventoryTable({ libraryId }: { libraryId: string }) {
  const {
    data: inventory,
    isLoading,
    mutate: refreshInventory
  } = useInventoryData(libraryId)

  const handleAddBook = async (bookData: AddBookFormData) => {
    // Optimistic update
    await addBookToInventory(libraryId, bookData)
    refreshInventory()
    
    // Trigger crawler enrichment
    await triggerBookEnrichment(bookData.isbn_13)
  }

  return (
    <DataTable
      columns={inventoryColumns}
      data={inventory ?? []}
      loading={isLoading}
      onAddBook={handleAddBook}
      searchableColumns={['title', 'author', 'isbn_13']}
      filterableColumns={['availability.status']}
    />
  )
}
```

#### 2. Real-time Updates

```typescript
// hooks/use-real-time-transactions.ts
export const useRealTimeTransactions = (libraryId: string) => {
  const queryClient = useQueryClient()
  const supabase = createAdminClient()

  useEffect(() => {
    const channel = supabase
      .channel('library-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrowing_transactions',
          filter: `library_id=eq.${libraryId}`
        },
        (payload) => {
          // Update relevant queries
          queryClient.invalidateQueries(['transactions', libraryId])
          queryClient.invalidateQueries(['inventory', libraryId])
          
          // Show notification for new requests
          if (payload.eventType === 'INSERT' && payload.new.status === 'requested') {
            toast({
              title: "New Borrowing Request",
              description: `New request from ${payload.new.borrower_name}`,
              action: <Link href={`/transactions/${payload.new.id}`}>Review</Link>
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [libraryId, queryClient])
}
```

### Form Management

#### 1. Type-Safe Forms with Zod

```typescript
// lib/validation/inventory-schemas.ts
import { z } from 'zod'

export const addBookSchema = z.object({
  isbn_13: z.string().regex(/^\d{13}$/, 'Must be 13 digits').optional(),
  manual_entry: z.object({
    title: z.string().min(1, 'Title required'),
    author_name: z.string().min(1, 'Author required'),
    publisher: z.string().optional(),
    publication_year: z.number().optional()
  }).optional()
}).refine(data => data.isbn_13 || data.manual_entry, {
  message: "Either ISBN or manual entry required"
})

export type AddBookFormData = z.infer<typeof addBookSchema>

// components/inventory/add-book-form.tsx
export function AddBookForm({ onSubmit }: { onSubmit: (data: AddBookFormData) => Promise<void> }) {
  const form = useForm<AddBookFormData>({
    resolver: zodResolver(addBookSchema)
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="isbn_13"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ISBN-13</FormLabel>
              <FormControl>
                <Input placeholder="9781234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Additional form fields */}
      </form>
    </Form>
  )
}
```

### State Management

#### 1. React Query for Server State

```typescript
// lib/queries/admin-queries.ts
export const adminQueries = {
  // Library inventory
  inventory: (libraryId: string) => ({
    queryKey: ['inventory', libraryId],
    queryFn: () => getLibraryInventory(libraryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),

  // Active borrowing requests  
  pendingTransactions: (libraryId: string) => ({
    queryKey: ['transactions', libraryId, 'pending'],
    queryFn: () => getPendingTransactions(libraryId),
    refetchInterval: 30 * 1000, // 30 seconds for active requests
  }),

  // Member list
  members: (libraryId: string) => ({
    queryKey: ['members', libraryId],
    queryFn: () => getLibraryMembers(libraryId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

#### 2. Zustand for UI State

```typescript
// lib/store/admin-store.ts
import { create } from 'zustand'

interface AdminState {
  selectedLibrary: string | null
  activeView: 'dashboard' | 'inventory' | 'members' | 'transactions'
  filters: {
    inventory: InventoryFilters
    members: MemberFilters
    transactions: TransactionFilters
  }
  setSelectedLibrary: (id: string) => void
  setActiveView: (view: AdminState['activeView']) => void
  updateFilters: <T extends keyof AdminState['filters']>(
    category: T, 
    filters: Partial<AdminState['filters'][T]>
  ) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  selectedLibrary: null,
  activeView: 'dashboard',
  filters: {
    inventory: {},
    members: {},
    transactions: {}
  },
  setSelectedLibrary: (id) => set({ selectedLibrary: id }),
  setActiveView: (view) => set({ activeView: view }),
  updateFilters: (category, newFilters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [category]: { ...state.filters[category], ...newFilters }
      }
    }))
}))
```

### Integration with External Services

#### 1. Book Crawler Service Integration

```typescript
// lib/services/crawler-service.ts
export class CrawlerService {
  private baseUrl = process.env.NEXT_PUBLIC_CRAWLER_API_URL

  async enrichBook(bookData: { 
    isbn_13?: string
    book_edition_id: string
    general_book_id: string 
  }) {
    const response = await fetch(`${this.baseUrl}/crawler/enrich-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getServiceToken()}`
      },
      body: JSON.stringify({
        ...bookData,
        force_refresh: false
      })
    })

    if (!response.ok) {
      throw new CrawlerError('Failed to trigger book enrichment')
    }

    return response.json()
  }

  async validateISBN(isbn: string): Promise<ISBNValidationResult> {
    const response = await fetch(`${this.baseUrl}/crawler/validate-isbn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn })
    })

    return response.json()
  }
}

export const crawlerService = new CrawlerService()
```

### Performance Optimizations

#### 1. Efficient Data Fetching

```typescript
// lib/queries/optimized-queries.ts
export const useOptimizedInventory = (libraryId: string, filters: InventoryFilters) => {
  return useInfiniteQuery({
    queryKey: ['inventory', libraryId, filters],
    queryFn: ({ pageParam = 0 }) => 
      getInventoryPage(libraryId, filters, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    // Only fetch when component is visible
    enabled: !!libraryId
  })
}

// Virtualized tables for large datasets
export const VirtualizedInventoryTable = ({ libraryId }: { libraryId: string }) => {
  const { data, fetchNextPage, hasNextPage } = useOptimizedInventory(libraryId, {})
  
  return (
    <VirtualizedTable
      data={data?.pages.flat() ?? []}
      columns={inventoryColumns}
      onEndReached={() => hasNextPage && fetchNextPage()}
      estimatedRowHeight={60}
      overscan={5}
    />
  )
}
```

#### 2. Optimistic Updates

```typescript
// hooks/use-optimistic-transactions.ts
export const useOptimisticTransactions = (libraryId: string) => {
  const queryClient = useQueryClient()

  const approveRequest = useMutation({
    mutationFn: (transactionId: string) => 
      approveTransactionRequest(transactionId),
    
    onMutate: async (transactionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['transactions', libraryId])

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData(['transactions', libraryId])

      // Optimistically update
      queryClient.setQueryData(['transactions', libraryId], (old: Transaction[]) =>
        old.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'approved', approved_at: new Date() }
            : t
        )
      )

      return { previousTransactions }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions', libraryId], context.previousTransactions)
      }
    },

    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries(['transactions', libraryId])
    }
  })

  return { approveRequest }
}
```

### Security Implementation

#### 1. Server-Side Authorization

```typescript
// lib/auth/admin-auth.ts
export async function requireAdminAccess(
  libraryId: string,
  requiredPermission?: AdminPermission
) {
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const adminRole = await getAdminRole(session.user.id, libraryId)
  
  if (!adminRole) {
    throw new Error('Access denied: Not a library administrator')
  }

  if (requiredPermission && !hasPermission(adminRole.role, requiredPermission)) {
    throw new Error(`Access denied: Missing ${requiredPermission} permission`)
  }

  return { user: session.user, adminRole }
}

// app/inventory/page.tsx
export default async function InventoryPage({ 
  params 
}: { 
  params: { libraryId: string } 
}) {
  await requireAdminAccess(params.libraryId, 'manage_books')
  
  return <InventoryPageClient libraryId={params.libraryId} />
}
```

### Error Handling

#### 1. Global Error Boundaries

```typescript
// components/error-boundary.tsx
export function AdminErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={AdminErrorFallback}
      onError={(error, errorInfo) => {
        // Log to monitoring service
        logger.error('Admin app error', { error, errorInfo })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function AdminErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Card className="m-4 p-6">
      <CardHeader>
        <CardTitle className="text-destructive">
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
```

This technical specification provides a comprehensive foundation for implementing the Library Management App with proper bounded context separation, type safety, and integration with the broader EzLib system.