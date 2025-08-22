# Epic 3: Book Borrowing Workflow

**Expanded Goal:** Connect reader book discovery with library staff operations through a complete digital borrowing workflow. Readers can browse available books and request borrowing, while library staff manage approvals and track the full borrowing lifecycle. This epic completes the core EzLib value proposition and validates end-to-end user adoption.

### Story 3.1: Public Book Browser for Readers

As a **reader**,
I want to browse books available at local libraries,
so that I can discover what books I might want to borrow.

#### Acceptance Criteria
1. Public-facing book catalog page showing available books from participating libraries
2. Book display includes title, author, library location, and availability status
3. Library filtering to show books from specific libraries
4. Basic search functionality by title and author for readers
5. Book availability updates in real-time as status changes
6. Mobile-responsive design for reader browsing on phones
7. Library information display (name, location) for each book
8. "Request to Borrow" button visible only for available books

### Story 3.2: Book Borrowing Request System

As a **reader**,
I want to request to borrow books that interest me,
so that I can access books from local libraries without visiting in person first.

#### Acceptance Criteria
1. "Request to Borrow" functionality for available books
2. Reader authentication required before making borrowing requests
3. Borrowing request form capturing reader contact preferences
4. Request confirmation message with expected response timeframe
5. Reader dashboard showing their pending and approved requests
6. Request history tracking for readers
7. Email notification to reader when request status changes
8. Ability for readers to cancel pending requests

### Story 3.3: Staff Request Management Interface

As a **library staff member**,
I want to review and manage borrowing requests from readers,
so that I can approve appropriate requests and maintain control over lending decisions.

#### Acceptance Criteria
1. Staff dashboard showing pending borrowing requests
2. Request details display including reader information and book details
3. One-click approve/decline functionality for borrowing requests
4. Approval automatically creates checkout transaction linking book to reader
5. Decline functionality with optional message to reader
6. Request filtering by status (pending, approved, declined)
7. Batch operations for managing multiple requests
8. Request history and audit trail for library records

### Story 3.4: Integrated Borrowing Transaction Management

As a **library staff member**,
I want to manage the complete borrowing lifecycle from request through return,
so that I can track books and ensure proper collection management.

#### Acceptance Criteria
1. Approved requests automatically appear in checkout interface
2. Physical book pickup confirmation workflow for staff
3. Integration with existing checkin system for request-based borrowings
4. Reader notification system for book ready for pickup
5. Request expiration handling for unclaimed approved books
6. Complete transaction history linking requests to checkouts to returns
7. Reader contact information readily available during all transaction phases
8. Overdue tracking for request-based borrowings with reader notification