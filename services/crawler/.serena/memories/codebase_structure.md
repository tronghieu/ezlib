# EzLib Book Crawler Service - Codebase Structure

## Directory Organization

```
services/crawler/
├── docs/                           # Comprehensive documentation
│   ├── prd.md                     # Product requirements
│   ├── architecture.md           # Technical architecture  
│   ├── external-apis.md          # External API integration
│   ├── data-contracts.md         # Database and API contracts
│   ├── workflows.md              # Processing workflows
│   ├── architecture/             # Detailed architecture docs
│   ├── prd/                      # Detailed PRD components
│   ├── stories/                  # Development stories
│   └── qa/                       # QA gates and testing criteria
├── src/                           # Main source code
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry point
│   ├── api/                      # FastAPI route handlers
│   │   ├── __init__.py
│   │   ├── enrichment.py         # Book enrichment endpoints
│   │   └── health.py             # Health check endpoints
│   ├── clients/                  # External API clients
│   │   ├── __init__.py
│   │   ├── base_client.py        # Base HTTP client class
│   │   └── openlibrary_client.py # OpenLibrary API client
│   ├── core/                     # Core application components
│   │   ├── __init__.py
│   │   ├── config.py             # Pydantic settings management
│   │   ├── exceptions.py         # Custom exception classes
│   │   └── logging.py            # Structured logging setup
│   ├── models/                   # Data models and schemas
│   │   ├── __init__.py
│   │   ├── database/             # Database models
│   │   │   ├── __init__.py
│   │   │   └── book_metadata.py  # Book metadata database model
│   │   ├── external/             # External API response models
│   │   │   ├── __init__.py
│   │   │   └── openlibrary_models.py # OpenLibrary API models
│   │   ├── requests/             # API request models
│   │   │   ├── __init__.py
│   │   │   └── enrichment_request.py # Enrichment request schemas
│   │   └── responses/            # API response models
│   │       ├── __init__.py
│   │       └── enrichment_result.py # Enrichment response schemas
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   └── enrichment_service.py # Main enrichment service
│   └── utils/                    # Utility functions
│       ├── __init__.py
│       └── isbn_utils.py         # ISBN validation and formatting
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── conftest.py              # Pytest configuration and fixtures
│   ├── test_main.py             # Main application tests
│   ├── api/                     # API endpoint tests
│   │   ├── __init__.py
│   │   └── test_enrichment.py   # Enrichment API tests
│   ├── clients/                 # External client tests
│   │   ├── __init__.py
│   │   └── test_openlibrary_client.py # OpenLibrary client tests
│   ├── services/                # Service layer tests
│   │   ├── __init__.py
│   │   └── test_enrichment_service.py # Enrichment service tests
│   └── utils/                   # Utility function tests
│       ├── __init__.py
│       └── test_isbn_utils.py   # ISBN utility tests
├── scripts/                     # Development utility scripts
│   ├── setup-dev.sh            # Development environment setup
│   ├── format-code.sh          # Code formatting script
│   └── run-tests.sh            # Test execution script
├── .env.example                # Environment variable template
├── .env                        # Local environment variables
├── pyproject.toml              # Poetry configuration and tool settings
├── poetry.lock                 # Locked dependency versions
├── Dockerfile                  # Container configuration
├── docker-compose.yml          # Multi-container setup
├── supervisord.conf            # Process management config
└── README.md                   # Project documentation
```

## Module Responsibilities

### Core Application (`src/main.py`)
- FastAPI application initialization
- Middleware configuration
- Route registration
- Lifespan management

### API Layer (`src/api/`)
- **enrichment.py**: Book enrichment endpoints, request/response handling
- **health.py**: Health check and monitoring endpoints
- Dependency injection for services
- HTTP error handling and status codes

### Service Layer (`src/services/`)
- **enrichment_service.py**: Core business logic for book enrichment
- External API orchestration
- Data quality validation and scoring
- Error handling and retry logic

### Client Layer (`src/clients/`)
- **base_client.py**: Shared HTTP client functionality, rate limiting, retry logic
- **openlibrary_client.py**: OpenLibrary API specific implementation
- Request/response transformation
- API-specific error handling

### Core Components (`src/core/`)
- **config.py**: Environment-based configuration with Pydantic
- **exceptions.py**: Custom application exceptions
- **logging.py**: Structured logging with correlation IDs

### Data Models (`src/models/`)
- **database/**: Database schema models for Supabase integration
- **external/**: External API response models for data transformation
- **requests/**: API request validation schemas
- **responses/**: API response formatting schemas

### Utilities (`src/utils/`)
- **isbn_utils.py**: ISBN validation, normalization, and conversion
- Reusable helper functions
- Data transformation utilities

## Key Architecture Patterns

### Dependency Injection
- Configuration injected via FastAPI dependencies
- Services injected into API handlers
- Clients injected into services

### Layered Architecture
- API → Service → Client → External API
- Clear separation of concerns
- Testable interfaces between layers

### Data Validation
- Pydantic models for all data structures
- Request validation at API boundary
- Response transformation in service layer

### Error Handling
- Custom exceptions with proper HTTP mapping
- Structured error responses
- Correlation ID tracking across layers