# EzLib Book Crawler Service - Source Tree Structure

## Overview

This document defines the canonical source tree structure for the EzLib Book Crawler Service, establishing clear organizational patterns for maintainable and scalable development.

## Root Directory Structure

```
ezlib-book-crawler/
├── src/                          # Application source code
├── tests/                        # Test suite (mirrors src/ structure)
├── docs/                         # Documentation
├── scripts/                      # Deployment and utility scripts
├── docker/                       # Docker configuration files
├── .github/                      # GitHub Actions workflows
├── .ai/                         # AI development artifacts
├── poetry.lock                  # Locked dependency versions
├── pyproject.toml              # Python project configuration
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Local development environment
├── README.md                   # Project overview
└── .env.example               # Environment variable template
```

## Source Code Organization (`src/`)

### Primary Structure
```
src/
├── main.py                     # FastAPI application entry point
├── api/                        # API layer (routes, middleware, dependencies)
├── services/                   # Business logic layer
├── clients/                    # External API client implementations
├── models/                     # Data models and schemas
├── core/                       # Core functionality and configuration
├── utils/                      # Utility functions and helpers
└── __init__.py                # Package marker
```

### API Layer (`src/api/`)
```
api/
├── __init__.py
├── deps.py                     # FastAPI dependency injection
├── middleware.py              # Custom middleware implementations
├── enrichment.py              # Book enrichment endpoints
├── health.py                  # Health check and monitoring endpoints
├── batch.py                   # Batch processing endpoints
└── errors.py                  # Error handling and exception mappers
```

**File Purposes:**
- `enrichment.py` - Single book enrichment REST endpoints
- `batch.py` - Bulk enrichment operations
- `health.py` - Service health, readiness, and metrics endpoints
- `deps.py` - Reusable dependency injection functions
- `middleware.py` - Request logging, authentication, rate limiting
- `errors.py` - HTTP exception handlers and error response formatting

### Services Layer (`src/services/`)
```
services/
├── __init__.py
├── enrichment_service.py      # Core book enrichment orchestration
├── external_api_service.py    # External API integration coordinator
├── cache_service.py           # Caching layer management
├── database_service.py        # Database operations and transactions
├── validation_service.py      # Data quality validation and scoring
└── metrics_service.py         # Performance metrics collection
```

**Service Responsibilities:**
- `enrichment_service.py` - Main enrichment workflow orchestration
- `external_api_service.py` - Manages multiple external API clients
- `cache_service.py` - Redis caching with TTL management
- `database_service.py` - Supabase operations and data persistence
- `validation_service.py` - Data quality scoring and validation rules
- `metrics_service.py` - Application metrics and performance tracking

### External Clients (`src/clients/`)
```
clients/
├── __init__.py
├── base_client.py             # Abstract base client with common functionality
├── openlibrary_client.py      # OpenLibrary API client
├── google_books_client.py     # Google Books API client
├── wikidata_client.py         # Wikidata/Wikipedia API client
├── isbn_db_client.py          # ISBN Database API client
└── supabase_client.py         # Supabase database client wrapper
```

**Client Pattern:**
Each client inherits from `base_client.py` and implements:
- Rate limiting and retry logic
- Response parsing and error handling
- Caching integration
- Metrics collection

### Data Models (`src/models/`)
```
models/
├── __init__.py
├── requests/                   # Request models
│   ├── __init__.py
│   ├── enrichment_request.py  # Single enrichment request
│   └── batch_request.py       # Batch enrichment request
├── responses/                  # Response models
│   ├── __init__.py
│   ├── enrichment_result.py   # Enrichment operation result
│   ├── batch_result.py        # Batch operation result
│   └── health_response.py     # Health check responses
├── external/                   # External API response models
│   ├── __init__.py
│   ├── openlibrary_models.py  # OpenLibrary API response schemas
│   ├── google_books_models.py # Google Books API response schemas
│   └── wikidata_models.py     # Wikidata API response schemas
├── database/                   # Database models
│   ├── __init__.py
│   ├── book_metadata.py       # Book metadata representation
│   ├── author_data.py         # Author information representation
│   └── enrichment_job.py      # Enrichment job tracking
└── base.py                    # Base model with common functionality
```

