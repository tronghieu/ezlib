# Library Management App - API Integration Guide

<!-- Powered by BMAD™ Core -->

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-24 | 1.0 | Initial API integration documentation according to BMad Method | BMad Orchestrator |

## Introduction

This document outlines how the Library Management App integrates with the shared Supabase database, external services, and other components within the EzLib ecosystem. It provides implementation patterns for backend developers and service integration specialists.

## Database Integration

### Direct Supabase Client Usage

The Library Management App connects directly to the shared Supabase database using the JavaScript client, leveraging Row Level Security (RLS) for multi-tenant data isolation.

#### Client Configuration

```typescript
// lib/supabase/config.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient<Database>()
}

// Server-side Supabase client
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Admin-specific queries with proper typing
export const createAdminClient = () => {
  const client = createClient()
  
  // Add admin-specific query methods
  return {
    ...client,
    admin: {
      getLibraryInventory: (libraryId: string) =>
        client.from('book_inventory')
          .select(`
            *,
            book_edition:book_editions!inner(
              id,
              title,
              subtitle,
              isbn_13,
              language,
              edition_metadata,
              general_book:general_books!inner(
                id,
                canonical_title,
                first_publication_year,
                subjects
              )
            )
          `)
          .eq('library_id', libraryId),
      
      getLibraryMembers: (libraryId: string) =>
        client.from('lib_readers')
          .select(`
            *,
            user:users!inner(
              id,
              display_name,
              email,
              avatar_url
            )
          `)
          .eq('library_id', libraryId)
          .eq('state', 'active'),
      
      getPendingTransactions: (libraryId: string) =>
        client.from('borrowing_transactions')
          .select(`
            *,
            book_inventory!inner(
              *,
              book_edition:book_editions!inner(
                title,
                general_book:general_books!inner(canonical_title)
              )
            ),
            borrower:users!inner(
              display_name,
              email
            )
          `)
          .eq('library_id', libraryId)
          .in('status', ['requested', 'approved'])
    }
  }
}
```

### Row Level Security Policies

The app relies on RLS policies defined in the shared database schema to ensure proper data isolation:

```sql
-- Library admins can only access their assigned libraries
CREATE POLICY "Library admins can view their library inventory" 
ON book_inventory FOR SELECT USING (
  library_id IN (
    SELECT library_id 
    FROM lib_admins 
    WHERE user_id = auth.uid()
  )
);

-- Library admins can manage their library members
CREATE POLICY "Library admins can manage their members" 
ON lib_readers FOR ALL USING (
  library_id IN (
    SELECT library_id 
    FROM lib_admins 
    WHERE user_id = auth.uid() 
    AND (permissions->>'manage_members')::boolean = true
  )
);
```

### Database Operations

#### 1. Inventory Management

```typescript
// lib/services/inventory-service.ts
export class InventoryService {
  private client = createAdminClient()

  async addBookToInventory(data: AddBookInventoryData): Promise<BookInventory> {
    const { data: inventory, error } = await this.client
      .from('book_inventory')
      .insert({
        book_edition_id: data.book_edition_id,
        library_id: data.library_id,
        availability: {
          status: 'available',
          total_copies: data.total_copies,
          available_copies: data.total_copies,
          current_borrower_id: null,
          due_date: null
        },
        physical_details: {
          shelf_location: data.shelf_location,
          condition: data.condition || 'good',
          acquisition_date: data.acquisition_date,
          acquisition_cost: data.acquisition_cost,
          barcode: data.barcode
        }
      })
      .select()
      .single()

    if (error) throw new InventoryError(error.message)
    return inventory
  }

  async updateInventoryStatus(
    inventoryId: string, 
    status: InventoryStatus
  ): Promise<void> {
    const { error } = await this.client
      .from('book_inventory')
      .update({
        availability: { 
          ...status,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', inventoryId)

    if (error) throw new InventoryError(error.message)
  }

  async searchInventory(
    libraryId: string, 
    query: string
  ): Promise<BookInventoryWithDetails[]> {
    const { data, error } = await this.client.admin
      .getLibraryInventory(libraryId)
      .or(`
        book_edition.title.ilike.%${query}%,
        book_edition.isbn_13.ilike.%${query}%,
        book_edition.general_book.canonical_title.ilike.%${query}%
      `)

    if (error) throw new InventoryError(error.message)
    return data || []
  }
}
```

#### 2. Transaction Management

