# EzLib Library Management - Frontend Architecture Document

<!-- Powered by BMAD™ Core -->

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-25 | 2.0 | Complete architectural overhaul: Ultra-simple MVP, passwordless authentication, cross-domain access, real-time sync | Winston (Architect) |
| 2025-08-24 | 1.0 | Initial frontend architecture for Library Management App | BMad Orchestrator |

## Introduction

This document defines the **ultra-simple first** frontend architecture for the **EzLib Library Management System** within the monorepo. This administrative web application serves small/medium libraries (1-3 staff, up to 5K books, 1K members) with a **dashboard-centric, search-first** interface that prioritizes operational efficiency over feature complexity.

### Bounded Context & MVP Philosophy
- **Domain**: Ultra-simple library operations replacing manual/spreadsheet systems
- **Users**: Library staff (owners, managers, librarians) with varying technical comfort levels  
- **Access**: `manage.ezlib.com` with passwordless email OTP authentication
- **Integration**: Direct Supabase connection with real-time sync to reader app
- **MVP Approach**: Basic book lists → simple checkout/return → enhanced features later

## Frontend Tech Stack

### Core Technology Decisions

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------| 
| **Framework** | Next.js | 14+ | React with App Router | Server-side rendering, optimal admin performance, Vercel deployment |
| **Language** | TypeScript | 5.0+ | Type safety | Strict mode, error prevention, developer productivity |
| **UI Foundation** | shadcn/ui | Latest | Component system | Professional admin interface, accessibility, customization |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS | Rapid development, consistent design, responsive by default |
| **Database** | Supabase Client | Latest | PostgreSQL integration | Real-time subscriptions, Row Level Security, direct connection |
| **State Management** | Zustand + React Query | Latest | Client + Server state | Lightweight UI state, optimized caching for admin operations |
| **Forms** | React Hook Form + Zod | Latest | Type-safe forms | Performance optimization, schema validation |
| **Authentication** | Supabase Auth | Latest | Passwordless OTP | Cross-domain sessions, role-based access control |
| **Real-time** | Supabase Subscriptions | Latest | Live updates | Inventory sync with reader app, transaction updates |

### Architecture Principles

1. **Ultra-Simple First**: Start with basic functionality, add complexity incrementally
2. **Search-First Interface**: Prominent search across all data types with autocomplete  
3. **Dashboard-Centric Navigation**: Operational overview with quick access to common tasks
4. **Real-time Synchronization**: Live inventory updates between admin and reader apps
5. **Mobile-Responsive Admin**: Tablet-optimized for circulation desk operations
6. **Cross-Domain Authentication**: Independent login sessions with future session sharing

## Project Structure

