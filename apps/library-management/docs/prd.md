# EzLib Library Management System Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable small/medium libraries (1-3 staff, up to 5K books, 1K members) to replace manual/spreadsheet systems with ultra-simple digital operations
- Deliver immediate operational value through basic book/member tracking before expanding to advanced features
- Demonstrate that simple digital tools can replace paper/spreadsheet tracking systems without overwhelming small library staff
- Provide real-time synchronization with public reader interface (ezlib.com) for seamless book availability updates
- Establish foundation for multi-tenant SaaS platform with passwordless email OTP authentication architecture
- Validate ultra-simple MVP approach (basic checkout/return, no due dates initially) before adding complexity

### Background Context

The EzLib Library Management System addresses a critical gap in the small library market, where 70% of facilities operate without integrated digital management systems. These libraries, typically serving up to 5,000 books and 1,000 active members with just 1-3 staff members, currently rely on manual processes and spreadsheet-based tracking that creates operational inefficiencies and data fragmentation.

This administrative web application (accessible at manage.ezlib.com) serves as the operational backbone for library staff, integrating with the broader EzLib ecosystem including the public reader interface (ezlib.com) and book metadata crawler service. The system follows an "ultra-simple first" philosophy - starting with basic book lists, member tracking, and one-click checkout/return operations before gradually adding complexity like due dates, overdue management, and advanced features.

The authentication strategy requires library staff to first register on the main reader platform (ezlib.com) using passwordless email OTP, then access the management interface through independent login, ensuring clear platform identity while enabling future cross-domain session sharing. By focusing specifically on small library needs rather than enterprise-scale solutions, the system prioritizes immediate operational value and adoption confidence over comprehensive feature sets.

### Change Log

| Date       | Version | Description                                                                                                                                | Author    |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 2024-08-25 | 2.0     | Major update: Ultra-simple MVP approach, passwordless email OTP authentication, cross-domain access strategy, internationalization support | John (PM) |
| 2024-08-24 | 1.0     | Initial PRD creation from project brief                                                                                                    | John (PM) |

## Requirements

### Functional Requirements

1. **FR1:** The system shall require users to first register on the main reader platform (ezlib.com) using passwordless email OTP authentication, then provide independent login access to manage.ezlib.com with role-based access control (owner, manager, librarian) across multiple libraries, with permissions enforced through Row Level Security policies and server-side authorization checks

2. **FR2:** The system shall provide ultra-simple book management with basic book lists containing title, author, ISBN, and available/checked-out status, with optional ISBN lookup integration to the crawler service for automatic metadata enrichment

3. **FR3:** The system shall maintain real-time book availability status synchronized with the public reader interface (ezlib.com) for seamless borrowing request workflows

4. **FR4:** The system shall provide simple member management with library patron names, email, and basic contact information, enabling library staff to register new members

5. **FR5:** The system shall process basic book check-out operations with one-click checkout to member and immediate availability status updates, initially without due date tracking

6. **FR6:** The system shall process basic book check-in operations with one-click return and immediate inventory status updates, initially without fine calculations

7. **FR7:** The system shall support enhanced circulation features (due dates, renewals, holds, overdue tracking) as post-MVP functionality after core validation

8. **FR8:** The system shall support enhanced overdue management (automated tracking, fine calculations, notifications) as post-MVP functionality

9. **FR9:** The system shall support automated member communications (email notifications, overdue notices) as post-MVP functionality

10. **FR10:** The system shall provide basic search capabilities across books (title, author) and members (name, email) with enhanced filtering as post-MVP functionality

11. **FR11:** The system shall support basic reporting (circulation statistics, member activity) with advanced analytics as post-MVP functionality

12. **FR12:** The system shall support multi-tenant architecture with complete data isolation between different libraries using Row Level Security policies

13. **FR13:** The system shall support cross-domain authentication between ezlib.com and manage.ezlib.com with independent login sessions and future cross-domain session sharing capability

14. **FR14:** The system shall maintain audit logs for all critical operations (check-outs, returns, member changes, inventory updates) for compliance and operational analysis

15. **FR15:** The system shall support internationalization framework for future multi-language and regional preferences as post-MVP enhancement

