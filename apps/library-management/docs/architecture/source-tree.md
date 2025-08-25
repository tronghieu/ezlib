# Library Management App - Source Tree

<!-- Powered by BMAD™ Core -->

## Overview

This document provides a comprehensive guide to the **EzLib Library Management System** source code organization, following the **ultra-simple MVP approach** with clear separation between core functionality and post-MVP enhancements.

## Project Root Structure

```plaintext
apps/library-management/
├── docs/                               # 📚 Documentation
│   ├── architecture/                   # Architecture documentation
│   │   ├── coding-standards.md         # Development standards
│   │   ├── tech-stack.md               # Technology decisions
│   │   └── source-tree.md              # This file
│   ├── prd/                            # Product requirements
│   ├── frontend-architecture.md        # Frontend architecture
│   ├── project-brief.md                # Project overview
│   └── prd.md                          # Product requirements document
├── src/                                # 🚀 Source code
├── public/                             # 🌐 Static assets  
├── tests/                              # 🧪 Test files
├── package.json                        # 📦 Dependencies & scripts
├── next.config.js                      # ⚙️ Next.js configuration
├── tailwind.config.js                  # 🎨 Tailwind configuration
├── tsconfig.json                       # 📘 TypeScript configuration
├── .env.local                          # 🔐 Environment variables (gitignored)
├── .env.example                        # 📝 Environment template
├── .eslintrc.js                        # 📏 ESLint configuration
├── .prettierrc                         # ✨ Prettier configuration
├── jest.config.js                      # 🧪 Jest test configuration
├── playwright.config.ts                # 🎭 E2E test configuration
└── README.md                           # 📖 Project documentation
```

## Source Code Structure (`src/`)

```plaintext
src/
├── app/                                # 🏗️ Next.js 14 App Router
│   ├── (auth)/                         # 🔐 Authentication group
│   │   ├── login/                      # Cross-domain login page
│   │   │   ├── page.tsx                # Login form with OTP
│   │   │   └── components/             # Login-specific components
│   │   ├── callback/                   # Auth callback handler
│   │   │   └── page.tsx                # OTP verification
│   │   └── layout.tsx                  # Auth layout with messaging
│   ├── (admin)/                        # 👥 Admin-protected routes
│   │   ├── dashboard/                  # 📊 Main operational dashboard
│   │   │   ├── page.tsx                # Dashboard overview
│   │   │   └── components/             # Dashboard components
│   │   │       ├── quick-stats.tsx     # Basic library statistics
│   │   │       ├── recent-activity.tsx # Latest transactions
│   │   │       └── quick-actions.tsx   # Common task shortcuts
│   │   ├── inventory/                  # 📚 Ultra-simple book management
│   │   │   ├── page.tsx                # Basic book list (title, author, status)
│   │   │   ├── add/                    # Add book workflow
│   │   │   │   └── page.tsx            # Simple add book form
│   │   │   ├── [id]/                   # Individual book management
│   │   │   │   ├── page.tsx            # Book details (post-MVP)
│   │   │   │   └── edit/               # Edit book information
│   │   │   │       └── page.tsx        # Edit form
│   │   │   └── components/             # Inventory components
│   │   │       ├── book-list.tsx       # Basic book table
│   │   │       ├── add-book-form.tsx   # Simple add book form
│   │   │       ├── book-search.tsx     # Real-time book search
│   │   │       ├── isbn-lookup.tsx     # Crawler service integration
│   │   │       └── book-actions.tsx    # Quick action buttons
│   │   ├── members/                    # 👥 Basic member management
│   │   │   ├── page.tsx                # Simple member list
│   │   │   ├── register/               # Member registration
│   │   │   │   └── page.tsx            # Registration form
│   │   │   ├── [id]/                   # Individual member management
│   │   │   │   ├── page.tsx            # Member profile
│   │   │   │   └── edit/               # Edit member info
│   │   │   │       └── page.tsx        # Edit form
│   │   │   └── components/             # Member components
│   │   │       ├── member-list.tsx     # Simple member table
│   │   │       ├── member-form.tsx     # Registration/edit form
│   │   │       ├── member-search.tsx   # Member search functionality
│   │   │       └── member-actions.tsx  # Quick action buttons
│   │   ├── transactions/               # 📖 Ultra-simple checkout/return
│   │   │   ├── checkout/               # Checkout workflow
│   │   │   │   └── page.tsx            # One-click checkout interface
│   │   │   ├── return/                 # Return workflow
│   │   │   │   └── page.tsx            # One-click return interface
│   │   │   ├── history/                # Transaction history
│   │   │   │   └── page.tsx            # Basic transaction log
│   │   │   └── components/             # Transaction components
│   │   │       ├── checkout-form.tsx   # One-click checkout
│   │   │       ├── return-form.tsx     # One-click return
│   │   │       ├── transaction-log.tsx # Basic history display
│   │   │       └── availability-sync.tsx # Real-time status updates
│   │   ├── reports/                    # 📈 Basic reporting (post-MVP)
│   │   │   ├── page.tsx                # Report dashboard
│   │   │   ├── circulation/            # Circulation reports
│   │   │   │   └── page.tsx            # Circulation statistics
│   │   │   └── components/             # Report components
│   │   │       ├── report-filters.tsx  # Date/type filters
│   │   │       └── report-charts.tsx   # Basic charts
│   │   ├── settings/                   # ⚙️ Library configuration (post-MVP)
│   │   │   ├── page.tsx                # Settings overview
│   │   │   ├── library/                # Library settings
│   │   │   │   └── page.tsx            # Library configuration
│   │   │   ├── staff/                  # Staff management
│   │   │   │   └── page.tsx            # Staff accounts
│   │   │   └── components/             # Settings components
│   │   └── layout.tsx                  # Admin layout with sidebar
│   ├── api/                            # 🔗 API routes (minimal)
│   │   ├── health/                     # Health check endpoint
│   │   │   └── route.ts                # System status
│   │   ├── auth/                       # Authentication APIs
│   │   │   ├── callback/               # Auth callback
│   │   │   │   └── route.ts            # Handle OTP verification
│   │   │   └── validate/               # User validation
│   │   │       └── route.ts            # Check reader platform registration
│   │   └── sync/                       # Real-time sync endpoints
│   │       └── inventory/              # Inventory sync
│   │           └── route.ts            # Handle inventory updates
│   ├── globals.css                     # 🎨 Global styles with admin theme
│   ├── layout.tsx                      # 🏠 Root layout with providers
│   ├── loading.tsx                     # ⏳ Global loading states
│   ├── not-found.tsx                   # ❌ 404 handling
│   └── error.tsx                       # 🚨 Global error boundary
```

