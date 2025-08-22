# EzLib Book Crawler Service - Coding Standards

## Overview

This document establishes coding standards, conventions, and best practices for the EzLib Book Crawler Service to ensure maintainable, consistent, and high-quality code.

## Python Code Standards

### Code Formatting
- **Formatter**: Black with line length of 88 characters
- **Import Sorting**: Ruff (replaces isort) with PEP 8 compliant grouping
- **Line Endings**: Unix LF (\n) only
- **Encoding**: UTF-8 with BOM excluded

```python
# Good: Black-formatted code
async def enrich_book_metadata(
    isbn: str, force_refresh: bool = False
) -> EnrichmentResult:
    """Enrich book metadata from external sources."""
    if not isbn or len(isbn) != 13:
        raise ValueError("Invalid ISBN-13 format")
    
    result = await external_api_client.fetch_book_data(isbn)
    return EnrichmentResult.from_api_response(result)
```

### Naming Conventions

#### Variables and Functions
- **Style**: snake_case
- **Descriptive**: Use full words, avoid abbreviations
- **Boolean**: Prefix with `is_`, `has_`, `should_`, `can_`

```python
# Good
book_metadata = await fetch_book_details(isbn_13)
is_enrichment_complete = all(required_fields_present)
has_valid_publication_date = validate_date(publication_date)

# Bad
bm = await fetch_details(isbn)  # Too abbreviated
enrichment_done = check_fields()  # Not descriptive enough
```

#### Classes and Types
- **Style**: PascalCase
- **Suffixes**: Use meaningful suffixes (`Service`, `Client`, `Model`, `Error`)
- **Generics**: Single uppercase letters (T, K, V)

```python
# Good
class BookEnrichmentService:
    pass

class ExternalAPIClient:
    pass

class EnrichmentError(Exception):
    pass

# Data models
class BookMetadata(BaseModel):
    title: str
    authors: List[str]
    publication_date: Optional[date] = None
```

#### Constants and Configuration
- **Style**: UPPER_SNAKE_CASE
- **Grouping**: Related constants in classes or modules
- **Type Hints**: Always include for better IDE support

```python
# Good - Configuration constants
API_REQUEST_TIMEOUT = 30.0
MAX_RETRY_ATTEMPTS = 3
DEFAULT_CACHE_TTL = 86400  # 24 hours in seconds

# Rate limits per API
RATE_LIMITS: Dict[str, Tuple[int, int]] = {
    "openlibrary": (100, 60),      # requests, seconds
    "google_books": (1000, 86400), # requests, seconds
    "wikidata": (5000, 3600),      # requests, seconds
}
```

### Type Hints and Annotations
- **Required**: All function parameters, return types, and class attributes
- **Style**: Use `from __future__ import annotations` for forward references
- **Optionals**: Prefer `Optional[T]` over `Union[T, None]`
- **Generics**: Use where appropriate for containers

```python
from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime

async def process_enrichment_batch(
    requests: List[EnrichmentRequest],
    max_concurrent: int = 10
) -> List[EnrichmentResult]:
    """Process multiple enrichment requests concurrently."""
    # Implementation here
    pass

class CacheManager:
    def __init__(self, redis_url: str, default_ttl: int = 3600) -> None:
        self._client: Optional[redis.Redis] = None
        self._default_ttl = default_ttl
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached value by key."""
        # Implementation here
        pass
```

### Error Handling Patterns

#### Custom Exceptions
- **Hierarchy**: Create specific exception classes
- **Context**: Include relevant information in exception messages
- **Chaining**: Use `raise ... from e` to preserve original exception

