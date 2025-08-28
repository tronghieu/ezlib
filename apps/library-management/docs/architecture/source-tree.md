# Library Management System - Source Tree

<!-- Powered by BMAD™ Core -->

## Overview

This document provides the actual source code organization for the **Library Management System**, a **monolithic Next.js application** with Supabase authentication and shadcn/ui components.

## Project Root Structure

```plaintext
apps/library-management/
├── docs/                               # 📚 Documentation
│   ├── architecture/                   # Architecture documentation
│   │   ├── coding-standards.md         # Development standards
│   │   ├── tech-stack.md               # Technology decisions
│   │   └── source-tree.md              # This file
│   ├── prd/                            # Product requirements
│   ├── api/                            # API documentation
│   ├── po-validation/                  # Product owner validation
│   ├── stories/                        # User stories
│   └── ci-cd/                          # CI/CD documentation
├── src/                                # 🚀 Source code (Next.js App Router)
│   ├── app/                           # Next.js 15 App Router pages & layouts
│   ├── components/                    # React components
│   └── lib/                           # Utility functions
├── public/                             # 🌐 Static assets
├── .bmad-core/                        # 🔧 BMad framework files
├── .claude/                           # Claude AI configuration
├── .cursor/                           # Cursor IDE configuration  
├── .serena/                           # Serena memory system
├── package.json                        # 📦 Dependencies & scripts
├── next.config.ts                      # ⚙️ Next.js configuration
├── tailwind.config.js                  # 🎨 Tailwind configuration (implicit)
├── tsconfig.json                       # 📘 TypeScript configuration
├── eslint.config.mjs                   # 📏 ESLint configuration
├── .prettierrc                         # ✨ Prettier configuration
├── components.json                     # 🎨 shadcn/ui configuration
├── postcss.config.mjs                  # 🎨 PostCSS configuration
├── .editorconfig                       # 📝 Editor configuration
├── .gitignore                          # 📝 Git ignore rules
├── pnpm-lock.yaml                      # 📦 Package lock file
├── README.md                           # 📖 Project documentation
└── CLAUDE.md                           # 📖 Claude Code instructions
```

## Source Code Structure (`src/`)

### Current Implementation (Minimal)

```plaintext
src/
├── app/                                # 🏗️ Next.js 15 App Router
│   ├── layout.tsx                      # Root layout with fonts & metadata
│   ├── page.tsx                        # Homepage component
│   ├── globals.css                     # Global styles with Tailwind imports
│   └── favicon.ico                     # App favicon
├── components/                         # 🎨 React components
│   └── ui/                            # shadcn/ui components
│       ├── button.tsx                  # Button component
│       ├── card.tsx                    # Card component
│       ├── checkbox.tsx                # Checkbox component  
│       ├── dialog.tsx                  # Modal dialog component
│       ├── dropdown-menu.tsx           # Dropdown menu component
│       ├── input.tsx                   # Form input component
│       ├── label.tsx                   # Form label component
│       ├── select.tsx                  # Select component
│       ├── sonner.tsx                  # Toast notifications
│       ├── table.tsx                   # Data table component
│       └── textarea.tsx                # Textarea component
└── lib/                               # 🔧 Utility functions
    └── utils.ts                       # Common utilities (cn function)
```

### Planned Structure (Future Implementation)

