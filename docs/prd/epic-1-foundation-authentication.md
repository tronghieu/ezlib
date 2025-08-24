# Epic 1: Foundation & Authentication

**Expanded Goal:** Establish secure, scalable project foundation with user authentication, database schema, and core infrastructure that differentiates library staff from readers. This epic delivers a deployable authentication system and prepares the technical foundation for all library operations and reader interactions.

## Story 1.1: Project Setup and Infrastructure

As a **developer**,
I want to establish the basic Next.js project structure with essential dependencies and configuration,
so that the development environment is ready for building EzLib features.

### Acceptance Criteria
1. Next.js 14+ project created with TypeScript configuration
2. Tailwind CSS integrated and configured for styling
3. ESLint and Prettier configured for code quality
4. Git repository initialized with appropriate .gitignore
5. Package.json configured with all necessary dependencies (Supabase client, Zod, etc.)
6. Development scripts configured (dev, build, lint, test)
7. Basic project structure established (pages, components, lib, types directories)
8. Environment variables template created for Supabase configuration

## Story 1.2: Supabase Database Schema and Connection

As a **developer**,
I want to establish the database schema and Supabase connection,
so that the application can store and retrieve books, members, and borrowing data.

### Acceptance Criteria
1. Supabase project created and configured
2. Database schema implemented with tables: libraries, books, members, borrowing_transactions
3. Row Level Security (RLS) policies configured for data protection
4. Supabase client configured in Next.js application
5. Database connection tested with basic health check
6. Migration scripts created for schema versioning
7. Seed data script created for development/testing purposes
8. Database types generated for TypeScript integration

## Story 1.3: Passwordless Email OTP Authentication System

As a **reader**,
I want to create an account and login using only my email address,
so that I can access book discovery and borrowing features without password management.

### Acceptance Criteria
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

## Story 1.3.1: Cross-Domain Authentication Strategy

As a **library staff member**,
I want to access the management app using my existing reader account,
so that I can manage library operations without creating a separate account.

### Acceptance Criteria
1. Management app (`manage.ezlib.com`) requires login but blocks new registration
2. Login interface explains users must first register on `ezlib.com`
3. Independent login sessions for early-stage implementation
4. LibAdmin table queries determine management app access for authenticated users
5. Appropriate error handling when authenticated users lack admin privileges
6. Logout functionality works independently on each domain
7. User session persistence per domain until cross-domain sharing implemented

## Story 1.4: Library Registration and Management

As a **library administrator**,
I want to register my library and manage library-specific settings,
so that my staff can begin using the system for our collection.

### Acceptance Criteria
1. Library registration form implemented with basic information fields
2. Library profiles stored in database with unique identifiers
3. Library staff can be associated with specific libraries
4. Library settings page created for basic configuration
5. Library selection functionality for staff with multi-library access
6. Library profile validation and error handling
7. Initial library dashboard created showing library information
8. Library deletion/deactivation functionality for administrators
