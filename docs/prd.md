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
| 2025-01-24 | 1.1 | Added Epic 4: Internationalization & Localization with location-based language detection, user country selection, and cultural formatting requirements | PM John |
| 2025-08-24 | 1.2 | Updated authentication strategy with passwordless email OTP, single-app registration flow, and cross-domain access requirements | PM John |

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
11. **FR11:** The system shall provide passwordless email authentication using 6-digit OTP codes
12. **FR12:** The system shall restrict new user registration to the Reader app only (`ezlib.com`)
13. **FR13:** The system shall require independent login sessions on Reader and Library Management apps
14. **FR14:** The system shall automatically grant reader access to all authenticated users
15. **FR15:** The system shall grant library management access only to users with LibAdmin records
16. **FR16:** The system shall collect user preferences (display name, gender, language, region) during registration
17. **FR17:** The system shall display interface content in the user's preferred language based on their country selection
18. **FR18:** The system shall automatically detect and default to the user's geographic location during registration
19. **FR19:** The system shall allow users to manually change their country/language preferences at any time
20. **FR20:** The system shall localize date formats, number formats, and cultural conventions based on user's country selection

### Non Functional

1. **NFR1:** The system shall load pages in under 3 seconds on standard broadband connections
2. **NFR2:** The system shall be accessible via modern web browsers (Chrome 90+, Firefox 85+, Safari 14+, Edge 90+)
3. **NFR3:** The system shall maintain 99.5% uptime during business hours (9 AM - 9 PM local time)
4. **NFR4:** The system shall protect library patron data according to library confidentiality standards
5. **NFR5:** The user interface shall be intuitive enough for volunteers with basic computer literacy to use without extensive training
6. **NFR6:** The system shall handle up to 5,000 books and 1,000 active members per library without performance degradation
7. **NFR7:** The system shall work on both desktop and mobile devices with responsive design
8. **NFR8:** The system shall provide data backup and recovery capabilities to prevent loss of library records
9. **NFR9:** The system shall support at least English and Spanish languages initially, with architecture for additional languages
10. **NFR10:** The system shall maintain consistent user experience across all supported languages without compromising functionality

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
- **Authentication:** Supabase Auth with passwordless email OTP for unified user management across domains
- **Deployment Platform:** Vercel for frontend hosting with automatic deployments from Git
- **Development Environment:** Local development using Supabase CLI for database schema management
- **Data Validation:** Zod schemas for API request/response validation and type inference
- **State Management:** React hooks and Context API for simple state needs, avoiding external state management libraries for MVP
- **Real-time Updates:** Supabase real-time subscriptions for book availability status across multiple concurrent users
- **Mobile Responsiveness:** Tailwind responsive utilities for mobile-first design approach
- **Internationalization:** Next.js i18n with react-intl for translation management, IP-based geolocation for automatic language detection, and ICU message formatting for cultural appropriateness
- **Localization Infrastructure:** Translation key management system, locale-specific routing, and right-to-left (RTL) language support architecture

## Epic List

**Epic 1: Foundation & Authentication** 
Establish project infrastructure, database schema, and role-based authentication system distinguishing library staff from readers.

**Epic 2: Core Library Operations**  
Enable library staff to manage books and members with basic CRUD operations and simple reporting capabilities.

**Epic 3: Book Borrowing Workflow**
Implement the complete borrowing cycle from reader book browsing through staff approval and checkout/checkin processes.

**Epic 4: Internationalization & Localization**
Enable multi-language support with automatic location-based language detection, user-configurable country preferences, and culturally appropriate localization for global library deployment.

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

### Story 1.3: Passwordless Email OTP Authentication System

As a **reader**,
I want to create an account and login using only my email address,
so that I can access book discovery and borrowing features without password management.

#### Acceptance Criteria
1. Supabase Auth integrated with email OTP authentication (no passwords)
2. Registration flow implemented exclusively on Reader app (`ezlib.com`)
3. OTP verification workflow: email input → 6-digit code → account creation
4. User profile creation form with display name, gender, language, and region selection
5. Login functionality on both apps (`ezlib.com` and `manage.ezlib.com`) using email OTP
6. User profiles table linked to auth.users with preference storage
7. Role-based access control: authenticated users = readers, LibAdmin records = management access
8. Protected routes middleware configured for both domains
9. Authentication state management implemented with React Context across apps
10. Clear messaging on management app directing users to register on main platform first

### Story 1.3.1: Cross-Domain Authentication Strategy