```plaintext
src/
├── app/                                # 🏗️ Next.js 15 App Router
│   ├── (auth)/                        # 🔐 Authentication routes
│   │   ├── login/                     # Login page with Supabase Auth
│   │   │   └── page.tsx               # Login form
│   │   ├── callback/                  # Auth callback handler
│   │   │   └── page.tsx               # Handle auth redirects
│   │   └── layout.tsx                 # Auth layout wrapper
│   ├── (dashboard)/                   # 🏠 Main application routes
│   │   ├── dashboard/                 # Dashboard overview
│   │   │   └── page.tsx               # Main dashboard
│   │   ├── books/                     # Book management
│   │   │   ├── page.tsx               # Book list
│   │   │   ├── add/                   # Add book form
│   │   │   │   └── page.tsx           # Add book page
│   │   │   └── [id]/                  # Individual book pages
│   │   │       ├── page.tsx           # Book details
│   │   │       └── edit/              # Edit book
│   │   │           └── page.tsx       # Edit book page
│   │   ├── members/                   # Member management
│   │   │   ├── page.tsx               # Member list
│   │   │   ├── add/                   # Add member form
│   │   │   │   └── page.tsx           # Add member page
│   │   │   └── [id]/                  # Individual member pages
│   │   │       ├── page.tsx           # Member profile
│   │   │       └── edit/              # Edit member
│   │   │           └── page.tsx       # Edit member page
│   │   ├── circulation/               # Check-in/out operations
│   │   │   ├── page.tsx               # Circulation dashboard
│   │   │   ├── checkout/              # Checkout workflow
│   │   │   │   └── page.tsx           # Checkout page
│   │   │   ├── checkin/               # Check-in workflow
│   │   │   │   └── page.tsx           # Check-in page
│   │   │   └── history/               # Transaction history
│   │   │       └── page.tsx           # History page
│   │   ├── settings/                  # Application settings
│   │   │   ├── page.tsx               # Settings overview
│   │   │   ├── profile/               # User profile
│   │   │   │   └── page.tsx           # Profile page
│   │   │   └── library/               # Library settings
│   │   │       └── page.tsx           # Library config
│   │   └── layout.tsx                 # Dashboard layout with navigation
│   ├── api/                           # 🔗 API routes (minimal)
│   │   └── auth/                      # Auth-related API routes
│   │       └── callback/              # Auth callback API
│   │           └── route.ts           # Handle auth callbacks
│   ├── globals.css                    # 🎨 Global styles with Tailwind
│   ├── layout.tsx                     # 🏠 Root layout with providers
│   ├── loading.tsx                    # ⏳ Global loading component
│   ├── error.tsx                      # 🚨 Global error boundary
│   ├── not-found.tsx                  # ❌ 404 page
│   └── favicon.ico                    # App favicon
├── components/                         # 🎨 React components
│   ├── ui/                            # shadcn/ui base components
│   │   ├── button.tsx                 # Button variations
│   │   ├── card.tsx                   # Card layouts
│   │   ├── dialog.tsx                 # Modal dialogs
│   │   ├── dropdown-menu.tsx          # Dropdown menus
│   │   ├── input.tsx                  # Form inputs
│   │   ├── label.tsx                  # Form labels
│   │   ├── select.tsx                 # Select dropdowns
│   │   ├── table.tsx                  # Data tables
│   │   ├── toast.tsx                  # Toast notifications
│   │   └── index.ts                   # Component exports
│   ├── layout/                        # 🏗️ Layout components
│   │   ├── header.tsx                 # Application header
│   │   ├── sidebar.tsx                # Navigation sidebar
│   │   ├── footer.tsx                 # Application footer
│   │   └── breadcrumb.tsx             # Breadcrumb navigation
│   ├── forms/                         # 📝 Form components
│   │   ├── book-form.tsx              # Book add/edit form
│   │   ├── member-form.tsx            # Member add/edit form
│   │   ├── checkout-form.tsx          # Checkout form
│   │   └── search-form.tsx            # Search components
│   ├── tables/                        # 📋 Data table components
│   │   ├── books-table.tsx            # Books data table
│   │   ├── members-table.tsx          # Members data table
│   │   ├── transactions-table.tsx     # Transactions table
│   │   └── table-pagination.tsx       # Pagination controls
│   ├── dashboard/                     # 📊 Dashboard components
│   │   ├── stats-card.tsx             # Statistics cards
│   │   ├── recent-activity.tsx        # Recent activity feed
│   │   └── quick-actions.tsx          # Quick action buttons
│   ├── providers/                     # 🔧 Context providers
│   │   ├── supabase-provider.tsx      # Supabase client provider
│   │   ├── query-provider.tsx         # React Query provider
│   │   ├── theme-provider.tsx         # Theme provider
│   │   └── toast-provider.tsx         # Toast notifications provider
│   └── common/                        # 🔧 Common components
│       ├── loading-spinner.tsx        # Loading indicators
│       ├── empty-state.tsx            # Empty state displays
│       ├── error-boundary.tsx         # Error boundaries
│       └── confirmation-dialog.tsx    # Confirmation modals
├── lib/                               # 🔧 Core utilities and services
│   ├── supabase/                      # 🗄️ Supabase integration
│   │   ├── client.ts                  # Supabase client configuration
│   │   ├── server.ts                  # Server-side Supabase client
│   │   ├── middleware.ts              # Auth middleware
│   │   └── types.ts                   # Generated database types
│   ├── auth/                          # 🔐 Authentication utilities
│   │   ├── config.ts                  # Auth configuration
│   │   ├── utils.ts                   # Auth helper functions
│   │   └── middleware.ts              # Auth middleware
│   ├── api/                           # 🔗 API utilities
│   │   ├── books.ts                   # Book-related API calls
│   │   ├── members.ts                 # Member-related API calls
│   │   ├── transactions.ts            # Transaction API calls
│   │   └── utils.ts                   # API utilities
│   ├── validation/                    # ✅ Validation schemas
│   │   ├── auth.ts                    # Auth validation schemas
│   │   ├── books.ts                   # Book validation schemas
│   │   ├── members.ts                 # Member validation schemas
│   │   └── transactions.ts            # Transaction schemas
│   ├── hooks/                         # 🪝 Custom React hooks
│   │   ├── use-supabase.ts           # Supabase hooks
│   │   ├── use-auth.ts               # Authentication hooks
│   │   ├── use-books.ts              # Book management hooks
│   │   ├── use-members.ts            # Member management hooks
│   │   └── use-transactions.ts       # Transaction hooks
│   ├── stores/                        # 🗃️ Zustand stores
│   │   ├── auth-store.ts             # Authentication state
│   │   ├── ui-store.ts               # UI state (modals, etc.)
│   │   └── search-store.ts           # Search state
│   ├── utils.ts                       # 🛠️ Common utilities (cn function)
│   ├── constants.ts                   # 📋 Application constants
│   ├── config.ts                      # ⚙️ Application configuration
│   └── types.ts                       # 📘 TypeScript type definitions
├── styles/                            # 🎨 Additional styles (if needed)
│   └── globals.css                    # Additional global styles
└── hooks/                             # 🪝 Global custom hooks (alternative location)
    ├── use-local-storage.ts           # Local storage hook
    ├── use-media-query.ts             # Media query hook
    └── use-debounce.ts                # Debounce hook
```

