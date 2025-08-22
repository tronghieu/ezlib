# Constraints and Assumptions

## Technical Constraints
- Must operate within external API rate limits (OpenLibrary: 100 req/min, Google Books: 1000 req/day)
- Vercel Functions have 30-second timeout limits for initial deployment
- Supabase database connection limits apply to concurrent operations

## Business Constraints
- External API costs must remain under $500/month for initial deployment
- No user-facing features - service operates in background only
- Must not impact main application performance during enrichment

## Assumptions
- Majority of books added to libraries have valid ISBN-13 identifiers
- External APIs (OpenLibrary, Google Books) maintain stable interfaces
- Library staff prefer automated accuracy over immediate availability
- Internet connectivity is reliable for external API access
