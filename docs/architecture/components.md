# Components

Based on the multi-frontend architecture, unified data models, and REST API design, here are the major logical components across the fullstack EzLib system:

## Reader Social App (ezlib.com) - **DEFAULT APPLICATION**

**Responsibility:** Public-facing social book discovery platform for readers to find, review, and borrow books from local libraries. This is the default application users see when visiting the main domain.

**Key Features:**
- Book discovery with social context and recommendations
- Personalized reading activity feed and social interactions
- Direct book borrowing workflow with library integration
- Review creation and social engagement features
- Real-time notifications for book availability and borrowing updates

**Data Access:** Direct Supabase client integration with Row Level Security

**Dependencies:** Supabase Database, Book Crawler Service (for enrichment)

**Technology Stack:** Next.js 14 App Router, Supabase JavaScript client, shadcn/ui components, React Query for data fetching, Tailwind CSS styling

## Library Management App (manage.ezlib.com) - **SUBDOMAIN**

**Responsibility:** Administrative dashboard for library staff to manage books, members, borrowing operations, and collections. Accessed via subdomain for administrative users.

**Key Features:**
- Book inventory and catalog management
- Member registration, tracking, and subscription management
- Borrowing transaction workflow management (approve, check-out, return)
- Book collection organization and curation
- Real-time notifications for borrowing requests and overdue items
- Library analytics and reporting

**Data Access:** Direct Supabase client integration with admin-level Row Level Security

**Dependencies:** Supabase Database, Book Crawler Service (for book enrichment)

**Technology Stack:** Next.js 14 App Router with server-side rendering, Supabase JavaScript client, professional UI components optimized for data management, React Query for data fetching, table-heavy interfaces with filtering and search

## Supabase Database Layer

**Responsibility:** Multi-tenant PostgreSQL database with built-in authentication, real-time subscriptions, and row-level security for data isolation.

**Key Interfaces:**
- PostgreSQL database with complex relationships (books, users, libraries)
- Supabase Auth for user management and JWT token generation
- Real-time subscriptions for book availability and social activity
- Row Level Security policies for multi-tenant data isolation
- File storage for book covers and user avatars

**Dependencies:** External authentication providers (Google, Facebook), CDN for file delivery

**Technology Stack:** Supabase (PostgreSQL + Auth + Storage + Real-time), custom RLS policies, database functions for complex queries

**Multi-App Configuration:**
- **Single Supabase Project**: Shared database across reader app and management app
- **Cross-Domain Authentication**: Supports both `ezlib.com` and `manage.ezlib.com`
- **Shared Row Level Security**: App-agnostic data access policies based on user roles
- **Real-time Subscriptions**: Cross-app notifications (e.g., borrowing requests from reader to management)

## Python Book Crawler Service

**Responsibility:** Asynchronous book metadata enrichment from external sources including ISBN lookups, review aggregation, and author information.

**Key Features:**
- `/crawler/enrich-book` - Triggered enrichment for specific books
- ISBN lookup APIs (OpenLibrary, Google Books, Goodreads)
- Web scraping for review and rating data
- Author biographical data collection
- Book cover image processing and optimization

**Data Access:** Direct Supabase Python client for database updates

**Dependencies:** External book APIs, image processing services

**Technology Stack:** FastAPI with Python 3.11+, Supabase Python client, asyncio for concurrent processing, BeautifulSoup/Scrapy for web scraping, requests for API integration, Pydantic for data validation

## Component Diagrams

```mermaid
graph TB
    subgraph "Frontend Applications"
        ReaderApp[📱 Reader Social App<br/>ezlib.com<br/>Next.js]
        LibApp[💼 Library Management<br/>manage.ezlib.com<br/>Next.js]
    end
    
    subgraph "Shared Frontend Packages"
        SharedTypes[@ezlib/types<br/>TypeScript Interfaces]
        SharedUI[@ezlib/ui<br/>React Components]
        SharedUtils[@ezlib/utils<br/>Helper Functions]
    end
    
    subgraph "Data Layer"
        Database[(🗄️ Supabase Database<br/>PostgreSQL + RLS)]
        Storage[📁 Supabase Storage<br/>Files & Images]
        Auth[👤 Supabase Auth<br/>User Management]
        Realtime[⚡ Supabase Realtime<br/>Cross-app Subscriptions]
    end
    
    subgraph "External Services"
        Crawler[🐍 Python Book Crawler<br/>FastAPI Service]
        ExternalAPIs[🌐 External Book APIs<br/>ISBN + Reviews]
    end
    
    %% Frontend Dependencies
    ReaderApp --> SharedTypes
    ReaderApp --> SharedUI
    LibApp --> SharedTypes
    LibApp --> SharedUI
    SharedTypes --> SharedUtils
    
    %% Direct Database Connections
    ReaderApp --> Database
    ReaderApp --> Auth
    ReaderApp --> Storage
    ReaderApp --> Realtime
    
    LibApp --> Database
    LibApp --> Auth
    LibApp --> Storage
    LibApp --> Realtime
    
    %% Database Dependencies
    Database --> Auth
    Database --> Storage
    Database --> Realtime
    
    %% External Service Dependencies
    Crawler --> Database
    Crawler --> ExternalAPIs
```
