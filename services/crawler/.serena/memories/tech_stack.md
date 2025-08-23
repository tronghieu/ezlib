# EzLib Book Crawler Service - Technology Stack

## Core Technologies

### Runtime & Framework
- **Python**: 3.11+ (primary language)
- **FastAPI**: 0.100+ (async REST API framework with automatic OpenAPI docs)
- **Uvicorn**: 0.23+ (ASGI server for running FastAPI)

### Dependencies (Poetry managed)
- **httpx**: 0.24+ (async HTTP client for external API calls)
- **Pydantic**: 2.0+ (data validation and settings management)
- **pydantic-settings**: 2.0+ (environment variable handling)
- **structlog**: 23.1+ (structured logging)

### Development Tools
- **Poetry**: Dependency management and packaging
- **Black**: Code formatter (line length: 88)
- **Ruff**: Fast Python linter and import sorter
- **MyPy**: Static type checking with strict settings
- **Pytest**: Testing framework with async support and coverage

### External Integrations
- **Supabase**: PostgreSQL database (main EzLib database)
- **Redis**: Response caching for external APIs
- **OpenLibrary**: Primary data source (public API)
- **Google Books**: Secondary data source (API key required)
- **ISBN Database**: Fallback data source (paid API)
- **Wikipedia**: Author information source

### Deployment
- **Vercel Functions**: Serverless deployment (Phase 1)
- **Docker**: Container deployment (Phase 2)
- **Supervisord**: Process management in containers

## Configuration Management
- **Environment Variables**: Managed through `.env` files
- **Pydantic Settings**: Type-safe configuration with validation
- **Multiple Environments**: Development, production configurations