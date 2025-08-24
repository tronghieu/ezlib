# Library Management App - Frontend Architecture Document

<!-- Powered by BMAD™ Core -->

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-24 | 1.0 | Initial frontend architecture for Library Management App | BMad Orchestrator |

## Introduction

This document defines the frontend architecture for the **Library Management App** within the EzLib monorepo. This application serves as the administrative dashboard for library staff, providing tools to manage books, members, borrowing operations, and collections.

### Bounded Context
- **Domain**: Library Operations and Administration
- **Users**: Library staff (owners, managers, librarians)
- **Access**: `manage.ezlib.com` (subdomain-based routing)
- **Integration**: Direct Supabase connection with Row Level Security

## Frontend Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Framework | Next.js | 14+ | React framework with App Router | SSR support, optimal for admin dashboards, Vercel deployment |
| UI Library | shadcn/ui | Latest | Component library | Professional admin interface, customizable, accessibility |
| State Management | React Query + Zustand | Latest | Server state + client state | Optimal caching for admin operations, lightweight UI state |
| Routing | Next.js App Router | 14+ | File-based routing | Built-in, supports layouts and nested routes |
| Build Tool | Next.js built-in | 14+ | Webpack + SWC | Optimized for React, fast builds |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS | Consistent design, rapid development |
| Testing | Jest + Testing Library | Latest | Unit and integration tests | React-focused testing |
| Component Library | Radix UI | Latest | Unstyled components | Accessibility foundation for shadcn/ui |
| Form Handling | React Hook Form + Zod | Latest | Type-safe forms | Performance, validation schema |
| Animation | Framer Motion | Latest | UI animations | Smooth transitions for admin workflows |
| Dev Tools | TypeScript + ESLint | Latest | Development tooling | Type safety, code quality |

## Project Structure

```plaintext
apps/library-management/
├── docs/                               # Documentation
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── (auth)/                    # Authentication group
│   │   │   ├── login/                 # Login page
│   │   │   └── layout.tsx             # Auth layout
│   │   ├── dashboard/                 # Main dashboard
│   │   │   ├── page.tsx              # Dashboard page
│   │   │   └── components/           # Dashboard components
│   │   ├── inventory/                # Book management
│   │   │   ├── page.tsx              # Inventory list
│   │   │   ├── add/page.tsx          # Add book form
│   │   │   ├── [id]/page.tsx         # Book details
│   │   │   └── components/           # Inventory components
│   │   ├── members/                  # Member management
│   │   │   ├── page.tsx              # Members list
│   │   │   ├── [id]/page.tsx         # Member details
│   │   │   └── components/           # Member components
│   │   ├── transactions/             # Borrowing operations
│   │   │   ├── page.tsx              # Transaction list
│   │   │   ├── [id]/page.tsx         # Transaction details
│   │   │   └── components/           # Transaction components
│   │   ├── collections/              # Collection management
│   │   ├── analytics/                # Reports and insights
│   │   ├── settings/                 # Library configuration
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── loading.tsx               # Global loading UI
│   ├── components/                    # Shared React components
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx            # Button component
│   │   │   ├── input.tsx             # Input component
│   │   │   ├── table.tsx             # Table component
│   │   │   └── index.ts              # Component exports
│   │   ├── data-tables/              # Complex table components
│   │   │   ├── data-table.tsx        # Reusable data table
│   │   │   └── columns/              # Table column definitions
│   │   ├── forms/                    # Form components
│   │   │   ├── add-book-form.tsx     # Add book form
│   │   │   └── member-form.tsx       # Member form
│   │   ├── charts/                   # Analytics visualization
│   │   └── layout/                   # Layout components
│   │       ├── header.tsx            # Admin header
│   │       ├── sidebar.tsx           # Navigation sidebar
│   │       └── breadcrumb.tsx        # Breadcrumb navigation
│   ├── lib/                          # Utility functions and configurations
│   │   ├── supabase/                 # Database client
│   │   │   ├── client.ts             # Supabase client setup
│   │   │   ├── admin-queries.ts      # Admin-specific queries
│   │   │   └── types.ts              # Database types
│   │   ├── auth/                     # Authentication logic
│   │   │   ├── admin-auth.ts         # Admin authentication
│   │   │   └── permissions.ts        # Permission checking
│   │   ├── services/                 # Service integrations
│   │   │   ├── inventory-service.ts  # Inventory operations
│   │   │   ├── transaction-service.ts # Transaction operations
│   │   │   └── crawler-integration.ts # Crawler service
│   │   ├── validation/               # Form and data validation
│   │   │   ├── schemas.ts            # Zod schemas
│   │   │   └── inventory-schemas.ts  # Inventory validation
│   │   ├── utils.ts                  # Common utilities
│   │   └── constants.ts              # Application constants
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-admin-permissions.ts  # Permission hook
│   │   ├── use-real-time-updates.ts  # Real-time subscriptions
│   │   └── use-optimistic-updates.ts # Optimistic updates
│   ├── store/                        # Zustand stores
│   │   ├── admin-store.ts            # Admin UI state
│   │   └── filter-store.ts           # Filter state
│   └── types/                        # TypeScript type definitions
│       ├── database.ts               # Generated Supabase types
│       ├── admin.ts                  # Admin-specific types
│       └── forms.ts                  # Form types
├── public/                           # Static assets
├── package.json                      # Dependencies
├── tailwind.config.js               # Tailwind configuration
├── next.config.js                   # Next.js configuration
└── tsconfig.json                    # TypeScript configuration
```

