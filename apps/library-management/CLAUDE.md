# CLAUDE.md - Library Management System

## Project Status

**Implemented**: Epic 1
**Current**: Epic 2
**Working Dir**: `apps/library-management`

## Principles:
- Never read or load resource outside of working directory, except user mentioned
- Always ask for edits when writing outside of working directory

## Quick Commands

```bash
# Development
pnpm dev                    # Start app (port 3001)
pnpm test:e2e              # Run E2E tests
pnpm lint:fix && pnpm type-check && pnpm build  # Pre-commit checks

# Database (from ../../supabase)
supabase start             # Start backend services
supabase db reset          # Reset with migrations + seeds
supabase status            # View service URLs
```

## Service URLs

- **App**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **Email Testing**: http://localhost:54324 (Mailpit)
- **API Gateway**: http://localhost:54321

## Architecture

- **Stack**: Next.js 15 + TypeScript + Shadcn UI + Tailwind
- **Database**: Direct Supabase (no API layer), multi-tenant with RLS
- **Auth**: Passwordless OTP via Supabase Auth
- **State**: Zustand (client) + React Query (server state)
- **Real-time**: Supabase subscriptions
- **Testing**: Playwright MCP for UAT

## Key Patterns

### Library Context

- URL structure: `/[library-code]/dashboard`
- All operations scoped to selected library
- RLS enforces data isolation

## Database

### Documentation
- [Database Design](docs/architecture/database-design.md)
- [Data Access Rules](docs/architecture/data-access-rules.md)
- [Database Views & Functions](docs/architecture/database-views-and-functions.md)

### Supabase

Database (from ../../supabase)
When working with Supabase databases, **ALWAYS** use migrations for ANY schema changes:

### Core Rules

1. **NEVER modify the database directly** - No manual CREATE TABLE, ALTER TABLE, etc
2. **Because shared Supabase with other projects, activities that change database schema, Supabase configuration are not performed within the scope of this project.**
3. **NEVER join `general_books` when fetching `book_*` data except user mentioned**

### E2E Testing

**Test-Specific Seed Data Pattern:**
- Create deterministic test data at runtime (not random faker data)
- Use unique timestamps for isolation: `test-${Date.now()}@example.com`
- Clean up test data after each test to prevent interference
- Never use hardcoded emails/IDs from random seeds

**UAT Testing:**
1. Use supabase mcp to get existing users, never create new user except for testing registrations
2. Use Playwright MCP to navigate and authenticate
3. Open new browser tab to get OTP from Mailpit: http://localhost:54324
4. Test library workflows

## Current Focus

- Story 2.1: Book inventory interface
- Story 2.2: Add books with ISBN lookup
- Story 2.3: Member management
- Story 2.4: Simple checkout/return (no due dates initially)

## Important Notes

- **PNPM only** - Never use npm
- **Supabase commands** - Always run from `../../supabase`
- **Type safety** - Regenerate types after migrations
- **Multi-tenant** - All queries include library_id
- **Shadcn UI** - Use `context7` MCP for latest docs

## Reference Docs

- Stories: `docs/stories/*.md`
- QA Gates: `docs/qa/gates/*.yml`

---

_Concise guide for Claude Code - See full documentation in docs/_
- No need to unit test for user interface components
- This project use `pnpm` for package management avoid use `npm` or `npx`
- use context7 mcp when dealing with external packages