## Components Structure (`src/components/`)

```plaintext
src/components/
├── ui/                                 # 🎨 shadcn/ui base components
│   ├── button.tsx                      # Customized button component
│   ├── input.tsx                       # Form input component
│   ├── table.tsx                       # Data table component
│   ├── card.tsx                        # Card container component
│   ├── dialog.tsx                      # Modal dialog component
│   ├── dropdown-menu.tsx               # Dropdown menu component
│   ├── label.tsx                       # Form label component
│   ├── toast.tsx                       # Notification toast component
│   ├── search.tsx                      # Global search component
│   ├── status-badge.tsx                # Available/checked-out indicators
│   ├── skeleton.tsx                    # Loading skeleton component
│   └── index.ts                        # Component exports
├── layout/                             # 🏗️ Layout components
│   ├── admin-header.tsx                # Header with library context + search
│   ├── admin-sidebar.tsx               # Navigation sidebar
│   ├── library-selector.tsx            # Multi-tenant library switching
│   ├── breadcrumb.tsx                  # Contextual navigation
│   ├── page-header.tsx                 # Consistent page headers
│   └── footer.tsx                      # Admin footer
├── dashboard/                          # 📊 Dashboard-specific components
│   ├── quick-stats.tsx                 # Basic library statistics
│   ├── recent-activity.tsx             # Latest transactions
│   ├── quick-actions.tsx               # Common task shortcuts
│   ├── library-overview.tsx            # Library information card
│   └── dashboard-skeleton.tsx          # Loading state for dashboard
├── inventory/                          # 📚 Ultra-simple book components
│   ├── book-list.tsx                   # Basic book table (title, author, status)
│   ├── book-list-skeleton.tsx          # Loading state for book list
│   ├── add-book-form.tsx               # Simple add book form
│   ├── edit-book-form.tsx              # Book editing form (post-MVP)
│   ├── book-search.tsx                 # Book search with real-time results
│   ├── book-filters.tsx                # Basic filtering (post-MVP)
│   ├── book-actions.tsx                # Quick action buttons
│   ├── book-selector.tsx               # Book selection component
│   ├── isbn-lookup.tsx                 # Optional crawler integration
│   ├── book-details.tsx                # Book information display (post-MVP)
│   └── bulk-operations.tsx             # Bulk book operations (post-MVP)
├── members/                            # 👥 Basic member components
│   ├── member-list.tsx                 # Simple member table
│   ├── member-list-skeleton.tsx        # Loading state for member list
│   ├── member-form.tsx                 # Registration/edit form
│   ├── member-search.tsx               # Member search functionality
│   ├── member-actions.tsx              # Quick action buttons
│   ├── member-selector.tsx             # Member selection component
│   ├── member-details.tsx              # Member information display
│   └── member-profile.tsx              # Detailed member profile (post-MVP)
├── transactions/                       # 📖 Ultra-simple checkout components
│   ├── checkout-form.tsx               # One-click checkout interface
│   ├── return-form.tsx                 # One-click return interface
│   ├── transaction-log.tsx             # Basic history display
│   ├── transaction-item.tsx            # Individual transaction display
│   ├── availability-sync.tsx           # Real-time status updates
│   ├── quick-checkout.tsx              # Simplified checkout widget
│   └── transaction-filters.tsx         # Basic filtering (post-MVP)
├── forms/                              # 📝 Reusable form components
│   ├── form-field.tsx                  # Standardized form field wrapper
│   ├── form-section.tsx                # Form section with heading
│   ├── form-actions.tsx                # Form button group
│   ├── search-input.tsx                # Searchable input component
│   ├── date-picker.tsx                 # Date selection component
│   └── multi-select.tsx                # Multiple selection component
├── data-tables/                        # 📋 Advanced table components
│   ├── data-table.tsx                  # Reusable data table with sorting
│   ├── data-table-toolbar.tsx          # Table filtering toolbar
│   ├── data-table-pagination.tsx       # Pagination controls
│   ├── columns/                        # Column definitions
│   │   ├── book-columns.tsx            # Book table columns
│   │   ├── member-columns.tsx          # Member table columns
│   │   └── transaction-columns.tsx     # Transaction table columns
│   └── cells/                          # Custom cell components
│       ├── status-cell.tsx             # Status display cell
│       ├── actions-cell.tsx            # Action buttons cell
│       └── date-cell.tsx               # Date formatting cell
├── charts/                             # 📈 Analytics visualization (post-MVP)
│   ├── circulation-chart.tsx           # Book circulation trends
│   ├── member-activity-chart.tsx       # Member engagement metrics
│   ├── collection-overview.tsx         # Collection composition
│   └── chart-skeleton.tsx              # Loading state for charts
├── providers/                          # 🔧 Context providers
│   ├── admin-auth-provider.tsx         # Authentication context
│   ├── query-provider.tsx              # React Query configuration
│   ├── real-time-provider.tsx          # Supabase subscriptions
│   ├── library-context-provider.tsx    # Library selection context
│   └── theme-provider.tsx              # Theme management
├── error/                              # 🚨 Error handling components
│   ├── error-boundary.tsx              # React error boundary
│   ├── error-state.tsx                 # Error display component
│   ├── not-found.tsx                   # 404 state component
│   └── empty-state.tsx                 # Empty data state
└── common/                             # 🔧 Common utilities
    ├── loading-spinner.tsx             # Loading indicator
    ├── confirmation-dialog.tsx         # Confirmation modal
    ├── page-loading.tsx                # Full page loading state
    ├── copy-button.tsx                 # Copy to clipboard button
    └── auto-save-indicator.tsx         # Auto-save status indicator
```

