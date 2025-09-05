<!-- Powered by BMAD™ Core -->

# apply-database-dev-changes

Apply all database migrations and seed comprehensive test data in the development environment. This task provides a complete database reset and population workflow for EzLib's Supabase development setup.

## Purpose

- Reset the local Supabase database with all migrations
- Apply comprehensive seed data for development and testing
- Validate database architecture and security policies
- Ensure development environment is ready for frontend work

## Prerequisites

- Supabase CLI installed and configured
- Local Supabase instance running (`supabase start`)
- Node.js/PNPM available for seeding scripts
- Access to supabase directory with migrations and seeds

## Process (Execute in Order)

### 1) Verify Supabase Environment

Check that local Supabase is running:
```bash
supabase status
```

Expected services:
- API URL: http://localhost:54321
- DB URL: postgresql://postgres:postgres@localhost:54322/postgres
- Studio URL: http://localhost:54323
- All services should show "RUNNING"

**HALT**: If services aren't running, run `supabase start` first.

### 2) Apply Database Reset and Migrations

Navigate to supabase directory and reset database:
```bash
cd supabase
supabase db reset
```

This will:
- ✅ Recreate the database from scratch
- ✅ Apply all numbered migrations
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Create database functions and triggers
- ✅ Set up multi-tenant security architecture

**Expected Output**:
- "Finished supabase db reset"
- No errors during migration application
- NOTICE messages about existing indexes are normal

### 3) Run Comprehensive Database Seeding

Execute the main seed script:
```bash
pnpm dlx tsx seed.ts
```

**Seeding Phases** (executed automatically):
1. **Users and Authentication** - Creates 20 test users across all roles
2. **Books and Authors** - 30 authors, 50 books, 139 editions
3. **Library Management** - 5 libraries with staff and members
4. **Inventory and Collections** - 274 book copies and collections
5. **Transactions and Events** - Borrowing history with audit trails
6. **Social Features** - Reviews, follows, and sample invitations

**Expected Results**:
```
📊 Seeding Summary:
├── Users: 20
├── Authors: 30
├── General Books: 50
├── Book Editions: 139
├── Libraries: 5
├── Library Staff: 16
├── Library Members: 28
├── Book Copies: 274
└── Reviews: 63
```

**Test Credentials**: All users have password `Test123!@#`

### 4) Validate Database Architecture

Verify key components are working:

**Multi-Tenant Security**:
```sql
-- Check RLS is enabled on global tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('authors', 'general_books', 'book_editions', 'book_contributors')
AND rowsecurity = true;
-- Should return 4 rows
```

**Permission Functions**:
```sql
-- Test permission functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('user_has_permission', 'get_user_library_ids')
AND routine_schema = 'public';
-- Should return 2 functions
```

**Sample Data Query**:
```sql
-- Verify seeded data
SELECT
    l.name as library,
    COUNT(bc.id) as book_copies,
    COUNT(DISTINCT be.id) as unique_titles
FROM libraries l
LEFT JOIN book_copies bc ON l.id = bc.library_id
LEFT JOIN book_editions be ON bc.book_edition_id = be.id
GROUP BY l.id, l.name
ORDER BY l.name;
-- Should show 5 libraries with book inventory
```

### 5) Development Environment Verification

**Database Access**:
- Supabase Studio: http://localhost:54323 (browse data)
- Direct DB: localhost:54322 (for SQL clients)

**Test Users Available**:
- System Admins: 2 users
- Library Admins: 4 users
- Librarians: 6 users
- Readers: 8 users

**Multi-Library Setup**:
- 5 different libraries with unique inventories
- Staff distributed across libraries with proper permissions
- Members can borrow from their libraries
- Transaction history with events

## Blocking Conditions

**Stop and investigate if**:
- `supabase db reset` fails with migration errors
- Seeding script fails or shows incomplete data
- Permission functions not created
- RLS not enabled on expected tables
- Missing test users or empty tables

## Success Criteria

✅ **Database Reset Complete**:
- All migrations applied successfully
- No SQL errors in reset output

✅ **Seeding Complete**:
- 20+ users created across all roles
- 5 libraries with complete staff/member structure
- 200+ book copies distributed across libraries
- Social features populated (reviews, follows)

✅ **Security Architecture Active**:
- RLS enabled on all tables
- Multi-tenant permission functions working
- Global vs library-scoped data properly isolated

✅ **Ready for Development**:
- Supabase Studio accessible with populated data
- Test credentials available for all user types
- Complete borrowing workflow data available
- Performance views and functions active

## Common Issues & Solutions

**Migration Conflicts**:
- If reset fails, check migration file syntax
- Ensure all referenced tables exist in dependency order
- Check for duplicate policy names

**Seeding Failures**:
- Verify Node.js/PNPM available in supabase directory
- Check network access for Auth API calls
- Ensure migrations completed before seeding

**Missing Data**:
- Re-run seeding: `pnpm dlx tsx seed.ts`
- Check specific seed files in `supabase/seeds/` directory
- Verify foreign key relationships

**Permission Issues**:
- Confirm `user_has_permission` function exists
- Test with simple query: `SELECT user_has_permission('manage_catalog')`
- Check RLS policies are applied to target tables

## Development Workflow

This task should be run:
- **After new migrations** are added to ensure clean state
- **Before frontend development** to have realistic test data
- **When database inconsistencies** arise during development
- **For new team members** setting up local environment
- **Before integration testing** to ensure known state

**Note**: This task is safe to run multiple times - it completely resets the database each time.
