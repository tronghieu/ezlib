# Data Contracts Specification

## Overview

This document defines the data contracts between the Book Crawler Service and the main EzLib system. It ensures consistent data structures, API interfaces, and database interactions while maintaining loose coupling between services.

## Database Integration

### Shared Database Tables

The crawler service operates directly on the main EzLib Supabase database but is limited to specific tables and operations to maintain data integrity.

#### Allowed Operations by Table

| Table | CREATE | READ | UPDATE | DELETE | Notes |
|-------|--------|------|--------|--------|-------|
| `book_editions` | ❌ | ✅ | ✅ | ❌ | Can only update metadata fields |
| `authors` | ✅ | ✅ | ✅ | ❌ | Can create new authors, update existing |
| `book_contributors` | ✅ | ✅ | ✅ | ❌ | Link books to authors |
| `general_books` | ❌ | ✅ | ✅ | ❌ | Can only update global stats |
| `book_inventory` | ❌ | ✅ | ❌ | ❌ | Read-only for availability checks |

### Database Connection Configuration

```python
# Supabase client configuration for crawler service
SUPABASE_CONFIG = {
    "url": os.getenv("SUPABASE_URL"),
    "key": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),  # Service role for elevated permissions
    "options": {
        "schema": "public",
        "auto_refresh_token": True,
        "persist_session": False  # Stateless service
    }
}

class CrawlerDatabase:
    def __init__(self):
        self.client = create_client(
            SUPABASE_CONFIG["url"],
            SUPABASE_CONFIG["key"],
            options=SUPABASE_CONFIG["options"]
        )
```

### Data Update Patterns

#### Book Metadata Updates

```python
async def update_book_metadata(self, book_edition_id: str, metadata: BookMetadata) -> bool:
    """Update book edition metadata from crawler enrichment"""
    try:
        # Prepare metadata update
        metadata_update = {
            "edition_metadata": {
                "publisher": metadata.publisher,
                "publication_date": metadata.publication_date.isoformat() if metadata.publication_date else None,
                "page_count": metadata.page_count,
                "cover_image_url": metadata.cover_image_url,
                "edition_notes": metadata.edition_notes,
                "format": metadata.format,
                "last_enriched_at": datetime.utcnow().isoformat()
            }
        }
        
        # Update with conflict resolution
        result = await self.client.table("book_editions") \
            .update(metadata_update) \
            .eq("id", book_edition_id) \
            .execute()
        
        return len(result.data) > 0
        
    except Exception as e:
        logger.error(f"Failed to update book metadata for {book_edition_id}: {str(e)}")
        return False
```

#### Author Creation and Updates

```python
async def upsert_author(self, author_data: AuthorData) -> Optional[str]:
    """Create or update author record with external ID linking"""
    try:
        # Check for existing author by external IDs or canonical name
        existing_author = await self._find_existing_author(author_data)
        
        author_record = {
            "name": author_data.name,
            "canonical_name": author_data.canonical_name,
            "biography": author_data.biography,
            "metadata": {
                "birth_date": author_data.birth_date.isoformat() if author_data.birth_date else None,
                "death_date": author_data.death_date.isoformat() if author_data.death_date else None,
                "photo_url": author_data.photo_url,
                "external_ids": author_data.external_ids,
                "last_enriched_at": datetime.utcnow().isoformat()
            }
        }
        
        if existing_author:
            # Update existing author
            result = await self.client.table("authors") \
                .update(author_record) \
                .eq("id", existing_author["id"]) \
                .execute()
            return existing_author["id"]
        else:
            # Create new author
            result = await self.client.table("authors") \
                .insert(author_record) \
                .execute()
            return result.data[0]["id"] if result.data else None
            
    except Exception as e:
        logger.error(f"Failed to upsert author {author_data.name}: {str(e)}")
        return None
```

## API Contracts

### Internal Service API

The crawler service exposes REST endpoints for the main EzLib system to trigger enrichment operations.

#### Request/Response Models

```python
# Request models
class EnrichmentRequest(BaseModel):
    book_edition_id: str = Field(..., description="UUID of the book edition to enrich")
    isbn_13: Optional[str] = Field(None, description="ISBN-13 for external lookups")
    force_refresh: bool = Field(False, description="Force re-enrichment even if recently updated")
    priority: Literal["low", "normal", "high"] = Field("normal", description="Processing priority")

class BatchEnrichmentRequest(BaseModel):
    requests: List[EnrichmentRequest] = Field(..., max_items=100)
    callback_url: Optional[str] = Field(None, description="Webhook URL for completion notification")

# Response models
class EnrichmentStatus(BaseModel):
    job_id: str
    book_edition_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress: float = Field(ge=0.0, le=1.0)
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class EnrichmentResult(BaseModel):
    job_id: str
    book_edition_id: str
    status: Literal["success", "partial", "failed"]
    metadata_updated: bool
    authors_updated: List[str]  # List of author IDs updated/created
    sources_used: List[str]
    data_quality_score: float = Field(ge=0.0, le=1.0)
    errors: List[str] = []
    enriched_at: datetime
```

#### API Endpoint Specifications