## Library Structure (`src/lib/`)

```plaintext
src/lib/
├── auth/                               # 🔐 Authentication logic
│   ├── admin-auth.ts                   # Cross-domain auth validation
│   ├── permissions.ts                  # Role-based access control
│   ├── session-management.ts           # Independent session handling
│   └── middleware.ts                   # Auth middleware for routes
├── supabase/                           # 🗄️ Database integration
│   ├── client.ts                       # Supabase client configuration
│   ├── admin-client.ts                 # Admin-specific client wrapper
│   ├── admin-queries.ts                # Admin-specific database queries
│   ├── real-time.ts                    # Subscription management
│   ├── migrations.ts                   # Database migration helpers
│   └── types.ts                        # Generated database types
├── services/                           # 🔧 Business logic services
│   ├── inventory-service.ts            # Ultra-simple inventory operations
│   ├── member-service.ts               # Basic member management
│   ├── transaction-service.ts          # Checkout/return operations
│   ├── sync-service.ts                 # Reader app synchronization
│   ├── dashboard-service.ts            # Dashboard statistics
│   ├── search-service.ts               # Global search functionality
│   └── crawler-service.ts              # Book metadata enrichment
├── validation/                         # ✅ Form and data validation
│   ├── schemas.ts                      # Common Zod schemas
│   ├── book-schemas.ts                 # Book validation (title, author, ISBN)
│   ├── member-schemas.ts               # Member validation (name, email)
│   ├── transaction-schemas.ts          # Transaction validation
│   └── auth-schemas.ts                 # Authentication validation
├── utils/                              # 🛠️ Utility functions
│   ├── index.ts                        # Main utils export (cn, etc.)
│   ├── date-utils.ts                   # Date formatting and manipulation
│   ├── search-utils.ts                 # Search and filtering helpers
│   ├── format-utils.ts                 # Data formatting utilities
│   ├── validation-utils.ts             # Validation helpers
│   └── api-utils.ts                    # API request utilities
├── errors/                             # 🚨 Custom error classes
│   ├── inventory-errors.ts             # Inventory-specific errors
│   ├── auth-errors.ts                  # Authentication errors
│   ├── sync-errors.ts                  # Real-time sync errors
│   └── base-errors.ts                  # Base error classes
├── constants/                          # 📋 Application constants
│   ├── index.ts                        # Main constants export
│   ├── permissions.ts                  # Permission definitions
│   ├── status-values.ts                # Book and member status values
│   ├── routes.ts                       # Application route constants
│   └── feature-flags.ts                # MVP progression flags
└── config/                             # ⚙️ Configuration files
    ├── database.ts                     # Database configuration
    ├── auth.ts                         # Authentication configuration
    ├── api.ts                          # API configuration
    └── features.ts                     # Feature flag configuration
```