```plaintext
apps/library-management/
├── docs/                               # Architecture documentation
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── (auth)/                    # Authentication group  
│   │   │   ├── login/                 # Cross-domain passwordless login
│   │   │   └── layout.tsx             # Auth layout with registration messaging
│   │   ├── (admin)/                   # Admin-protected routes
│   │   │   ├── dashboard/             # Main operational dashboard
│   │   │   ├── inventory/             # Ultra-simple book management
│   │   │   │   ├── page.tsx           # Basic book list (title, author, status)
│   │   │   │   ├── add/page.tsx       # Simple add book form
│   │   │   │   └── [id]/page.tsx      # Book details (post-MVP)
│   │   │   ├── members/               # Basic member management
│   │   │   │   ├── page.tsx           # Simple member list
│   │   │   │   ├── register/page.tsx  # Member registration form
│   │   │   │   └── [id]/page.tsx      # Member profile
│   │   │   ├── transactions/          # Ultra-simple checkout/return
│   │   │   │   ├── checkout/page.tsx  # One-click checkout interface
│   │   │   │   ├── return/page.tsx    # One-click return interface  
│   │   │   │   └── history/page.tsx   # Basic transaction log
│   │   │   └── settings/              # Library configuration (post-MVP)
│   │   ├── globals.css                # Global styles with admin theme
│   │   ├── layout.tsx                 # Root layout with providers
│   │   ├── loading.tsx                # Global loading states
│   │   └── not-found.tsx              # 404 handling
│   ├── components/                    # Shared React components
│   │   ├── ui/                        # shadcn/ui base components
│   │   │   ├── button.tsx             # Customized button component
│   │   │   ├── input.tsx              # Form input component
│   │   │   ├── table.tsx              # Data table component
│   │   │   ├── search.tsx             # Global search component
│   │   │   └── status-badge.tsx       # Available/checked-out indicators
│   │   ├── layout/                    # Layout components
│   │   │   ├── admin-header.tsx       # Header with library context + search
│   │   │   ├── admin-sidebar.tsx      # Navigation sidebar
│   │   │   ├── library-selector.tsx   # Multi-tenant library switching
│   │   │   └── breadcrumb.tsx         # Contextual navigation
│   │   ├── dashboard/                 # Dashboard-specific components
│   │   │   ├── quick-stats.tsx        # Basic library statistics
│   │   │   ├── recent-activity.tsx    # Latest transactions
│   │   │   └── quick-actions.tsx      # Common task shortcuts
│   │   ├── inventory/                 # Ultra-simple book components
│   │   │   ├── book-list.tsx          # Basic book table (title, author, status)
│   │   │   ├── add-book-form.tsx      # Simple add book form
│   │   │   ├── book-search.tsx        # Book search with real-time results
│   │   │   └── isbn-lookup.tsx        # Optional crawler integration
│   │   ├── members/                   # Basic member components  
│   │   │   ├── member-list.tsx        # Simple member table
│   │   │   ├── member-form.tsx        # Registration/edit form
│   │   │   └── member-search.tsx      # Member search functionality
│   │   ├── transactions/              # Ultra-simple checkout components
│   │   │   ├── checkout-form.tsx      # One-click checkout interface
│   │   │   ├── return-form.tsx        # One-click return interface
│   │   │   ├── transaction-log.tsx    # Basic history display
│   │   │   └── availability-sync.tsx  # Real-time status updates
│   │   └── providers/                 # Context providers
│   │       ├── admin-auth-provider.tsx # Authentication context
│   │       ├── query-provider.tsx     # React Query configuration
│   │       └── real-time-provider.tsx # Supabase subscriptions
│   ├── lib/                           # Core utilities and services
│   │   ├── auth/                      # Authentication logic
│   │   │   ├── admin-auth.ts          # Cross-domain auth validation
│   │   │   ├── permissions.ts         # Role-based access control
│   │   │   └── session-management.ts  # Independent session handling
│   │   ├── supabase/                  # Database integration
│   │   │   ├── client.ts              # Supabase client configuration
│   │   │   ├── admin-queries.ts       # Admin-specific database queries
│   │   │   ├── real-time.ts           # Subscription management
│   │   │   └── types.ts               # Generated database types
│   │   ├── services/                  # Business logic services
│   │   │   ├── inventory-service.ts   # Ultra-simple inventory operations
│   │   │   ├── member-service.ts      # Basic member management
│   │   │   ├── transaction-service.ts # Checkout/return operations
│   │   │   └── sync-service.ts        # Reader app synchronization
│   │   ├── validation/                # Form schemas
│   │   │   ├── book-schemas.ts        # Book validation (title, author, ISBN)
│   │   │   ├── member-schemas.ts      # Member validation (name, email)
│   │   │   └── transaction-schemas.ts # Transaction validation
│   │   ├── utils.ts                   # Common utilities
│   │   └── constants.ts               # Application constants
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-admin-permissions.ts   # Permission checking
│   │   ├── use-library-context.ts     # Multi-tenant library state
│   │   ├── use-real-time-inventory.ts # Live inventory updates
│   │   ├── use-global-search.ts       # Search across all data types
│   │   └── use-optimistic-updates.ts  # Instant UI feedback
│   ├── store/                         # Zustand state management
│   │   ├── admin-store.ts             # Global admin UI state
│   │   ├── library-store.ts           # Selected library context
│   │   ├── search-store.ts            # Global search state
│   │   └── notification-store.ts      # System notifications
│   └── types/                         # TypeScript definitions
│       ├── database.ts                # Generated Supabase types
│       ├── admin.ts                   # Admin-specific types
│       ├── forms.ts                   # Form validation types
│       └── api.ts                     # API contract types
├── public/                            # Static assets
├── package.json                       # Dependencies and scripts
├── tailwind.config.js                 # Tailwind with admin theme
├── next.config.js                     # Next.js configuration
└── tsconfig.json                      # TypeScript configuration
```

