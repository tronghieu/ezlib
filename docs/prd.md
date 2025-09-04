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
| 2025-09-03 | 1.3 | Updated terminology and table names to align with database schema (library_staff, book_copies, etc.) | PM John |
| 2025-09-03 | 2.0 | **MAJOR**: Simplified to master planning level - removed detailed stories, kept epic roadmap and architectural constraints for federated planning model | PM John |

## Requirements

### Functional Requirements

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
21. **FR21:** The system shall allow library staff with appropriate permissions to invite new staff members via email
22. **FR22:** The system shall support role-based invitations (owner, manager, librarian, volunteer) with configurable permissions
23. **FR23:** The system shall generate secure, unique invitation tokens that expire after 7 days
24. **FR24:** The system shall allow library staff to invite new library members via email invitation
25. **FR25:** The system shall validate that invitation recipients' email matches their registered account during acceptance
26. **FR26:** The system shall automatically create appropriate staff or member records upon invitation acceptance
27. **FR27:** The system shall allow invitations to be cancelled by the inviter or library managers before acceptance
28. **FR28:** The system shall maintain an audit trail of all invitation responses (accepted, declined, expired)
29. **FR29:** The system shall prevent duplicate pending invitations for the same email and library
30. **FR30:** The system shall automatically expire invitations that have passed their expiry date
31. **FR31:** The system shall track and display the number of available copies for each book (e.g., "4 of 6 copies available")
32. **FR32:** The system shall automatically update available copy counts when books are checked out or returned
33. **FR33:** The system shall allow library staff to manage multiple copies of the same book edition with individual tracking
34. **FR34:** The system shall prevent checkout when no copies are available and display appropriate messaging

### Non-Functional Requirements

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

## System Architecture & Integration Requirements

### Core Platform Components

1. **Reader App** (`apps/reader/`) - Public book discovery at `ezlib.com`
2. **Library Management App** (`apps/library-management/`) - Staff operations at `manage.ezlib.com`
3. **Crawler Service** (`services/crawler/`) - Book metadata enrichment
4. **Shared Database** (`supabase/`) - PostgreSQL with Row Level Security

### Integration Contracts

**Real-time Data Sync:**
- Book availability status synchronized between apps within 500ms
- Supabase subscriptions for live inventory updates
- Borrowing request workflow between reader and management apps

**Authentication Architecture:**
- Single registration point: Reader app only (`ezlib.com`)
- Passwordless email OTP authentication via Supabase Auth
- Cross-domain access: Independent login sessions
- Role-based permissions: readers (default) + library_staff (management access)

**Database Schema Requirements:**
- Multi-tenant with RLS policies for library isolation
- Core tables: libraries, library_staff, library_members, book_copies, borrowing_transactions
- Supporting tables: authors, general_books, book_editions
- Audit logging for critical operations

### Platform Standards

**Performance:**
- Page load times: <3 seconds
- API response times: <500ms
- Real-time sync: <500ms latency
- Uptime: 99.5%+ during business hours

**Scale Targets:**
- Libraries: Support for small/medium libraries (1-3 staff, up to 5K books, 1K members)
- Concurrent users: 10+ staff per library
- Multi-tenant: Complete data isolation via RLS

**Technology Standards:**
- Frontend: Next.js 15+, TypeScript, Tailwind CSS, shadcn/ui
- Database: Supabase PostgreSQL with direct client connections
- Authentication: Supabase Auth with email OTP
- Hosting: Vercel for apps, Supabase for backend
- Package Management: PNPM for monorepo

**Quality Standards:**
- Browser support: Chrome 90+, Firefox 85+, Safari 14+, Edge 90+
- Accessibility: WCAG 2.1 AA compliance
- Responsive design: Desktop + tablet optimized
- Data protection: Library confidentiality standards

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

## Epic Roadmap

### Epic 1: Foundation & Authentication
**Owner**: Core Platform Team
**Timeline**: MVP Phase 1
**Success Metrics**: Deployable authentication system, multi-tenant database operational

**Core Deliverables:**
- Multi-application monorepo infrastructure (reader app, library management, crawler service)
- Shared Supabase database with RLS policies for multi-tenant isolation
- Passwordless email OTP authentication with cross-domain access strategy
- Role-based permission system (readers + library_staff)

**Key Architectural Constraints:**
- Single registration point: Reader app only (`ezlib.com`)
- Independent login sessions between `ezlib.com` and `manage.ezlib.com`
- Direct Supabase client connections (no API layer)
- Real-time subscriptions for cross-app synchronization

---

### Epic 2: Library Operations
**Owner**: BMad Sub-team (`apps/library-management/`)
**Timeline**: MVP Phase 1
**Success Metrics**: Library staff can replace manual/spreadsheet systems, 90% daily usage