## Hooks Structure (`src/hooks/`)

```plaintext
src/hooks/
├── auth/                               # 🔐 Authentication hooks
│   ├── use-admin-permissions.ts        # Permission checking
│   ├── use-admin-auth.ts               # Authentication state
│   └── use-session-management.ts       # Session handling
├── data/                               # 📊 Data fetching hooks
│   ├── use-library-inventory.ts        # Inventory data with real-time
│   ├── use-library-members.ts          # Member data with real-time
│   ├── use-transaction-history.ts      # Transaction data
│   ├── use-dashboard-stats.ts          # Dashboard statistics
│   └── use-global-search.ts            # Cross-entity search
├── real-time/                          # ⚡ Real-time update hooks
│   ├── use-real-time-inventory.ts      # Live inventory updates
│   ├── use-real-time-transactions.ts   # Live transaction updates
│   └── use-connection-status.ts        # Real-time connection status
├── forms/                              # 📝 Form management hooks
│   ├── use-book-form.ts                # Book form state and validation
│   ├── use-member-form.ts              # Member form state and validation
│   ├── use-checkout-form.ts            # Checkout form state
│   └── use-form-auto-save.ts           # Auto-save form data
├── ui/                                 # 🎨 UI state hooks
│   ├── use-library-context.ts          # Multi-tenant library state
│   ├── use-search-state.ts             # Global search state
│   ├── use-filter-state.ts             # Filtering state management
│   ├── use-modal-state.ts              # Modal open/close state
│   └── use-toast-notifications.ts      # Toast notification management
└── utils/                              # 🛠️ Utility hooks
    ├── use-optimistic-updates.ts       # Instant UI feedback
    ├── use-debounced-value.ts          # Debounced input handling
    ├── use-local-storage.ts            # Local storage persistence
    ├── use-media-query.ts              # Responsive design helpers
    └── use-copy-to-clipboard.ts        # Clipboard functionality
```

## Store Structure (`src/store/`)

```plaintext
src/store/
├── admin-store.ts                      # 👥 Global admin UI state
├── library-store.ts                    # 🏢 Selected library context
├── search-store.ts                     # 🔍 Global search state
├── notification-store.ts               # 🔔 System notifications
├── filter-store.ts                     # 🔧 Filter and sorting state
└── ui-store.ts                         # 🎨 General UI state (modals, etc.)
```

## Types Structure (`src/types/`)

```plaintext
src/types/
├── database.ts                         # 🗄️ Generated Supabase types
├── admin.ts                            # 👥 Admin-specific types
├── forms.ts                            # 📝 Form validation types
├── api.ts                              # 🔗 API contract types
├── auth.ts                             # 🔐 Authentication types
├── inventory.ts                        # 📚 Book inventory types
├── members.ts                          # 👤 Library member types
├── transactions.ts                     # 📖 Transaction types
├── search.ts                           # 🔍 Search-related types
└── common.ts                           # 🔧 Common utility types
```

## Test Structure (`tests/`)

