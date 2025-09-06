# Data Access Security Rules

Comprehensive access control rules for all EzLib database tables, defining who can perform which operations under what conditions.

## Core User & Authentication

### `user_profiles`
- **READ**: All authenticated users (public profiles) + user owns profile
- **EDIT**: User owns profile only
- **CREATE**: System auto-creates on user registration
- **DELETE**: System cascade from auth.users deletion

### `user_preferences`
- **READ**: User owns preferences only
- **EDIT**: User owns preferences only
- **CREATE**: System auto-creates on user registration
- **DELETE**: System cascade from auth.users deletion

## Library Organization

### `libraries`
- **READ**: Public access for active libraries
- **EDIT**: Library staff with owner role for the library
- **CREATE**: System administrators + library owners
- **DELETE**: Library owners only

### `library_members`
- **READ**: User owns membership OR staff of the library
- **EDIT**: Owner, manager, librarian roles for the library
- **CREATE**: Owner, manager, librarian roles for the library
- **DELETE**: Apply soft delete update `is_deleted = true` (EDIT RULE)

### `library_staff`
- **READ**: User owns employment record OR owner/manager of same library
- **EDIT**: Owner role for the library only
- **CREATE**: Owner role for the library only
- **DELETE**: Apply soft delete update `is_deleted = true` (EDIT RULE)

## Global Book Content

### `authors`
- **READ**: Public access (no authentication required)
- **EDIT**: System crawler service + owner, manager, librarian roles (from any library)
- **CREATE**: System crawler service + owner, manager, librarian roles (from any library)
- **DELETE**: System administrators only

### `general_books`
- **READ**: Public access (no authentication required)
- **EDIT**: System crawler service + owner, manager, librarian roles (from any library)
- **CREATE**: System crawler service + owner, manager, librarian roles (from any library)
- **DELETE**: System administrators only

### `book_editions`
- **READ**: Public access (no authentication required)
- **EDIT**: System crawler service + owner, manager, librarian roles (from any library)
- **CREATE**: System crawler service + owner, manager, librarian roles (from any library)
- **DELETE**: System administrators only

### `book_contributors`
- **READ**: Public access (no authentication required)
- **EDIT**: System crawler service + owner, manager, librarian roles (from any library)
- **CREATE**: System crawler service + owner, manager, librarian roles (from any library)
- **DELETE**: System administrators only

## Library Inventory

### `book_copies`
- **READ**: Public access for active libraries (catalog browsing) - only active status copies visible to public
- **EDIT**: Owner, manager, librarian roles for the library
- **CREATE**: Owner, manager, librarian roles for the library
- **DELETE**: Apply soft delete update `is_deleted = true` (EDIT RULE)

**Status Values:**
- **active** (default): Available for borrowing and public catalog browsing
- **inactive**: Not available for borrowing, visible only to staff
- **damaged**: Requires maintenance, not available for borrowing
- **lost**: Missing from inventory, not available for borrowing  
- **maintenance**: Temporarily unavailable, undergoing repairs or processing

### `collections`
- **READ**: Public collections visible to all + staff see all for their library
- **EDIT**: Owner, manager, librarian roles for the library
- **CREATE**: Owner, manager, librarian roles for the library
- **DELETE**: Owner, manager, librarian roles for the library

### `collection_books`
- **READ**: Follows collection visibility rules
- **EDIT**: Owner, manager, librarian roles for the library
- **CREATE**: Owner, manager, librarian roles for the library
- **DELETE**: Owner, manager, librarian roles for the library

## Borrowing & Transactions

### `borrowing_transactions`
- **READ**: Member owns transaction OR staff of the library
- **EDIT**: Owner, manager, librarian, volunteer roles for the library
- **CREATE**: Owner, manager, librarian, volunteer roles for the library OR automated system
- **DELETE**: Prohibited (audit trail protection)

### `transaction_events`
- **READ**: Member owns related transaction OR staff of the library
- **EDIT**: Prohibited (immutable audit trail)
- **CREATE**: System processes + staff of the library
- **DELETE**: Prohibited (immutable audit trail)

## Social Features

### `reviews`
- **READ**: Public reviews visible to all + users see own regardless of visibility
- **EDIT**: Review author only
- **CREATE**: Authenticated users only
- **DELETE**: Review author only

### `author_follows`
- **READ**: Public author follows visible to all + users see own regardless of visibility
- **EDIT**: User owns follow relationship
- **CREATE**: Authenticated users only
- **DELETE**: User owns follow relationship

### `social_follows`
- **READ**: Public social follows visible to all + users see own regardless of visibility
- **EDIT**: User is follower only
- **CREATE**: Authenticated users only (as follower)
- **DELETE**: User is follower only

## Invitation System

### `invitations`
- **READ**: Inviter owns invitation OR library staff of the library OR invitation recipient by token
- **EDIT**: Inviter owns invitation OR owner role for the library
- **CREATE**: Owner role for the library
- **DELETE**: Inviter owns invitation OR owner role for the library

### `invitation_responses`
- **READ**: Library staff of the library OR invitation participant (inviter/responder)
- **EDIT**: Prohibited (immutable audit trail)
- **CREATE**: System processes + invitation recipients
- **DELETE**: Prohibited (immutable audit trail)

## Access Control Helpers

### Simplified Role-Based Access (No Granular Permissions)

### Role Hierarchy & Capabilities
- **owner**: 
  - Full library control (settings, deletion, staff management)
  - All catalog and inventory operations
  - All member and circulation operations
- **manager**: 
  - All operations except library settings/deletion and staff role management
  - Can manage catalog, inventory, members, circulation
  - Cannot invite/edit staff or change library settings
- **librarian**: 
  - Standard day-to-day operations
  - Catalog management, inventory, circulation, member management
  - Cannot manage staff or library settings
- **volunteer**: 
  - Circulation only (check-out, check-in, member lookup)
  - Cannot manage catalog, inventory, or members

### System Actors
- **service_role**: Full database access for system operations
- **authenticated**: Base role for logged-in users
- **anon**: Unauthenticated public access for catalog browsing

## Multi-Tenant Isolation

### Library Boundary Rules
- Staff can only access data for libraries where they have active employment
- Members can only access data for libraries where they have active membership
- All library-specific data is isolated by library_id foreign key constraints
- Cross-library access requires explicit multi-library staff relationships

### Data Sharing Rules
- Global book content (authors, books, editions) shared across all libraries
- User profiles public for social discovery across libraries
- Reviews and social features global but privacy-controlled
- Transaction and member data strictly library-isolated

### Security Boundaries
- Authentication required for all edit operations
- Public read access limited to discovery and catalog browsing
- Audit trails immutable once created
- Personal data (preferences, private member info) user-owned only