### Non-Functional Requirements

1. **NFR1:** The system shall achieve 99.9% uptime with response times under 2 seconds for all core operations

2. **NFR2:** The system shall support concurrent usage by up to 10 staff members per library without performance degradation

3. **NFR3:** The system shall ensure data security through HTTPS encryption, secure authentication, and SOC 2 compliance via Supabase

4. **NFR4:** The system shall implement comprehensive Row Level Security (RLS) for multi-tenant data isolation

5. **NFR5:** The system shall be accessible via modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

6. **NFR6:** The system shall provide responsive design optimized for desktop and tablet usage (1024px+ screens)

7. **NFR7:** The system shall maintain WCAG 2.1 AA accessibility standards for inclusive staff usage

8. **NFR8:** The system shall backup all data automatically with point-in-time recovery capabilities

9. **NFR9:** The system shall handle library datasets up to 5,000 books and 1,000 active members efficiently

10. **NFR10:** The system shall provide real-time data synchronization across all connected applications within 500ms

11. **NFR11:** The system shall support data export in standard formats (CSV, PDF) for reporting and compliance needs

12. **NFR12:** The system shall maintain audit trail retention for minimum 7 years for compliance and operational analysis

## User Interface Design Goals

### Overall UX Vision

The library management interface prioritizes operational efficiency and staff productivity through clean, intuitive workflows that minimize cognitive load and training time. The design emphasizes rapid task completion for high-frequency operations (check-out/check-in, member lookup, book search) while providing comprehensive functionality for less frequent administrative tasks. The interface should feel familiar to staff comfortable with basic web applications while providing professional reliability and data confidence essential for library operations.

### Key Interaction Paradigms

- **Dashboard-centric Navigation:** Primary dashboard provides at-a-glance operational status and quick access to common tasks
- **Search-first Approach:** Prominent search functionality for both books and members with intelligent autocomplete and filtering
- **Modal-based Workflows:** Complex operations (new member registration, book cataloging) use focused modal dialogs to maintain context
- **Contextual Actions:** Action buttons and menus appear contextually based on current selection and user permissions
- **Keyboard-friendly Operations:** Support for keyboard shortcuts and tab navigation for power users performing repetitive tasks
- **Real-time Status Updates:** Live indicators for book availability, member status, and system sync status

### Core Screens and Views

- **Main Dashboard:** Operational overview with quick stats, recent activity, and shortcuts to common tasks
- **Book Management:** Comprehensive book inventory with search, filtering, and bulk operations
- **Member Directory:** Complete member database with search, profiles, and borrowing history
- **Circulation Desk:** Dedicated check-out/check-in interface optimized for desk operations
- **Reports Center:** Standard and custom reports with filtering and export capabilities
- **Overdue Management:** Dedicated view for tracking and managing overdue items and communications
- **System Settings:** Library configuration, policies, user management, and integration settings
- **Audit Log:** Read-only system activity tracking for compliance and troubleshooting

### Accessibility: WCAG AA

The interface will meet WCAG 2.1 AA accessibility standards including proper keyboard navigation, screen reader compatibility, sufficient color contrast, and alternative text for all visual elements. This ensures usability for staff members with varying abilities and supports libraries' commitment to inclusive service.

### Branding

The interface will integrate with the broader EzLib design system while maintaining professional library aesthetics. Clean, modern styling with emphasis on readability and data clarity. Color palette will use calming, professional tones (blues, grays) with clear status indicators (green for available, red for overdue, amber for warnings). Typography will prioritize legibility for extended screen usage.

### Target Device and Platforms: Web Responsive

Primary target is desktop browsers (1024px+) with tablet responsiveness for circulation desk flexibility. The interface will be optimized for:

- **Desktop:** Full-featured interface with multi-column layouts and comprehensive data displays
- **Tablet (landscape):** Simplified layouts suitable for circulation desk operations and mobile inventory management
- **Modern browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ with progressive enhancement

## Technical Assumptions

### Repository Structure: Monorepo

The library management application will be developed within the existing EzLib monorepo structure as `apps/library-management/`. This follows the established pattern alongside `apps/reader/` and `services/crawler/`, enabling shared configurations, dependencies, and streamlined deployment while maintaining clear application boundaries.