## Authentication Architecture

### Cross-Domain Passwordless Strategy

```typescript
// lib/auth/admin-auth.ts
export class AdminAuthService {
  private supabase = createClient()

  // Validate user exists from reader platform registration
  async validateUserFromReaderPlatform(email: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    return !!data
  }

  // Cross-domain login with existing account verification
  async signInWithExistingAccount(email: string): Promise<AuthResult> {
    // Verify user exists from reader platform
    const userExists = await this.validateUserFromReaderPlatform(email)
    
    if (!userExists) {
      throw new AuthError(
        'Please register first at ezlib.com before accessing library management'
      )
    }

    // Send passwordless OTP
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (error) throw new AuthError(error.message)
    
    return { success: true, message: 'Check your email for login code' }
  }

  // Verify admin access for specific library
  async requireAdminAccess(libraryId: string): Promise<AdminRole> {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new AuthError('Authentication required')
    }

    const { data: adminRole } = await this.supabase
      .from('lib_admins')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('library_id', libraryId)
      .eq('status', 'active')
      .single()

    if (!adminRole) {
      throw new AuthError('Library admin access required')
    }

    return adminRole
  }
}
```

### Role-Based Access Control

```typescript
// lib/auth/permissions.ts
export type AdminRole = 'owner' | 'manager' | 'librarian'
export type AdminPermission = 
  | 'manage_books' 
  | 'manage_members' 
  | 'process_transactions'
  | 'view_reports'
  | 'manage_settings'

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: ['manage_books', 'manage_members', 'process_transactions', 'view_reports', 'manage_settings'],
  manager: ['manage_books', 'manage_members', 'process_transactions', 'view_reports'],
  librarian: ['manage_books', 'manage_members', 'process_transactions']
}

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

// Hook for component-level permission checking
export function useAdminPermissions(libraryId: string) {
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const adminRole = await adminAuthService.requireAdminAccess(libraryId)
        setPermissions(ROLE_PERMISSIONS[adminRole.role])
      } catch (error) {
        setPermissions([])
      }
    }
    
    checkPermissions()
  }, [libraryId])
  
  return {
    permissions,
    hasPermission: (permission: AdminPermission) => permissions.includes(permission),
    canManageBooks: permissions.includes('manage_books'),
    canProcessTransactions: permissions.includes('process_transactions')
  }
}
```

## Ultra-Simple State Management

### Library Context Store

```typescript
// store/library-store.ts
interface LibraryState {
  selectedLibrary: Library | null
  availableLibraries: Library[]
  isLoading: boolean
  
  // Actions
  setSelectedLibrary: (library: Library) => void
  loadUserLibraries: (userId: string) => Promise<void>
  switchLibrary: (libraryId: string) => void
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  selectedLibrary: null,
  availableLibraries: [],
  isLoading: false,

  setSelectedLibrary: (library) => {
    set({ selectedLibrary: library })
    // Persist to localStorage for session continuity
    localStorage.setItem('selectedLibraryId', library.id)
  },

  loadUserLibraries: async (userId) => {
    set({ isLoading: true })
    try {
      const libraries = await adminService.getUserLibraries(userId)
      set({ availableLibraries: libraries, isLoading: false })
      
      // Auto-select first library if none selected
      if (!get().selectedLibrary && libraries.length > 0) {
        get().setSelectedLibrary(libraries[0])
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  switchLibrary: (libraryId) => {
    const library = get().availableLibraries.find(lib => lib.id === libraryId)
    if (library) {
      get().setSelectedLibrary(library)
      // Clear related queries when switching libraries
      queryClient.removeQueries(['inventory', 'members', 'transactions'])
    }
  }
}))
```

