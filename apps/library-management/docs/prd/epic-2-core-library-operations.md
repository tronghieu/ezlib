# Epic 2: Core Library Operations

**Epic Goal:** Implement comprehensive book inventory management and member database functionality that enables library staff to perform essential administrative tasks including book cataloging with metadata enrichment, member registration and management, and basic search capabilities across all library data.

## Story 2.1: Book Inventory Management Interface

As a **library staff member**,  
I want **to view, search, and filter the complete book inventory**,  
so that **I can quickly find books, check availability status, and manage the collection efficiently**.

**Acceptance Criteria:**
1. Inventory table displays books with title, author, ISBN, availability status, and location information
2. Search functionality works across title, author, ISBN, and genre fields with real-time filtering
3. Advanced filters available for availability status, genre, publication year, and acquisition date
4. Pagination or virtualized scrolling for large inventories (up to 5,000 books)
5. Sort functionality on all major columns (title, author, acquisition date, status)
6. Bulk selection capabilities for future batch operations
7. Export functionality for inventory reports in CSV format
8. Loading states and error handling for all data operations
9. Real-time updates when book status changes through circulation activities

## Story 2.2: Add New Books with ISBN Lookup

As a **library staff member**,  
I want **to add new books to inventory with automatic metadata enrichment**,  
so that **cataloging is efficient and book information is accurate and complete**.

**Acceptance Criteria:**
1. Add book form supports both ISBN lookup and manual entry modes
2. ISBN-13 validation with proper format checking and error messages
3. Integration with crawler service for automatic metadata enrichment from external APIs
4. Manual entry form for books without ISBNs (title, author, publisher, year, genre)
5. Book cover image handling through Supabase storage or URL reference
6. Duplicate detection prevents adding books that already exist in inventory
7. Success notification confirms book addition with option to add another immediately
8. Form validation ensures required fields are completed before submission
9. Added books immediately appear in inventory with proper availability status

## Story 2.3: Book Details and Management

As a **library staff member**,  
I want **to view detailed book information and edit book records**,  
so that **I can maintain accurate inventory data and make necessary corrections**.

**Acceptance Criteria:**
1. Book detail view displays complete metadata including description, genre, and publication details
2. Edit functionality for all book fields except system-generated data
3. Book location management (shelf, section) with validation against library layout
4. Book condition tracking (new, good, fair, poor) with notes field
5. Historical view of book's circulation activity and maintenance records
6. Image upload/replacement functionality for book covers
7. Delete/remove book functionality with confirmation dialog and audit trail
8. Integration status display showing last metadata enrichment attempt
9. Manual re-enrichment option to update metadata from external sources

## Story 2.4: Member Management System

As a **library staff member**,  
I want **to register new members and manage existing member profiles**,  
so that **I can maintain accurate patron records and enable borrowing privileges**.

**Acceptance Criteria:**
1. Member registration form collects name, email, phone, address, and library preferences
2. Unique member ID generation with configurable format (auto-increment or custom)
3. Member search functionality by name, email, member ID, or phone number
4. Member profile view displays complete contact information and borrowing history
5. Edit member information with validation for email format and required fields
6. Member status management (active, suspended, expired) with effective dates
7. Communication preferences (email notifications, phone calls) configuration
8. Member export functionality for mailing lists and reports
9. Duplicate detection during registration to prevent multiple accounts

## Story 2.5: Member Profile and Borrowing History

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

## Story 2.6: Global Search and Discovery

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