### Core Functionality (`src/core/`)
```
core/
├── __init__.py
├── config.py                   # Application configuration management
├── logging.py                  # Structured logging setup
├── exceptions.py               # Custom exception hierarchy
├── security.py                # Authentication and security utilities
├── database.py                # Database connection management
└── cache.py                   # Cache connection management
```

**Core Components:**
- `config.py` - Environment-based configuration with validation
- `logging.py` - Structured JSON logging with context
- `exceptions.py` - Custom exception classes for error handling
- `security.py` - JWT validation and service authentication
- `database.py` - Supabase connection pooling and management
- `cache.py` - Redis connection and health monitoring

### Utility Functions (`src/utils/`)
```
utils/
├── __init__.py
├── validators.py               # Data validation utilities
├── date_parser.py             # Date parsing and normalization
├── isbn_utils.py              # ISBN validation and conversion
├── text_processing.py         # Text cleaning and normalization
├── rate_limiter.py            # Rate limiting implementations
└── retry.py                   # Retry logic with exponential backoff
```

## Test Structure (`tests/`)

### Test Organization
```
tests/
├── conftest.py                # Pytest configuration and shared fixtures
├── test_main.py               # Application-level integration tests
├── api/                       # API endpoint tests
│   ├── __init__.py
│   ├── test_enrichment.py     # Enrichment endpoint tests
│   ├── test_batch.py          # Batch endpoint tests
│   └── test_health.py         # Health endpoint tests
├── services/                  # Service layer tests
│   ├── __init__.py
│   ├── test_enrichment_service.py
│   ├── test_external_api_service.py
│   └── test_cache_service.py
├── clients/                   # External client tests
│   ├── __init__.py
│   ├── test_openlibrary_client.py
│   ├── test_google_books_client.py
│   └── test_supabase_client.py
├── models/                    # Model validation tests
│   ├── __init__.py
│   ├── test_book_metadata.py
│   └── test_enrichment_request.py
├── utils/                     # Utility function tests
│   ├── __init__.py
│   ├── test_validators.py
│   └── test_isbn_utils.py
└── fixtures/                  # Test data fixtures
    ├── __init__.py
    ├── book_metadata.json     # Sample book metadata
    ├── api_responses/         # Mock external API responses
    └── database/              # Test database fixtures
```

### Test File Naming Convention
- **Unit Tests**: `test_{module_name}.py` - Tests for individual functions/classes
- **Integration Tests**: `test_{feature_name}_integration.py` - Cross-component tests  
- **E2E Tests**: `test_{workflow_name}_e2e.py` - End-to-end workflow tests
- **Fixtures**: Data files in `fixtures/` with descriptive names

## Documentation Structure (`docs/`)

```
docs/
├── README.md                   # Documentation index
├── architecture.md             # High-level architecture overview
├── prd.md                     # Product requirements document
├── data-contracts.md          # API and database contracts
├── external-apis.md           # External API integration guide
├── workflows.md               # Process workflows and algorithms
├── architecture/              # Detailed architecture documents
│   ├── tech-stack.md         # Technology stack specification
│   ├── coding-standards.md   # Development standards and conventions
│   └── source-tree.md        # This document
├── api/                       # API documentation
│   ├── openapi.yaml          # OpenAPI specification (generated)
│   └── examples.md           # API usage examples
├── deployment/                # Deployment guides
│   ├── docker.md             # Docker deployment guide
│   ├── kubernetes.md         # Kubernetes deployment (future)
│   └── monitoring.md         # Monitoring and observability
└── development/               # Development guides
    ├── getting-started.md     # Development environment setup
    ├── testing.md            # Testing guidelines
    └── contributing.md       # Contribution guidelines
```

## Configuration and Scripts

### Scripts Directory (`scripts/`)
```
scripts/
├── setup-dev.sh              # Development environment setup
├── run-tests.sh              # Test execution with coverage
├── deploy.sh                 # Deployment script
├── backup-db.sh              # Database backup utility
├── load-test-data.sh         # Load sample data for testing
└── health-check.sh           # Service health validation
```

### Docker Configuration (`docker/`)
```
docker/
├── Dockerfile.dev            # Development container
├── Dockerfile.prod           # Production container
├── docker-compose.yml       # Local development stack
├── docker-compose.prod.yml  # Production stack template
└── nginx/                   # Nginx configuration (if using reverse proxy)
    └── default.conf
```