```typescript
// lib/services/transaction-service.ts
export class TransactionService {
  private client = createAdminClient()

  async approveTransactionRequest(transactionId: string): Promise<void> {
    const { error } = await this.client
      .from('borrowing_transactions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        due_date: this.calculateDueDate()
      })
      .eq('id', transactionId)

    if (error) throw new TransactionError(error.message)
  }

  async checkOutBook(transactionId: string): Promise<void> {
    // Start a transaction to update both borrowing_transactions and book_inventory
    const { error } = await this.client.rpc('check_out_book', {
      transaction_id: transactionId,
      checkout_timestamp: new Date().toISOString()
    })

    if (error) throw new TransactionError(error.message)
  }

  async returnBook(transactionId: string): Promise<void> {
    const { error } = await this.client.rpc('return_book', {
      transaction_id: transactionId,
      return_timestamp: new Date().toISOString()
    })

    if (error) throw new TransactionError(error.message)
  }

  private calculateDueDate(): string {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 21) // 3 weeks default
    return dueDate.toISOString()
  }
}
```

### Real-time Subscriptions

```typescript
// hooks/use-real-time-updates.ts
export const useRealTimeUpdates = (libraryId: string) => {
  const queryClient = useQueryClient()
  const client = createClient()

  useEffect(() => {
    // Subscribe to borrowing transactions
    const transactionsChannel = client
      .channel(`library-${libraryId}-transactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrowing_transactions',
          filter: `library_id=eq.${libraryId}`
        },
        (payload) => {
          queryClient.invalidateQueries(['transactions', libraryId])
          
          if (payload.eventType === 'INSERT' && payload.new.status === 'requested') {
            // Show notification for new borrowing request
            showNotification({
              title: 'New Borrowing Request',
              message: 'A reader has requested to borrow a book',
              type: 'info'
            })
          }
        }
      )

    // Subscribe to inventory changes
    const inventoryChannel = client
      .channel(`library-${libraryId}-inventory`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'book_inventory',
          filter: `library_id=eq.${libraryId}`
        },
        () => {
          queryClient.invalidateQueries(['inventory', libraryId])
        }
      )

    transactionsChannel.subscribe()
    inventoryChannel.subscribe()

    return () => {
      client.removeChannel(transactionsChannel)
      client.removeChannel(inventoryChannel)
    }
  }, [libraryId, queryClient])
}
```

## External Service Integration

### Book Crawler Service

The Library Management App integrates with the Python FastAPI crawler service for book metadata enrichment.

```typescript
// lib/services/crawler-integration.ts
export class CrawlerIntegration {
  private baseUrl = process.env.NEXT_PUBLIC_CRAWLER_API_URL || 'http://localhost:8000'

  async enrichBookMetadata(data: EnrichmentRequest): Promise<EnrichmentResponse> {
    const response = await fetch(`${this.baseUrl}/crawler/enrich-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getServiceToken()}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new CrawlerError(`Enrichment failed: ${error.detail}`)
    }

    return response.json()
  }

  async validateISBN(isbn: string): Promise<ISBNValidationResult> {
    const response = await fetch(`${this.baseUrl}/crawler/validate-isbn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn_13: isbn })
    })

    return response.json()
  }

  private async getServiceToken(): Promise<string> {
    // Get service-to-service authentication token
    const client = createClient()
    const { data: { session } } = await client.auth.getSession()
    return session?.access_token || ''
  }
}

