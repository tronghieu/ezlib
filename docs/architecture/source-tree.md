# EzLib Source Tree Structure

## Overview

This document defines the monorepo structure for the EzLib platform, organizing the book crawler service alongside the Next.js applications in a scalable, maintainable architecture.

---

## Repository Root Structure

```
ezlib/
├── apps/                           # Frontend applications
│   ├── reader/                     # Public reader social app (ezlib.com - DEFAULT)
│   ├── library-management/         # Library admin dashboard (manage.ezlib.com)
│   └── public-site/               # Marketing/landing pages (optional)
├── services/                       # Backend services
│   └── crawler/                   # Python book crawler service
├── packages/                       # Shared libraries
│   ├── ui/                        # Shared UI components
│   ├── types/                     # TypeScript type definitions
│   └── utils/                     # Shared utility functions
├── supabase/                       # Database configuration and migrations
│   ├── config.toml                # Supabase local development config
│   ├── migrations/                # SQL migration files
│   ├── seed.sql                   # Sample data
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
├── tools/                         # Development tools and scripts
│   ├── scripts/                   # Utility scripts
│   └── generators/                # Code generators
├── docker/                        # Docker configurations
├── turbo.json                     # Turbo monorepo configuration
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # PNPM workspace configuration
└── README.md                      # Project overview
```

---

## Frontend Applications (`apps/`)

### Reader Social App (`apps/reader/`) - **DEFAULT APP**

**Purpose**: Public-facing social book discovery platform  
**Domain**: ezlib.com (main domain - default when users visit the website)  
**Framework**: Next.js 14 App Router

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
├── .eslintrc.json              # ESLint configuration
├── .gitignore
├── components.json              # shadcn/ui configuration
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Jest setup
├── next.config.js              # Next.js configuration
├── package.json
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

### Library Management App (`apps/library-management/`)

**Purpose**: Administrative dashboard for library staff  
**Domain**: manage.ezlib.com (subdomain for library management)  
**Framework**: Next.js 14 App Router

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

## Shared Packages (`packages/`)

### UI Package (`packages/ui/`)

**Purpose**: Shared React components across frontend apps

```
packages/ui/
├── src/
│   ├── components/              # Reusable components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── index.ts            # Export all components
│   ├── hooks/                  # Shared hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── utils/                  # UI utilities
│   │   ├── cn.ts              # Class name utility
│   │   └── colors.ts          # Color utilities
│   └── styles/                # Shared styles
│       ├── globals.css
│       └── components.css
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### Types Package (`packages/types/`)

**Purpose**: Shared TypeScript type definitions

```
packages/types/
├── src/
│   ├── api/                    # API-related types
│   │   ├── requests.ts
│   │   ├── responses.ts
│   │   └── errors.ts
│   ├── entities/               # Domain entity types
│   │   ├── user.ts
│   │   ├── book.ts
│   │   ├── library.ts
│   │   ├── author.ts
│   │   └── transaction.ts
│   ├── database/               # Database types
│   │   ├── supabase.ts        # Generated Supabase types
│   │   └── migrations.ts
│   ├── utils/                  # Utility types
│   │   ├── common.ts
│   │   └── helpers.ts
│   └── index.ts               # Re-export all types
├── package.json
└── tsconfig.json
```

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

## Development Tools (`tools/`)

```
tools/
├── scripts/                    # Development scripts
│   ├── setup.sh               # Project setup
│   ├── db-reset.sh            # Reset database
│   ├── generate-types.sh      # Generate TypeScript types
│   └── deploy.sh              # Deployment script
├── generators/                 # Code generators
│   ├── component/             # React component generator
│   ├── api-route/             # API route generator
│   └── page/                  # Next.js page generator
└── configs/                    # Shared configurations
    ├── eslint-config-custom/
    ├── tsconfig/
    └── tailwind-config/
```

---

## Configuration Files

### Root Configuration

```json
// turbo.json - Monorepo build configuration
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

```yaml
# pnpm-workspace.yaml - PNPM workspace configuration
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
  - 'tools/*'
```

```json
// package.json - Root package configuration
{
  "name": "ezlib",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "@turbo/gen": "^1.9.7",
    "turbo": "^1.9.7",
    "prettier": "^2.8.8",
    "typescript": "^5.1.6"
  }
}
```

This source tree structure provides a scalable foundation for the EzLib platform, clearly separating concerns while enabling code sharing and consistent development practices across all applications and services.