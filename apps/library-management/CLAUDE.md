# CLAUDE.md - Library Management System

This file provides guidance to Claude Code when working with the **Library Management System**.

## Project Overview

The **Library Management System** is a standalone Next.js 15+ web application that enables small/medium libraries to replace manual/spreadsheet systems with ultra-simple digital operations. This admin interface serves library staff for book inventory management, member registration, and circulation operations.

### Current Development State

- ❌ **Project Setup**: Next.js 15+ App Router structure [NOT YET IMPLEMENTED]
- ❌ **Authentication**: Passwordless OTP integration [NOT YET IMPLEMENTED]
- ❌ **Core Features**: Ultra-simple book lists, member management, circulation [NOT YET IMPLEMENTED]
- ✅ **Documentation**: Complete PRD, technical specs, and UX requirements [IMPLEMENTED]

## Application Type

**Frontend Web Application** - Admin dashboard for library staff operations

- **Primary Users**: Library administrators, managers, librarians
- **Architecture**: Direct Supabase integration with Row Level Security

## Tech Stack

### Core Technologies

- **Framework**: Next.js 15+ with App Router (TypeScript, strict mode)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with responsive design
- **Database**: Direct Supabase PostgreSQL integration
- **Authentication**: Supabase Auth with passwordless email OTP
- **State Management**: Zustand (client) + React Query (server state)
- **Real-time**: Supabase subscriptions for live inventory updates

### Development Tools

- **Package Manager**: PNPM
- **Code Quality**: ESLint, Prettier, Husky git hooks
- **Testing**: Jest, Testing Library, Playwright (E2E)
- **Deployment**: Vercel with global CDN

## Essential Commands

### Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev

# Open app in browser
open http://localhost:3001
```

## Supabase Backend-as-a-Service

### Overview

This application uses **Supabase** as the backend database service with PostgreSQL and real-time capabilities.

### Supabase Configuration

```
supabase/
├── config.toml              # Supabase local development configuration
├── migrations/              # Database schema migrations (sequential)
│   ├── 001_core_book_metadata.sql
│   ├── 002_book_relationships.sql
│   ├── 003_indexes_performance.sql
│   ├── 004_triggers_functions.sql
│   ├── 005_row_level_security.sql
│   └── 006_library_management_tables.sql
└── seeds/                   # Sample data for development
    ├── seed.sql            # Main seed file (auto-executed)
    ├── 01_authors.sql      # Author sample data
    ├── 02_general_books.sql # Book sample data
    ├── 11_book_copies.sql  # Library inventory samples
    └── 12_borrowing_transactions.sql # Transaction samples
```

### Database Operations (from database root)

#### Basic Operations

```bash
# Navigate to database directory (relative to project root)
cd ../../supabase

# Start local Supabase stack (includes PostgreSQL, Auth, Realtime, Storage)
supabase start

# Stop local Supabase stack
supabase stop

# View Supabase status and service URLs
supabase status

# Open Supabase Studio (database GUI)
open http://localhost:54323
```

#### Database Management

```bash
# Reset database with ALL migrations and seeds (DESTRUCTIVE)
supabase db reset

# Apply pending migrations only (safe)
supabase db push

# View migration status
supabase migration list

# Generate TypeScript types for this app (run from database directory)
supabase gen types typescript --local > ../apps/library-management/lib/database.types.ts
```

#### Migration Management

```bash
# Create new migration file
supabase migration new "descriptive_migration_name"

# Example: Add new library feature
supabase migration new "add_library_events_table"

# Migration files are created in: supabase/migrations/YYYYMMDDHHMMSS_name.sql
# Edit the file to add your SQL changes

# Test migration by resetting database
supabase db reset

# Alternative: Apply specific migration
supabase db push
```

#### Seeding Data Management

```bash
# Reseed database (runs automatically with db reset)
supabase db reset

# View current seed files
ls -la supabase/seeds/

