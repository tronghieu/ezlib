# CLAUDE.md - Library Management System

## Project Status

✅ **Implemented**: Stories 1.1-1.5 (Next.js setup, Supabase integration, auth, library context, dashboard)
🚧 **Current**: Story 2.x (inventory, members, circulation)
📁 **Working Dir**: `/apps/library-management`

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

### Database Types

```bash
# Regenerate after schema changes (from ../../supabase)
supabase gen types typescript --local > ../apps/library-management/lib/database.types.ts
```

### Supabase Migration-First Development

Database (from ../../supabase)
When working with Supabase databases, **ALWAYS** use migrations for ANY schema changes:

### Core Rules

1. **NEVER modify the database directly** - No manual CREATE TABLE, ALTER TABLE, etc.
2. **ALWAYS create a migration file** for schema changes:

```bash
supabase migration new descriptive_name_here
```

3. **Migration naming convention**:

- `create_[table]_table` - New tables
- `add_[column]_to_[table]` - New columns
- `update_[table]_[change]` - Modifications
- `create_[name]_index` - Indexes
- `add_[table]_rls` - RLS policies

4. **After EVERY migration**:

```bash
supabase db reset                          # Apply locally
supabase gen types typescript --local > ../apps/library-management/lib/database.types.ts  # Update types
```

5. **Include in EVERY migration**:

- Enable RLS on new tables
- Add proper indexes
- Consider adding triggers for updated_at

### UAT Testing

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
- Detailed patterns: Original CLAUDE.md backup

---

_Concise guide for Claude Code - See full documentation in docs/_
