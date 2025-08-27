# 📁 Documentation Structure Integration

## File Organization

```
apps/library-management/docs/
├── api/                           # API Documentation Hub
│   ├── README.md                  # API Overview & Quick Start Guide
│   ├── database-schema.md         # Supabase Schema & Types Documentation
│   ├── crawler-integration.md     # External Service Integration Guide
│   ├── realtime-events.md         # WebSocket Event Contracts
│   ├── health-endpoints.md        # Monitoring & Health Check API
│   └── integration-examples.md    # Code Examples & Common Patterns
├── story-1.6-ci-cd-pipeline.md   # Infrastructure story (created)
├── po-validation-report.md        # Validation results (created)
├── frontend-architecture.md       # Existing (excellent)
├── prd.md                         # Existing requirements
└── ...                            # Other project documentation
```

## Build Process Integration

```json
// package.json - Enhanced scripts for documentation
{
  "scripts": {
    "docs:generate": "run-s docs:db docs:api docs:validate docs:build",
    "docs:db": "supabase gen types typescript --local > lib/supabase/types.ts && node scripts/generate-schema-docs.js",
    "docs:api": "node scripts/generate-api-docs.js",
    "docs:validate": "tsc --noEmit && markdownlint docs/api/*.md",
    "docs:build": "markdoc build docs/api --output=.docs/api",
    "docs:serve": "serve .docs/api --port 3002",
    "docs:deploy": "vercel --prod --scope=ezlib-docs .docs/api"
  }
}
```

## CI/CD Integration Points

```yaml

```