### Service Architecture

**Direct Supabase Integration with Cross-Domain Architecture:** The application will connect directly to the shared Supabase PostgreSQL database without an intermediate API layer, following EzLib's architectural principle of direct client connections. The system supports cross-domain access between ezlib.com and manage.ezlib.com with independent login sessions. This approach provides:

- Real-time subscriptions for live data updates synchronized between reader and management apps
- Built-in Row Level Security for multi-tenant isolation with cross-domain session validation
- Reduced complexity and latency compared to custom API layers
- Seamless integration with existing database schema and RLS policies
- Independent authentication sessions with planned future cross-domain session sharing
- Event-driven real-time updates using Supabase subscriptions for book availability synchronization

### Testing Requirements

**Comprehensive Testing Strategy:** Implementation will include unit testing, integration testing with Supabase, and end-to-end user workflow testing:

- **Unit Tests:** Component logic, utility functions, and business rule validation
- **Integration Tests:** Database operations, real-time subscriptions, and crawler service integration
- **E2E Tests:** Critical user workflows (circulation operations, member management)
- **Manual Testing:** Convenience methods for testing multi-tenant scenarios and complex workflows

### Additional Technical Assumptions and Requests

**Frontend Technology Stack:**

- **Framework:** Next.js 14+ with App Router for server-side rendering and optimal performance
- **Language:** TypeScript 5.0+ with strict mode for type safety and developer productivity
- **UI Components:** shadcn/ui component library for consistent design system integration
- **Styling:** Tailwind CSS for rapid development and maintainable styles
- **State Management:** Zustand for client-side state with Supabase real-time integration

**Database and Backend Services:**

- **Database:** Existing Supabase PostgreSQL database with established schema from `/supabase/migrations/`
- **Authentication:** Supabase Auth with role-based access control and session management
- **Real-time:** Supabase subscriptions for live inventory and circulation updates
- **File Storage:** Supabase Storage for any document or image assets

**Integration Requirements:**

- **Crawler Service Integration:** Direct database updates from crawler service for book metadata enrichment
- **Reader App Synchronization:** Real-time inventory updates via shared database for patron-facing availability
- **Type Generation:** Automated TypeScript type generation from Supabase schema using `supabase gen types`

**Development and Deployment:**

- **Package Management:** PNPM for monorepo dependency management and workspace support
- **Build System:** Turbo for optimized monorepo builds and caching
- **Hosting:** Vercel deployment with edge caching and global CDN
- **Environment:** Local development with Supabase local stack, production with hosted Supabase

**Code Quality and Standards:**

- **Linting:** ESLint with TypeScript rules for code consistency
- **Formatting:** Prettier for automatic code formatting
- **Git Hooks:** Pre-commit hooks for linting, testing, and type checking
- **Documentation:** TSDoc comments for complex business logic and integration points

**Security and Compliance:**

- **Data Protection:** Leverage Supabase SOC 2 compliance for data security requirements
- **Multi-tenant Isolation:** Strict Row Level Security policies preventing cross-library data access
- **Audit Logging:** Database triggers for tracking all critical operations and changes
- **HTTPS Everywhere:** SSL/TLS encryption for all client-server communication

**Performance and Scalability:**

- **Database Optimization:** Proper indexing for search operations and reporting queries
- **Caching Strategy:** Vercel edge caching for static assets and selective data caching
- **Image Optimization:** Next.js Image component for book covers and library assets
- **Bundle Optimization:** Code splitting and lazy loading for optimal page load times

## Authentication & Registration Strategy

### Registration Flow (Reader App Only)

**Single Registration Point:** All user registration occurs exclusively on the Reader app (`ezlib.com`) to avoid user confusion and establish clear platform identity. Library staff must first register as readers before gaining access to management tools.

**Passwordless Email OTP Process:**

1. **Email Collection**: Library staff visit `ezlib.com` → enter email address → request verification code
2. **OTP Verification**: 6-digit code sent to email → user enters code for authentication
3. **Profile Setup**: User completes profile with display name, gender, language preference, and region selection
4. **Default Access**: All accounts created as readers with Supabase authenticated role

