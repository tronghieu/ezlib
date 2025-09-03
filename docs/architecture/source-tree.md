# EzLib Source Tree Structure

## Overview

This document defines the multi-application structure for the EzLib platform, organizing standalone monolithic Next.js applications alongside supporting services. Each web application is self-contained with its own dependencies, build process, and deployment pipeline.

---

## Repository Root Structure

```
ezlib/
├── apps/                           # Standalone web applications
│   ├── reader/                     # Public reader social app (ezlib.com - DEFAULT) [PLANNED - NOT IMPLEMENTED]
│   ├── library-management/         # Library admin dashboard (manage.ezlib.com) [IMPLEMENTED - NextJS 15+]
│   └── public-site/               # Marketing/landing pages (optional) [NOT IMPLEMENTED]
├── services/                       # Backend services
│   └── crawler/                   # Python book crawler service [PARTIALLY IMPLEMENTED]
├── packages/                       # Shared libraries [MINIMAL - each app is self-contained]
│   └── types/                     # Shared TypeScript type definitions [IMPLEMENTED]
├── supabase/                       # Database configuration and migrations [IMPLEMENTED]
│   ├── config.toml                # Supabase local development config
│   ├── migrations/                # SQL migration files (5 migrations implemented)
│   ├── seeds/                     # Structured seed data files (snaplet-seed)
│   └── .gitignore                 # Supabase-specific gitignore
├── docs/                          # Project documentation
│   ├── architecture/              # Architecture documents
│   ├── stories/                   # Development stories
│   └── prd/                      # Product requirements
├── .bmad-core/                    # BMad method configuration
│   ├── agents/                    # Agent definitions
│   ├── tasks/                     # Reusable tasks
│   └── templates/                 # Document templates
├── .github/                       # GitHub Actions workflows
│   └── workflows/                 # CI/CD pipelines
├── scripts/                        # Shared development scripts [IMPLEMENTED]
└── README.md                      # Project overview
```

---

## Standalone Web Applications (`apps/`)

Each application is a complete, self-contained monolithic Next.js application with its own:
- Dependencies (`package.json`)
- Build pipeline (`next build`)
- Deployment configuration
- Database connection (direct Supabase)
- UI components (shadcn/ui)

### Reader Social App (`apps/reader/`) - **DEFAULT APP** [PLANNED]

**Purpose**: Public-facing social book discovery platform  
**Domain**: ezlib.com (main domain - default when users visit the website)  
**Framework**: Next.js 15.5.2 App Router (monolithic architecture)
**Status**: Not yet implemented

