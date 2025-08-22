# External APIs Integration Specification

## Overview

The EzLib Book Crawler integrates with multiple external APIs to enrich book metadata. This document defines the integration patterns, data mappings, and operational procedures for each external data source.

## API Integration Strategy

### Primary Data Sources
1. **OpenLibrary API** - Primary metadata source (free, comprehensive)
2. **Google Books API** - Secondary source for detailed publisher info
3. **Wikipedia/Wikidata** - Author biographical information
4. **ISBN Database** - ISBN validation and format conversion

### Integration Principles
- **Graceful Degradation**: Service continues with reduced functionality if APIs fail
- **Rate Limiting**: Respect all external API quotas and implement backoff strategies
- **Caching**: Cache responses to minimize API calls and improve performance
- **Data Quality**: Validate and sanitize all external data before processing

## OpenLibrary API Integration

### Service Details
- **Base URL**: `https://openlibrary.org/api/`
- **Authentication**: Public API, no key required
- **Rate Limits**: 100 requests per minute per IP
- **Documentation**: https://openlibrary.org/developers/api

### Key Endpoints

#### Books API
```http
GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data
```

**Response Structure**:
```json
{
  "ISBN:9780441569595": {
    "title": "Neuromancer",
    "authors": [
      {
        "name": "William Gibson",
        "url": "https://openlibrary.org/authors/OL2617577A"
      }
    ],
    "publishers": [
      {
        "name": "Ace Books"
      }
    ],
    "publish_date": "July 1984",
    "number_of_pages": 271,
    "cover": {
      "small": "https://covers.openlibrary.org/b/id/240726-S.jpg",
      "medium": "https://covers.openlibrary.org/b/id/240726-M.jpg",
      "large": "https://covers.openlibrary.org/b/id/240726-L.jpg"
    },
    "subjects": [
      {
        "name": "Science fiction",
        "url": "https://openlibrary.org/subjects/science_fiction"
      }
    ]
  }
}
```

#### Authors API
```http
GET https://openlibrary.org/authors/{author_key}.json
```

**Response Structure**:
```json
{
  "name": "William Gibson",
  "birth_date": "17 March 1948",
  "bio": {
    "type": "/type/text",
    "value": "William Ford Gibson is an American-Canadian speculative fiction writer..."
  },
  "photos": [240726],
  "wikipedia": "http://en.wikipedia.org/wiki/William_Gibson"
}
```

### Data Mapping

```python
class OpenLibraryMapper:
    def map_book_data(self, ol_response: dict) -> BookMetadata:
        """Map OpenLibrary response to internal BookMetadata model"""
        data = list(ol_response.values())[0]  # Get first book data
        
        return BookMetadata(
            title=data.get('title', ''),
            subtitle=data.get('subtitle'),
            publisher=self._extract_publisher(data.get('publishers', [])),
            publication_date=self._parse_date(data.get('publish_date')),
            page_count=data.get('number_of_pages'),
            cover_image_url=self._get_cover_url(data.get('cover', {})),
            subjects=self._extract_subjects(data.get('subjects', []))
        )
    
    def map_author_data(self, ol_response: dict) -> AuthorData:
        """Map OpenLibrary author response to internal AuthorData model"""
        return AuthorData(
            name=ol_response.get('name', ''),
            canonical_name=self._normalize_name(ol_response.get('name', '')),
            biography=self._extract_bio(ol_response.get('bio')),
            birth_date=self._parse_date(ol_response.get('birth_date')),
            death_date=self._parse_date(ol_response.get('death_date')),
            photo_url=self._get_photo_url(ol_response.get('photos', [])),
            external_ids={
                'openlibrary_id': ol_response.get('key', '').replace('/authors/', ''),
                'wikipedia_url': ol_response.get('wikipedia')
            }
        )
```

### Error Handling

```python
class OpenLibraryClient:
    async def get_book_by_isbn(self, isbn: str) -> Optional[dict]:
        try:
            response = await self.http_client.get(
                f"https://openlibrary.org/api/books",
                params={
                    'bibkeys': f'ISBN:{isbn}',
                    'format': 'json',
                    'jscmd': 'data'
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data:  # Non-empty response
                    return data
                else:
                    logger.warning(f"No data found for ISBN {isbn}")
                    return None
            elif response.status_code == 429:
                # Rate limited - implement exponential backoff
                await self._handle_rate_limit()
                return await self.get_book_by_isbn(isbn)  # Retry
            else:
                logger.error(f"OpenLibrary API error: {response.status_code}")
                return None
                
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching book data for ISBN {isbn}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching book data: {str(e)}")
            return None
```