# Add custom seed data:
# 1. Create new .sql file in supabase/seeds/
# 2. Add file reference to supabase/seeds/seed.sql
# 3. Run: supabase db reset
```

### Service URLs (Local Development)

- **Supabase Studio**: http://localhost:54323 (Database GUI)
- **Database Direct**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **API Gateway**: http://localhost:54321
- **Realtime**: ws://localhost:54321/realtime/v1/websocket
- **Email Testing**: http://localhost:54324 (Inbucket - view sent emails)

### Environment Variables

```bash
# Add to .env.local

# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Copy keys from: supabase status (run from database directory)
# Or view in Supabase Studio > Settings > API
```

### Key Database Tables (Library Management)

#### Core Tables

```sql
-- Libraries (organizations)
libraries {
  id: UUID (PK)
  name: TEXT
  code: TEXT (unique, e.g., "NYCPL-MAIN")
  address: JSONB
  settings: JSONB (loan periods, fees, policies)
}

-- Library Staff (employees with permissions)
library_staff {
  user_id: UUID (FK to auth.users)
  library_id: UUID (FK to libraries)
  role: TEXT (librarian, manager, admin)
  permissions: JSONB
}

-- Library Members (patrons who borrow books)
library_members {
  id: UUID (PK)
  library_id: UUID (FK to libraries)
  member_id: TEXT (library-specific ID)
  personal_info: JSONB
  borrowing_stats: JSONB
}

-- Book Copies (physical inventory)
book_copies {
  id: UUID (PK)
  library_id: UUID (FK to libraries)
  book_edition_id: UUID (FK to book_editions)
  barcode: TEXT (unique)
  availability: JSONB (status, due_date, hold_queue)
}

-- Borrowing Transactions (checkout/return history)
borrowing_transactions {
  library_id: UUID (FK to libraries)
  book_copy_id: UUID (FK to book_copies)
  member_id: UUID (FK to library_members)
  transaction_type: TEXT (checkout, return, renewal)
  due_date: TIMESTAMPTZ
  fees: JSONB
}
```

#### Multi-Tenant Architecture

All tables include `library_id` for **Row Level Security (RLS)** isolation:

- Each library's data is completely isolated
- Staff can only access their assigned library's data
- Real-time subscriptions filtered by library context
- Database policies enforce access control automatically

### Code Quality & Testing

```bash
# Format and lint code
pnpm lint:fix
pnpm format
pnpm format:check            # Check formatting without changes

# Run type checking
pnpm type-check

# Run tests
pnpm test                    # Unit tests
pnpm test:watch              # Unit tests in watch mode
pnpm test:coverage           # Test coverage report
pnpm test:e2e                # End-to-end tests
pnpm test:e2e:ui             # End-to-end tests with UI
```

### Build & Deployment

```bash
# Build for production
pnpm build

