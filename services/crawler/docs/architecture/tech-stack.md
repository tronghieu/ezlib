# EzLib Book Crawler Service - Technology Stack

## Overview

This document defines the specific technology stack for the EzLib Book Crawler Service based on the architecture requirements and deployment constraints.

## Core Technology Stack

### Runtime Environment
| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| **Language** | Python | 3.11+ | Rich ecosystem for web scraping, async processing, and data validation |
| **Package Manager** | Poetry | 1.6+ | Dependency management with lock files for reproducible builds |
| **Environment Management** | pyenv | 2.3+ | Python version management across development environments |

### Web Framework & API
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **API Framework** | FastAPI | 0.100+ | High-performance async API with automatic OpenAPI documentation |
| **ASGI Server** | Uvicorn | 0.23+ | Production ASGI server with hot reload for development |
| **Request Validation** | Pydantic | 2.0+ | Data validation and serialization with type hints |
| **HTTP Client** | httpx | 0.24+ | Async HTTP client for external API integration |

### Data & Database
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Database Client** | Supabase Python | 1.0+ | Integration with main EzLib Supabase database |
| **ORM Alternative** | Raw SQL + Supabase | N/A | Direct database operations for performance |
| **Data Models** | Pydantic | 2.0+ | Type-safe data models and validation |
| **Cache Layer** | Redis | 7.0+ | Response caching for external APIs |

### External API Integration
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Rate Limiting** | slowapi | 0.1+ | Per-API rate limiting and request queuing |
| **Web Scraping** | BeautifulSoup4 | 4.12+ | HTML parsing for sites without APIs |
| **JSON Processing** | Standard Library | N/A | Built-in JSON handling |
| **Date Parsing** | python-dateutil | 2.8+ | Robust date parsing from multiple formats |

### Development & Testing
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Testing Framework** | pytest | 7.4+ | Comprehensive testing with fixtures |
| **Async Testing** | pytest-asyncio | 0.21+ | Testing async functions and coroutines |
| **HTTP Testing** | httpx | 0.24+ | Testing HTTP clients and external API mocks |
| **Code Formatting** | black | 23.7+ | Consistent code formatting |
| **Linting** | ruff | 0.0.285+ | Fast Python linter replacing flake8/isort |
| **Type Checking** | mypy | 1.5+ | Static type checking |

### Infrastructure & Deployment
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Containerization** | Docker | 24.0+ | Consistent deployment environment |
| **Base Image** | python:3.11-slim | Latest | Lightweight Python container |
| **Orchestration** | Docker Compose | 2.20+ | Local development environment |
| **Process Management** | Supervisord | 4.2+ | Multi-process management in containers |

### Monitoring & Logging
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Logging** | structlog | 23.1+ | Structured logging with JSON output |
| **Metrics** | Prometheus Client | 0.17+ | Application metrics collection |
| **Health Checks** | FastAPI | Built-in | Service health endpoints |
| **Tracing** | OpenTelemetry | 1.19+ | Distributed tracing (future enhancement) |

## Development Tool Configuration

### Python Environment Setup
```bash
# Required Python version
python --version  # Should be 3.11+

# Install Poetry (if not installed)
curl -sSL https://install.python-poetry.org | python3 -

# Project setup
poetry install                    # Install dependencies
poetry shell                     # Activate virtual environment
```

### Code Quality Tools
```bash
# Formatting and linting
poetry run black .               # Code formatting
poetry run ruff check .          # Linting
poetry run mypy src/             # Type checking

# Testing
poetry run pytest               # Run all tests
poetry run pytest --cov        # With coverage report
```

### Docker Development
```bash
# Local development
docker-compose up --build       # Start all services
docker-compose down             # Stop services

# Production build
docker build -t ezlib-crawler . # Build production image
```

## External Service Dependencies

