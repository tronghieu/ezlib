# Epic 2: Ultra-Simple Library Operations

**Epic Goal:** Implement ultra-simple book lists, basic member management, and one-click checkout/return operations without due dates or complex tracking, enabling library staff to replace manual/spreadsheet systems with digital tools while validating core operational workflows before adding complexity.

## Story 2.1: Ultra-Simple Book List Interface

As a **library staff member**,  
I want **to view and manage a simple book list with basic information**,  
so that **I can quickly see what books we have and their availability status without complex features overwhelming the interface**.

**Acceptance Criteria:**

1. Simple book list displays title, author, ISBN, and availability status showing "X of Y copies available"
2. Basic search functionality across title and author fields with simple text matching
3. Clear availability status indicators showing copy count with color coding (green for available, red for none available)
4. Simple pagination for book lists (up to 5,000 books)
5. Basic sorting by title and author only - no complex filtering initially
6. Real-time status updates when books are checked out or returned
7. Loading states and error handling for data operations
8. Mobile-responsive design for tablet usage at circulation desk
9. Add new book button prominently displayed for easy access

## Story 2.2: Ultra-Simple Add New Books

As a **library staff member**,  
I want **to add new books with minimal required information**,  
so that **I can quickly build our book inventory without complex cataloging workflows**.

**Acceptance Criteria:**

1. Book search combobox allows searching existing book editions by title with real-time results
2. If book edition exists, user can select it and skip to step 4 (add copies)
3. If book edition not found, "+ Add book edition" button expands inline edition form
4. Edition form includes author search combobox with real-time author suggestions
5. If author exists, user selects from list; if not found, "+ Add author" opens modal
6. Author modal allows creating new author with name and optional biography
7. After selecting/creating author, user completes edition details (title, year, publisher, ISBN)
8. Final step: user creates book copies with library-specific details (copy numbers, total copies, shelf location)
9. All new books automatically set to "available" status with immediate list visibility
10. Progressive form validation ensures required fields at each step
11. Success notification with option to "Add Another Book" resets to step 1

## Story 2.3: Book Copies Details and Management

As a **library staff member**,  
I want **to view detailed book information and edit book records**,  
so that **I can maintain accurate inventory data and make necessary corrections**.

**Acceptance Criteria:**

1. Book copy detail view displays complete metadata including book editions details
2. Edit functionality for all book copy fields except book edition information
3. Book copy location management (shelf, section) with validation against library layout
4. Book condition tracking (new, good, fair, poor) with notes field
5. Historical view of book's circulation activity and maintenance records
6. Delete/remove book copies functionality with confirmation dialog and audit trail
7. Role restrictions for editing book copies, allow all library staff can view but only librarian+ can edit

## Story 2.4: Ultra-Simple Member Management

As a **library staff member**,  
I want **to register new library members with basic contact information**,  
so that **I can track who can borrow books without complex member management workflows**.

**Acceptance Criteria:**

1. Simple member registration form: name, email, basic contact information only
2. Automatic member ID generation (simple auto-increment format)
3. Basic member search by name and email only
4. Simple member list showing name, email, and current checkout count
5. Basic member profile showing contact information and list of currently checked-out books
6. Edit member contact information with email format validation
7. All members default to "active" status - no complex status management initially
8. Duplicate detection by email address to prevent multiple accounts
9. No advanced features like fines, limits, or communication preferences in initial version

## Story 2.5: Ultra-Simple Checkout and Return Operations

As a **library staff member**,  
I want **to check out books to members and check them back in with simple one-click operations**,  
so that **I can track book borrowing without complex due date management or fine calculations**.

**Acceptance Criteria:**

1. One-click checkout: select book, select member, click "Check Out" - no due dates initially
2. One-click return: scan/select book, click "Check In" - immediate status update to increment available copies
3. Book availability status instantly updates showing remaining copies (e.g., "3 of 5 available" becomes "2 of 5 available")
4. Member profile shows simple list of currently checked-out books
5. Real-time sync with reader app so book availability updates instantly on ezlib.com
6. Basic checkout history for member profile (book title, checkout date, return date)
7. Simple checkout validation (book must be available, member must exist)
8. No overdue tracking, fines, or renewal functionality in this version
9. Transaction logging for basic audit trail and checkout statistics

## Story 2.6: Member Profile and Borrowing History

As a **library staff member**,  
I want **to view detailed member profiles with complete borrowing history**,  
so that **I can assist patrons effectively and make informed decisions about lending policies**.

**Acceptance Criteria:**

1. Complete borrowing history showing current and past transactions
2. Current checkouts display with due dates, renewal count, and overdue status
3. Hold/reservation queue with position and estimated availability
4. Fine and fee tracking with payment history and outstanding balances
5. Member notes field for staff communication and special circumstances
6. Borrowing statistics (total books borrowed, average checkout duration, favorite genres)
7. Contact information with last verification date and preferred communication method
8. Member since date and membership renewal requirements
9. Quick action buttons for common tasks (check out book, send notification, update contact)

## Story 2.6: Staff and Member Invitation System

As a **library staff member with appropriate permissions**,  
I want **to invite new staff members and library members via email**,  
so that **I can efficiently onboard team members and patrons with proper access controls and audit trails**.

**Acceptance Criteria:**

1. Staff invitation interface with role selection (owner, manager, librarian, volunteer) and email input
2. Member invitation capability for registered library patrons with email verification
3. Secure invitation token generation with 7-day expiry period
4. Email delivery of invitation links with library branding and clear instructions
5. Invitation acceptance flow that validates email match and creates appropriate records
6. Invitation status tracking (pending, accepted, declined, expired) with timestamps
7. Ability to cancel pending invitations before acceptance
8. Prevention of duplicate invitations for same email/library combination
9. Audit trail of all invitation activities for compliance and security
10. Role-based permissions automatically applied upon staff invitation acceptance

## Story 2.7: Global Search and Discovery

As a **library staff member**,  
I want **to search across all library data from a single interface**,  
so that **I can quickly find books, members, or transactions without navigating between different sections**.

**Acceptance Criteria:**

1. Global search bar accessible from all pages in main navigation
2. Search results categorized by type (Books, Members, Transactions) with result counts
3. Search across book titles, authors, ISBNs, member names, and transaction IDs
4. Auto-complete suggestions appear as user types with recent searches
5. Advanced search modal with specific filters for each data type
6. Search result links navigate directly to detailed views
7. Search history maintained for user session with quick re-search capability
8. Real-time search with debounced input for optimal performance
9. Empty state guidance when no results found with suggested search refinements