### Global Search Store

```typescript
// store/search-store.ts
interface SearchState {
  query: string
  isSearching: boolean
  results: {
    books: BookResult[]
    members: MemberResult[]
    transactions: TransactionResult[]
  }
  
  // Actions
  setQuery: (query: string) => void
  performGlobalSearch: (libraryId: string) => Promise<void>
  clearSearch: () => void
}

export const useSearchStore = create<SearchState>()((set, get) => ({
  query: '',
  isSearching: false,
  results: { books: [], members: [], transactions: [] },

  setQuery: (query) => set({ query }),

  performGlobalSearch: async (libraryId) => {
    const { query } = get()
    if (!query.trim()) return

    set({ isSearching: true })
    try {
      const [books, members, transactions] = await Promise.all([
        inventoryService.searchBooks(libraryId, query),
        memberService.searchMembers(libraryId, query),
        transactionService.searchTransactions(libraryId, query)
      ])

      set({
        results: { books, members, transactions },
        isSearching: false
      })
    } catch (error) {
      set({ isSearching: false })
      throw error
    }
  },

  clearSearch: () => set({ 
    query: '', 
    results: { books: [], members: [], transactions: [] } 
  })
}))
```

## Real-Time Synchronization Architecture

### Inventory Sync Service

```typescript
// lib/services/sync-service.ts
export class InventorySyncService {
  private supabase = createClient()
  private subscriptions: Map<string, RealtimeChannel> = new Map()

  // Subscribe to inventory changes for real-time updates
  subscribeToInventoryUpdates(libraryId: string, onUpdate: InventoryUpdateCallback) {
    const channel = this.supabase
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
          // Handle inventory status changes
          this.handleInventoryChange(payload, onUpdate)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'borrowing_transactions',
          filter: `library_id=eq.${libraryId}`
        },
        (payload) => {
          // Handle transaction updates that affect availability
          this.handleTransactionChange(payload, onUpdate)
        }
      )
      .subscribe()

    this.subscriptions.set(libraryId, channel)
    return () => this.unsubscribe(libraryId)
  }

  private handleInventoryChange(
    payload: RealtimePayload,
    onUpdate: InventoryUpdateCallback
  ) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'UPDATE':
        // Availability status changed
        if (newRecord.availability.status !== oldRecord.availability.status) {
          onUpdate({
            type: 'availability_changed',
            bookId: newRecord.book_edition_id,
            status: newRecord.availability.status,
            borrowerId: newRecord.availability.current_borrower_id
          })
        }
        break
        
      case 'INSERT':
        // New book added to inventory
        onUpdate({
          type: 'book_added',
          bookId: newRecord.book_edition_id,
          libraryId: newRecord.library_id
        })
        break
    }
  }

  // Sync inventory status with reader app
  async syncWithReaderApp(libraryId: string, bookId: string, status: InventoryStatus) {
    // Update book availability in shared database
    const { error } = await this.supabase
      .from('book_inventory')
      .update({
        availability: {
          ...status,
          last_updated: new Date().toISOString()
        }
      })
      .eq('library_id', libraryId)
      .eq('book_edition_id', bookId)

    if (error) {
      throw new SyncError(`Failed to sync inventory: ${error.message}`)
    }

    // Trigger real-time update to reader app
    await this.supabase
      .channel('reader-inventory-sync')
      .send({
        type: 'broadcast',
        event: 'inventory_updated',
        payload: { libraryId, bookId, status }
      })
  }
}
```

### Real-Time Hooks

