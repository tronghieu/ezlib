# Database Views and Functions Documentation

## Overview

EzLib's Supabase database leverages PostgreSQL views and functions to optimize performance, enforce business logic, and provide clean abstractions for complex operations. This document provides a comprehensive guide to all database views and functions, their purposes, and usage examples.

## Table of Contents

- [Core Utility Functions](#core-utility-functions)
- [Authentication & User Management](#authentication--user-management)
- [Library Access Control](#library-access-control)
- [Soft Delete Management](#soft-delete-management)
- [Book Management](#book-management)
- [Transaction Management](#transaction-management)
- [Social Features](#social-features)
- [Performance Views](#performance-views)

## Core Utility Functions

### `update_updated_at_column()`

**Purpose**: Automatically updates the `updated_at` timestamp when a row is modified.

**Type**: Trigger Function

**Usage**: Applied to all tables with `updated_at` columns via triggers.

```sql
-- Automatically applied via trigger
CREATE TRIGGER update_[table]_updated_at
    BEFORE UPDATE ON public.[table]
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

**Benefits**:
- Ensures consistent timestamp tracking across all tables
- Eliminates need for manual timestamp updates
- Provides audit trail for data modifications

## Authentication & User Management

### `handle_new_user()`

**Purpose**: Automatically creates user profile and preferences when a new auth user is created.

**Type**: Trigger Function

**Behavior**:
- Creates `user_profiles` entry with email and display name
- Creates `user_preferences` with default settings
- Handles errors gracefully to prevent blocking user creation
- Extracts metadata from auth.users (display_name, avatar_url)

```sql
-- Triggered automatically on auth.users INSERT
-- Populates:
-- - user_profiles.display_name (from metadata or email prefix)
-- - user_profiles.avatar_url
-- - user_preferences with defaults
```

### `handle_user_update()`

**Purpose**: Synchronizes user profile when auth.users data changes.

**Type**: Trigger Function

**Updates**:
- Email changes
- Display name changes
- Avatar URL changes
- Updates `updated_at` timestamp

### `handle_user_delete()`

**Purpose**: Handles cleanup when an auth user is deleted.

**Type**: Trigger Function

**Note**: Cascade deletes handle most cleanup automatically, but this function can be extended for custom archival logic.

## Library Access Control

### `get_library_role(target_library_id, target_user_id)`

**Purpose**: Returns a user's role in a specific library without triggering RLS recursion.

**Returns**: TEXT (role name or NULL)

**Parameters**:
- `target_library_id`: UUID of the library
- `target_user_id`: UUID of the user (defaults to auth.uid())

**Usage Example**:
```sql
-- Check current user's role
SELECT get_library_role('library-uuid-here');

-- Check specific user's role
SELECT get_library_role('library-uuid', 'user-uuid');
```

**Possible Return Values**:
- `'owner'`: Library owner with full permissions
- `'manager'`: Can manage most library operations
- `'librarian'`: Standard staff member
- `'volunteer'`: Limited permissions
- `NULL`: No role in library

### `user_has_library_access(target_library_id, target_user_id)`

**Purpose**: Boolean check if user has any active role in a library.

**Returns**: BOOLEAN

**Usage Example**:
```sql
-- Used in RLS policies
CREATE POLICY "Staff can view library data"
ON public.book_copies
FOR SELECT USING (
    user_has_library_access(library_id)
);
```

### `user_can_manage_staff(target_library_id, target_user_id)`

**Purpose**: Checks if user can manage staff (owner or manager only).

**Returns**: BOOLEAN

**Usage**: Primarily for RLS policies on staff management operations.

### `user_has_permission(permission_name, library_id_param, target_user_id)`

**Purpose**: Universal permission checker for multi-tenant system with optional library scoping.

**Returns**: BOOLEAN

**Parameters**:
- `permission_name`: TEXT - The permission to check (e.g., 'manage_inventory', 'manage_catalog')
- `library_id_param`: UUID - Optional library ID for library-specific checks (NULL for global)
- `target_user_id`: UUID - User to check permissions for (defaults to auth.uid())

**Usage Examples**:
```sql
-- Library-specific permission check
SELECT user_has_permission('manage_inventory', 'library-uuid');

-- Global permission check (any library)
SELECT user_has_permission('manage_catalog');

-- Check specific user's permission
SELECT user_has_permission('process_loans', 'library-uuid', 'user-uuid');
```

**Multi-Tenant Behavior**:
- **Library-scoped**: When `library_id_param` provided, checks permission in that specific library
- **Global**: When `library_id_param` is NULL, checks if user has permission in ANY library
- **Service role**: Always returns TRUE for system operations

**Supported Permissions**:
- `manage_members`: Add, edit, delete library members
- `manage_inventory`: Add, edit, delete book copies  
- `process_loans`: Create and manage borrowing transactions
- `manage_staff`: Add, edit, remove library staff
- `admin_settings`: Modify library settings and configuration
- `manage_catalog`: Edit global book content and metadata & collections
- `view_reports`: Access library analytics and reports

### `get_user_library_ids(target_user_id)`

**Purpose**: Returns array of library IDs where user is active staff member.

**Returns**: UUID[] (array of library IDs)

**Parameters**:
- `target_user_id`: UUID - User to get library IDs for (defaults to auth.uid())

**Usage Examples**:
```sql
-- Get current user's libraries
SELECT get_user_library_ids();

-- Get specific user's libraries
SELECT get_user_library_ids('user-uuid');

-- Used in RLS policies
CREATE POLICY "Staff can view data" ON some_table
FOR SELECT USING (library_id = ANY(get_user_library_ids()));
```

**Performance Benefits**:
- **Reusable**: Eliminates repeated subquery patterns in RLS policies
- **Optimized**: Single function call vs multiple complex subqueries
- **Maintainable**: Changes to staff lookup logic centralized
- **Clean**: `library_id = ANY(get_user_library_ids())` vs complex IN clauses

## Soft Delete Management

### `handle_member_soft_delete()`

**Purpose**: Converts DELETE operations to soft deletes for library members.

**Type**: Trigger Function

**Sets**:
- `is_deleted = TRUE`
- `deleted_at = NOW()`
- `deleted_by = [staff_id]`

### `handle_staff_soft_delete()`

**Purpose**: Soft delete for library staff members.

**Type**: Trigger Function

**Requirements**: Only owners/managers can soft delete staff.

### `handle_book_copy_soft_delete()`

**Purpose**: Soft delete for book inventory.

**Type**: Trigger Function

**Preserves**: Historical transaction data while removing from active inventory.

### `restore_soft_deleted(table_name, record_id, library_id)`

**Purpose**: Restores soft-deleted records.

**Returns**: BOOLEAN

**Parameters**:
- `table_name`: One of ('library_members', 'library_staff', 'book_copies')
- `record_id`: UUID of the record to restore
- `library_id`: UUID of the library (for permission check)

**Usage Example**:
```sql
-- Restore a soft-deleted book copy
SELECT restore_soft_deleted('book_copies', 'copy-uuid', 'library-uuid');
```

**Permissions**: Only library owners/managers can restore records.

## Book Management

### `get_book_authors(book_edition_id)`

**Purpose**: Efficiently retrieves comma-separated list of authors for a book edition.

**Returns**: TEXT

**Performance**: Replaces N+1 queries in React components with single function call.

**Usage Example**:
```sql
SELECT 
    title,
    get_book_authors(id) as authors
FROM book_editions;
```

**Output Format**: "Author One, Author Two, Author Three" or "Unknown Author"

### `search_books_by_library(library_id, search_term, limit)`

**Purpose**: Server-side book search with relevance scoring.

**Returns**: TABLE(book_copy_id UUID, relevance_score REAL)

**Parameters**:
- `library_id`: UUID of library to search
- `search_term`: Search string
- `limit`: Maximum results (default: 50)

**Relevance Scoring**:
- 1.0: Title match
- 0.9: ISBN match
- 0.8: Author match
- 0.1: Other matches

**Usage Example**:
```sql
SELECT * FROM search_books_by_library(
    'library-uuid',
    'Harry Potter',
    20
);
```

### `update_book_availability()`

**Purpose**: Updates book copy availability when transactions change.

**Type**: Trigger Function

**Updates**:
- Sets status to 'borrowed' on checkout
- Sets status to 'available' on return
- Updates current_borrower_id
- Creates transaction events for audit trail

**Validates**:
- Book copy must be active for checkout
- Prevents checkout of deleted books

## Transaction Management

Transaction management is primarily handled through triggers that automatically:
- Update book availability on checkout/return
- Create audit events
- Calculate late fees
- Track transaction history

## Social Features

### `process_invitation_acceptance(token, user_id, notes)`

**Purpose**: Processes library invitation acceptance.

**Returns**: JSONB with success status and details

**Process**:
1. Validates invitation token and expiry
2. Verifies email match
3. Creates library_staff or library_members entry
4. Updates invitation status
5. Creates audit trail

**Return Format**:
```json
{
    "success": true,
    "staff_id": "uuid",
    "member_id": "uuid",
    "library_id": "uuid",
    "role": "librarian"
}
```

### `decline_invitation(token, user_id, notes)`

**Purpose**: Declines a library invitation.

**Returns**: BOOLEAN

**Updates**:
- Sets invitation status to 'declined'
- Creates response record for audit

### `handle_invitation_expiration()`

**Purpose**: Automatically expires old invitations.

**Type**: Trigger Function

**Behavior**: Sets status to 'expired' when expires_at is passed.

## Performance Views

### `book_display_view`

**Purpose**: Optimized view for book listings combining copies, editions, and authors.

**Columns**:
- Book copy information (id, availability, status)
- Edition details (title, ISBN, metadata)
- Computed author display string
- Availability status

**Usage Example**:
```sql
SELECT * FROM book_display_view
WHERE library_id = 'library-uuid'
ORDER BY title
LIMIT 20;
```

### `book_search_view`

**Purpose**: Search-optimized view with pre-computed search fields.

**Features**:
- Lowercase search fields for case-insensitive matching
- Full-text search vector for PostgreSQL text search
- All fields from book_display_view

**Usage Example**:
```sql
-- Full-text search
SELECT * FROM book_search_view
WHERE search_vector @@ plainto_tsquery('english', 'harry potter');

-- Simple ILIKE search
SELECT * FROM book_search_view
WHERE title_search ILIKE '%harry%'
   OR authors_search ILIKE '%rowling%';
```

### `library_book_summary_view`

**Purpose**: Aggregated statistics for library dashboards.

**Provides**:
- Total book copies
- Unique titles count
- Available vs borrowed statistics
- Recent additions (last 30 days)

**Usage Example**:
```sql
SELECT * FROM library_book_summary_view
WHERE library_id = 'library-uuid';
```

## Best Practices

### When to Use Views vs Functions

**Use Views When**:
- Joining multiple tables frequently
- Pre-computing common aggregations
- Providing simplified data access
- Creating reusable query patterns

**Use Functions When**:
- Complex business logic required
- Dynamic parameters needed
- Avoiding RLS recursion
- Performing multi-step operations

### Performance Considerations

1. **Indexed Columns**: All views leverage underlying table indexes
2. **Materialized Views**: Consider for heavy aggregations (not currently used)
3. **Function Stability**: 
   - Use `STABLE` for read-only functions
   - Use `VOLATILE` for functions with side effects
4. **Security Definer**: Used to bypass RLS when needed for permission checks

### Security Guidelines

1. **RLS Compatibility**: Views inherit RLS from base tables
2. **SECURITY DEFINER**: Used carefully for permission functions
3. **Input Validation**: All functions validate inputs and permissions
4. **Audit Trails**: Critical operations create audit records

## Multi-Tenant RLS Policy Patterns

EzLib implements a sophisticated multi-tenant security model with two distinct data scopes:

### **Scope 1: Global Shared Data**
Tables: `authors`, `general_books`, `book_editions`, `book_contributors`

**Security Model**: If user has `manage_catalog` permission in ANY library, they can manage global catalog.

**Pattern**:
```sql
-- Global catalog management
CREATE POLICY "Catalog managers can modify" ON global_table
FOR ALL USING (user_has_permission('manage_catalog'));
-- Note: No library_id parameter = checks ANY library
```

### **Scope 2: Library-Scoped Data** 
Tables: `book_copies`, `collections`, `collection_books`, `library_members`, `library_staff`

**Security Model**: Users can only access data for libraries where they have active staff membership AND specific permissions.

**Patterns**:
```sql
-- View access: Staff can see data in their libraries
CREATE POLICY "Staff can view" ON library_scoped_table
FOR SELECT USING (library_id = ANY(get_user_library_ids()));

-- Modify access: Must have specific permission in that exact library
CREATE POLICY "Permission holders can modify" ON library_scoped_table
FOR ALL USING (user_has_permission('specific_permission', library_id));
```

### **Policy Pattern Examples**

**Book Copies (Library Inventory)**:
```sql
-- Public catalog browsing
CREATE POLICY "Public catalog" ON book_copies
FOR SELECT USING (
    library_id IN (SELECT id FROM libraries WHERE status = 'active') 
    AND is_deleted = false AND status = 'active'
);

-- Staff can view all inventory in their libraries
CREATE POLICY "Staff inventory view" ON book_copies
FOR SELECT USING (library_id = ANY(get_user_library_ids()));

-- Only inventory managers can modify
CREATE POLICY "Inventory modification" ON book_copies
FOR ALL USING (user_has_permission('manage_inventory', library_id));
```

**Collections (Library-Specific)**:
```sql
-- Public collections visible to all
CREATE POLICY "Public collections" ON collections
FOR SELECT USING (is_public = true);

-- Staff see all collections in their libraries  
CREATE POLICY "Staff collections" ON collections
FOR SELECT USING (library_id = ANY(get_user_library_ids()));

-- Only catalog managers can manage collections in their library
CREATE POLICY "Collection management" ON collections
FOR ALL USING (user_has_permission('manage_catalog', library_id));
```

### **Security Benefits**

1. **Multi-Tenant Isolation**: Staff from Library A cannot access Library B data
2. **Permission Granularity**: Different permissions for different operations
3. **Global vs Local**: Appropriate scope for shared vs library-specific data
4. **Performance**: Optimized functions avoid N+1 queries in policies
5. **Maintainability**: Centralized permission logic in reusable functions

## Migration Strategy

When adding new views or functions:

1. Create in numbered migration files
2. Include DROP statements for rollback
3. Add comprehensive comments
4. Update this documentation
5. Test with sample data
6. Verify RLS policies still work

## Monitoring & Optimization

### Query Performance

Monitor slow queries using:
```sql
-- Check view performance
EXPLAIN ANALYZE SELECT * FROM book_display_view WHERE library_id = '...';

-- Check function performance
EXPLAIN ANALYZE SELECT get_book_authors('book-edition-uuid');
```

### Index Usage

Verify indexes are being used:
```sql
-- Check index usage statistics
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

## Common Patterns

### Avoiding RLS Recursion

Use SECURITY DEFINER functions that query tables directly:
```sql
CREATE FUNCTION check_permission()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Direct table access bypasses RLS
$$;
```

### Efficient Aggregations

Pre-compute in views rather than client-side:
```sql
-- Good: Database aggregation
SELECT * FROM library_book_summary_view;

-- Avoid: Multiple queries from client
-- SELECT COUNT(*) FROM book_copies...
-- SELECT COUNT(DISTINCT...) FROM book_copies...
```

### Author String Building

Use database string aggregation:
```sql
STRING_AGG(author_name, ', ' ORDER BY sort_order)
```

## Troubleshooting

### Common Issues

1. **RLS Policy Conflicts**: Use permission functions to avoid recursion
2. **Slow View Performance**: Check underlying table indexes
3. **Function Not Found**: Verify schema search path
4. **Permission Denied**: Check SECURITY DEFINER and RLS policies

### Debugging Tips

```sql
-- Check current user
SELECT auth.uid();

-- Test permission functions
SELECT get_library_role('library-uuid');

-- Verify view results
SELECT * FROM book_display_view LIMIT 5;

-- Check execution plans
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
```

## Future Enhancements

### Recently Added (2024)

1. ✅ **Universal Permission Function**: `user_has_permission()` for multi-tenant access control
2. ✅ **Library ID Helper**: `get_user_library_ids()` for optimized RLS policies
3. ✅ **Multi-Tenant RLS**: Comprehensive security model with global vs library-scoped data
4. ✅ **Global Catalog Security**: RLS policies for shared book content tables

### Planned Additions

1. **Caching Layer**: Materialized views for heavy aggregations
2. **Search Optimization**: PostgreSQL full-text search improvements
3. **Analytics Views**: Reading trends and recommendations
4. **Batch Operations**: Functions for bulk imports/updates
5. **Notification System**: Trigger functions for real-time alerts
6. **Advanced Permissions**: Role-based permission inheritance and delegation
7. **Audit Enhancement**: Detailed change tracking for all modifications

### Performance Targets

- Book listing queries: < 50ms
- Search operations: < 100ms
- Dashboard aggregations: < 200ms
- Permission checks: < 10ms