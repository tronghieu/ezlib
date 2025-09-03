# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EzLib is a unified fullstack platform enabling readers to browse and borrow books from local libraries, while providing small/medium libraries with operational management tools. The project uses a **monolithic frontends architecture** with multiple standalone applications sharing a single Supabase database.

### Current Development State
- ✅ **Architecture & Documentation**: Fully defined in `docs/`
- ✅ **Database**: 5 Supabase migrations implemented in `supabase/migrations/`
- ✅ **Crawler Service**: Partially implemented FastAPI service in `services/crawler/`
- ❌ **Frontend Applications**: Planned for `apps/reader/` and `apps/library-management/`

## Architecture

### Multi-Application Structure
1. **Reader App** (`apps/reader/`) - Default app on `ezlib.com` [NOT YET IMPLEMENTED]
2. **Library Management App** (`apps/library-management/`) - Admin dashboard on `manage.ezlib.com` [BUILDING]
3. **Book Crawler Service** (`services/crawler/`) - Python FastAPI service for metadata enrichment [PARTIALLY IMPLEMENTED]
4. **Shared Database** (`supabase/`) - PostgreSQL with Row Level Security [IMPLEMENTED]

### Key Architectural Principles
- **Direct Supabase Connections**: Each app connects directly to Supabase (no shared API layer)
- **Multi-Tenant SaaS**: Single database with RLS policies for isolation
- **Event-Driven Real-time**: Supabase subscriptions for cross-app notifications

## Tech Stack

- **Frontend**: Next.js 15+ with TypeScript, shadcn/ui, Tailwind CSS
- **Backend Service**: Python 3.11+ with FastAPI, Pydantic, Supabase Python client
- **Database**: Supabase PostgreSQL with Row Level Security
- **Infrastructure**: Vercel (hosting), PNPM (package manager)

## Supabase

### Database Design
- always include `created_at` and `updated_at` columns and add trigger to automatically timestamp when data changes
- use English lowercase for statuses/states. Example: 'active', 'inactive', 'pending'

### Supabase Migration-First Development

When working with Supabase databases, **ALWAYS** use migrations for ANY schema changes:

### Core Rules

1. **NEVER modify the database directly** - No manual CREATE TABLE, ALTER TABLE, etc.
2. **ALWAYS create a migration file** for schema changes
3. Run `supabase migration new ...` to create a new migration file instead of creating directly

### Migration Guidelines

1. **Migration naming convention**:
- `create_[table]_table` - New tables
- `add_[column]_to_[table]` - New columns
- `update_[table]_[change]` - Modifications
- `create_[name]_index` - Indexes
- `add_[table]_rls` - RLS policies

2. **Include in EVERY migration**:
- Enable RLS on new tables
- Add proper indexes
- Consider adding triggers for `update_at`

### Row-Level Security principle
1. Enable RSL on new tables
2. Avoid infinite recursion errors in RLS policies
3. Use database functions for checking permissions of a user follow roles

Example: Allow library admin to manage borrowing_transactions
- write `get_library_role(library_id, user_id)` function return `null` / `role` from `library_staff` table
- use the function to check permissions instead of writing complex queries

### Seeding data
- Use snaplet to seed data
- Using read data for books seeding data, include English, Chinese and Vietnamese.
- Split data into multiple files for better organization in `supabase/seeds`
- Create standalone seeding files for each feature with tables and its relations. Example: seeding library management features include `libraries`, `library_staff`.
- Follow naming convention for seeding files: `supabase/seeds/[feature_name].ts`
- enable `dryRun` option (https://snaplet-seed.netlify.app/seed/integrations/supabase#4-optional-hook-into-supabase-seeding-workflow)

## Essential Commands

### Supabase Database
```bash
supabase start                   # Start local development environment
supabase db reset               # Reset database with fresh migrations
supabase migration new <name>   # Create new migration
supabase gen types typescript --local  # Generate TypeScript types
```

### Crawler Service (services/crawler/)
```bash
cd services/crawler
poetry install                  # Install dependencies
poetry run black src/ tests/   # Format code
poetry run ruff check src/     # Lint code
poetry run mypy src/           # Type checking
poetry run pytest             # Run tests
poetry run uvicorn src.main:app --reload  # Start dev server
```

### Service Access Points
- **Supabase Studio**: http://localhost:54323
- **Crawler API**: http://localhost:8000
- **Database**: localhost:54322

## Code Quality Standards

### Python (Crawler Service)
- **Formatter**: Black (88 char line length)
- **Linter**: Ruff
- **Type Checker**: MyPy
- **Testing**: Pytest with pytest-asyncio
- **Naming**: snake_case for variables/functions, PascalCase for classes

### TypeScript (Future Frontend Apps)
- **Language**: TypeScript 5.0+ with strict mode
- **Framework**: Next.js 15+ App Router
- **Components**: Functional React components with proper typing
- **Database**: Direct Supabase client integration

## Development Workflow

### Before Task Completion
For Python changes:
```bash
cd services/crawler
poetry run black src/ tests/
poetry run ruff check src/ --fix
poetry run mypy src/
poetry run pytest
```

For database changes:
```bash
supabase db reset
supabase migration list
```

### Database Integration Pattern
- Use Supabase clients directly (JavaScript for frontend, Python for crawler)
- Implement RLS policies for multi-tenant data isolation
- Leverage Supabase real-time for cross-app notifications
- Generate TypeScript types from database schema

### File Organization
- **Services**: Organize by domain (enrichment, validation, external APIs)
- **Models**: Separate request, response, database, and external models
- **Tests**: Mirror source structure in test directories
- **Documentation**: Maintain architecture docs for system-wide changes

## Important Notes

- The project uses **direct database connections** - avoid creating shared API layers
- Each application should connect to Supabase independently using appropriate client libraries
- Database migrations are organized into logical files (metadata, relationships, indexes, triggers, RLS)
- The crawler service has comprehensive test coverage and should maintain this standard
- Future frontend applications should follow the planned monorepo structure in `apps/`
- While creating seeding data, split into separating files in the supabase/seeds folder
- When designing database tables that have update operations, always include `created_at` and `updated_at` columns and add trigger to automatically timestamp when data changes
