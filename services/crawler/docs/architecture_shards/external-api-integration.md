# External API Integration

## API Priority and Fallback Strategy

1. **Primary Source**: OpenLibrary API (free, comprehensive)
2. **Secondary Source**: Google Books API (detailed publisher info)
3. **Specialized Sources**: ISBN Database (validation), Wikipedia (author bios)
4. **Last Resort**: Structured web scraping (rate-limited)

## Rate Limiting Strategy

```python