```python
class CrawlerServiceError(Exception):
    """Base exception for crawler service errors."""
    pass

class ExternalAPIError(CrawlerServiceError):
    """Error communicating with external APIs."""
    
    def __init__(self, api_name: str, status_code: int, message: str) -> None:
        self.api_name = api_name
        self.status_code = status_code
        super().__init__(f"{api_name} API error ({status_code}): {message}")

class DataValidationError(CrawlerServiceError):
    """Error validating external data."""
    
    def __init__(self, field_name: str, value: Any, reason: str) -> None:
        self.field_name = field_name
        self.value = value
        self.reason = reason
        super().__init__(f"Invalid {field_name} '{value}': {reason}")
```

#### Error Handling Best Practices
```python
# Good: Specific exception handling with context
async def fetch_book_data(isbn: str) -> Optional[BookMetadata]:
    try:
        response = await http_client.get(f"/books/{isbn}")
        response.raise_for_status()
        return BookMetadata.parse_raw(response.content)
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            logger.warning(f"Book not found for ISBN {isbn}")
            return None
        raise ExternalAPIError("OpenLibrary", e.response.status_code, str(e)) from e
    
    except ValidationError as e:
        raise DataValidationError("book_metadata", response.content, str(e)) from e
    
    except Exception as e:
        logger.error(f"Unexpected error fetching book {isbn}: {str(e)}")
        raise CrawlerServiceError(f"Failed to fetch book data: {str(e)}") from e
```

### Logging Standards

#### Structured Logging
- **Format**: JSON structure for production, pretty-printed for development
- **Levels**: Use appropriate log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **Context**: Include relevant context in log messages

```python
import structlog

logger = structlog.get_logger(__name__)

async def enrich_book(request: EnrichmentRequest) -> EnrichmentResult:
    """Enrich book with metadata from external sources."""
    
    # Info: Normal operations
    logger.info(
        "Starting book enrichment",
        book_edition_id=request.book_edition_id,
        isbn=request.isbn_13,
        force_refresh=request.force_refresh
    )
    
    try:
        # Debug: Detailed information
        logger.debug(
            "Fetching from OpenLibrary",
            isbn=request.isbn_13,
            cache_enabled=not request.force_refresh
        )
        
        result = await external_api.fetch_book_data(request.isbn_13)
        
        # Success logging
        logger.info(
            "Book enrichment completed",
            book_edition_id=request.book_edition_id,
            sources_used=result.sources_used,
            quality_score=result.quality_score
        )
        
        return result
        
    except ExternalAPIError as e:
        # Warning: Expected errors that we can handle
        logger.warning(
            "External API error during enrichment",
            book_edition_id=request.book_edition_id,
            api_name=e.api_name,
            status_code=e.status_code,
            error=str(e)
        )
        raise
    
    except Exception as e:
        # Error: Unexpected failures
        logger.error(
            "Unexpected error during book enrichment",
            book_edition_id=request.book_edition_id,
            isbn=request.isbn_13,
            error=str(e),
            exc_info=True  # Include stack trace
        )
        raise
```

### Async/Await Patterns

#### Async Function Design
- **Consistency**: Make functions fully async or fully sync, avoid mixing
- **Resource Management**: Use async context managers for external resources
- **Concurrency Control**: Use semaphores for rate limiting and resource control

```python
import asyncio
from contextlib import asynccontextmanager

class ExternalAPIClient:
    def __init__(self, max_concurrent: int = 10):
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._session: Optional[httpx.AsyncClient] = None
    
    @asynccontextmanager
    async def _get_session(self):
        """Get or create HTTP session with proper cleanup."""
        if self._session is None:
            self._session = httpx.AsyncClient(timeout=30.0)
        try:
            yield self._session
        finally:
            # Session cleanup happens in close() method
            pass
    
    async def fetch_with_rate_limit(self, url: str) -> httpx.Response:
        """Fetch URL with concurrency control."""
        async with self._semaphore:  # Limit concurrent requests
            async with self._get_session() as session:
                return await session.get(url)
    
    async def close(self) -> None:
        """Clean up resources."""
        if self._session:
            await self._session.aclose()
```

### Data Model Standards

