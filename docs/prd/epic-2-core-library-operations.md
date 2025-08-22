# Epic 2: Core Library Operations

**Expanded Goal:** Provide library staff with essential operational tools to manage their book collection and member base, replacing manual/spreadsheet tracking with digital workflows. This epic delivers immediate operational value to libraries and validates staff adoption of digital tools before building reader-facing features.

### Story 2.1: Book Collection Management

As a **library staff member**,
I want to add and manage books in our collection,
so that I can maintain an accurate digital catalog of available books.

#### Acceptance Criteria
1. Book creation form with fields: title, author, availability status (available/checked out)
2. Book listing page showing all books with status indicators
3. Book editing functionality to update information and status
4. Book deletion capability with confirmation dialog
5. Basic book search functionality by title and author
6. Validation for required fields and duplicate prevention
7. Book status toggle (available ↔ checked out) with single click
8. Simple book statistics display (total books, available count, checked out count)

### Story 2.2: Member Registration and Management

As a **library staff member**,
I want to register and manage library members,
so that I can track who is eligible to borrow books from our collection.

#### Acceptance Criteria
1. Member registration form with name and contact information fields
2. Member listing page showing all registered members
3. Member profile editing capabilities
4. Member search functionality by name
5. Member status management (active/inactive)
6. Member deletion with confirmation and impact warning
7. Basic member statistics (total members, active count)
8. Member contact information validation and formatting

### Story 2.3: Basic Checkout and Checkin Operations

As a **library staff member**,
I want to check books out to members and process returns,
so that I can track which books are currently borrowed and by whom.

#### Acceptance Criteria
1. Checkout interface allowing staff to select book and member
2. Single-click checkout process creating borrowing transaction record
3. Automatic book status update to "checked out" upon checkout
4. Checkin interface showing currently checked out books
5. Single-click checkin process updating book availability and transaction status
6. Transaction history tracking (book, member, checkout date, return date)
7. Currently checked out books display with member information
8. Error handling for invalid checkout attempts (unavailable books, inactive members)

### Story 2.4: Basic Reporting and Library Dashboard

As a **library staff member**,
I want to view simple reports and dashboard information,
so that I can understand our library's activity and current status.

#### Acceptance Criteria
1. Library dashboard showing key metrics (books total/available, members total/active, current transactions)
2. Currently checked out books report with member details
3. Member activity report showing borrowing history
4. Popular books report based on checkout frequency
5. Overdue items identification (books checked out beyond typical return period)
6. Simple export functionality for basic reports (CSV format)
7. Date range filtering for activity reports
8. Visual indicators for important status information (overdue count, available inventory)