```
apps/reader/
├── public/                        # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── src/
│   ├── app/                      # Next.js 14 app router
│   │   ├── (auth)/               # Route groups for auth pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/          # Protected reader dashboard
│   │   │   ├── profile/
│   │   │   ├── library/
│   │   │   └── social/
│   │   ├── books/                # Book discovery and details
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # Book details page
│   │   │   │   └── reviews/     # Book reviews
│   │   │   ├── discover/
│   │   │   └── search/
│   │   ├── authors/              # Author pages
│   │   │   └── [id]/
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   ├── books/
│   │   │   ├── reviews/
│   │   │   └── social/
│   │   ├── globals.css
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── index.ts
│   │   ├── book/                 # Book-related components
│   │   │   ├── BookCard.tsx
│   │   │   ├── BookDetails.tsx
│   │   │   ├── BookGrid.tsx
│   │   │   └── BookSearch.tsx
│   │   ├── social/               # Social features
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   └── FollowButton.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── forms/                # Form components
│   │       ├── LoginForm.tsx
│   │       ├── ReviewForm.tsx
│   │       └── SearchForm.tsx
│   ├── lib/                      # Utility libraries
│   │   ├── api/                  # API client functions
│   │   │   ├── books.ts
│   │   │   ├── auth.ts
│   │   │   ├── reviews.ts
│   │   │   └── social.ts
│   │   ├── stores/               # Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   ├── book-store.ts
│   │   │   └── social-store.ts
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-books.ts
│   │   │   └── use-debounce.ts
│   │   ├── utils.ts              # Utility functions
│   │   ├── constants.ts          # App constants
│   │   ├── validations.ts        # Form validations
│   │   └── supabase.ts           # Supabase client
│   └── types/                    # TypeScript definitions
│       ├── api.ts
│       ├── book.ts
│       ├── user.ts
│       └── social.ts
├── __tests__/                    # Test files
│   ├── components/
│   ├── pages/
│   └── lib/
├── .env.local.example           # Environment variables template
├── eslint.config.mjs           # ESLint configuration (ESLint 9+)
├── .gitignore
├── components.json              # shadcn/ui configuration
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Jest setup
├── next.config.ts              # Next.js configuration (TypeScript)
├── package.json
├── postcss.config.mjs          # PostCSS configuration (ES modules)
├── tailwind.config.js          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

### Library Management App (`apps/library-management/`) [IMPLEMENTED]

**Purpose**: Administrative dashboard for library staff  
**Domain**: manage.ezlib.com (subdomain for library management)  
**Framework**: Next.js 15.5.2 App Router (monolithic architecture)
**Status**: Currently implemented and in active development

```
apps/library-management/
├── src/
│   ├── app/
│   │   ├── (auth)/               # Authentication pages
│   │   ├── (dashboard)/          # Main dashboard
│   │   │   ├── inventory/        # Book inventory management
│   │   │   │   ├── add/
│   │   │   │   ├── [id]/edit/
│   │   │   │   └── page.tsx
│   │   │   ├── members/          # Member management
│   │   │   │   ├── add/
│   │   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── transactions/     # Borrowing transactions
│   │   │   │   ├── pending/
│   │   │   │   ├── overdue/
│   │   │   │   └── history/
│   │   │   ├── collections/      # Book collections
│   │   │   ├── analytics/        # Library analytics
│   │   │   └── settings/         # Library settings
│   │   └── api/                  # Library-specific API routes
│   │       ├── inventory/
│   │       ├── members/
│   │       ├── transactions/
│   │       └── analytics/
│   ├── components/
│   │   ├── ui/                   # Shared UI components
│   │   ├── inventory/            # Inventory management
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── AddBookForm.tsx
│   │   │   └── BookEditor.tsx
│   │   ├── members/              # Member management
│   │   │   ├── MemberTable.tsx
│   │   │   ├── MemberProfile.tsx
│   │   │   └── AddMemberForm.tsx
│   │   ├── transactions/         # Transaction management
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   └── ReturnForm.tsx
│   │   ├── analytics/            # Analytics dashboard
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── Charts.tsx
│   │   │   └── Reports.tsx
│   │   └── layout/               # Layout components
│   │       ├── LibraryHeader.tsx
│   │       ├── AdminSidebar.tsx
│   │       └── LibrarySelector.tsx
│   └── lib/                      # Library-specific utilities
│       ├── api/                  # API functions
│       ├── stores/               # State management
│       ├── hooks/                # Custom hooks
│       └── utils.ts
└── [similar config files as reader app]
```

---

## Backend Services (`services/`)

### Book Crawler Service (`services/crawler/`)

**Purpose**: Python FastAPI service for book metadata enrichment with direct Supabase integration  
**Deployment**: Vercel Functions (initially) → Dedicated service (later)  
**Database Access**: Direct connection via Supabase Python client

```
services/crawler/
├── src/
│   ├── crawler/                  # Main package
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── config.py             # Configuration management
│   │   ├── models/               # Pydantic data models
│   │   │   ├── __init__.py
│   │   │   ├── book.py           # Book-related models
│   │   │   ├── author.py         # Author models
│   │   │   ├── external.py       # External API models
│   │   │   └── responses.py      # API response models
│   │   ├── services/             # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── enrichment.py     # Main enrichment service
│   │   │   ├── external_apis/    # External API integrations
│   │   │   │   ├── __init__.py
│   │   │   │   ├── openlibrary.py
│   │   │   │   ├── google_books.py
│   │   │   │   ├── worldcat.py
│   │   │   │   ├── goodreads.py
│   │   │   │   └── isbn_db.py
│   │   │   ├── database.py       # Supabase Python client operations
│   │   │   ├── cache.py          # Caching layer
│   │   │   └── rate_limiter.py   # Rate limiting
│   │   ├── api/                  # FastAPI routers
│   │   │   ├── __init__.py
│   │   │   ├── crawler.py        # Main crawler endpoints
│   │   │   ├── health.py         # Health check endpoints
│   │   │   └── middleware.py     # Custom middleware
│   │   └── utils/                # Utility functions
│   │       ├── __init__.py
│   │       ├── isbn.py           # ISBN validation/conversion
│   │       ├── text_processing.py # Text cleaning/processing
│   │       ├── scraping.py       # Web scraping utilities
│   │       └── logging.py        # Structured logging setup
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── conftest.py              # Pytest configuration
│   ├── test_main.py             # Main app tests
│   ├── test_models/             # Model tests
│   │   ├── test_book.py
│   │   └── test_author.py
│   ├── test_services/           # Service tests
│   │   ├── test_enrichment.py
│   │   └── test_external_apis/
│   │       ├── test_openlibrary.py
│   │       ├── test_google_books.py
│   │       └── test_goodreads.py
│   ├── test_api/                # API endpoint tests
│   │   └── test_crawler.py
│   └── fixtures/                # Test data
│       ├── book_samples.json
│       └── api_responses/
├── docker/                      # Docker configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── scripts/                     # Utility scripts
│   ├── setup.py                # Setup script
│   ├── migrate.py              # Database migration
│   └── seed_data.py            # Sample data seeding
├── .env.example                # Environment variables template
├── .gitignore
├── .dockerignore
├── pyproject.toml              # Poetry configuration
├── poetry.lock                 # Dependencies lock file
├── Dockerfile
├── vercel.json                 # Vercel deployment config
├── requirements.txt            # Pip requirements (for Vercel)
└── README.md                   # Service documentation
```

**Key Service Files**:

```python
# services/crawler/src/crawler/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import crawler_router, health_router
from .config import settings