#### Pydantic Models
- **Validation**: Include custom validators for complex validation logic
- **Serialization**: Use appropriate field aliases for external API compatibility
- **Documentation**: Include docstrings and field descriptions

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime

class BookMetadata(BaseModel):
    """Book metadata model with validation."""
    
    title: str = Field(..., min_length=1, max_length=500, description="Book title")
    subtitle: Optional[str] = Field(None, max_length=200, description="Book subtitle")
    authors: List[str] = Field(default_factory=list, description="List of author names")
    isbn_13: Optional[str] = Field(None, regex=r'^\d{13}$', description="13-digit ISBN")
    publication_date: Optional[date] = Field(None, description="Publication date")
    publisher: Optional[str] = Field(None, max_length=200, description="Publisher name")
    page_count: Optional[int] = Field(None, ge=1, le=10000, description="Number of pages")
    cover_image_url: Optional[str] = Field(None, description="URL to cover image")
    
    @validator('publication_date')
    def validate_publication_date(cls, v: Optional[date]) -> Optional[date]:
        """Validate publication date is reasonable."""
        if v is None:
            return v
        
        current_year = datetime.now().year
        if v.year < 1450 or v.year > current_year + 2:
            raise ValueError(f"Publication year {v.year} is not reasonable")
        
        return v
    
    @validator('authors')
    def validate_authors(cls, v: List[str]) -> List[str]:
        """Validate author names are not empty."""
        return [author.strip() for author in v if author and author.strip()]
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            date: lambda d: d.isoformat(),
            datetime: lambda dt: dt.isoformat()
        }
```

### Testing Standards

#### Test Structure
- **Organization**: Mirror source code structure in tests directory
- **Naming**: Test files end with `_test.py`, test functions start with `test_`
- **Fixtures**: Use pytest fixtures for reusable test setup

```python
import pytest
from unittest.mock import AsyncMock, patch
from datetime import date

from src.services.enrichment_service import BookEnrichmentService
from src.models.book_metadata import BookMetadata
from src.exceptions import ExternalAPIError

class TestBookEnrichmentService:
    """Test suite for BookEnrichmentService."""
    
    @pytest.fixture
    async def service(self):
        """Create enrichment service for testing."""
        service = BookEnrichmentService(
            openlibrary_client=AsyncMock(),
            google_books_client=AsyncMock(),
            cache_manager=AsyncMock()
        )
        yield service
        await service.close()
    
    @pytest.fixture
    def sample_book_metadata(self):
        """Sample book metadata for testing."""
        return BookMetadata(
            title="Test Book",
            authors=["Test Author"],
            isbn_13="9781234567890",
            publication_date=date(2023, 1, 1),
            publisher="Test Publisher"
        )
    
    async def test_enrich_book_success(self, service, sample_book_metadata):
        """Test successful book enrichment."""
        # Arrange
        isbn = "9781234567890"
        service.openlibrary_client.fetch_book_data.return_value = sample_book_metadata
        
        # Act
        result = await service.enrich_book(isbn)
        
        # Assert
        assert result.status == "success"
        assert result.metadata.title == "Test Book"
        assert len(result.metadata.authors) == 1
        service.openlibrary_client.fetch_book_data.assert_called_once_with(isbn)
    
    async def test_enrich_book_external_api_error(self, service):
        """Test handling of external API errors."""
        # Arrange
        isbn = "9781234567890"
        service.openlibrary_client.fetch_book_data.side_effect = ExternalAPIError(
            "OpenLibrary", 500, "Internal Server Error"
        )
        
        # Act & Assert
        with pytest.raises(ExternalAPIError) as exc_info:
            await service.enrich_book(isbn)
        
        assert exc_info.value.api_name == "OpenLibrary"
        assert exc_info.value.status_code == 500