## Google Books API Integration

### Service Details
- **Base URL**: `https://www.googleapis.com/books/v1/`
- **Authentication**: API key required (optional for limited usage)
- **Rate Limits**: 1,000 requests per day (free), 100,000 requests per day (paid)
- **Documentation**: https://developers.google.com/books/docs/v1/using

### Key Endpoints

#### Volume Search
```http
GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={api_key}
```

**Response Structure**:
```json
{
  "items": [
    {
      "volumeInfo": {
        "title": "Neuromancer",
        "subtitle": "A Novel",
        "authors": ["William Gibson"],
        "publisher": "Ace Books",
        "publishedDate": "1984-07-01",
        "description": "The Matrix is a world within the world...",
        "pageCount": 271,
        "categories": ["Fiction / Science Fiction / Cyberpunk"],
        "imageLinks": {
          "thumbnail": "http://books.google.com/books/content?id=...&printsec=frontcover&img=1&zoom=1",
          "small": "http://books.google.com/books/content?id=...&printsec=frontcover&img=1&zoom=2"
        },
        "language": "en",
        "country": "US"
      }
    }
  ]
}
```

### Data Mapping

```python
class GoogleBooksMapper:
    def map_book_data(self, gb_response: dict) -> BookMetadata:
        """Map Google Books response to internal BookMetadata model"""
        if not gb_response.get('items'):
            return None
            
        volume_info = gb_response['items'][0]['volumeInfo']
        
        return BookMetadata(
            title=volume_info.get('title', ''),
            subtitle=volume_info.get('subtitle'),
            publisher=volume_info.get('publisher'),
            publication_date=self._parse_iso_date(volume_info.get('publishedDate')),
            page_count=volume_info.get('pageCount'),
            cover_image_url=self._get_best_image(volume_info.get('imageLinks', {})),
            description=volume_info.get('description'),
            subjects=self._normalize_categories(volume_info.get('categories', [])),
            language=volume_info.get('language', 'en'),
            format=self._determine_format(volume_info)
        )
```

## Wikipedia/Wikidata Integration

### Service Details
- **Base URL**: `https://www.wikidata.org/w/api.php`
- **Authentication**: Public API, no key required
- **Rate Limits**: 5,000 requests per hour per IP
- **Documentation**: https://www.wikidata.org/wiki/Wikidata:Data_access

### Author Biography Enrichment

#### Search for Author Entity
```http
GET https://www.wikidata.org/w/api.php?action=wbsearchentities&search={author_name}&language=en&type=item&format=json
```

#### Get Author Details
```http
GET https://www.wikidata.org/w/api.php?action=wbgetentities&ids={entity_id}&format=json
```

### Data Mapping

```python
class WikidataMapper:
    def map_author_data(self, wd_response: dict) -> AuthorData:
        """Map Wikidata response to internal AuthorData model"""
        entity_id = list(wd_response['entities'].keys())[0]
        entity = wd_response['entities'][entity_id]
        
        claims = entity.get('claims', {})
        
        return AuthorData(
            name=self._get_label(entity, 'en'),
            canonical_name=self._normalize_name(self._get_label(entity, 'en')),
            biography=self._get_description(entity, 'en'),
            birth_date=self._extract_date(claims.get('P569')),  # Birth date property
            death_date=self._extract_date(claims.get('P570')),  # Death date property
            photo_url=self._get_commons_image(claims.get('P18')),  # Image property
            external_ids={
                'wikidata_id': entity_id,
                'wikipedia_url': self._get_wikipedia_url(entity.get('sitelinks', {}))
            }
        )
```

## ISBN Database Integration

### Service Details
- **Base URL**: `https://api2.isbndb.com/`
- **Authentication**: API key required
- **Rate Limits**: 2,500 requests per month (free tier)
- **Documentation**: https://isbndb.com/apidocs

### ISBN Validation and Lookup

```http
GET https://api2.isbndb.com/book/{isbn}
Authorization: {api_key}
```

### Implementation

```python
class ISBNDatabaseClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api2.isbndb.com"
    
    async def validate_isbn(self, isbn: str) -> bool:
        """Validate ISBN format and existence"""
        try:
            response = await self.http_client.get(
                f"{self.base_url}/book/{isbn}",
                headers={"Authorization": self.api_key}
            )
            return response.status_code == 200
        except Exception:
            return False
    
    async def get_book_data(self, isbn: str) -> Optional[dict]:
        """Get book data from ISBN database"""
        # Implementation similar to other APIs
        pass
```

