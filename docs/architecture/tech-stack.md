# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.0+ | Type safety across all apps | Shared types between reader/library apps, reduces bugs |
| **Frontend Framework** | Next.js | 15.5.2+ | Both reader and library apps | App Router, server components, optimized for Vercel |
| **UI Component Library** | shadcn/ui + Radix | Latest | Consistent design system | Professional library management + social reader UI |
| **State Management** | Zustand + React Query | Latest | Client state + server state | Lightweight, works well with Supabase real-time |
| **Backend Language** | TypeScript | 5.0+ | Next.js API routes | Shared types with frontend, consistent codebase |
| **Backend Framework** | Next.js API Routes | 15.5.2+ | Shared backend services | Unified auth, simplified deployment |
| **API Style** | REST + Supabase Client | Latest | Database operations + real-time | Leverages Supabase strengths, familiar patterns |
| **Database** | Supabase PostgreSQL | Latest | Primary data store | Multi-tenant RLS, real-time, auth integration |
| **Cache** | Supabase Edge Cache | Latest | Query caching | Built-in caching, reduces complexity |
| **File Storage** | Supabase Storage | Latest | Book covers, user avatars | Integrated with auth, CDN delivery |
| **Authentication** | Supabase Auth | Latest | Unified user management | Role-based access, social login support |
| **Crawler Language** | Python | 3.11+ | Book data enrichment service | Superior scraping ecosystem, AI/ML ready, rich ISBN libraries |
| **Crawler Framework** | FastAPI | Latest | REST API for book data | Async support, Pydantic validation, Vercel Functions compatible |
| **Crawler Deployment** | Vercel Functions → FastAPI | Latest | Phased deployment strategy | Start simple, scale to dedicated service when needed |
| **Frontend Testing** | Jest + Testing Library | Latest | Component and integration tests | React-focused, good Next.js support |
| **Backend Testing** | Jest + Supertest | Latest | API endpoint testing | Consistent with frontend testing |
| **E2E Testing** | Playwright | Latest | Cross-app user workflows | Multi-domain testing for subdomain architecture |
| **Build Tool** | Next.js Built-in | Latest | Application build system | Integrated build pipeline for each monolithic app |
| **Bundler** | Next.js Built-in | 15.5.2+ | Webpack + SWC | Optimized for React Server Components |
| **IaC Tool** | Vercel CLI | Latest | Deployment configuration | Declarative subdomain/environment setup |
| **CI/CD** | GitHub Actions + Vercel | Latest | Automated deployment | Native Vercel integration, preview deployments |
| **Monitoring** | Vercel Analytics + Sentry | Latest | Performance + error tracking | Real user monitoring across subdomains |
| **Logging** | Vercel Functions Logs | Latest | Centralized logging | Built-in observability |
| **CSS Framework** | Tailwind CSS | 4.0+ | Utility-first styling | Consistent design across reader/library apps |
| **React** | React | 19.1.0+ | UI framework | Latest features, server components compatibility |
| **Internationalization** | next-intl | 4.3.5+ | Multi-language support | Currently disabled, planned for future |
| **Form Handling** | React Hook Form + Zod | Latest | Form validation & type safety | Declarative forms with schema validation |
| **Animation** | Framer Motion | Latest | UI animations | Smooth interactions and transitions |
| **Icons** | Lucide React | Latest | Icon system | Consistent icon library |
| **Notifications** | Sonner | Latest | Toast notifications | User feedback system |