### Cross-Domain Access Strategy

**Early Stage Implementation:**

- **Independent Login**: Library staff must log in separately on `ezlib.com` and `manage.ezlib.com`
- **Registration Restriction**: Management app shows "Login with existing account" - no registration option
- **Clear Messaging**: Management app explains users must first register on main platform

**Role-Based Access Control:**

- **Default Role**: All users can access reader features (social book discovery) with authenticated role
- **Library Management Access**: Users gain admin capabilities when added to LibAdmin table for specific libraries
- **Permission Levels**: Owner, Manager, Librarian roles with granular permissions for each library

**Future Enhancement:** Planned implementation of cross-domain session sharing for seamless user experience between applications.

### Technical Implementation

**Supabase Authentication:**

- Email OTP authentication using `supabase.auth.signInWithOtp()`
- JWT tokens with role-based claims
- Row Level Security policies enforcing multi-tenant access

**User Profile Structure:**

- Base user record in `users` table
- Optional `lib_readers` records for library memberships
- Optional `lib_admins` records for management access
- Preference storage for language, region, notification settings

## Epic List

**Epic 1: Foundation & Passwordless Authentication**  
Establish project infrastructure, passwordless email OTP authentication with cross-domain access strategy, and basic library context management while delivering ultra-simple core functionality validation.

**Epic 2: Ultra-Simple Library Operations**  
Implement basic book lists, simple member management, and one-click checkout/return operations without due dates or complex tracking - focusing on core operational validation.

**Epic 3: Enhanced Circulation Management**  
Build comprehensive circulation features including due dates, renewals, holds, and overdue tracking that extend the ultra-simple foundation (post-MVP functionality).

**Epic 4: Advanced Features & Multi-tenant Administration**  
Complete the system with reporting, bulk operations, internationalization support, and administrative features for comprehensive library management (post-MVP functionality).

## Epic 1: Foundation & Passwordless Authentication

**Epic Goal:** Establish the technical foundation for the library management application including project setup, passwordless email OTP authentication with cross-domain access strategy, and basic library context management while delivering a deployable health check endpoint that validates the complete technical stack integration and ultra-simple core functionality.

### Story 1.1: Project Setup and Core Infrastructure

As a **developer**,  
I want **to establish the Next.js 14 project structure with essential dependencies and configuration**,  
so that **the development team has a solid technical foundation for building the library management application**.

**Acceptance Criteria:**

1. Next.js 14 App Router project created in `apps/library-management/` within the monorepo structure
2. TypeScript 5.0+ configuration with strict mode enabled and proper path aliases configured
3. Essential dependencies installed: shadcn/ui, Tailwind CSS, Supabase client libraries, React Query, Zustand, Zod
4. ESLint and Prettier configured with consistent formatting rules
5. Basic folder structure implemented following the technical specification (`app/`, `components/`, `lib/`, `types/`)
6. Turbo build configuration added for monorepo integration
7. Environment variable setup for Supabase connection and crawler service integration
8. Health check endpoint `/api/health` returns system status and database connectivity

### Story 1.2: Supabase Integration and Type Generation

As a **developer**,  
I want **to establish secure Supabase connection with generated TypeScript types**,  
so that **the application has type-safe database access and proper integration with the existing EzLib schema**.

**Acceptance Criteria:**

1. Supabase client configuration established with proper environment variables
2. TypeScript types generated from existing Supabase schema using `supabase gen types`
3. Database connection validated through health check endpoint
4. Row Level Security policies tested to ensure proper multi-tenant data isolation
5. Admin-specific database client wrapper created (`lib/supabase/admin-client.ts`)
6. Basic database query functions implemented for library and user data
7. Error handling established for database connection failures
8. Real-time subscription setup tested for future transaction updates

### Story 1.3: Cross-Domain Passwordless Authentication System

As a **library administrator**,  
I want **to access the library management system using my existing ezlib.com account with passwordless authentication**,  
so that **I can safely manage library operations through a unified authentication strategy while maintaining platform identity**.

**Acceptance Criteria:**