**Core Deliverables:**
- Ultra-simple book inventory management (title, author, availability status)
- Basic member registration and lookup
- One-click checkout/return operations (no due dates initially)
- Simple reporting and dashboard

**Integration Requirements:**
- Real-time sync with reader app for book availability
- Optional ISBN lookup via crawler service
- Multi-tenant data isolation per library

---

### Epic 3: Reader Discovery & Borrowing
**Owner**: Reader Experience Team (`apps/reader/`)
**Timeline**: MVP Phase 2
**Success Metrics**: Reader engagement with digital library browsing, successful borrowing workflows

**Core Deliverables:**
- Public book catalog browsing across participating libraries
- Book borrowing request system for readers
- Staff request approval/decline workflow
- Complete borrowing lifecycle management

**Integration Requirements:**
- Real-time book availability from library management app
- Cross-domain user authentication flow
- Request notifications and status updates

---

### Epic 4: Internationalization & Localization
**Owner**: Platform Team
**Timeline**: Post-MVP
**Success Metrics**: Multi-language support, cultural localization for global deployment

**Core Deliverables:**
- Location-based language detection during registration
- User-configurable country/language preferences
- Cultural formatting (dates, numbers, regional conventions)
- Translation management system

**Technical Requirements:**
- Next.js i18n infrastructure across all apps
- ICU message formatting for cultural appropriateness
- Right-to-left (RTL) language support architecture

---

### Epic 5: Advanced Features & Multi-tenant Administration
**Owner**: Library Management Team (`apps/library-management/`)
**Timeline**: Post-MVP Phase 2
**Success Metrics**: Comprehensive reporting, bulk operations, administrative efficiency

**Core Deliverables:**
- Standard library reports and analytics dashboard
- Bulk operations for books and member management
- Advanced staff management with granular permissions
- System configuration and policy management
- Integration framework for external services

**Technical Requirements:**
- Advanced reporting engine with export capabilities
- Bulk data processing and validation
- Role-based access control matrix
- API integration framework for third-party services

## Sub-team Planning Guidelines

### For Sub-team Product Managers:

**What You Own:**
- Detailed story breakdown with acceptance criteria
- Sprint planning and resource allocation
- Domain-specific UX and business rules
- Quality execution and testing strategy
- Risk management and timeline delivery

**What You Must Align With:**
- Epic success metrics and timeline
- Integration contracts with other components
- Architectural constraints and technology standards
- Database schema and authentication patterns

### Planning Template for Sub-teams:

```yaml
epic_name: "Your Epic Name"
owner: "Your Team"
success_metrics: ["Specific measurable outcomes"]
architectural_constraints: ["Platform requirements you must follow"]
integration_points: ["Other apps/services you connect to"]

stories:
  - story_id: "X.Y"
    title: "Detailed user story"
    acceptance_criteria: ["Detailed implementation requirements"]
    dependencies: ["Other stories or external requirements"]
    risk_level: "low/medium/high"
```

### Integration Contracts Between Sub-teams:

**Real-time Data Sync:**
- Book availability status: Library Management → Reader App (< 500ms)
- Borrowing requests: Reader App → Library Management
- User authentication state: Cross-domain coordination

**Database Schema Coordination:**
- Core tables: Managed by Platform Team via migrations
- Application-specific tables: Managed by respective sub-teams
- RLS policies: Reviewed by Platform Team for security

## Next Steps & Sub-team Handoffs

### For Sub-team Product Managers

**BMad Team (Library Management)**:
✅ **Status**: Already executing successfully with detailed PRD in `apps/library-management/docs/prd.md`
**Action**: Continue current approach - your detailed planning demonstrates best practice for federated model

**Reader Experience Team**:
**Action**: Create detailed PRD for Epic 3 using BMad's approach as template
**Focus**: Public book discovery, borrowing requests, user authentication flows
**Key Constraint**: Must integrate seamlessly with BMad's library management workflows

**Platform Team**:
**Action**: Define detailed authentication and database migration strategy
**Focus**: Cross-domain session management, RLS policy templates, integration testing framework

### Integration Coordination

**Immediate Priority**: Establish integration testing framework to validate real-time sync between apps
**Monthly Sync**: Epic-level progress reviews with dependency coordination
**Quality Gates**: Each epic must pass integration tests with dependent components before release

### Architecture Specialist Prompts

**Frontend Architect**: Review platform technology standards and create shared component library specification for consistency across reader and library management interfaces

**Backend Architect**: Design comprehensive RLS policy framework and real-time synchronization architecture to support the multi-tenant, multi-application ecosystem

---

*Master PRD v2.0 - Federated Planning Model*
*Sub-team detailed planning: See respective app directories for implementation PRDs*