```yaml
# OpenAPI specification for crawler service
paths:
  /api/v1/enrich:
    post:
      summary: Trigger single book enrichment
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EnrichmentRequest'
      responses:
        '202':
          description: Enrichment job accepted
          content:
            application/json:
              schema:
                type: object
                properties:
                  job_id:
                    type: string
                    format: uuid
                  estimated_completion:
                    type: string
                    format: date-time
        '400':
          description: Invalid request
        '429':
          description: Rate limit exceeded

  /api/v1/enrich/batch:
    post:
      summary: Trigger batch enrichment
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BatchEnrichmentRequest'
      responses:
        '202':
          description: Batch job accepted
          content:
            application/json:
              schema:
                type: object
                properties:
                  batch_id:
                    type: string
                    format: uuid
                  job_ids:
                    type: array
                    items:
                      type: string
                      format: uuid

  /api/v1/status/{job_id}:
    get:
      summary: Get enrichment job status
      parameters:
        - name: job_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Job status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EnrichmentStatus'
        '404':
          description: Job not found
```

### Main System Integration

#### Triggering Enrichment from Main API

```python
# In main EzLib API - when new book is added
class LibraryBookController:
    async def add_book_to_inventory(self, request: AddBookRequest):
        # Create book edition and inventory records
        book_edition = await self.create_book_edition(request)
        inventory = await self.create_inventory_record(book_edition.id, request.library_id)
        
        # Trigger asynchronous enrichment
        if book_edition.isbn_13:
            enrichment_request = EnrichmentRequest(
                book_edition_id=book_edition.id,
                isbn_13=book_edition.isbn_13,
                priority="normal"
            )
            
            try:
                await self.crawler_client.enrich_book(enrichment_request)
                logger.info(f"Enrichment triggered for book {book_edition.id}")
            except Exception as e:
                logger.warning(f"Failed to trigger enrichment: {str(e)}")
                # Continue without enrichment - not a blocking error
        
        return {"book_edition": book_edition, "inventory": inventory}
```

## Data Validation and Quality Assurance

### Input Validation

```python
class DataValidator:
    def validate_isbn(self, isbn: str) -> bool:
        """Validate ISBN-13 format and checksum"""
        if not isbn or len(isbn) != 13:
            return False
        
        # Check if all characters are digits
        if not isbn.isdigit():
            return False
        
        # Validate checksum
        checksum = sum(int(digit) * (1 if i % 2 == 0 else 3) 
                      for i, digit in enumerate(isbn[:12]))
        check_digit = (10 - (checksum % 10)) % 10
        
        return int(isbn[12]) == check_digit
    
    def validate_publication_date(self, date: str, title: str) -> bool:
        """Validate publication date is reasonable"""
        try:
            pub_date = datetime.fromisoformat(date)
            current_year = datetime.now().year
            
            # Books should be published between 1450 (Gutenberg) and 2 years in future
            return 1450 <= pub_date.year <= current_year + 2
        except:
            return False
    
    def validate_author_name(self, name: str) -> bool:
        """Validate author name format"""
        if not name or len(name.strip()) < 2:
            return False
        
        # Check for suspicious patterns
        suspicious_patterns = ['unknown', 'anonymous', 'n/a', 'test']
        return not any(pattern in name.lower() for pattern in suspicious_patterns)
```

### Data Quality Scoring

```python
class DataQualityScorer:
    def calculate_book_metadata_score(self, metadata: BookMetadata) -> float:
        """Calculate data quality score for book metadata"""
        score_components = {
            'title': 1.0 if metadata.title else 0.0,
            'publisher': 0.8 if metadata.publisher else 0.0,
            'publication_date': 0.8 if metadata.publication_date else 0.0,
            'page_count': 0.5 if metadata.page_count else 0.0,
            'cover_image': 0.7 if metadata.cover_image_url else 0.0,
            'description': 0.6 if metadata.description else 0.0,
            'subjects': 0.4 if metadata.subjects else 0.0
        }
        
        # Weighted average
        weights = {
            'title': 0.25,
            'publisher': 0.15,
            'publication_date': 0.15,
            'page_count': 0.10,
            'cover_image': 0.15,
            'description': 0.10,
            'subjects': 0.10
        }
        
        total_score = sum(score_components[field] * weights[field] 
                         for field in score_components)
        
        return round(total_score, 2)
    
    def calculate_author_data_score(self, author: AuthorData) -> float:
        """Calculate data quality score for author data"""
        score_components = {
            'name': 1.0 if author.name else 0.0,
            'biography': 0.8 if author.biography else 0.0,
            'birth_date': 0.6 if author.birth_date else 0.0,
            'photo_url': 0.5 if author.photo_url else 0.0,
            'external_ids': 0.7 if any(author.external_ids.values()) else 0.0
        }
        
        # Simple average for author data
        return sum(score_components.values()) / len(score_components)
```

## Error Handling and Rollback

### Transaction Management