# Preview production build
pnpm start
```

## Development Workflow

### Before Task Completion

Always run quality checks before committing:

```bash
pnpm lint:fix
pnpm format
pnpm type-check
pnpm test
pnpm build
```

### Additional Development Commands

```bash
# Code quality checks
pnpm format:check            # Check code formatting
pnpm test:watch              # Run tests in watch mode
pnpm test:e2e:ui             # Run E2E tests with interactive UI
```

### Authentication Integration Pattern

- **Registration**: User registration with email OTP
- **Login**: Email OTP authentication
- **Access Control**: Role-based permissions (owner, manager, librarian) per library

### Database Integration Pattern

- **Direct Connection**: Use Supabase client directly (no API layer)
- **Row Level Security**: Multi-tenant isolation enforced at database level
- **Real-time Updates**: Supabase subscriptions for live inventory synchronization
- **Type Safety**: Generated TypeScript types from database schema

## Architecture Principles

### Ultra-Simple MVP Approach

- **Phase 1**: Basic book lists, member registration, one-click checkout/return
- **No Due Dates Initially**: Focus on core operational validation
- **Progressive Enhancement**: Feature flags enable advanced features post-MVP

### Dashboard-Centric Design

- **Primary Dashboard**: Operational overview with quick access to common tasks
- **Search-First**: Prominent search for books and members with autocomplete
- **Modal Workflows**: Complex operations use focused modals to maintain context
- **Keyboard-Friendly**: Support shortcuts and tab navigation for power users

### Multi-Tenant Architecture

- **Library Context**: All operations scoped to selected library
- **Role-Based Access**: Granular permissions per library for different staff roles
- **Data Isolation**: Complete separation between libraries via RLS policies

## File Organization

```
library-management/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Main dashboard
│   ├── inventory/         # Book management
│   ├── members/           # Member management
│   ├── circulation/       # Checkout/return operations
│   └── settings/          # Library configuration
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── tables/           # Data table components
│   └── charts/           # Analytics components
├── lib/                   # Utility functions
│   ├── supabase/         # Database client configuration
│   ├── auth/             # Authentication helpers
│   ├── utils/            # General utilities
│   └── validations/      # Zod schemas
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── stores/               # Zustand stores
└── docs/                 # Project documentation
```

## Key Features & User Stories

### Epic 1: Foundation & Authentication

- **Story 1.1**: Next.js 15 project setup
- **Story 1.2**: Supabase integration and TypeScript type generation
- **Story 1.3**: Passwordless authentication system
- **Story 1.4**: Library context management and switching
- **Story 1.5**: Basic dashboard and navigation structure

### Epic 2: Ultra-Simple Operations

- **Story 2.1**: Simple book list interface with search
- **Story 2.2**: Add new books with optional ISBN lookup
- **Story 2.3**: Basic member registration and management
- **Story 2.4**: One-click checkout/return operations (no due dates)

### Epic 3: Enhanced Circulation (Post-MVP)

- **Story 3.1**: Due date tracking and renewal system
- **Story 3.2**: Holds and reservation management
- **Story 3.3**: Overdue tracking and fine calculations

### Epic 4: Advanced Features (Post-MVP)

- **Story 4.1**: Reporting and analytics dashboard
- **Story 4.2**: Bulk operations and data management
- **Story 4.3**: Multi-library administration
- **Story 4.4**: Internationalization support

## Integration Guidelines

### Supabase Integration Patterns

#### Database Client Setup

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

export const supabase = createClientComponentClient<Database>();

// lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const createServerClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  });
};
```

#### Real-Time Synchronization

```typescript
// Real-time book inventory updates
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useBookInventory(libraryId: string) {
  const [books, setBooks] = useState<BookCopy[]>([]);

  useEffect(() => {
    // Initial data fetch
    const fetchBooks = async () => {
      const { data } = await supabase
        .from("book_copies")
        .select(
          `
          *,
          book_editions (
            title,
            authors,
            isbn_13
          )
        `
        )
        .eq("library_id", libraryId);

      setBooks(data || []);
    };

    // Real-time subscription
    const subscription = supabase
      .channel("book_inventory_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "book_copies",
          filter: `library_id=eq.${libraryId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBooks((current) => [...current, payload.new as BookCopy]);
          }
          if (payload.eventType === "UPDATE") {
            setBooks((current) =>
              current.map((book) =>
                book.id === payload.new.id ? (payload.new as BookCopy) : book
              )
            );
          }
          if (payload.eventType === "DELETE") {
            setBooks((current) =>
              current.filter((book) => book.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    fetchBooks();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [libraryId]);

  return books;
}
```

#### Row Level Security (Multi-Tenant)

```typescript
// Row Level Security automatically enforced by database policies
// All queries are filtered by current user's library access

export async function getLibraryBooks(libraryId: string) {
  // RLS automatically filters to only books for this library
  const { data, error } = await supabase
    .from("book_copies")
    .select(
      `
      *,
      book_editions (*)
    `
    )
    .eq("library_id", libraryId); // Explicit filter + RLS enforcement

  return { data, error };
}

export async function checkoutBook(
  bookCopyId: string,
  memberId: string,
  libraryId: string
) {
  // Multi-step transaction with RLS
  const { data, error } = await supabase.rpc("process_book_checkout", {
    p_book_copy_id: bookCopyId,
    p_member_id: memberId,
    p_library_id: libraryId,
    p_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  });

  return { data, error };
}
```

#### Cross-Domain Authentication

```typescript
// Authentication middleware for library management
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireLibraryAccess(libraryId?: string) {
  const supabase = createServerClient();

  // Check user authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Check library admin access
  const { data: staffAccess } = await supabase
    .from("library_staff")
    .select("role, permissions, library_id")
    .eq("user_id", user.id)
    .eq("library_id", libraryId)
    .single();

  if (!staffAccess) {
    redirect("/unauthorized");
  }

  return {
    user,
    libraryAccess: staffAccess,
  };
}
```

#### Book Metadata Enrichment Integration

```typescript
// Integration with external APIs for ISBN lookup
export async function enrichBookMetadata(isbn: string, libraryId: string) {
  try {
    // Call external API for metadata (e.g., Google Books API)
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Enrichment failed");
    }

    const enrichmentData = await response.json();

    // Process and save the enriched data
    return { success: true, data: enrichmentData };
  } catch (error) {
    console.error("Book enrichment failed:", error);
    return { success: false, error: error.message };
  }
}
```

#### Database Queries with TypeScript Types

```typescript
// Generated types from: supabase gen types typescript --local
import { Database } from "@/lib/database.types";