1. Management app displays "Login with existing account" with clear messaging that registration occurs on ezlib.com
2. Passwordless email OTP authentication integration using `supabase.auth.signInWithOtp()`
3. Cross-domain authentication that validates existing user accounts from reader platform
4. Authentication middleware implemented to protect admin routes and validate cross-domain sessions
5. `requireAdminAccess()` server-side function validates user permissions per library from LibAdmin table
6. Role-based permission system established (owner, manager, librarian) with granular permissions
7. Dynamic library assignment - users can have different roles across multiple libraries
8. Permission checking hooks (`useAdminPermissions`) implemented for UI state management
9. Authentication state persisted with independent sessions between ezlib.com and manage.ezlib.com
10. Clear user messaging explaining the two-step authentication flow and future session sharing plans

### Story 1.4: Library Context Management

As a **library administrator**,  
I want **to select which library I'm currently managing**,  
so that **all subsequent operations are scoped to the correct library context**.

**Acceptance Criteria:**

1. Library selection component displays all libraries where user has admin permissions
2. Selected library context persisted in URL parameters and local state
3. Library-specific data queries automatically filtered by selected library ID
4. UI clearly displays current library context in header/navigation
5. Library switching updates all active queries and real-time subscriptions
6. Error handling for invalid or inaccessible library selections
7. Default library selection logic based on user's primary admin role
8. Breadcrumb navigation shows current library context throughout the application

### Story 1.5: Basic Dashboard and Navigation

As a **library administrator**,  
I want **to see a dashboard overview and navigate between different management sections**,  
so that **I have immediate visibility into library operations and can efficiently access different administrative functions**.

**Acceptance Criteria:**

1. Main dashboard displays basic library statistics (total books, active members, pending transactions)
2. Navigation sidebar with links to all major sections (Inventory, Members, Transactions, Reports, Settings)
3. Responsive layout that works on desktop and tablet devices
4. User profile dropdown with logout functionality and current role display
5. Library switcher component in main navigation for multi-library administrators
6. Quick action shortcuts for common tasks (Add Book, Register Member, Process Return)
7. Recent activity feed showing latest transactions and system events
8. Navigation state persistence across page refreshes and browser sessions
9. Loading states and error boundaries for all dashboard components

## Epic 2: Ultra-Simple Library Operations

**Epic Goal:** Implement ultra-simple book lists, basic member management, and one-click checkout/return operations without due dates or complex tracking, enabling library staff to replace manual/spreadsheet systems with digital tools while validating core operational workflows before adding complexity.

### Story 2.1: Ultra-Simple Book List Interface

As a **library staff member**,  
I want **to view and manage a simple book list with basic information**,  
so that **I can quickly see what books we have and their availability status without complex features overwhelming the interface**.

**Acceptance Criteria:**

1. Simple book list displays title, author, ISBN, and available/checked-out status only
2. Basic search functionality across title and author fields with simple text matching
3. Clear available/checked-out status indicators using color coding (green/red)
4. Simple pagination for book lists (up to 5,000 books)
5. Basic sorting by title and author only - no complex filtering initially
6. Real-time status updates when books are checked out or returned
7. Loading states and error handling for data operations
8. Mobile-responsive design for tablet usage at circulation desk
9. Add new book button prominently displayed for easy access

### Story 2.2: Ultra-Simple Add New Books

As a **library staff member**,  
I want **to add new books with minimal required information**,  
so that **I can quickly build our book inventory without complex cataloging workflows**.

**Acceptance Criteria:**

1. Simple add book form with only required fields: title, author, ISBN (optional)
2. Optional ISBN lookup integration with crawler service for metadata enrichment
3. Manual entry fallback for books without ISBNs - title and author minimum required
4. Duplicate detection prevents adding books with same title/author combination
5. All new books automatically set to "available" status
6. Simple success notification with option to "Add Another Book"
7. Basic form validation ensures title and author are provided
8. Added books immediately appear in book list with available status
9. No complex cataloging fields (genre, publisher, etc.) in initial version

### Story 2.3: Book Details and Management

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

### Story 2.4: Ultra-Simple Member Management

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

### Story 2.5: Ultra-Simple Checkout and Return Operations