## Component Standards

### Component Template

```typescript
'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  children?: React.ReactNode
  // Add specific props here
}

const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "base-styles-here",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Component.displayName = "Component"

export { Component }
export type { ComponentProps }
```

### Naming Conventions

- **Components**: PascalCase (`AdminHeader`, `InventoryTable`)
- **Files**: kebab-case (`admin-header.tsx`, `inventory-table.tsx`)
- **Directories**: kebab-case (`data-tables`, `form-components`)
- **Hooks**: camelCase starting with "use" (`useAdminPermissions`)
- **Services**: PascalCase classes (`InventoryService`)
- **Types**: PascalCase (`AdminUser`, `BookInventory`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_BOOKS_PER_PAGE`)

## State Management

### Store Structure

```plaintext
src/store/
├── admin-store.ts          # Main admin UI state
├── filter-store.ts         # Filter and search state
└── notification-store.ts   # Notification state
```

### State Management Template

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AdminState {
  selectedLibrary: string | null
  activeView: 'dashboard' | 'inventory' | 'members' | 'transactions'
  filters: {
    inventory: InventoryFilters
    members: MemberFilters
    transactions: TransactionFilters
  }
  // Actions
  setSelectedLibrary: (id: string) => void
  setActiveView: (view: AdminState['activeView']) => void
  updateFilters: <T extends keyof AdminState['filters']>(
    category: T, 
    filters: Partial<AdminState['filters'][T]>
  ) => void
  resetFilters: () => void
}

export const useAdminStore = create<AdminState>()(
  devtools(
    (set, get) => ({
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
        })),
        
      resetFilters: () => set({
        filters: { inventory: {}, members: {}, transactions: {} }
      })
    }),
    { name: 'admin-store' }
  )
)

// Selector hooks for performance
export const useSelectedLibrary = () => useAdminStore(state => state.selectedLibrary)
export const useActiveView = () => useAdminStore(state => state.activeView)
export const useInventoryFilters = () => useAdminStore(state => state.filters.inventory)
```

## API Integration

### Service Template

```typescript
import { createAdminClient } from '@/lib/supabase/client'
import { AdminError, InventoryError } from '@/lib/errors'
import type { BookInventory, AddBookInventoryData } from '@/types/admin'

export class InventoryService {
  private client = createAdminClient()

  async addBookToInventory(data: AddBookInventoryData): Promise<BookInventory> {
    try {
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
    } catch (error) {
      if (error instanceof AdminError) throw error
      throw new InventoryError('Failed to add book to inventory')
    }
  }

  async searchInventory(
    libraryId: string, 
    query: string
  ): Promise<BookInventoryWithDetails[]> {
    try {
      const { data, error } = await this.client.admin
        .getLibraryInventory(libraryId)
        .or(`
          book_edition.title.ilike.%${query}%,
          book_edition.isbn_13.ilike.%${query}%,
          book_edition.general_book.canonical_title.ilike.%${query}%
        `)

      if (error) throw new InventoryError(error.message)
      return data || []
    } catch (error) {
      if (error instanceof AdminError) throw error
      throw new InventoryError('Failed to search inventory')
    }
  }
}

export const inventoryService = new InventoryService()
```

### API Client Configuration

```typescript
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

// Admin-specific client with enhanced queries
export const createAdminClient = () => {
  const client = createClient()
  
  return {
    ...client,
    admin: {
      getLibraryInventory: (libraryId: string) =>
        client.from('book_inventory')
          .select(`
            *,
            book_edition:book_editions!inner(
              id, title, subtitle, isbn_13, language,
              edition_metadata,
              general_book:general_books!inner(
                id, canonical_title, first_publication_year, subjects
              )
            )
          `)
          .eq('library_id', libraryId),
      
      getLibraryMembers: (libraryId: string) =>
        client.from('lib_readers')
          .select(`
            *, user:users!inner(id, display_name, email, avatar_url)
          `)
          .eq('library_id', libraryId)
          .eq('state', 'active'),
      
      getPendingTransactions: (libraryId: string) =>
        client.from('borrowing_transactions')
          .select(`
            *,
            book_inventory!inner(*,
              book_edition:book_editions!inner(
                title, general_book:general_books!inner(canonical_title)
              )
            ),
            borrower:users!inner(display_name, email)
          `)
          .eq('library_id', libraryId)
          .in('status', ['requested', 'approved'])
    }
  }
}
```

## Routing

### Route Configuration

```typescript
// app/layout.tsx
import { AdminAuthProvider } from '@/components/providers/admin-auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AdminErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AdminErrorBoundary>
          <AdminAuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AdminAuthProvider>
        </AdminErrorBoundary>
      </body>
    </html>
  )
}

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

## Styling Guidelines

### Styling Approach

The application uses **Tailwind CSS** with **shadcn/ui** components for a professional administrative interface. This combination provides:

- Consistent design system
- Accessibility by default
- Customizable components
- Utility-first approach for rapid development

### Global Theme Variables

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    
    /* Admin-specific colors */
    --admin-sidebar: 220 14.3% 95.9%;
    --admin-header: 0 0% 100%;
    --admin-nav: 220 14.3% 95.9%;
    --success: 142.1 76.2% 36.3%;
    --warning: 47.9 95.8% 53.1%;
    --info: 221.2 83.2% 53.3%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* Add dark theme variables */
  }
  
  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }
  
  h1 { @apply text-2xl; }
  h2 { @apply text-xl; }
  h3 { @apply text-lg; }
}

@layer utilities {
  .admin-container {
    @apply container mx-auto px-4 sm:px-6 lg:px-8;
  }
  
  .admin-card {
    @apply rounded-lg border bg-card text-card-foreground shadow-sm;
  }
  
  .admin-button {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50;
  }
}
```

## Testing Requirements

### Component Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminAuthProvider } from '@/components/providers/admin-auth-provider'
import { InventoryTable } from '@/components/inventory/inventory-table'

// Test wrapper with providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </QueryClientProvider>
  )
}

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createAdminClient: () => ({
    admin: {
      getLibraryInventory: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    }
  })
}))

