# High Level Architecture

## Technical Summary

EzLib implements a **unified fullstack platform** using a Next.js monorepo architecture with role-based interfaces, supporting users who can simultaneously be readers and library managers. The system uses **Supabase as the shared backend** providing PostgreSQL database, authentication, and real-time subscriptions across multiple frontend experiences. The architecture separates social reading features from library operations through **context-aware UI switching** while maintaining unified user identity and cross-library data access. A dedicated **book crawler service** enriches the platform with ISBN-based metadata and external review integration, deployed as a separate Node.js service alongside the main Next.js application on Vercel and Supabase infrastructure.

## Platform and Infrastructure Choice

**Platform:** Vercel + Supabase  
**Key Services:** Next.js App Router, Supabase Auth/Database/Realtime, Vercel Functions, Vercel Edge Network  
**Deployment Host and Regions:** Vercel Global CDN, Supabase US-East (expandable)

## Repository Structure

**Structure:** Monorepo with shared packages and dedicated Supabase directory  
**Monorepo Tool:** Turbo (built into Vercel, optimized for Next.js)  
**Package Organization:** App-based separation with shared libraries for types, UI components, and business logic  
**Database:** Supabase directory at root level (standard CLI structure) shared across all apps

## High Level Architecture Diagram

```mermaid
graph TB
    Users[👥 Users<br/>Readers + Library Managers] --> LB[🌐 Vercel Edge Network]
    
    LB --> ReaderApp[📱 Reader Social App<br/>ezlib.com (DEFAULT)<br/>Next.js]
    LB --> LibApp[💼 Library Management App<br/>manage.ezlib.com<br/>Next.js] 
    LB --> PublicSite[🌍 Public Site<br/>(Optional)<br/>Next.js]
    
    ReaderApp --> Supabase[(🗄️ Supabase<br/>PostgreSQL + Auth + Realtime)]
    LibApp --> Supabase
    PublicSite --> Supabase
    
    Crawler[📚 Book Crawler Service<br/>Node.js/Vercel Functions] --> Supabase
    Crawler --> External[🌐 External APIs<br/>ISBN/Reviews/Ratings]
    
    Supabase --> RLS[🔐 Row Level Security<br/>Multi-tenant + Role-based]
```

## Architectural Patterns

- **Jamstack Architecture:** Static generation with serverless APIs for optimal performance and scalability - _Rationale:_ Supports both social feeds (dynamic) and library catalogs (cacheable) efficiently

- **Multi-Tenant SaaS Pattern:** Single database with tenant isolation for libraries via Row Level Security - _Rationale:_ Enables users to manage multiple libraries while maintaining data privacy and operational separation

- **Role-Based Access Control (RBAC):** Dynamic permission system supporting reader/manager dual roles - _Rationale:_ Handles complex user scenarios where same person reads socially and manages libraries professionally

- **Event-Driven Real-time Updates:** Supabase subscriptions for book availability and social activities - _Rationale:_ Critical for social engagement and operational accuracy in library borrowing workflows

- **Backend for Frontend (BFF) Pattern:** Tailored API responses for different frontend contexts - _Rationale:_ Reader social feeds need different data shapes than library management dashboards

- **Service Layer Pattern:** Centralized business logic layer shared across all frontends - _Rationale:_ Ensures consistent borrowing rules, social algorithms, and library operations regardless of interface