As a **library staff member**,  
I want **to check out books to members and check them back in with simple one-click operations**,  
so that **I can track book borrowing without complex due date management or fine calculations**.

**Acceptance Criteria:**

1. One-click checkout: select book, select member, click "Check Out" - no due dates initially
2. One-click return: scan/select book, click "Check In" - immediate status change to available
3. Book status instantly updates from "available" to "checked out" and vice versa
4. Member profile shows simple list of currently checked-out books
5. Real-time sync with reader app so book availability updates instantly on ezlib.com
6. Basic checkout history for member profile (book title, checkout date, return date)
7. Simple checkout validation (book must be available, member must exist)
8. No overdue tracking, fines, or renewal functionality in this version
9. Transaction logging for basic audit trail and checkout statistics

### Story 2.6: Member Profile and Borrowing History

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

### Story 2.6: Global Search and Discovery

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

## Epic 3: Enhanced Circulation Management (Post-MVP)

**Epic Goal:** Extend the ultra-simple foundation with comprehensive circulation features including due date tracking, renewal processes, holds management, and automated overdue tracking with notifications, transforming the basic checkout/return system into a full-featured circulation management platform.

### Story 3.1: Book Check-Out Process

As a **library staff member**,  
I want **to check out books to members quickly and accurately**,  
so that **patrons can borrow materials efficiently while maintaining proper inventory tracking**.

**Acceptance Criteria:**

1. Check-out interface supports both member ID lookup and book ISBN/barcode scanning
2. Member verification displays current checkout status, holds, and any restrictions (overdue items, fines)
3. Book availability validation prevents checkout of already borrowed or unavailable items
4. Due date calculation based on configurable library policies (loan periods by item type)
5. Multiple book checkout in single transaction with batch processing
6. Hold queue processing - automatically assigns books to members with pending holds
7. Real-time inventory status updates synchronized with public reader interface
8. Receipt generation (digital/printable) with due dates and renewal information
9. Transaction logging for audit trail and member borrowing history

### Story 3.2: Book Check-In and Return Processing

As a **library staff member**,  
I want **to process book returns efficiently and accurately**,  
so that **returned items are immediately available for other patrons and any fines are calculated correctly**.

**Acceptance Criteria:**

1. Check-in interface supports book scanning/lookup with immediate status updates
2. Automatic fine calculation for overdue returns based on library policies
3. Book condition assessment option (damaged, lost, needs repair) with appropriate processing
4. Hold fulfillment - automatic notification when returned book fills a pending hold
5. Bulk check-in processing for multiple returns in single session
6. Overdue notification clearing when items are returned
7. Real-time availability updates to public interface and internal inventory
8. Return receipt generation with fine information and payment options
9. Transaction history updates member profile immediately

### Story 3.3: Book Renewal System

As a **library staff member**,  
I want **to process book renewals for members**,  
so that **patrons can extend their borrowing period when items are not needed by others**.

**Acceptance Criteria:**

1. Renewal interface displays member's current checkouts with renewal eligibility
2. Automatic validation against renewal limits (maximum renewals per item)
3. Hold queue checking - prevents renewal if other members are waiting
4. Renewal period calculation extends due date according to library policies
5. Batch renewal processing for multiple items in single transaction
6. Renewal confirmation with new due dates communicated to member
7. Renewal history tracking in member profile and transaction logs
8. Integration with overdue management - renewals clear pending overdue status
9. Real-time updates to member notifications and public interface holds

### Story 3.4: Holds and Reservation Management

As a **library staff member**,  
I want **to manage book holds and reservations effectively**,  
so that **members can reserve unavailable books and be notified when they become available**.

**Acceptance Criteria:**

1. Hold placement interface validates member status and item availability
2. Hold queue display shows position, estimated availability date, and hold placed date
3. Automatic hold fulfillment when items are returned or become available
4. Hold notification system (email/system notification) when items are ready
5. Hold pickup time limits with automatic cancellation after configured period
6. Hold cancellation functionality for member requests or staff override
7. Priority hold processing for special circumstances (staff override capability)
8. Hold statistics and reporting for collection development insights
9. Integration with public reader interface for patron self-service hold management

### Story 3.5: Overdue Management and Tracking

