# Library Management App Documentation

<!-- Powered by BMAD™ Core -->

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-24 | 1.0 | Initial documentation restructure according to BMad Method | BMad Orchestrator |

## Introduction

The **Library Management App** is the administrative dashboard for library staff to manage books, members, borrowing operations, and collections within the EzLib platform. This bounded context serves as the operational heart of library administration.

### Bounded Context Definition

- **Domain**: Library Operations and Administration  
- **Users**: Library staff (owners, managers, librarians)
- **Access**: `manage.ezlib.com` (subdomain-based routing)
- **Scope**: Internal library management processes and workflows

## Architecture Overview

The Library Management App operates within the EzLib monorepo architecture as an independent bounded context:

```plaintext
ezlib/
├── apps/
│   ├── reader/                 # Reader social app (ezlib.com) 
│   └── library-management/     # This app (manage.ezlib.com)
├── services/
│   └── crawler/               # Book metadata enrichment service
└── supabase/                  # Shared database and auth
```

### Integration Points

- **Database**: Direct Supabase connection with Row Level Security
- **Authentication**: Shared Supabase Auth with role-based access control  
- **Real-time**: Cross-app notifications for borrowing workflows
- **External Services**: Book crawler integration for metadata enrichment

## Key Features & Capabilities

### Core Administrative Functions

1. **📚 Inventory Management**
   - Add books via ISBN or manual entry with automatic metadata enrichment
   - Track physical book conditions, locations, and multiple copies
   - Bulk operations for new acquisitions and catalog maintenance
   - Integration with Book Crawler service for rich metadata

2. **👥 Member Management** 
   - Process member registrations and subscription renewals
   - Comprehensive member profiles with borrowing history
   - Role-based access control (active, inactive, banned states)
   - Member communication and notification tools

3. **📋 Transaction Workflow**
   - Real-time borrowing request processing and approvals
   - Physical check-out and return workflows
   - Overdue management and fee calculations
   - Complete audit trail for all transactions

4. **📂 Collection Organization**
   - Create and manage themed book collections  
   - Control public visibility for member discovery
   - Seasonal and featured collection management
   - Performance analytics for collection optimization

5. **📊 Analytics & Reporting**
   - Real-time dashboard with operational metrics
   - Borrowing trends and member engagement analytics
   - Collection performance and acquisition insights
   - Exportable reports for stakeholders

## Technical Architecture

### Technology Foundation
- **Framework**: Next.js 14+ with App Router (SSR optimized for admin workflows)
- **Language**: TypeScript (strict mode with comprehensive type safety)
- **Database**: Direct Supabase client integration with Row Level Security
- **UI System**: shadcn/ui + Tailwind CSS (professional admin interface)
- **State Management**: React Query (server state) + Zustand (client state)
- **Real-time**: Supabase subscriptions for operational notifications

### Security & Data Access
- **Authentication**: Shared Supabase Auth with admin role verification
- **Authorization**: Row Level Security policies for multi-tenant isolation
- **Data Protection**: Encrypted sensitive member data, audit logging
- **Access Control**: Fine-grained permissions (owner, manager, librarian)

### Performance & Scalability
- **Rendering**: Server-side rendering for SEO and initial load performance
- **Caching**: Query optimization with proper indexing and stale-while-revalidate
- **Real-time**: Selective subscriptions only for critical operational data
- **Pagination**: Virtualized tables for large datasets (books, members, transactions)

## Documentation Structure

This documentation follows BMad Method standards and includes:

| Document | Purpose | Audience |
|----------|---------|----------|
| **README.md** | Project overview and setup guide | All developers |
| **frontend-architecture.md** | Technical implementation details | Frontend developers |  
| **api-integration.md** | Database and service integration patterns | Backend developers |
| **user-workflows.md** | Staff workflows and use cases | UX designers, PMs |
| **technical-specification.md** | Legacy technical details | Reference only |

## Quick Start Guide

### Prerequisites
- Node.js 18+ and PNPM
- Access to EzLib Supabase project
- Library admin role in the system

### Development Setup
```bash
# From project root
cd apps/library-management

# Install dependencies
pnpm install

# Set up environment variables (copy from main project)
cp ../../.env.example .env.local

# Start development server
pnpm dev    # Runs on http://localhost:3001
```

### Key Development Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production  
pnpm start        # Start production server
pnpm test         # Run test suite
pnpm lint         # Run ESLint and type checking
pnpm storybook    # Start component documentation
```

## BMad Method Compliance

This project follows BMad Method standards for:
- ✅ **Documentation Structure**: Standardized sections and templates
- ✅ **Version Control**: Change logs and document versioning
- ✅ **Technical Standards**: Coding conventions and architecture patterns
- ✅ **Component Templates**: Reusable patterns and best practices
- ✅ **Testing Requirements**: Comprehensive testing strategy
- ✅ **Developer Experience**: Quick reference guides and setup instructions

## Next Steps

For implementation details, refer to:
1. **[Frontend Architecture](./frontend-architecture.md)** - Implementation patterns and code structure
2. **[API Integration](./api-integration.md)** - Database integration and service connections  
3. **[User Workflows](./user-workflows.md)** - Staff workflows and interaction patterns

---

*Generated using BMad Method v2.0 | Last updated: 2025-08-24*