app = FastAPI(
    title="EzLib Book Crawler",
    description="Book metadata enrichment service",
    version="1.0.0"
)

app.add_middleware(CORSMiddleware, **settings.cors_settings)
app.include_router(health_router, prefix="/health")
app.include_router(crawler_router, prefix="/api/crawler")
```

```python
# services/crawler/src/crawler/services/enrichment.py
from typing import Optional
from .external_apis import OpenLibraryAPI, GoogleBooksAPI
from .database import SupabaseClient
from ..models.book import BookMetadata

class BookEnrichmentService:
    def __init__(self):
        self.supabase = SupabaseClient()
        
    async def enrich_book(self, isbn: str) -> Optional[BookMetadata]:
        """Main enrichment workflow with direct Supabase updates"""
        # Fetch from external APIs
        metadata = await self._fetch_external_metadata(isbn)
        
        # Update Supabase directly
        await self.supabase.update_book_metadata(metadata)
        return metadata
```

```python
# services/crawler/src/crawler/services/database.py
from supabase import create_client, Client
from ..config import settings
from ..models.book import BookMetadata

class SupabaseClient:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key  # Service role key for admin access
        )
    
    async def update_book_metadata(self, metadata: BookMetadata) -> None:
        """Direct Supabase update - no API layer needed"""
        await self.client.table('book_editions').update({
            'edition_metadata': metadata.to_dict(),
            'updated_at': 'now()'
        }).eq('isbn_13', metadata.isbn).execute()
```

---

## Minimal Shared Packages (`packages/`)

Given the monolithic approach, shared packages are kept minimal. Each application primarily manages its own dependencies and components.

### Types Package (`packages/types/`) [IMPLEMENTED]

**Purpose**: Shared TypeScript type definitions (primarily database types)

```
packages/types/
├── src/
│   ├── database/               # Database types
│   │   └── supabase.ts        # Generated Supabase types
│   └── index.ts               # Re-export types
├── package.json
└── tsconfig.json
```

**Note**: UI components are managed directly within each application using shadcn/ui rather than shared packages.

---

## Database Configuration (`supabase/`)

**Purpose**: Supabase local development and database management  
**Location**: Root-level directory (standard Supabase CLI structure)

```
supabase/
├── config.toml                 # Supabase local development configuration
├── migrations/                 # SQL migration files (timestamped)
│   ├── 20250823000001_core_book_metadata.sql
│   ├── 20250823000002_book_relationships.sql
│   ├── 20250823000003_indexes_performance.sql
│   ├── 20250823000004_triggers_functions.sql
│   └── 20250823000005_row_level_security.sql
├── seed.sql                   # Sample data for local development
├── .gitignore                 # Supabase-specific git ignores
└── functions/                 # Edge functions (optional)
    └── book-enrichment/
```

**Key Configuration Notes:**
- **Multi-app Support**: Configure `site_url` and `additional_redirect_urls` for multiple domains
- **Authentication**: Set up CORS and auth redirects for both `ezlib.com` and `manage.ezlib.com`
- **Row Level Security**: Shared database with app-specific access policies
- **Real-time**: Enable subscriptions for cross-app notifications

---

## Development Approach

**Monolithic Architecture**: Each web application (`apps/reader/`, `apps/library-management/`) is completely self-contained with:

- **Independent Dependencies**: Each app has its own `package.json` with no shared dependencies
- **Individual Build Process**: Each app builds independently using `next build`
- **Separate Deployments**: Each app deploys to its own Vercel project/subdomain
- **Direct Database Access**: Each app connects directly to Supabase (shared database with RLS)
- **Self-Contained UI**: Each app uses shadcn/ui components directly (no shared component library)

This structure provides a scalable foundation for the EzLib platform with clear separation of concerns. Each application can evolve independently while sharing only the essential database layer through Supabase RLS policies.