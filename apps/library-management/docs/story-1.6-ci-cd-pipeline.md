# Story 1.6: CI/CD Pipeline and Deployment Infrastructure

**Epic:** Foundation & Passwordless Authentication  
**Priority:** Critical Infrastructure  
**Dependencies:** Story 1.1 (Project Setup), Story 1.2 (Supabase Integration)  
**Sequence:** Must complete before Story 1.4 (Library Context) for deployment validation

---

## User Story

As a **developer**,  
I want **to establish automated CI/CD pipeline with Vercel deployment and quality gates**,  
so that **code changes are automatically tested, validated, and deployed safely with proper environment management and rollback capabilities**.

---

## Acceptance Criteria

### 🔧 GitHub Actions Workflow Configuration

1. **GitHub Actions workflow file** (`.github/workflows/library-management.yml`) created with:
   - Trigger on push to `main` branch and pull requests targeting `main`
   - Node.js 18+ environment setup with PNPM caching
   - Monorepo-aware build targeting `apps/library-management` only

2. **Quality gates pipeline** includes sequential stages:
   - **Lint**: ESLint validation with zero warnings allowed for production
   - **Type Check**: TypeScript strict mode validation
   - **Test**: Unit tests with minimum 80% coverage threshold
   - **Build**: Next.js production build validation

3. **Environment variable management** with proper secrets handling:
   - Development environment variables from GitHub repository secrets
   - Production environment variables from Vercel environment settings
   - Supabase keys properly secured and injected at build time

### 🚀 Vercel Deployment Configuration

4. **Vercel project setup** with proper monorepo configuration:
   - Build command: `cd apps/library-management && pnpm run build`
   - Output directory: `apps/library-management/.next`
   - Install command: `pnpm install`
   - Framework preset: Next.js

5. **Environment management strategy**:
   - **Development**: `dev.manage.ezlib.com` (preview deployments from PRs)
   - **Staging**: `staging.manage.ezlib.com` (main branch deployments)
   - **Production**: `manage.ezlib.com` (manual promotion from staging)

6. **Custom domains configured** with SSL certificates:
   - Primary domain: `manage.ezlib.com`
   - Staging domain: `staging.manage.ezlib.com`
   - Development previews: Auto-generated Vercel URLs

### 🛡️ Deployment Safety & Validation

7. **Health check integration** in deployment pipeline:
   - Post-deployment health check hits `/api/health` endpoint
   - Validates database connectivity and essential service availability
   - Automatic rollback triggers if health checks fail

8. **Branch protection rules** configured on GitHub:
   - Require pull request reviews before merging to `main`
   - Require status checks to pass (lint, test, build)
   - Require branches to be up to date before merging
   - Restrict direct pushes to `main` branch

9. **Deployment notifications** configured:
   - Slack/email notifications for deployment success/failure
   - GitHub deployment status updates
   - Vercel deployment comments on pull requests

### 📊 Monitoring & Rollback Strategy

10. **Deployment monitoring setup**:
    - Vercel Analytics enabled for performance monitoring
    - Basic error tracking configured for production issues
    - Deployment logs accessible through Vercel dashboard

11. **Rollback procedures documented and tested**:
    - Vercel instant rollback capability to previous deployment
    - Database migration rollback procedures for schema changes
    - Emergency contact procedures for deployment issues

12. **Performance baselines established**:
    - Lighthouse CI integration for performance regression detection
    - Build time monitoring and optimization alerts
    - Bundle size tracking to prevent bloat

### 🔄 Integration with Existing Infrastructure

13. **Supabase environment alignment**:
    - Development environment connects to local Supabase instance
    - Staging environment connects to dedicated Supabase project
    - Production environment connects to production Supabase instance

14. **Monorepo integration validation**:
    - Turbo build cache properly configured for CI environment
    - Only library management app builds triggered by relevant file changes
    - Shared dependencies from monorepo root properly resolved

15. **Security scanning integration**:
    - Dependency vulnerability scanning with automated updates
    - Secret scanning to prevent credential commits
    - HTTPS enforcement and security headers validation

---

## Definition of Done

- [ ] GitHub Actions workflow successfully deploys to all environments
- [ ] All quality gates pass consistently in CI pipeline
- [ ] Health check endpoint validates deployment success
- [ ] Rollback procedure tested and documented
- [ ] Team can deploy confidently with one-click promotion
- [ ] Performance baselines established and monitored
- [ ] Security scanning prevents credential leaks
- [ ] Documentation updated with deployment procedures

---

## Technical Implementation Details

### GitHub Actions Workflow Example

```yaml
# .github/workflows/library-management.yml
name: Library Management CI/CD

on:
  push:
    branches: [main]
    paths: ["apps/library-management/**"]
  pull_request:
    branches: [main]
    paths: ["apps/library-management/**"]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: cd apps/library-management && pnpm run lint

      - name: Type check
        run: cd apps/library-management && pnpm run type-check

      - name: Test
        run: cd apps/library-management && pnpm run test:coverage

      - name: Build
        run: cd apps/library-management && pnpm run build

      - name: Health check (staging)
        if: github.ref == 'refs/heads/main'
        run: |
          curl -f https://staging.manage.ezlib.com/api/health || exit 1
```

### Vercel Configuration

```json
{
  "buildCommand": "cd apps/library-management && pnpm run build",
  "outputDirectory": "apps/library-management/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "functions": {
    "apps/library-management/app/api/health/route.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Health Check Implementation

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // Test database connectivity
    const { data, error } = await supabase
      .from("libraries")
      .select("id")
      .limit(1);

    const dbLatency = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: "unhealthy",
              error: error.message,
            },
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: "healthy",
          latency_ms: dbLatency,
        },
        realtime: {
          status: "healthy",
          active_subscriptions: 0,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
```

---

## Integration Notes

### Sequence Dependency Rationale

- **After Story 1.1**: Requires Next.js project structure and basic configuration
- **After Story 1.2**: Needs Supabase integration for health check validation
- **Before Story 1.3**: Authentication testing requires deployment pipeline
- **Before Story 1.4**: Library context switching needs environment validation

### Monorepo Considerations

- Pipeline only triggers on changes to `apps/library-management/**` paths
- Uses PNPM workspace features for efficient dependency management
- Turbo build caching optimizes CI/CD performance
- Shared configurations from monorepo root properly resolved

### Security Measures

- All secrets managed through GitHub Secrets and Vercel environment variables
- Dependency scanning prevents vulnerable package deployment
- HTTPS enforcement with security headers configured
- Branch protection prevents direct production deployments

---

_Story Created: August 26, 2024_  
_Epic: Foundation & Passwordless Authentication_  
_Addresses: Critical infrastructure gap identified in PO validation_
