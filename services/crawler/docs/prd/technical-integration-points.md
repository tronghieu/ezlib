# Technical Integration Points

## Upstream Dependencies
- **Main EzLib API**: Triggers enrichment when books are added to library inventories
- **Supabase Database**: Source of truth for book and author data
- **External APIs**: OpenLibrary, Google Books, Wikipedia for metadata sources

## Downstream Consumers
- **Reader Social App**: Enhanced book discovery with rich metadata
- **Library Management App**: Automated data entry for staff workflows
- **Analytics System**: Data quality metrics and enrichment statistics

## Data Flow
1. Library staff adds book with ISBN in management interface
2. Main API creates book record and triggers crawler enrichment
3. Crawler fetches metadata from external sources
4. Crawler validates, merges, and updates database records
5. Updated book information appears in both staff and reader interfaces
