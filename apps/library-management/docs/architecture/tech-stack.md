# Library Management System - Tech Stack

<!-- Powered by BMAD™ Core -->

## Overview

This document defines the complete technology stack for the **Library Management System**, a **monolithic Next.js application** with Supabase authentication. This is a single standalone application serving library staff operations.

## Architecture Pattern

**Monolithic Frontend Application**
- Single Next.js application with App Router
- Direct Supabase client integration
- Component-based UI architecture
- No separate backend services

## Technology Stack

### Core Framework

| Technology     | Version | Purpose                         | Rationale                                                                                  |
| -------------- | ------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| **Next.js**    | 15.5.2  | React framework with App Router | Server-side rendering, optimal performance, built-in optimization, modern React features   |
| **React**      | 19.1.0  | UI library                      | Component-based architecture, concurrent features, excellent ecosystem                     |
| **TypeScript** | 5+      | Type safety                     | Strict mode enabled, error prevention, developer productivity, maintainable codebase      |

### UI & Styling

| Technology        | Version | Purpose             | Rationale                                                                   |
| ----------------- | ------- | ------------------- | --------------------------------------------------------------------------- |
| **shadcn/ui**     | Latest  | Component system    | Professional interface, accessibility by default, highly customizable      |
| **Radix UI**      | Latest  | Unstyled primitives | Accessibility foundation, keyboard navigation, ARIA support                 |
| **Tailwind CSS**  | 4       | Utility-first CSS   | Rapid development, consistent design system, responsive by default          |
| **Lucide React**  | 0.542.0 | Icon system         | Consistent iconography, tree-shakable, extensive library                    |
| **Framer Motion** | 12.23.12| Animation library   | Smooth transitions, loading states, micro-interactions                      |
| **next-themes**   | 0.4.6   | Theme management    | Dark/light mode support with system preference detection                    |

### State Management & Data Fetching

| Technology           | Version | Purpose           | Rationale                                                                   |
| -------------------- | ------- | ----------------- | --------------------------------------------------------------------------- |
| **Zustand**          | 5.0.8   | Client state      | Lightweight, simple API, perfect for UI state management                    |
| **TanStack Query**   | 5.85.5  | Server state      | Optimized caching, background updates, excellent DevX                       |
| **React Hook Form**  | 7.62.0  | Form state        | Performance optimization, minimal re-renders, excellent DX                  |

### Form Handling & Validation

| Technology          | Version | Purpose           | Rationale                                                            |
| ------------------- | ------- | ----------------- | -------------------------------------------------------------------- |
| **Zod**             | 4.1.3   | Schema validation | Type-safe validation, runtime type checking, form integration        |
| **@hookform/resolvers** | 5.2.1 | Form validation   | Seamless Zod integration with React Hook Form                      |

### Database & Authentication

| Technology           | Version | Purpose                    | Rationale                                                                    |
| -------------------- | ------- | -------------------------- | ---------------------------------------------------------------------------- |
| **Supabase Client**  | 2.56.0  | Database & Auth client     | Real-time subscriptions, Row Level Security, built-in authentication        |
| **@supabase/ssr**    | 0.7.0   | Server-side rendering      | Proper SSR support for Supabase with Next.js App Router                     |

### Notifications & UI Feedback

| Technology | Version | Purpose              | Rationale                                                        |
| ---------- | ------- | -------------------- | ---------------------------------------------------------------- |
| **Sonner** | 2.0.7   | Toast notifications  | Beautiful toast notifications with excellent UX                  |

### Development Tools

| Technology      | Version | Purpose                | Rationale                                             |
| --------------- | ------- | ---------------------- | ----------------------------------------------------- |
| **ESLint**      | 9       | Code linting           | Code quality, consistency, Next.js best practices    |
| **Prettier**    | 3.6.2   | Code formatting        | Consistent formatting, automated style enforcement    |
| **Husky**       | 9.1.7   | Git hooks              | Pre-commit quality checks, automated linting         |
| **lint-staged** | 16.1.5  | Staged file processing | Only lint/format changed files                        |
| **PNPM**        | 8+      | Package manager        | Fast installs, efficient disk usage, workspace support |

