# Technical Assumptions

## Repository Structure: Monorepo

The library management application will be developed within the existing EzLib monorepo structure as `apps/library-management/`. This follows the established pattern alongside `apps/reader/` and `services/crawler/`, enabling shared configurations, dependencies, and streamlined deployment while maintaining clear application boundaries.

## Service Architecture

**Direct Supabase Integration with Cross-Domain Architecture:** The application will connect directly to the shared Supabase PostgreSQL database without an intermediate API layer, following EzLib's architectural principle of direct client connections. The system supports cross-domain access between ezlib.com and manage.ezlib.com with independent login sessions. This approach provides:

- Real-time subscriptions for live data updates synchronized between reader and management apps
- Built-in Row Level Security for multi-tenant isolation with cross-domain session validation
- Reduced complexity and latency compared to custom API layers
- Seamless integration with existing database schema and RLS policies
- Independent authentication sessions with planned future cross-domain session sharing
- Event-driven real-time updates using Supabase subscriptions for book availability synchronization

## Testing Requirements

**Comprehensive Testing Strategy:** Implementation will include unit testing, integration testing with Supabase, and end-to-end user workflow testing:

- **Unit Tests:** Component logic, utility functions, and business rule validation
- **Integration Tests:** Database operations, real-time subscriptions, and crawler service integration
- **E2E Tests:** Critical user workflows (circulation operations, member management)
- **Manual Testing:** Convenience methods for testing multi-tenant scenarios and complex workflows

## Additional Technical Assumptions and Requests

**Frontend Technology Stack:**

- **Framework:** Next.js 15+ with App Router for server-side rendering and optimal performance
- **Language:** TypeScript 5.0+ with strict mode for type safety and developer productivity
- **UI Components:** shadcn/ui component library for consistent design system integration
- **Styling:** Tailwind CSS for rapid development and maintainable styles
- **State Management:** Zustand for client-side state with Supabase real-time integration

**Database and Backend Services:**

- **Database:** Existing Supabase PostgreSQL database with established schema from `/supabase/migrations/`
- **Authentication:** Supabase Auth with role-based access control and session management
- **Real-time:** Supabase subscriptions for live inventory and circulation updates
- **File Storage:** Supabase Storage for any document or image assets

**Integration Requirements:**

- **Crawler Service Integration:** Direct database updates from crawler service for book metadata enrichment
- **Reader App Synchronization:** Real-time inventory updates via shared database for patron-facing availability
- **Type Generation:** Automated TypeScript type generation from Supabase schema using `supabase gen types`

**Development and Deployment:**

- **Package Management:** PNPM for monorepo dependency management and workspace support
- **Build System:** Turbo for optimized monorepo builds and caching
- **Hosting:** Vercel deployment with edge caching and global CDN
- **Environment:** Local development with Supabase local stack, production with hosted Supabase

**Code Quality and Standards:**

- **Linting:** ESLint with TypeScript rules for code consistency
- **Formatting:** Prettier for automatic code formatting
- **Git Hooks:** Pre-commit hooks for linting, testing, and type checking
- **Documentation:** TSDoc comments for complex business logic and integration points

**Security and Compliance:**

- **Data Protection:** Leverage Supabase SOC 2 compliance for data security requirements
- **Multi-tenant Isolation:** Strict Row Level Security policies preventing cross-library data access
- **Audit Logging:** Database triggers for tracking all critical operations and changes
- **HTTPS Everywhere:** SSL/TLS encryption for all client-server communication

**Performance and Scalability:**

- **Database Optimization:** Proper indexing for search operations and reporting queries
- **Caching Strategy:** Vercel edge caching for static assets and selective data caching
- **Image Optimization:** Next.js Image component for book covers and library assets
- **Bundle Optimization:** Code splitting and lazy loading for optimal page load times