### CI/CD Configuration (`.github/`)
```
.github/
├── workflows/
│   ├── test.yml              # Run tests on PR/push
│   ├── build.yml             # Build and publish container
│   ├── deploy.yml            # Deploy to environments
│   └── security.yml          # Security scanning
├── ISSUE_TEMPLATE/           # Issue templates
└── pull_request_template.md  # PR template
```

## File Naming Conventions

### General Rules
- **Snake Case**: All Python files use snake_case naming
- **Descriptive Names**: Files should clearly indicate their purpose
- **Consistent Suffixes**: Use meaningful suffixes for file types

### Specific Patterns
```
# Services
{domain}_service.py           # e.g., enrichment_service.py

# Clients  
{api_name}_client.py         # e.g., openlibrary_client.py

# Models
{entity}_model.py            # e.g., book_metadata.py
{request_type}_request.py    # e.g., enrichment_request.py
{response_type}_response.py  # e.g., health_response.py

# Tests
test_{module_name}.py        # e.g., test_enrichment_service.py
test_{feature}_integration.py
test_{workflow}_e2e.py

# Configuration
{env}_config.py              # e.g., dev_config.py, prod_config.py

# Utilities
{purpose}_utils.py           # e.g., isbn_utils.py, date_utils.py
```

## Import Path Structure

### Absolute Imports
All imports within the application use absolute paths from the `src` root:

```python
# Good: Absolute imports
from src.services.enrichment_service import BookEnrichmentService
from src.models.book_metadata import BookMetadata  
from src.core.config import settings
from src.utils.validators import validate_isbn

# Bad: Relative imports for internal modules  
from ..services.enrichment_service import BookEnrichmentService
from .book_metadata import BookMetadata
```

### Import Grouping
```python
# 1. Standard library imports
import asyncio
import json
from datetime import datetime, date
from typing import Optional, List, Dict

# 2. Third-party library imports  
import httpx
import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 3. Local application imports
from src.core.config import settings
from src.services.enrichment_service import BookEnrichmentService
from src.models.book_metadata import BookMetadata
```

## Development Workflow Integration

### AI Development Artifacts (`.ai/`)
```
.ai/
├── debug-log.md              # Development debug log
├── stories/                  # Development stories
│   ├── story-001-setup.md   # Initial project setup
│   ├── story-002-api.md     # API implementation
│   └── story-003-tests.md   # Test implementation  
├── prompts/                  # AI assistance prompts
└── context/                  # Development context files
```

### Environment Files
```
# Development
.env.development              # Development environment variables
.env.test                    # Test environment variables  
.env.example                 # Template with all required variables

# Production (not in repository)
.env.production              # Production secrets
.env.staging                 # Staging environment
```

## Module Dependencies

### Dependency Layers
```
┌─────────────────┐
│   API Layer     │  ← FastAPI routes, middleware
│   (src/api/)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Services Layer  │  ← Business logic, workflows
│ (src/services/) │
└─────────────────┘  
         │
         ▼
┌─────────────────┐
│ Clients Layer   │  ← External API clients
│ (src/clients/)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Core Layer    │  ← Configuration, logging, exceptions
│  (src/core/)    │
└─────────────────┘
```

### Dependency Rules
1. **API Layer** can import from Services, Models, and Core
2. **Services Layer** can import from Clients, Models, Core, and Utils
3. **Clients Layer** can import from Models, Core, and Utils
4. **Core Layer** is independent (no internal dependencies)
5. **Utils Layer** can import from Core only
6. **Models Layer** can import from Core only

## Quality and Maintenance

### Code Organization Principles
- **Single Responsibility**: Each module has one clear purpose
- **Dependency Injection**: Services receive dependencies through constructors
- **Interface Segregation**: Small, focused interfaces rather than large ones
- **Domain Separation**: Business logic separated from infrastructure concerns

### Maintenance Guidelines
- **Regular Refactoring**: Move common code to appropriate utils modules
- **Documentation Updates**: Keep source tree documentation current
- **Dependency Auditing**: Regular review of inter-module dependencies
- **Pattern Consistency**: Maintain consistent patterns across similar modules

---

*EzLib Book Crawler Service - Source Tree Structure v1.0*
*Organized for maintainability, scalability, and developer productivity*