### Primary APIs
| Service | Base URL | Authentication | Rate Limits |
|---------|----------|---------------|-------------|
| **OpenLibrary** | https://openlibrary.org/api/ | None (Public) | 100 req/min |
| **Google Books** | https://www.googleapis.com/books/v1/ | API Key | 1,000 req/day |
| **Wikidata** | https://www.wikidata.org/w/api.php | None (Public) | 5,000 req/hour |
| **ISBN Database** | https://api2.isbndb.com/ | API Key | 2,500 req/month |

### Infrastructure Dependencies
| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Supabase** | Main database | URL + Service Role Key |
| **Redis** | Caching layer | Connection string |
| **Docker Registry** | Container hosting | Registry credentials |

## Environment Configuration

### Required Environment Variables
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs
GOOGLE_BOOKS_API_KEY=your-google-books-key
ISBN_DB_API_KEY=your-isbn-db-key

# Caching
REDIS_URL=redis://localhost:6379

# Application
LOG_LEVEL=INFO
DEBUG=false
PORT=8000
```

### Development vs Production

#### Development Environment
- **Database**: Local Supabase instance or development database
- **Cache**: Local Redis container
- **Logging**: DEBUG level with pretty printing
- **Hot Reload**: Enabled via uvicorn --reload
- **External APIs**: Rate limiting relaxed

#### Production Environment
- **Database**: Production Supabase with connection pooling
- **Cache**: Redis cluster with persistence
- **Logging**: INFO level with structured JSON
- **Process Management**: Supervisord with health checks
- **External APIs**: Full rate limiting with exponential backoff

## Performance Considerations

### Async Implementation
- **FastAPI**: Fully async request handling
- **httpx**: Async HTTP client for external APIs
- **Database**: Async Supabase client operations
- **Concurrency**: Controlled via semaphores and rate limiters

### Resource Optimization
- **Memory**: Pydantic models for memory-efficient data handling
- **CPU**: Limited concurrent external API calls
- **Network**: HTTP connection pooling and keep-alive
- **Disk**: Minimal local storage, cloud-based caching

## Security Stack

### API Security
| Layer | Technology | Implementation |
|-------|------------|----------------|
| **Authentication** | JWT Tokens | Service-to-service authentication |
| **Authorization** | IP Whitelisting | Restrict access to EzLib services |
| **Rate Limiting** | slowapi | Prevent abuse and respect API quotas |
| **Input Validation** | Pydantic | Validate all incoming data |

### Data Security
- **Secrets Management**: Environment variables (production: HashiCorp Vault)
- **Data Sanitization**: Custom validators for external data
- **SSL/TLS**: All external API communication over HTTPS
- **Database**: Supabase Row Level Security (RLS) policies

## Scalability Architecture

### Current Phase (MVP)
- **Single Instance**: One container with internal queuing
- **Database**: Shared Supabase instance
- **Cache**: Single Redis instance
- **Monitoring**: Basic health checks

### Future Scaling Path
- **Horizontal**: Multiple container instances behind load balancer
- **Database**: Dedicated Supabase project with read replicas
- **Cache**: Redis cluster with sharding
- **Queuing**: External message queue (Redis Pub/Sub or AWS SQS)
- **Monitoring**: Full observability stack (Prometheus + Grafana)

## Version Constraints & Compatibility

### Minimum Versions
- **Python 3.11**: Required for async improvements and error handling
- **FastAPI 0.100+**: Latest async features and OpenAPI 3.1 support
- **Pydantic 2.0+**: Performance improvements and validation features
- **Docker 24.0+**: Latest security patches and multi-platform builds

### Version Pinning Strategy
- **Production Dependencies**: Exact versions in poetry.lock
- **Development Dependencies**: Compatible version ranges
- **Docker Base Images**: Specific tags (not 'latest')
- **External APIs**: Version pinning in URL paths where available

---

*EzLib Book Crawler Service - Technology Stack v1.0*
*Focused on rapid development with production scalability*