```typescript
// hooks/use-real-time-inventory.ts
export function useRealTimeInventory(libraryId: string) {
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!libraryId) return

    const syncService = new InventorySyncService()
    
    const unsubscribe = syncService.subscribeToInventoryUpdates(
      libraryId,
      (update) => {
        // Optimistically update React Query cache
        switch (update.type) {
          case 'availability_changed':
            queryClient.setQueryData(
              ['inventory', libraryId],
              (oldData: BookInventory[]) => {
                return oldData?.map(book => 
                  book.book_edition_id === update.bookId
                    ? { ...book, availability: { ...book.availability, status: update.status } }
                    : book
                ) || []
              }
            )
            break
            
          case 'book_added':
            // Invalidate inventory query to refetch with new book
            queryClient.invalidateQueries(['inventory', libraryId])
            break
        }
        
        // Update connection status
        setConnectionStatus('connected')
      }
    )

    return unsubscribe
  }, [libraryId, queryClient])

  return { connectionStatus }
}
```

## Ultra-Simple Component Architecture

### Dashboard Component

```typescript
// components/dashboard/quick-stats.tsx
interface QuickStatsProps {
  libraryId: string
}

export function QuickStats({ libraryId }: QuickStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', libraryId],
    queryFn: () => dashboardService.getQuickStats(libraryId),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) return <QuickStatsSkeleton />

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard 
        title="Total Books" 
        value={stats?.totalBooks || 0}
        icon="📚"
      />
      <StatCard 
        title="Available" 
        value={stats?.availableBooks || 0}
        icon="✅"
        trend={stats?.availableTrend}
      />
      <StatCard 
        title="Checked Out" 
        value={stats?.checkedOutBooks || 0}
        icon="📖"
      />
      <StatCard 
        title="Active Members" 
        value={stats?.activeMembers || 0}
        icon="👥"
      />
    </div>
  )
}
```

### Ultra-Simple Book List

```typescript
// components/inventory/book-list.tsx
export function BookList({ libraryId }: { libraryId: string }) {
  const { data: books, isLoading } = useQuery({
    queryKey: ['inventory', libraryId],
    queryFn: () => inventoryService.getLibraryInventory(libraryId)
  })

  // Real-time updates
  useRealTimeInventory(libraryId)

  if (isLoading) return <BookListSkeleton />

  return (
    <div className="space-y-4">
      {/* Ultra-simple search */}
      <BookSearch libraryId={libraryId} />
      
      {/* Basic book table */}
      <div className="rounded-md border">
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
            {books?.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">
                  {book.book_edition.title}
                </TableCell>
                <TableCell>
                  {book.book_edition.general_book.canonical_title}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {book.book_edition.isbn_13}
                </TableCell>
                <TableCell>
                  <StatusBadge status={book.availability.status} />
                </TableCell>
                <TableCell>
                  <BookActions book={book} libraryId={libraryId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

### One-Click Checkout Form

```typescript
// components/transactions/checkout-form.tsx
export function CheckoutForm({ libraryId }: { libraryId: string }) {
  const [selectedBook, setSelectedBook] = useState<BookInventory | null>(null)
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null)
  
  const checkoutMutation = useMutation({
    mutationFn: (data: CheckoutData) => transactionService.processCheckout(data),
    onSuccess: () => {
      // Optimistic update - book immediately shows as checked out
      queryClient.invalidateQueries(['inventory', libraryId])
      // Clear form
      setSelectedBook(null)
      setSelectedMember(null)
      // Show success message
      toast.success('Book checked out successfully!')
    }
  })

  const handleQuickCheckout = () => {
    if (!selectedBook || !selectedMember) return

    checkoutMutation.mutate({
      libraryId,
      bookInventoryId: selectedBook.id,
      borrowerId: selectedMember.user_id,
      // Ultra-simple: no due date initially
      status: 'checked_out'
    })
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Checkout</h2>
      
      <div className="space-y-4">
        {/* Book Selection */}
        <div>
          <Label>Select Book</Label>
          <BookSelector
            libraryId={libraryId}
            onSelect={setSelectedBook}
            filterAvailable={true}
          />
        </div>

        {/* Member Selection */}
        <div>
          <Label>Select Member</Label>
          <MemberSelector
            libraryId={libraryId}
            onSelect={setSelectedMember}
          />
        </div>

        {/* One-Click Action */}
        <Button
          onClick={handleQuickCheckout}
          disabled={!selectedBook || !selectedMember || checkoutMutation.isLoading}
          className="w-full"
        >
          {checkoutMutation.isLoading ? 'Processing...' : 'Check Out Book'}
        </Button>
      </div>
    </Card>
  )
}
```

## Testing Strategy

### Component Testing Template

```typescript
// __tests__/components/inventory/book-list.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BookList } from '@/components/inventory/book-list'

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