```

### Documentation Standards

#### Function Documentation
- **Style**: Google-style docstrings
- **Content**: Purpose, parameters, return values, exceptions, examples
- **Type Hints**: Complement, don't duplicate type hints

```python
async def merge_book_metadata(
    primary_metadata: BookMetadata,
    secondary_metadata: BookMetadata,
    conflict_resolution: str = "primary"
) -> BookMetadata:
    """Merge book metadata from multiple sources.
    
    Combines metadata from multiple sources using the specified conflict
    resolution strategy. Primary metadata takes precedence for conflicting
    fields unless otherwise specified.
    
    Args:
        primary_metadata: Primary source of book metadata
        secondary_metadata: Secondary source to merge from
        conflict_resolution: Strategy for resolving conflicts
            - "primary": Primary source wins (default)
            - "most_complete": Most complete field wins
            - "newest": Newest data wins (requires timestamps)
    
    Returns:
        Merged BookMetadata instance with combined information
    
    Raises:
        ValueError: If conflict_resolution strategy is unknown
        DataValidationError: If merged data fails validation
    
    Example:
        >>> primary = BookMetadata(title="Book", authors=["Author"])
        >>> secondary = BookMetadata(title="Book", publisher="Publisher")
        >>> merged = await merge_book_metadata(primary, secondary)
        >>> assert merged.publisher == "Publisher"
    """
    # Implementation here
    pass
```

## Project Structure Standards

### Directory Organization
```
src/
├── api/                    # FastAPI routes and API layer
│   ├── __init__.py
│   ├── enrichment.py      # Enrichment endpoints
│   ├── health.py          # Health check endpoints
│   └── middleware.py      # Custom middleware
├── services/              # Business logic layer
│   ├── __init__.py
│   ├── enrichment_service.py
│   ├── external_api_service.py
│   └── cache_service.py
├── clients/               # External API clients
│   ├── __init__.py
│   ├── openlibrary_client.py
│   ├── google_books_client.py
│   └── base_client.py
├── models/                # Data models and schemas
│   ├── __init__.py
│   ├── book_metadata.py
│   ├── author_data.py
│   └── enrichment_request.py
├── core/                  # Core functionality
│   ├── __init__.py
│   ├── config.py          # Configuration management
│   ├── logging.py         # Logging setup
│   └── exceptions.py      # Custom exceptions
├── utils/                 # Utility functions
│   ├── __init__.py
│   ├── validators.py      # Data validation utilities
│   ├── date_parser.py     # Date parsing utilities
│   └── isbn_utils.py      # ISBN validation and conversion
└── main.py               # FastAPI application entry point

tests/                    # Mirror src/ structure
├── api/
├── services/
├── clients/
├── models/
├── core/
├── utils/
├── conftest.py          # Pytest configuration and fixtures
└── test_main.py        # Application-level tests
```

### Import Standards
```python
# Standard library imports
import asyncio
import json
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

# Third-party imports
import httpx
import structlog
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, validator

# Local imports
from src.core.config import settings
from src.core.exceptions import CrawlerServiceError
from src.models.book_metadata import BookMetadata
from src.services.enrichment_service import BookEnrichmentService
```

## Quality Assurance

### Code Quality Tools Configuration

#### pyproject.toml
```toml
[tool.black]
line-length = 88
target-version = ['py311']
include = '\.pyi?$'

[tool.ruff]
line-length = 88
target-version = "py311"
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long, handled by black
    "B008",  # do not perform function calls in argument defaults
]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--disable-warnings",
    "--cov=src",
    "--cov-report=term-missing",
    "--cov-report=html",
]
```

### Pre-commit Standards
- **Formatting**: Black runs before every commit
- **Linting**: Ruff checks code quality
- **Type Checking**: MyPy validates type hints
- **Tests**: All tests must pass before commit
- **Coverage**: Maintain minimum 80% test coverage

---

*EzLib Book Crawler Service - Coding Standards v1.0*
*Ensuring consistent, maintainable, and high-quality code*