## Configuration Files

### Core Configuration

```plaintext
# Next.js & React Configuration
next.config.ts                         # Next.js configuration
tsconfig.json                          # TypeScript configuration
components.json                        # shadcn/ui configuration

# Styling Configuration  
tailwind.config.js                     # Tailwind CSS configuration (implicit)
postcss.config.mjs                     # PostCSS configuration
.editorconfig                          # Editor configuration

# Code Quality
eslint.config.mjs                      # ESLint configuration  
.prettierrc                            # Prettier configuration

# Package Management
package.json                           # Dependencies and scripts
pnpm-lock.yaml                         # Lock file
```

### Environment Files (Not in Repository)

```plaintext
.env.local                             # Local development environment
.env.example                          # Environment template (future)
```

## File Naming Conventions

### Component Files
- **Pages**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- **Components**: `kebab-case.tsx` (e.g., `book-form.tsx`, `member-table.tsx`)
- **API Routes**: `route.ts`

### Utility Files
- **Hooks**: `use-kebab-case.ts` (e.g., `use-auth.ts`, `use-books.ts`)
- **Services**: `kebab-case.ts` (e.g., `supabase-client.ts`)
- **Types**: `kebab-case.ts` (e.g., `database-types.ts`)
- **Utils**: `kebab-case.ts` or `index.ts`

### Directory Names
- **All directories**: `kebab-case` (e.g., `data-tables`, `auth-forms`)
- **Route groups**: `(group-name)` (e.g., `(auth)`, `(dashboard)`)

## Import Path Structure

### Absolute Imports (Configured)

```typescript
// ✅ Good: Use absolute imports with @ alias
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Database } from "@/lib/types";
```

### Relative Imports (Avoid)

```typescript
// ❌ Bad: Avoid relative imports
import { Button } from "../../../components/ui/button";
import { createClient } from "../../lib/supabase/client";
```

## Current vs Future State

### What Exists Now (✅)
- Basic Next.js 15 App Router setup
- Root layout with fonts and metadata
- Simple homepage component
- shadcn/ui components installed and configured
- Basic utility functions (cn)
- TypeScript and ESLint configuration
- Tailwind CSS v4 setup

### What Needs Implementation (🚧)
- Authentication routes and Supabase integration
- Dashboard layout and navigation
- Book and member management pages
- CRUD operations and forms
- Data tables and pagination
- Real-time subscriptions
- State management with Zustand
- API routes and database integration

## Development Workflow

### Adding New Features

1. **Plan Route Structure**: Decide on URL structure in `src/app/`
2. **Create Page Components**: Add `page.tsx` files in appropriate directories
3. **Build UI Components**: Create reusable components in `src/components/`
4. **Add Business Logic**: Implement hooks and services in `src/lib/`
5. **Configure Database**: Set up Supabase tables and types
6. **Add Validation**: Create Zod schemas for forms
7. **Implement Auth**: Add authentication guards and permissions

### File Organization Principles

1. **Feature-First**: Group related components, hooks, and utilities
2. **Separation of Concerns**: Keep UI, business logic, and data separate
3. **Reusability**: Common components in shared directories
4. **TypeScript**: Strong typing throughout the application
5. **Testing**: Co-locate test files with components (future)

This source tree structure reflects the **current minimal implementation** while providing a clear path for **future development** of the library management system. The monolithic approach ensures all functionality remains in a single, maintainable codebase.