```plaintext
tests/
├── components/                         # 🧪 Component tests
│   ├── inventory/                      # Book component tests
│   ├── members/                        # Member component tests
│   ├── transactions/                   # Transaction component tests
│   └── ui/                             # UI component tests
├── hooks/                              # 🪝 Hook tests
│   ├── auth/                           # Auth hook tests
│   ├── data/                           # Data fetching hook tests
│   └── real-time/                      # Real-time hook tests
├── services/                           # 🔧 Service tests
│   ├── inventory-service.test.ts       # Inventory service tests
│   ├── member-service.test.ts          # Member service tests
│   └── transaction-service.test.ts     # Transaction service tests
├── utils/                              # 🛠️ Utility tests
├── e2e/                                # 🎭 End-to-end tests
│   ├── auth/                           # Authentication flows
│   ├── inventory/                      # Book management workflows
│   ├── transactions/                   # Checkout/return workflows
│   └── search/                         # Search functionality
├── fixtures/                           # 🗂️ Test data fixtures
│   ├── books.ts                        # Mock book data
│   ├── members.ts                      # Mock member data
│   └── transactions.ts                 # Mock transaction data
├── mocks/                              # 🎭 Service mocks
│   ├── supabase.ts                     # Supabase client mock
│   ├── next-auth.ts                    # NextAuth mock
│   └── msw/                            # API mocks
│       ├── handlers.ts                 # MSW request handlers
│       └── server.ts                   # MSW server setup
└── utils/                              # 🔧 Test utilities
    ├── test-wrapper.tsx                # Provider wrapper for tests
    ├── mock-data.ts                    # Mock data generators
    └── test-helpers.ts                 # Common test helpers
```

## Configuration Files

### Package Configuration

```json
// package.json
{
  "name": "ezlib-library-management",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:generate-types": "supabase gen types typescript --local > src/types/database.ts"
  }
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Admin theme colors
        'admin-sidebar': 'hsl(var(--admin-sidebar))',
        'admin-header': 'hsl(var(--admin-header))',
        'admin-nav': 'hsl(var(--admin-nav))',
      }
    }
  }
}
```

## File Naming Conventions

### Component Files
- **Components**: `kebab-case.tsx` (e.g., `book-list.tsx`, `member-form.tsx`)
- **Pages**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **API Routes**: `route.ts`

### Utility Files
- **Hooks**: `use-kebab-case.ts` (e.g., `use-admin-permissions.ts`)
- **Services**: `kebab-case-service.ts` (e.g., `inventory-service.ts`)
- **Utils**: `kebab-case-utils.ts` (e.g., `date-utils.ts`)
- **Types**: `kebab-case.ts` (e.g., `admin-types.ts`)

### Directory Names
- **All directories**: `kebab-case` (e.g., `data-tables`, `real-time`)
- **Route groups**: `(group-name)` (e.g., `(auth)`, `(admin)`)

## Import Path Structure

### Absolute Imports (Preferred)
```typescript
// ✅ Good: Use absolute imports
import { Button } from '@/components/ui/button'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { inventoryService } from '@/lib/services/inventory-service'
import type { BookInventory } from '@/types/admin'
```

### Relative Imports (Avoid)
```typescript
// ❌ Bad: Avoid relative imports
import { Button } from '../../../components/ui/button'
import { useAdminPermissions } from '../../hooks/use-admin-permissions'
```

## Development Workflow

### Adding New Features

1. **Create Types**: Define TypeScript interfaces in `src/types/`
2. **Create Service**: Add business logic in `src/lib/services/`
3. **Create Components**: Build UI components in `src/components/`
4. **Create Hooks**: Add data fetching/state in `src/hooks/`
5. **Create Pages**: Add routes in `src/app/`
6. **Add Tests**: Create tests in appropriate `tests/` subdirectory

### MVP → Post-MVP Progression

```plaintext
MVP Structure (Ultra-Simple):
├── inventory/page.tsx           # Basic book list (title, author, status)
├── members/page.tsx             # Simple member list  
└── transactions/checkout/       # One-click checkout (no due dates)

Post-MVP Additions:
├── inventory/[id]/page.tsx      # Book details and history
├── members/[id]/page.tsx        # Member profiles and borrowing history
├── transactions/overdue/        # Overdue management
├── reports/                     # Analytics and reporting
└── settings/                    # Advanced configuration
```

This source tree structure supports the **ultra-simple MVP approach** while providing clear organization for **progressive enhancement** to advanced library management features. The modular organization ensures **maintainable code** as the system grows from basic book tracking to comprehensive library operations.