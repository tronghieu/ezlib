# Technical Assumptions

## Repository Structure: Monorepo

Single Next.js project containing both library staff interface and reader-facing components. This reduces initial complexity while allowing future extraction of services as the system scales beyond MVP validation phase.

## Service Architecture

**Monolithic Next.js Application with API Routes:** Server-side rendering with integrated API routes for all backend functionality. Database operations handled through Supabase client within API routes. This architecture minimizes infrastructure complexity while providing solid foundation for MVP validation and future microservice extraction if needed.

## Testing Requirements

**Unit + Integration Testing:** Jest for unit tests covering business logic and utility functions. API route integration tests for database operations and request/response cycles. Manual testing protocols for end-to-end user workflows, particularly library staff operational procedures and reader browsing/requesting flows.

## Additional Technical Assumptions and Requests

- **Database Technology:** Supabase (PostgreSQL) for all data persistence, user authentication, and real-time subscriptions for availability status updates
- **Frontend Framework:** Next.js 14+ with TypeScript for type safety and developer experience
- **Styling Approach:** Tailwind CSS for rapid UI development and consistent design system
- **Authentication:** Supabase Auth with passwordless email OTP for unified user management across domains
- **Deployment Platform:** Vercel for frontend hosting with automatic deployments from Git
- **Development Environment:** Local development using Supabase CLI for database schema management
- **Data Validation:** Zod schemas for API request/response validation and type inference
- **State Management:** React hooks and Context API for simple state needs, avoiding external state management libraries for MVP
- **Real-time Updates:** Supabase real-time subscriptions for book availability status across multiple concurrent users
- **Mobile Responsiveness:** Tailwind responsive utilities for mobile-first design approach
- **Internationalization:** Next.js i18n with react-intl for translation management, IP-based geolocation for automatic language detection, and ICU message formatting for cultural appropriateness
- **Localization Infrastructure:** Translation key management system, locale-specific routing, and right-to-left (RTL) language support architecture