describe('InventoryTable', () => {
  const mockLibraryId = 'test-library-id'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders inventory table correctly', async () => {
    render(
      <InventoryTable libraryId={mockLibraryId} />,
      { wrapper: createTestWrapper() }
    )
    
    expect(screen.getByRole('table')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Loading...')).not.toBeInTheDocument()
    })
  })
  
  it('handles add book interaction', async () => {
    const mockAddBook = jest.fn()
    
    render(
      <InventoryTable 
        libraryId={mockLibraryId} 
        onAddBook={mockAddBook}
      />,
      { wrapper: createTestWrapper() }
    )
    
    const addButton = screen.getByRole('button', { name: /add book/i })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New Book')).toBeInTheDocument()
    })
  })
})
```

### Testing Best Practices

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and data flow
3. **E2E Tests**: Test critical admin workflows using Playwright
4. **Coverage Goals**: Aim for 80% code coverage on business logic
5. **Test Structure**: Use Arrange-Act-Assert pattern consistently
6. **Mock External Dependencies**: Always mock Supabase client, external APIs
7. **Test User Interactions**: Focus on real user workflows, not implementation details
8. **Snapshot Testing**: Use sparingly, only for stable UI components

## Environment Configuration

Required environment variables for the Library Management App:

```bash
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=https://manage.ezlib.com
NEXT_PUBLIC_VERCEL_URL=manage.ezlib.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Book Crawler Service
NEXT_PUBLIC_CRAWLER_API_URL=http://localhost:8000
CRAWLER_SERVICE_AUTH_SECRET=your-crawler-auth-secret

# Analytics and Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=library-management

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_DEBUG_MODE=false
```

## Frontend Developer Standards

### Critical Coding Rules

1. **Always use TypeScript**: No `any` types, proper interface definitions
2. **Component Structure**: Use forwardRef for reusable components
3. **Error Boundaries**: Wrap async operations with proper error handling
4. **Loading States**: Always provide loading UI for async operations
5. **Optimistic Updates**: Use for user actions that should feel instant
6. **Real-time Updates**: Subscribe only to necessary data changes
7. **Form Validation**: Use Zod schemas for all form validation
8. **Permission Checks**: Verify admin permissions before sensitive operations
9. **Mobile Responsive**: All admin interfaces must work on tablets
10. **Accessibility**: Use semantic HTML, proper ARIA labels

### Quick Reference

**Common Commands:**
```bash
npm run dev          # Start development server (port 3001)
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

**Key Import Patterns:**
```typescript
// Components
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-tables/data-table'

// Hooks and Services
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { inventoryService } from '@/lib/services/inventory-service'

// Types
import type { BookInventory } from '@/types/admin'
import type { Database } from '@/types/database'

// Utils
import { cn } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/client'
```

**File Naming Conventions:**
- Components: `kebab-case.tsx` (admin-header.tsx)
- Pages: `page.tsx`, `layout.tsx`, `loading.tsx`
- Hooks: `use-kebab-case.ts` (use-admin-permissions.ts)
- Services: `kebab-case-service.ts` (inventory-service.ts)
- Types: `kebab-case.ts` (admin-types.ts)

**Project-Specific Patterns:**
- Always check admin permissions before rendering sensitive UI
- Use React Query for all server state management
- Implement optimistic updates for user actions
- Subscribe to real-time updates for operational data
- Use Zod schemas for form validation and API contracts