## Rate Limiting and Caching

### Rate Limiting Implementation

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

class ExternalAPIRateLimiter:
    def __init__(self):
        self.limiters = {
            'openlibrary': AsyncLimiter(100, 60),      # 100 per minute
            'google_books': AsyncLimiter(1000, 86400), # 1000 per day
            'wikidata': AsyncLimiter(5000, 3600),      # 5000 per hour
            'isbn_db': AsyncLimiter(2500, 2592000)     # 2500 per month
        }
    
    async def acquire(self, api_name: str):
        """Acquire rate limit token for API"""
        limiter = self.limiters.get(api_name)
        if limiter:
            await limiter.acquire()
```

### Caching Strategy

```python
import redis.asyncio as redis
from typing import Optional
import json

class APIResponseCache:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)
        self.ttl_settings = {
            'book_metadata': 86400,    # 24 hours
            'author_data': 604800,     # 7 days
            'isbn_validation': 2592000 # 30 days
        }
    
    async def get(self, key: str, cache_type: str) -> Optional[dict]:
        """Get cached response"""
        try:
            cached = await self.redis.get(f"{cache_type}:{key}")
            return json.loads(cached) if cached else None
        except Exception:
            return None
    
    async def set(self, key: str, data: dict, cache_type: str):
        """Cache API response"""
        try:
            ttl = self.ttl_settings.get(cache_type, 3600)
            await self.redis.setex(
                f"{cache_type}:{key}",
                ttl,
                json.dumps(data)
            )
        except Exception:
            pass  # Cache failure shouldn't break the service
```

## Error Handling and Fallback Strategy

### Error Categories

1. **Network Errors**: Timeouts, connection failures
2. **Rate Limiting**: API quota exceeded
3. **Authentication Errors**: Invalid API keys
4. **Data Errors**: Malformed responses, missing data
5. **Service Unavailable**: External API downtime

### Fallback Implementation

```python
class MetadataEnrichmentService:
    async def enrich_book(self, isbn: str) -> EnrichmentResult:
        """Enrich book with fallback strategy"""
        errors = []
        metadata = BookMetadata()
        
        # Primary source: OpenLibrary
        try:
            ol_data = await self.openlibrary_client.get_book_by_isbn(isbn)
            if ol_data:
                metadata = self.merge_metadata(metadata, self.ol_mapper.map_book_data(ol_data))
            else:
                errors.append("OpenLibrary: No data found")
        except Exception as e:
            errors.append(f"OpenLibrary error: {str(e)}")
        
        # Secondary source: Google Books (if needed)
        if not metadata.is_complete():
            try:
                gb_data = await self.google_books_client.get_book_by_isbn(isbn)
                if gb_data:
                    metadata = self.merge_metadata(metadata, self.gb_mapper.map_book_data(gb_data))
                else:
                    errors.append("Google Books: No data found")
            except Exception as e:
                errors.append(f"Google Books error: {str(e)}")
        
        # Determine enrichment status
        status = self._determine_status(metadata, errors)
        
        return EnrichmentResult(
            status=status,
            metadata_updates=metadata,
            sources_used=self._get_sources_used(metadata),
            errors=errors,
            enriched_at=datetime.utcnow()
        )
```

## Monitoring and Observability

### Key Metrics

```python
EXTERNAL_API_METRICS = {
    'response_time': 'Average response time per API',
    'success_rate': 'Percentage of successful API calls',
    'rate_limit_hits': 'Number of rate limit encounters',
    'cache_hit_rate': 'Percentage of requests served from cache',
    'data_quality_score': 'Completeness of returned data',
    'cost_per_enrichment': 'API costs per book enrichment'
}
```

### Health Checks

```python
async def health_check_external_apis():
    """Check health of all external APIs"""
    health_status = {}
    
    # Test each API with a known good request
    apis = [
        ('openlibrary', lambda: test_openlibrary_connection()),
        ('google_books', lambda: test_google_books_connection()),
        ('wikidata', lambda: test_wikidata_connection())
    ]
    
    for api_name, test_func in apis:
        try:
            start_time = time.time()
            await test_func()
            response_time = time.time() - start_time
            
            health_status[api_name] = {
                'status': 'healthy',
                'response_time': response_time
            }
        except Exception as e:
            health_status[api_name] = {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    return health_status
```

---

*External APIs Integration Specification v1.0 - Comprehensive integration guide for EzLib Book Crawler*