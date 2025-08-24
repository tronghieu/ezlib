# Introduction

This document outlines the complete fullstack architecture for **EzLib**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

Based on your PRD and project brief, I can see you're planning a **greenfield project** with specific technology preferences:

- **Frontend:** Next.js with TypeScript, React components, Tailwind CSS
- **Backend:** Next.js API routes initially, with potential migration to separate Node.js/Express services
- **Database:** Supabase (PostgreSQL) for user management, book catalog, borrowing transactions, and social features
- **Hosting:** Vercel for frontend deployment, Supabase for backend services

Since you've already specified a **Next.js + Supabase + Vercel** stack, this suggests using the **T3 Stack** or similar Next.js fullstack template as a foundation, which provides:
- Next.js 14+ with TypeScript
- Tailwind CSS pre-configured
- Database integration patterns
- Authentication setup

However, your **multi-frontend architecture** requirement (reader social app + library management dashboard + book crawler service) suggests we should consider a **monorepo approach** rather than a single Next.js app.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-21 | 1.0 | Initial architecture creation from PRD | Winston (Architect) |
