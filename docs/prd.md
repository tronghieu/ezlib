# EzLib Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Enable readers to browse and borrow books from local libraries through a simple digital interface
- Provide small/medium libraries with basic operational management tools for books, members, and borrowing
- Validate core book borrowing behavior before building advanced social discovery features
- Replace manual/spreadsheet-based library tracking with simple digital checkout system
- Create operational efficiency gains for resource-constrained libraries with 1-3 staff members

### Background Context

EzLib addresses the critical operational gap in small and medium libraries that lack integrated management systems, while simultaneously providing readers with digital access to local library collections. The platform focuses on the underserved community library market (70% operate without digital management systems) and validates core book borrowing workflows before expanding to social discovery features.

The minimalist MVP approach prioritizes immediate operational value for libraries - simple book listing, member tracking, and checkout/return workflows - while testing reader engagement with digital library browsing. This foundation enables future expansion into social book discovery and cross-library integration once core behaviors are validated.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-18 | 1.0 | Initial PRD creation from Project Brief | PM John |

## Requirements

### Functional

1. **FR1:** The system shall allow library staff to add books to their collection with title, author, and availability status (available/checked out)
2. **FR2:** The system shall allow library staff to create and manage member profiles with name and contact information
3. **FR3:** The system shall enable library staff to check out books to members with a single click action
4. **FR4:** The system shall enable library staff to check in returned books and update availability status
5. **FR5:** The system shall provide readers with a browsable list of available books at participating libraries
6. **FR6:** The system shall allow readers to request to borrow available books through the digital interface
7. **FR7:** The system shall notify library staff of reader borrowing requests for approval/decline
8. **FR8:** The system shall maintain real-time availability status for all books in the collection
9. **FR9:** The system shall provide basic member lookup functionality for library staff during checkout
10. **FR10:** The system shall allow library staff to view simple reports of checked out books and member activity

### Non Functional

1. **NFR1:** The system shall load pages in under 3 seconds on standard broadband connections
2. **NFR2:** The system shall be accessible via modern web browsers (Chrome 90+, Firefox 85+, Safari 14+, Edge 90+)
3. **NFR3:** The system shall maintain 99.5% uptime during business hours (9 AM - 9 PM local time)
4. **NFR4:** The system shall protect library patron data according to library confidentiality standards
5. **NFR5:** The user interface shall be intuitive enough for volunteers with basic computer literacy to use without extensive training
6. **NFR6:** The system shall handle up to 5,000 books and 1,000 active members per library without performance degradation
7. **NFR7:** The system shall work on both desktop and mobile devices with responsive design
8. **NFR8:** The system shall provide data backup and recovery capabilities to prevent loss of library records

## User Interface Design Goals

### Overall UX Vision

EzLib prioritizes simplicity and efficiency for two distinct user types: library staff performing operational tasks and readers browsing/requesting books. The interface emphasizes clear, task-focused workflows with minimal clicks and intuitive navigation. Library staff side focuses on professional, functional design that reduces administrative overhead, while reader side provides a clean, browsable book discovery experience similar to familiar e-commerce patterns.

### Key Interaction Paradigms

- **One-Click Operations:** Check out, check in, and borrow request actions require single click/tap
- **List-Based Views:** Books and members displayed in scannable list formats with key information visible
- **Search-First Navigation:** Quick search functionality for finding books and members without complex categorization
- **Status-Driven Design:** Clear visual indicators for book availability, member status, and system state
- **Progressive Disclosure:** Show essential information first, detailed views on demand

### Core Screens and Views

- **Library Staff Dashboard:** Central hub showing recent activity, pending requests, and quick access to key functions
- **Book Management Screen:** Add, edit, and view book collection with availability status
- **Member Management Screen:** View, search, and manage library member profiles
- **Checkout/Checkin Interface:** Streamlined workflow for processing book transactions
- **Reader Book Browser:** Public-facing catalog of available books with borrowing request functionality
- **Request Management Screen:** Library staff interface for approving/declining borrowing requests

### Accessibility: WCAG AA

Ensure keyboard navigation, screen reader compatibility, and sufficient color contrast for professional library environments and diverse user populations.

### Branding

Clean, professional aesthetic appropriate for institutional use. Neutral color palette with clear visual hierarchy. Avoid overly casual or consumer-focused design patterns that might undermine professional credibility with library stakeholders.

### Target Device and Platforms: Web Responsive

Web-first responsive design serving both desktop library workstations and mobile reader access. Prioritize desktop usability for library staff workflows while ensuring mobile reader experience remains functional and pleasant.

## Technical Assumptions

### Repository Structure: Monorepo

Single Next.js project containing both library staff interface and reader-facing components. This reduces initial complexity while allowing future extraction of services as the system scales beyond MVP validation phase.

### Service Architecture