// Mock Supabase
jest.mock('@/lib/supabase/client')

describe('BookList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders book list with ultra-simple columns', async () => {
    render(<BookList libraryId="test-library" />, { 
      wrapper: createTestWrapper() 
    })

    // Verify ultra-simple table headers
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Author')).toBeInTheDocument()
    expect(screen.getByText('ISBN')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    
    // Should NOT have complex columns in MVP
    expect(screen.queryByText('Due Date')).not.toBeInTheDocument()
    expect(screen.queryByText('Fine Amount')).not.toBeInTheDocument()
  })

  it('shows real-time availability updates', async () => {
    const mockBook = {
      id: '1',
      availability: { status: 'available' },
      book_edition: { title: 'Test Book', isbn_13: '1234567890123' }
    }

    render(<BookList libraryId="test-library" />, {
      wrapper: createTestWrapper()
    })

    // Simulate real-time update
    // (Implementation depends on real-time testing setup)
  })
})
```

## Environment Configuration

```bash
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=https://manage.ezlib.com
NEXT_PUBLIC_READER_APP_URL=https://ezlib.com

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cross-Domain Authentication
NEXT_PUBLIC_ENABLE_CROSS_DOMAIN_AUTH=true
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://manage.ezlib.com

# Book Crawler Integration
NEXT_PUBLIC_CRAWLER_API_URL=http://localhost:8000
CRAWLER_SERVICE_AUTH_SECRET=your-crawler-auth-secret

# Feature Flags (MVP Progression)
NEXT_PUBLIC_ENABLE_DUE_DATES=false
NEXT_PUBLIC_ENABLE_FINES=false  
NEXT_PUBLIC_ENABLE_HOLDS=false
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH=false

# Real-time Updates
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_REALTIME_RETRY_ATTEMPTS=3
```

## Development Workflow

### MVP Phase Commands

```bash
# Start development
npm run dev            # Port 3001 (different from reader app)

# Type checking with strict mode
npm run type-check

# Testing
npm run test           # Unit tests
npm run test:e2e       # Critical workflows only
npm run test:coverage  # Coverage reports

# Code quality
npm run lint           # ESLint + TypeScript
npm run format         # Prettier

# Database
supabase gen types typescript --local  # Regenerate types
```

### Critical Coding Standards

1. **Ultra-Simple First**: Start with basic functionality, no complex features
2. **Real-time by Default**: All inventory changes must sync immediately  
3. **Search-First Interface**: Every list component needs prominent search
4. **Mobile-Responsive Admin**: All interfaces must work on tablets
5. **Cross-Domain Auth**: Always validate user exists from reader platform
6. **Permission Checks**: Verify admin access before sensitive operations
7. **Optimistic Updates**: User actions should feel instant
8. **Error Boundaries**: Wrap all async operations with proper error handling
9. **Loading States**: Always provide visual feedback for async operations
10. **TypeScript Strict**: No `any` types, proper interface definitions

## Next Steps

### Immediate Technical Actions

1. **Authentication Flow Implementation**: Build cross-domain passwordless login
2. **Real-time Sync Setup**: Implement inventory synchronization with reader app
3. **Ultra-Simple Dashboard**: Create operational overview with basic statistics  
4. **Basic Book Management**: Implement title/author/status tracking only
5. **One-Click Operations**: Build checkout/return without due date complexity

### Post-MVP Enhancements

- Due date management and overdue tracking
- Advanced search and filtering capabilities
- Comprehensive reporting and analytics
- Bulk operations and data management
- Fine calculations and payment processing
- Multi-library network support

This architecture prioritizes **immediate operational value** through ultra-simple workflows while establishing the technical foundation for future enhancements. The focus is on replacing manual/spreadsheet systems with reliable digital tools that library staff can adopt confidently.