```python
class CrawlerTransactionManager:
    async def enrich_book_with_rollback(self, request: EnrichmentRequest) -> EnrichmentResult:
        """Enrich book with automatic rollback on failure"""
        
        # Capture current state for rollback
        original_state = await self._capture_book_state(request.book_edition_id)
        
        try:
            # Perform enrichment
            result = await self.enrichment_service.enrich_book(request)
            
            if result.status == "failed":
                # Rollback on failure
                await self._rollback_book_state(request.book_edition_id, original_state)
                logger.warning(f"Enrichment failed, rolled back book {request.book_edition_id}")
            
            return result
            
        except Exception as e:
            # Rollback on exception
            await self._rollback_book_state(request.book_edition_id, original_state)
            logger.error(f"Enrichment error, rolled back book {request.book_edition_id}: {str(e)}")
            
            return EnrichmentResult(
                job_id=str(uuid.uuid4()),
                book_edition_id=request.book_edition_id,
                status="failed",
                metadata_updated=False,
                authors_updated=[],
                sources_used=[],
                errors=[str(e)],
                enriched_at=datetime.utcnow()
            )
    
    async def _capture_book_state(self, book_edition_id: str) -> dict:
        """Capture current book state for potential rollback"""
        book_data = await self.db.get_book_edition(book_edition_id)
        author_data = await self.db.get_book_authors(book_edition_id)
        
        return {
            "book_edition": book_data,
            "authors": author_data,
            "timestamp": datetime.utcnow()
        }
    
    async def _rollback_book_state(self, book_edition_id: str, original_state: dict):
        """Rollback book to original state"""
        try:
            # Restore book edition data
            await self.db.update_book_edition(book_edition_id, original_state["book_edition"])
            
            # Note: We don't rollback author data as it might be shared with other books
            logger.info(f"Successfully rolled back book {book_edition_id}")
            
        except Exception as e:
            logger.error(f"Failed to rollback book {book_edition_id}: {str(e)}")
```

## Monitoring and Observability

### Performance Metrics

```python
CRAWLER_METRICS = {
    # Database operations
    "db_query_duration": "Duration of database queries",
    "db_connection_pool_size": "Number of active database connections",
    "db_transaction_success_rate": "Percentage of successful database transactions",
    
    # API integration
    "api_enrichment_duration": "Total time for book enrichment",
    "api_request_success_rate": "Percentage of successful API requests",
    "api_data_quality_score": "Average data quality score",
    
    # System health
    "memory_usage": "Current memory usage",
    "cpu_usage": "Current CPU usage",
    "queue_depth": "Number of pending enrichment jobs",
    
    # Business metrics
    "books_enriched_per_hour": "Rate of book enrichment",
    "authors_created_per_day": "Rate of new author creation",
    "data_completeness_improvement": "Improvement in data completeness"
}
```

### Health Check Implementation

```python
async def health_check():
    """Comprehensive health check for crawler service"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {}
    }
    
    # Database connectivity
    try:
        await db_client.execute("SELECT 1")
        health_status["components"]["database"] = {"status": "healthy"}
    except Exception as e:
        health_status["components"]["database"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"
    
    # External APIs
    api_health = await check_external_apis_health()
    health_status["components"]["external_apis"] = api_health
    
    # Cache system
    try:
        await cache_client.ping()
        health_status["components"]["cache"] = {"status": "healthy"}
    except Exception as e:
        health_status["components"]["cache"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"
    
    return health_status
```

## Security Considerations

### Service Authentication

```python
class ServiceAuthenticator:
    def __init__(self, jwt_secret: str, allowed_services: List[str]):
        self.jwt_secret = jwt_secret
        self.allowed_services = allowed_services
    
    def verify_service_token(self, token: str) -> bool:
        """Verify JWT token from main EzLib service"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            
            # Verify service identity
            service_id = payload.get("service_id")
            return service_id in self.allowed_services
            
        except jwt.InvalidTokenError:
            return False
    
    def create_service_token(self, service_id: str) -> str:
        """Create JWT token for service-to-service communication"""
        payload = {
            "service_id": service_id,
            "issued_at": datetime.utcnow().timestamp(),
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).timestamp()
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
```

### Data Sanitization

```python
class DataSanitizer:
    def sanitize_book_metadata(self, metadata: BookMetadata) -> BookMetadata:
        """Sanitize book metadata from external sources"""
        return BookMetadata(
            title=self._clean_text(metadata.title),
            subtitle=self._clean_text(metadata.subtitle),
            publisher=self._clean_text(metadata.publisher),
            description=self._clean_html(metadata.description),
            subjects=self._clean_subjects(metadata.subjects),
            # ... other fields
        )
    
    def _clean_text(self, text: Optional[str]) -> Optional[str]:
        """Remove potentially harmful content from text"""
        if not text:
            return None
            
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Limit length
        return text[:1000] if len(text) > 1000 else text
    
    def _clean_html(self, html: Optional[str]) -> Optional[str]:
        """Clean HTML content safely"""
        if not html:
            return None
            
        # Use bleach library to sanitize HTML
        allowed_tags = ['p', 'br', 'em', 'strong', 'i', 'b']
        return bleach.clean(html, tags=allowed_tags, strip=True)
```

---

*Data Contracts Specification v1.0 - Ensuring consistent integration between crawler service and EzLib system*