### Utility Libraries

| Technology                | Version | Purpose                | Rationale                                           |
| ------------------------- | ------- | ---------------------- | --------------------------------------------------- |
| **clsx**                  | 2.1.1   | Conditional classes    | Simple conditional CSS class handling               |
| **tailwind-merge**        | 3.3.1   | Tailwind class merge   | Intelligent Tailwind class merging                  |
| **class-variance-authority** | 0.7.1 | Component variants   | Type-safe component variant system                  |

## Architecture Decisions

### Why Monolithic Next.js?

**Benefits:**
- **Simplicity**: Single codebase, single deployment
- **Developer Experience**: Unified tooling, single build process
- **Performance**: No network overhead between frontend/backend
- **TypeScript**: End-to-end type safety
- **Rapid Development**: Quick iteration, shared components

**Trade-offs:**
- **Scalability**: All functionality in single application
- **Team Organization**: All developers work in same codebase
- **Deployment**: Single deployment unit

### Why Supabase Direct Client?

**Benefits:**
- **Real-time**: Built-in WebSocket subscriptions
- **Authentication**: Integrated auth with JWT tokens
- **Row Level Security**: Database-level multi-tenancy
- **Reduced Complexity**: No custom API layer needed
- **Type Safety**: Generated TypeScript types

**Trade-offs:**
- **Vendor Lock-in**: Tied to Supabase ecosystem
- **Client Exposure**: Database schema visible to client
- **Limited Backend Logic**: Complex operations need database functions

### Why shadcn/ui over Material-UI?

**Benefits:**
- **Customization**: Complete control over styling
- **Bundle Size**: Tree-shakable, minimal overhead
- **Modern**: Latest React patterns, TypeScript first
- **Accessibility**: Built on Radix UI primitives

**Trade-offs:**
- **Component Count**: Fewer pre-built components
- **Learning Curve**: Custom implementation patterns

## Package Configuration

### Core Dependencies

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.1",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.56.0",
    "@tanstack/react-query": "^5.85.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.12",
    "lucide-react": "^0.542.0",
    "next": "15.5.2",
    "next-themes": "^0.4.6",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.62.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "zod": "^4.1.3",
    "zustand": "^5.0.8"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/eslint": "^9.6.1",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.2",
    "husky": "^9.1.7",
    "lint-staged": "^16.1.5",
    "prettier": "^3.6.2",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.7",
    "typescript": "^5"
  }
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Configuration  
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## Development Workflow

### Essential Commands

```bash
# Development
pnpm dev                    # Start development server on port 3001
pnpm build                  # Build production bundle
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run ESLint checks
pnpm lint:fix               # Fix ESLint issues automatically
pnpm format                 # Format code with Prettier
pnpm format:check           # Check formatting without changes
pnpm type-check             # TypeScript type checking
```

### Git Hooks

- **Pre-commit**: Automatically runs ESLint and Prettier on staged files
- **Quality Gate**: Prevents commits with linting errors or formatting issues

## Performance Considerations

### Bundle Optimization

- **Tree Shaking**: Automatic with Next.js and ES modules
- **Code Splitting**: App Router provides automatic route-based splitting
- **Image Optimization**: Next.js built-in image optimization
- **Dynamic Imports**: For heavy components and libraries

### Database Optimization

- **Direct Client Connection**: Eliminates API layer overhead
- **Real-time Subscriptions**: Efficient WebSocket connections
- **Row Level Security**: Database-level filtering
- **Generated Types**: Compile-time type checking

## Security Considerations

### Client-Side Security

- **Environment Variables**: Public vs private variable separation
- **Input Validation**: Zod schemas for all user inputs
- **Type Safety**: TypeScript strict mode enabled
- **Supabase RLS**: Database-level security policies

### Authentication Flow

- **JWT Tokens**: Supabase managed authentication
- **Session Management**: Automatic token refresh
- **Server-Side Rendering**: Proper SSR auth handling with @supabase/ssr

This technology stack provides a **solid foundation** for a modern library management system while maintaining simplicity through the monolithic architecture pattern. The choices prioritize **developer productivity**, **type safety**, and **user experience**.