**Monolithic Next.js Application with API Routes:** Server-side rendering with integrated API routes for all backend functionality. Database operations handled through Supabase client within API routes. This architecture minimizes infrastructure complexity while providing solid foundation for MVP validation and future microservice extraction if needed.

### Testing Requirements

**Unit + Integration Testing:** Jest for unit tests covering business logic and utility functions. API route integration tests for database operations and request/response cycles. Manual testing protocols for end-to-end user workflows, particularly library staff operational procedures and reader browsing/requesting flows.

### Additional Technical Assumptions and Requests

- **Database Technology:** Supabase (PostgreSQL) for all data persistence, user authentication, and real-time subscriptions for availability status updates
- **Frontend Framework:** Next.js 14+ with TypeScript for type safety and developer experience
- **Styling Approach:** Tailwind CSS for rapid UI development and consistent design system
- **Authentication:** Supabase Auth for user management with role-based access (library staff vs readers)
- **Deployment Platform:** Vercel for frontend hosting with automatic deployments from Git
- **Development Environment:** Local development using Supabase CLI for database schema management
- **Data Validation:** Zod schemas for API request/response validation and type inference
- **State Management:** React hooks and Context API for simple state needs, avoiding external state management libraries for MVP
- **Real-time Updates:** Supabase real-time subscriptions for book availability status across multiple concurrent users
- **Mobile Responsiveness:** Tailwind responsive utilities for mobile-first design approach

## Epic List

**Epic 1: Foundation & Authentication** 
Establish project infrastructure, database schema, and role-based authentication system distinguishing library staff from readers.

**Epic 2: Core Library Operations**  
Enable library staff to manage books and members with basic CRUD operations and simple reporting capabilities.

**Epic 3: Book Borrowing Workflow**
Implement the complete borrowing cycle from reader book browsing through staff approval and checkout/checkin processes.

## Epic 1: Foundation & Authentication

**Expanded Goal:** Establish secure, scalable project foundation with user authentication, database schema, and core infrastructure that differentiates library staff from readers. This epic delivers a deployable authentication system and prepares the technical foundation for all library operations and reader interactions.

### Story 1.1: Project Setup and Infrastructure

As a **developer**,
I want to establish the basic Next.js project structure with essential dependencies and configuration,
so that the development environment is ready for building EzLib features.

#### Acceptance Criteria
1. Next.js 14+ project created with TypeScript configuration
2. Tailwind CSS integrated and configured for styling
3. ESLint and Prettier configured for code quality
4. Git repository initialized with appropriate .gitignore
5. Package.json configured with all necessary dependencies (Supabase client, Zod, etc.)
6. Development scripts configured (dev, build, lint, test)
7. Basic project structure established (pages, components, lib, types directories)
8. Environment variables template created for Supabase configuration

### Story 1.2: Supabase Database Schema and Connection

As a **developer**,
I want to establish the database schema and Supabase connection,
so that the application can store and retrieve books, members, and borrowing data.

#### Acceptance Criteria
1. Supabase project created and configured
2. Database schema implemented with tables: libraries, books, members, borrowing_transactions
3. Row Level Security (RLS) policies configured for data protection
4. Supabase client configured in Next.js application
5. Database connection tested with basic health check
6. Migration scripts created for schema versioning
7. Seed data script created for development/testing purposes
8. Database types generated for TypeScript integration

### Story 1.3: User Authentication System

As a **library staff member** and **reader**,
I want to create accounts and login securely,
so that I can access appropriate features based on my role.

#### Acceptance Criteria
1. Supabase Auth integrated with email/password authentication
2. User registration flow implemented for both staff and readers
3. Login/logout functionality working correctly
4. User profiles table linked to auth.users
5. Role-based access control implemented (library_staff vs reader roles)
6. Protected routes middleware configured
7. Authentication state management implemented with React Context
8. Password reset functionality available
9. User session persistence across browser sessions

### Story 1.4: Library Registration and Management

As a **library administrator**,
I want to register my library and manage library-specific settings,
so that my staff can begin using the system for our collection.

#### Acceptance Criteria
1. Library registration form implemented with basic information fields
2. Library profiles stored in database with unique identifiers
3. Library staff can be associated with specific libraries
4. Library settings page created for basic configuration
5. Library selection functionality for staff with multi-library access
6. Library profile validation and error handling
7. Initial library dashboard created showing library information
8. Library deletion/deactivation functionality for administrators

## Epic 2: Core Library Operations

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

## Epic 3: Book Borrowing Workflow

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

## Next Steps

### UX Expert Prompt

Please review this PRD and create the front-end specification focusing on the dual-interface design (library staff operations vs reader browsing). Pay special attention to the mobile-responsive reader experience and professional desktop workflows for library staff.

### Architect Prompt

Please review this PRD and create the fullstack architecture specification. Focus on the monorepo Next.js + Supabase approach with particular attention to role-based access control, real-time book availability updates, and scalable data architecture for multi-library deployment.

---

*PRD created using the BMAD-METHOD framework*