As a **library staff member**,  
I want **to track overdue items and manage the associated processes**,  
so that **books are returned promptly and library policies are enforced consistently**.

**Acceptance Criteria:**

1. Overdue items dashboard shows all overdue materials with days overdue and fine amounts
2. Automated overdue notifications sent according to library escalation schedule
3. Fine calculation engine applies rates based on item type and overdue duration
4. Member communication tracking shows notification history and response status
5. Bulk overdue processing for generating notices and updating fine balances
6. Overdue item search and filtering by member, overdue duration, or fine amount
7. Grace period handling for recently returned items and system processing delays
8. Integration with member profiles to display overdue status and restrictions
9. Overdue analytics showing trends, chronic offenders, and collection insights

### Story 3.6: Circulation Desk Dashboard

As a **library staff member**,  
I want **a dedicated circulation workspace with real-time operational status**,  
so that **I can efficiently manage all circulation activities from a single interface**.

**Acceptance Criteria:**

1. Real-time statistics display (items checked out today, returns processed, overdues)
2. Quick action buttons for common tasks (check-out, check-in, member lookup, hold processing)
3. Recent transactions list with ability to reverse or modify recent actions
4. Active holds requiring pickup with notification status and hold dates
5. Priority alerts for overdue items, damaged materials, and system issues
6. Daily circulation summary with shift-end reporting capabilities
7. Integration with all circulation functions through embedded widgets or quick links
8. Customizable dashboard layout based on staff role and library workflows
9. Real-time synchronization status with public interface and external systems

## Epic 4: Advanced Features & Multi-tenant Administration (Post-MVP)

**Epic Goal:** Complete the professional library management system with comprehensive reporting capabilities, bulk operations, internationalization support, advanced administrative features, and system configuration tools that enable library directors to generate compliance reports, analyze operational performance, and configure library-specific policies for diverse library needs and regional requirements.

### Story 4.1: Standard Library Reports

As a **library administrator**,  
I want **to generate standard operational and compliance reports**,  
so that **I can monitor library performance, satisfy board reporting requirements, and make data-driven operational decisions**.

**Acceptance Criteria:**

1. Circulation statistics report (monthly/quarterly/annual) with checkout trends and popular titles
2. Member activity report showing registration trends, active vs. inactive members, and demographics
3. Overdue items report with fine collection status and chronic offender identification
4. Inventory reports including new acquisitions, condition assessments, and collection gaps
5. Financial summary report tracking fine collection, membership fees, and operational metrics
6. Customizable date ranges and filtering options for all report types
7. Export functionality in PDF and CSV formats for board presentations and data analysis
8. Automated report scheduling with email delivery for regular compliance reporting
9. Report templates for common library board and funding agency requirements

### Story 4.2: Analytics Dashboard and Insights

As a **library director**,  
I want **to access visual analytics and operational insights**,  
so that **I can understand library usage patterns, identify improvement opportunities, and demonstrate library impact to stakeholders**.

**Acceptance Criteria:**

1. Visual dashboard with charts showing circulation trends, member growth, and collection utilization
2. Popular items analysis identifying high-demand books and genres for acquisition planning
3. Member engagement metrics tracking borrowing frequency, renewal patterns, and member retention
4. Operational efficiency metrics including staff productivity and transaction processing times
5. Collection development insights showing underutilized items and genre demand trends
6. Comparative analysis tools for month-over-month and year-over-year performance tracking
7. Customizable dashboard widgets based on library priorities and reporting needs
8. Data export capabilities for further analysis in external business intelligence tools
9. Automated insights and recommendations based on library performance patterns

### Story 4.3: Bulk Operations and Data Management

As a **library staff member**,  
I want **to perform bulk operations on books and members efficiently**,  
so that **I can manage large-scale updates, imports, and maintenance tasks without repetitive manual work**.

**Acceptance Criteria:**

1. Bulk book import functionality with CSV template and validation for new acquisitions
2. Batch book metadata updates when publisher information or cataloging standards change
3. Mass member communication tools for library announcements, policy changes, and event notifications
4. Bulk fine adjustments and payment processing for special circumstances or policy changes
5. Batch book status updates for inventory maintenance, repairs, or collection weeding
6. Member data import/export for membership drives and system migrations
7. Bulk hold cancellation tools for discontinued items or collection changes
8. Data validation and error reporting for all bulk operations with rollback capabilities
9. Progress tracking and confirmation for all bulk operations affecting multiple records