type BookCopy = Database["public"]["Tables"]["book_copies"]["Row"];
type BookEdition = Database["public"]["Tables"]["book_editions"]["Row"];
type BorrowingTransaction =
  Database["public"]["Tables"]["borrowing_transactions"]["Row"];

// Type-safe queries
export async function getActiveLoans(
  libraryId: string
): Promise<BorrowingTransaction[]> {
  const { data, error } = await supabase
    .from("borrowing_transactions")
    .select(
      `
      *,
      book_copies (
        barcode,
        book_editions (
          title,
          authors
        )
      ),
      library_members (
        member_id,
        personal_info
      )
    `
    )
    .eq("library_id", libraryId)
    .eq("transaction_type", "checkout")
    .is("return_date", null);

  if (error) throw error;
  return data || [];
}
```

#### Migration Workflow Example

```sql
-- Example migration: supabase/migrations/YYYYMMDDHHMMSS_add_library_events.sql

-- Add events table for library activities
CREATE TABLE library_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_by UUID REFERENCES library_staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE library_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_events_access" ON library_events
  USING (library_id IN (
    SELECT library_id FROM library_staff
    WHERE user_id = auth.uid()
  ));

-- Add indexes
CREATE INDEX idx_library_events_library_id ON library_events(library_id);
CREATE INDEX idx_library_events_date ON library_events(event_date);
```

#### Seeding Data Example

```sql
-- Example: supabase/seeds/13_library_events.sql

INSERT INTO library_events (id, library_id, event_type, title, description, event_date) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM libraries WHERE code = 'DEMO-LIB' LIMIT 1),
  'workshop',
  'Digital Literacy Workshop',
  'Learn basic computer skills and internet safety',
  CURRENT_DATE + INTERVAL '7 days'
);
```

## Supabase Best Practices & Troubleshooting

### Development Workflow Best Practices

#### 1. Always Work from Database Root for Database Operations

```bash
# ❌ WRONG - Don't run from project directory
supabase start  # This might not find the correct configuration

# ✅ CORRECT - Always from database root
cd ../../supabase
supabase start  # Uses existing configuration
```

#### 2. Type Generation After Schema Changes

```bash
# After any migration or schema change (run from database directory):
cd ../../supabase
supabase gen types typescript --local > ../apps/library-management/lib/database.types.ts
```

#### 3. RLS Policy Testing

```sql
-- Always test RLS policies in Supabase Studio
-- Go to SQL Editor and run queries as different users

-- Test library staff access
SELECT current_setting('request.jwt.claims', true)::json->>'sub';

-- Test library-scoped queries
SELECT * FROM book_copies WHERE library_id = 'your-library-id';
```

### Common Issues & Solutions

#### Issue 1: "relation does not exist" errors

```bash
# Solution: Reset database to apply all migrations
cd {project root}
supabase db reset
```

#### Issue 2: Real-time subscriptions not working

```typescript
// Ensure you're using the correct channel name and filters
const subscription = supabase
  .channel("unique_channel_name") // Must be unique
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "book_copies",
      filter: `library_id=eq.${libraryId}`, // Correct filter format
    },
    (payload) => {
      console.log("Change received!", payload);
    }
  )
  .subscribe((status) => {
    console.log("Subscription status:", status);
  });
