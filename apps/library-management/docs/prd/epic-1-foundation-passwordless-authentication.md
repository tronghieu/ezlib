# Epic 1: Foundation & Passwordless Authentication

**Epic Goal:** Establish the technical foundation for the library management application including project setup, passwordless email OTP authentication with cross-domain access strategy, and basic library context management while delivering a deployable health check endpoint that validates the complete technical stack integration and ultra-simple core functionality.

## Story 1.1: Project Setup and Core Infrastructure

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

## Story 1.2: Supabase Integration and Type Generation

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

## Story 1.3: Cross-Domain Passwordless Authentication System

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

## Story 1.4: Library Context Management

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

## Story 1.5: Basic Dashboard and Navigation

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