### Story 4.4: Library Configuration and Policies

As a **library administrator**,  
I want **to configure library-specific policies and operational parameters**,  
so that **the system enforces our unique library rules, loan periods, and operational procedures**.

**Acceptance Criteria:**

1. Loan period configuration by item type (books, media, reference materials) with different durations
2. Fine structure setup with different rates for various item types and overdue durations
3. Renewal policy configuration including maximum renewals per item and renewal restrictions
4. Hold policy settings including hold duration, pickup time limits, and priority rules
5. Member policy configuration including registration requirements, membership duration, and borrowing limits
6. Notification templates customization for overdue notices, hold notifications, and general communications
7. Library information setup including hours, contact information, and service policies
8. System behavior configuration including grace periods, batch processing schedules, and integration settings
9. Backup and restore functionality for policy configurations and system settings

### Story 4.5: Staff Management and Permissions

As a **library owner**,  
I want **to manage staff accounts and assign appropriate permissions**,  
so that **different staff members have access levels appropriate to their roles while maintaining system security**.

**Acceptance Criteria:**

1. Staff account creation with role assignment (owner, manager, librarian) and permission configuration
2. Permission matrix showing which roles can access specific functions and data
3. Staff activity monitoring and audit logs for accountability and security purposes
4. Role-based dashboard customization reflecting different staff responsibilities and workflows
5. Multi-library staff assignment for administrators managing multiple library locations
6. Temporary permission elevation for special circumstances or coverage situations
7. Staff account deactivation and data access control when employees leave
8. Permission change audit trail tracking who modified access rights and when
9. Onboarding workflow for new staff including training mode and supervised access

### Story 4.6: System Administration and Maintenance

As a **library administrator**,  
I want **to monitor system health and perform maintenance operations**,  
so that **the library management system runs reliably and efficiently for daily operations**.

**Acceptance Criteria:**

1. System health dashboard showing database performance, API response times, and error rates
2. Data integrity monitoring with alerts for database inconsistencies or synchronization issues
3. Integration status monitoring for crawler service, reader app sync, and external API connections
4. Automated backup verification and restore testing capabilities
5. System activity logs with filtering and search capabilities for troubleshooting
6. Performance monitoring with alerts for slow queries or high resource usage
7. Library data export functionality for system migrations or external backup purposes
8. System usage statistics showing peak times, transaction volumes, and resource utilization
9. Maintenance mode capabilities for system updates and major configuration changes

### Story 4.7: Internationalization and Localization Support

As a **library administrator in a diverse community**,  
I want **the system to support multiple languages and regional preferences**,  
so that **our library staff and community can use the system in their preferred language with culturally appropriate formats**.

**Acceptance Criteria:**

1. Multi-language interface support with automatic location-based language detection
2. User-configurable language preferences with manual override capability
3. Localized date/time formats based on regional settings and user preferences
4. Cultural UI adaptations for libraries serving diverse communities
5. Library-specific customization options for region-appropriate workflows
6. Support for local compliance features and regulatory requirements
7. Culturally relevant interface elements and terminology choices
8. Language switching capability that persists across user sessions
9. Integration with existing EzLib ecosystem language preferences and user profile settings

## Next Steps

### UX Expert Prompt

The PRD is complete and ready for UI/UX specification development. Please create a comprehensive front-end specification using the `front-end-spec-tmpl` template, focusing on the dashboard-centric, search-first interface paradigms outlined in the UI Design Goals section. Pay special attention to the circulation desk workflows and multi-tenant library context switching requirements.

### Architect Prompt

The PRD provides detailed technical assumptions and system requirements. Please create the frontend architecture document using the `front-end-architecture-tmpl` template, ensuring seamless integration with the existing EzLib monorepo structure, Supabase direct connections, and real-time synchronization requirements. Consider the multi-tenant authentication patterns and performance requirements for libraries managing up to 5,000 books and 1,000 members.