```

#### Issue 3: RLS policies blocking queries

```sql
-- Check RLS policies for your table
SELECT * FROM pg_policies WHERE tablename = 'book_copies';

-- Temporarily disable RLS for testing (DEV ONLY!)
ALTER TABLE book_copies DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable: ALTER TABLE book_copies ENABLE ROW LEVEL SECURITY;
```

#### Issue 4: Migration conflicts

```bash
# If migrations fail, check the migration order
supabase migration list

# Reset and reapply from scratch
supabase db reset

# For production: create a new migration to fix issues
supabase migration new "fix_constraint_conflict"
```

### Performance Optimization

#### Database Query Optimization

```typescript
// ❌ Bad: Multiple queries
const books = await supabase.from("book_copies").select("*");
const editions = await supabase.from("book_editions").select("*");

// ✅ Good: Single query with joins
const booksWithEditions = await supabase
  .from("book_copies")
  .select(
    `
    *,
    book_editions (
      title,
      authors,
      isbn_13
    )
  `
  )
  .eq("library_id", libraryId);
```

#### Real-time Subscription Management

```typescript
// ❌ Bad: Multiple subscriptions
useEffect(() => {
  // Multiple subscriptions can cause memory leaks
  const sub1 = supabase.channel("books").subscribe();
  const sub2 = supabase.channel("members").subscribe();
}, []);

// ✅ Good: Single subscription with proper cleanup
useEffect(() => {
  const subscription = supabase
    .channel("library_data")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "book_copies" },
      handleBookChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "library_members" },
      handleMemberChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, [libraryId]);
```

### Security Checklist

- [ ] All tables have appropriate RLS policies enabled
- [ ] Service role key is never exposed to client-side code
- [ ] All user inputs are validated with Zod schemas
- [ ] Cross-domain authentication properly validates library access
- [ ] Database functions use SECURITY DEFINER only when necessary
- [ ] Audit logs capture all critical operations

### Monitoring & Debugging

#### Local Development

```bash
# View all running services
supabase status

# Check logs for issues
docker logs supabase_db_ezlib
docker logs supabase_auth_ezlib
docker logs supabase_realtime_ezlib

# Monitor real-time connections
# Open Supabase Studio > API > Realtime > Inspect
```

#### Database Debugging

```sql
-- Check current user context
SELECT auth.uid(), auth.jwt();

-- View active connections
SELECT * FROM pg_stat_activity WHERE datname = 'postgres';

-- Check table statistics
SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

## Important Notes

- **Ultra-Simple First**: Start with basic functionality, avoid feature creep
- **Multi-Tenant**: All queries must be scoped to selected library context
- **Responsive Design**: Optimize for desktop primary, tablet secondary
- **Accessibility**: Meet WCAG 2.1 AA standards for inclusive library staff usage
- **Performance**: Support up to 5,000 books and 1,000 members per library efficiently
- **Supabase Integration**: Always run database commands from database root directory
- **Type Safety**: Regenerate TypeScript types after every schema change
- **Package Manager**: This project uses **PNPM** exclusively - never use npm commands

## Process Improvement Guidelines

**Story Creation Enhancement**: Before creating any user stories, SM agents must reference `docs/enhanced-story-creation-guidelines.md` to ensure cross-cutting concerns (i18n, authentication, multi-tenancy, accessibility, performance) are properly considered. This prevents missing critical architectural requirements during story development.

## Next Steps

When starting development:

1. **Project Setup**: Initialize Next.js 15 structure with required dependencies
2. **Supabase Integration**: Configure database connection and generate types
3. **Authentication Flow**: Implement passwordless OTP system
4. **Basic Dashboard**: Create main navigation and library context switching
5. **Core Operations**: Build ultra-simple book lists and member management

---

_Library Management System CLAUDE.md - Standalone library management application_

- Use playwright mcp for end-to-end testing web app
- when working with browser or testing the display of web applications, use playwright mcp