// Usage in components
export const useBookEnrichment = () => {
  const crawler = new CrawlerIntegration()

  return useMutation({
    mutationFn: async (data: { isbn_13: string; book_edition_id: string }) => {
      return crawler.enrichBookMetadata({
        isbn_13: data.isbn_13,
        book_edition_id: data.book_edition_id,
        force_refresh: false
      })
    },
    onSuccess: () => {
      toast.success('Book enrichment started. Metadata will update automatically.')
    },
    onError: (error) => {
      toast.error(`Enrichment failed: ${error.message}`)
    }
  })
}
```

### Integration Workflows

#### 1. Adding a New Book with Automatic Enrichment

```typescript
// lib/workflows/add-book-workflow.ts
export const addBookWorkflow = async (
  libraryId: string,
  bookData: AddBookData
): Promise<BookInventory> => {
  const inventoryService = new InventoryService()
  const crawlerIntegration = new CrawlerIntegration()

  // Step 1: Validate ISBN if provided
  if (bookData.isbn_13) {
    const validation = await crawlerIntegration.validateISBN(bookData.isbn_13)
    if (!validation.valid) {
      throw new ValidationError('Invalid ISBN provided')
    }
  }

  // Step 2: Find or create book edition
  let bookEdition = await findBookEditionByISBN(bookData.isbn_13)
  
  if (!bookEdition) {
    bookEdition = await createMinimalBookEdition(bookData)
  }

  // Step 3: Add to library inventory
  const inventory = await inventoryService.addBookToInventory({
    library_id: libraryId,
    book_edition_id: bookEdition.id,
    total_copies: bookData.copies || 1,
    ...bookData.physical_details
  })

  // Step 4: Trigger asynchronous enrichment
  if (bookData.isbn_13) {
    crawlerIntegration.enrichBookMetadata({
      isbn_13: bookData.isbn_13,
      book_edition_id: bookEdition.id,
      general_book_id: bookEdition.general_book_id,
      force_refresh: false
    }).catch(error => {
      // Log error but don't fail the workflow
      console.error('Enrichment failed:', error)
    })
  }

  return inventory
}
```

#### 2. Transaction Approval Workflow

```typescript
// lib/workflows/transaction-workflow.ts
export const transactionApprovalWorkflow = async (
  transactionId: string,
  adminUserId: string
): Promise<void> => {
  const transactionService = new TransactionService()
  const client = createAdminClient()

  // Step 1: Verify admin permissions
  const { data: transaction } = await client
    .from('borrowing_transactions')
    .select('library_id, borrower_id')
    .eq('id', transactionId)
    .single()

  if (!transaction) {
    throw new NotFoundError('Transaction not found')
  }

  const hasPermission = await verifyAdminPermission(
    adminUserId, 
    transaction.library_id, 
    'manage_transactions'
  )

  if (!hasPermission) {
    throw new PermissionError('Insufficient permissions')
  }

  // Step 2: Approve transaction
  await transactionService.approveTransactionRequest(transactionId)

  // Step 3: Log approval event
  await client.from('transaction_events').insert({
    transaction_id: transactionId,
    event_type: 'approved',
    user_id: adminUserId,
    timestamp: new Date().toISOString(),
    notes: 'Request approved by library staff'
  })

  // Step 4: Send notification to borrower (via real-time)
  const notificationChannel = client.channel('user-notifications')
  notificationChannel.send({
    type: 'broadcast',
    event: 'transaction_approved',
    payload: {
      user_id: transaction.borrower_id,
      transaction_id: transactionId,
      message: 'Your book request has been approved! Please visit the library to check out your book.'
    }
  })
}
```

## Error Handling and Monitoring

### Centralized Error Management

```typescript
// lib/errors/admin-errors.ts
export class AdminError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AdminError'
  }
}

export class InventoryError extends AdminError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INVENTORY_ERROR', context)
  }
}

export class TransactionError extends AdminError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'TRANSACTION_ERROR', context)
  }
}

export class PermissionError extends AdminError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PERMISSION_ERROR', context)
  }
}

// Global error handler
export const handleAdminError = (error: Error) => {
  // Log to monitoring service
  console.error('Admin app error:', error)

  // Show appropriate user message
  if (error instanceof PermissionError) {
    toast.error('Access denied. Please contact your library administrator.')
  } else if (error instanceof InventoryError) {
    toast.error('Inventory operation failed. Please try again.')
  } else {
    toast.error('An unexpected error occurred. Please try again.')
  }
}
```

### Integration Health Checks

```typescript
// lib/health/integration-health.ts
export const useIntegrationHealth = () => {
  return useQuery({
    queryKey: ['integration-health'],
    queryFn: async () => {
      const checks = await Promise.allSettled([
        checkSupabaseConnection(),
        checkCrawlerService(),
        checkRealtimeConnection()
      ])

      return {
        supabase: checks[0].status === 'fulfilled',
        crawler: checks[1].status === 'fulfilled',
        realtime: checks[2].status === 'fulfilled',
        lastChecked: new Date()
      }
    },
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    retry: 1
  })
}

// Display health status in admin header
export const IntegrationHealthIndicator = () => {
  const { data: health } = useIntegrationHealth()

  if (!health) return null

  const allHealthy = health.supabase && health.crawler && health.realtime

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={cn(
          "w-2 h-2 rounded-full",
          allHealthy ? "bg-green-500" : "bg-red-500"
        )} />
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <div>Database: {health.supabase ? '✅' : '❌'}</div>
          <div>Crawler: {health.crawler ? '✅' : '❌'}</div>
          <div>Real-time: {health.realtime ? '✅' : '❌'}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
```

This API integration guide provides a comprehensive overview of how the Library Management App connects to and interacts with the various services and data sources within the EzLib ecosystem.