As a **library staff member**,
I want to access the management app using my existing reader account,
so that I can manage library operations without creating a separate account.

#### Acceptance Criteria
1. Management app (`manage.ezlib.com`) requires login but blocks new registration
2. Login interface explains users must first register on `ezlib.com`
3. Independent login sessions for early-stage implementation
4. LibAdmin table queries determine management app access for authenticated users
5. Appropriate error handling when authenticated users lack admin privileges
6. Logout functionality works independently on each domain
7. User session persistence per domain until cross-domain sharing implemented

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

## Epic 4: Internationalization & Localization

**Expanded Goal:** Enable EzLib to serve libraries and readers across different countries and language preferences through comprehensive internationalization support. Implement automatic location-based language detection during registration with user-configurable preferences, ensuring culturally appropriate interfaces for both library staff operations and reader experiences.

### Story 4.1: i18n Infrastructure and Configuration

As a **developer**,
I want to establish the internationalization infrastructure and configuration,
so that the application can support multiple languages and locales efficiently.

#### Acceptance Criteria
1. Next.js i18n configuration implemented with locale routing
2. React-intl integration for message formatting and translation management
3. Translation key extraction and management system established
4. Locale detection middleware configured for automatic language selection
5. ICU message format support for pluralization and number formatting
6. Development workflow established for adding new translations
7. Translation file structure organized by feature/page for maintainability
8. Fallback language configuration (English) for missing translations

### Story 4.2: User Location Detection and Country Selection

As a **reader** and **library staff member**,
I want the system to automatically detect my location and allow me to select my country preference,
so that I receive appropriate language and cultural formatting for my region.

#### Acceptance Criteria
1. IP-based geolocation service integrated for automatic country detection
2. Country selection interface available during user registration
3. Location detection runs automatically on first visit with user consent
4. Manual country selection override available in user profile settings
5. Country preference stored in user profile and persists across sessions
6. Geographic location API fallback handling for when detection fails
7. GDPR-compliant location detection with proper user consent
8. Country selection affects both language and regional formatting preferences

### Story 4.3: Core Interface Translation (English/Spanish)

As a **library staff member** and **reader**,
I want to use the system in my preferred language,
so that I can efficiently perform tasks without language barriers.

#### Acceptance Criteria
1. All user-facing text translated for English and Spanish languages
2. Library staff interface fully localized (dashboard, forms, buttons, messages)
3. Reader interface fully localized (book browser, requests, profile)
4. Dynamic language switching without page reload
5. Language selection persists across user sessions
6. Error messages and validation text translated appropriately
7. Help text and tooltips available in both languages
8. Email notifications sent in user's preferred language

### Story 4.4: Cultural and Regional Formatting

As a **user in different countries**,
I want dates, numbers, and cultural conventions to display in my familiar format,
so that the system feels natural and professional in my regional context.

#### Acceptance Criteria
1. Date formatting matches user's country conventions (MM/DD/YYYY vs DD/MM/YYYY vs YYYY-MM-DD)
2. Number formatting includes appropriate thousands separators and decimal points
3. Time formatting displays in 12-hour or 24-hour format based on regional preference
4. Currency display (if applicable) uses appropriate symbols and formatting
5. Address formatting matches country conventions for library addresses
6. Phone number formatting and validation matches country-specific patterns
7. Postal code validation adapts to country-specific formats
8. Right-to-left (RTL) language architecture prepared for future Arabic/Hebrew support

### Story 4.5: Admin Language Management Interface

As a **system administrator**,
I want to manage translations and language settings,
so that I can maintain accurate localization and add new language support.

#### Acceptance Criteria
1. Translation management interface for administrators
2. Missing translation detection and reporting
3. Translation key usage analytics to identify unused strings
4. Bulk translation import/export functionality (JSON/CSV formats)
5. Translation approval workflow for community contributors
6. Language pack version management and deployment
7. Translation quality metrics and user feedback collection
8. Automated testing for translation completeness across all supported languages

## Next Steps

### UX Expert Prompt

Please review this PRD and create the front-end specification focusing on the dual-interface design (library staff operations vs reader browsing). Pay special attention to the mobile-responsive reader experience and professional desktop workflows for library staff.

### Architect Prompt

Please review this PRD and create the fullstack architecture specification. Focus on the monorepo Next.js + Supabase approach with particular attention to role-based access control, real-time book availability updates, and scalable data architecture for multi-library deployment.

---

*PRD created using the BMAD-METHOD framework*