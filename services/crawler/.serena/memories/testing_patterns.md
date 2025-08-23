# EzLib Book Crawler Service - Testing Patterns & Guidelines

## Testing Framework & Configuration

### Core Testing Stack
- **Pytest**: Main testing framework with async support
- **pytest-asyncio**: Async test support (`asyncio_mode = "auto"`)
- **FastAPI TestClient**: HTTP client for API testing
- **httpx.AsyncClient**: Async HTTP client for integration tests
- **unittest.mock**: Mocking external dependencies

### Test Configuration (`pyproject.toml`)
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
asyncio_mode = "auto"
```

### Coverage Requirements
- **Minimum**: 80% code coverage enforced
- **Reports**: Terminal and HTML coverage reports
- **Command**: `pytest --cov=src --cov-report=term-missing --cov-report=html --cov-fail-under=80`

## Test Organization

### Directory Structure
```
tests/
├── conftest.py              # Shared fixtures and configuration
├── test_main.py            # FastAPI application tests
├── api/                    # API endpoint tests
├── clients/                # External client tests  
├── services/               # Business logic tests
└── utils/                  # Utility function tests
```

### Test Categories
- **Unit Tests**: Individual components in isolation
- **Integration Tests**: External API interactions (mocked)
- **API Tests**: FastAPI endpoint testing with TestClient
- **External API Tests**: Real external API calls (marked with `@pytest.mark.external_api`)

## Common Testing Patterns

### FastAPI Testing (`conftest.py`)
```python
@pytest.fixture
def client():
    """Sync test client for FastAPI."""
    with TestClient(app) as client:
        yield client

@pytest.fixture
async def async_client():
    """Async test client for FastAPI."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

### Async Test Example
```python
@pytest.mark.asyncio
async def test_enrich_book_success(async_client):
    """Test successful book enrichment."""
    response = await async_client.post(
        "/api/v1/enrich",
        json={"isbn": "9780441569595", "book_edition_id": "uuid"}
    )
    assert response.status_code == 200
    assert "metadata" in response.json()
```

### External API Mocking
```python
@patch('src.clients.openlibrary_client.httpx.AsyncClient')
async def test_openlibrary_client_success(mock_client):
    """Test OpenLibrary client with mocked response."""
    mock_response = Mock()
    mock_response.json.return_value = {"title": "Test Book"}
    mock_response.status_code = 200
    mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
    
    client = OpenLibraryClient()
    result = await client.fetch_book("9780441569595")
    assert result["title"] == "Test Book"
```

## Test Class Organization

### Naming Convention
```python
class TestEnrichmentAPI:
    """Test class for enrichment API endpoints."""
    
    def test_enrich_book_success(self):
        """Test successful enrichment."""
        pass
    
    def test_enrich_book_not_found(self):
        """Test book not found scenario."""
        pass
    
    def test_enrich_book_invalid_isbn(self):
        """Test invalid ISBN handling."""
        pass
```

### Test Method Patterns
- **Naming**: `test_[component]_[scenario]` (e.g., `test_enrich_book_success`)
- **Structure**: Arrange-Act-Assert pattern
- **Docstrings**: Brief description of what is being tested

## Mocking Strategies

### External APIs
- **Mock at client level**: Mock httpx.AsyncClient for HTTP calls
- **Mock responses**: Create realistic response objects
- **Test error scenarios**: Mock various HTTP error codes and timeouts

### Database Operations
- **Mock Supabase client**: Mock database operations
- **Test data**: Use realistic test data structures
- **Transaction testing**: Mock transaction rollbacks and commits

### Configuration
- **Environment variables**: Mock settings using monkeypatch
- **Feature flags**: Test different configuration states

## Test Data Management

### Fixtures for Test Data
```python
@pytest.fixture
def sample_book_data():
    """Sample book metadata for testing."""
    return {
        "isbn": "9780441569595",
        "title": "Neuromancer",
        "author": "William Gibson",
        "publication_date": "1984-07-01"
    }

@pytest.fixture
def mock_openlibrary_response():
    """Mock OpenLibrary API response."""
    return {
        "docs": [{
            "title": "Neuromancer",
            "author_name": ["William Gibson"],
            "first_publish_year": 1984
        }]
    }
```

### Test Data Isolation
- Each test should be independent
- Use fixtures for setup and teardown
- Avoid shared mutable state between tests

## Performance Testing

### Response Time Testing
```python
import time

def test_enrichment_performance():
    """Test enrichment response time."""
    start_time = time.time()
    # Perform enrichment
    elapsed_time = time.time() - start_time
    assert elapsed_time < 5.0  # Max 5 seconds
```

### Rate Limiting Tests
```python
async def test_rate_limiting():
    """Test rate limiting behavior."""
    # Test rapid requests to ensure rate limiting works
    tasks = [client.get("/api/v1/enrich") for _ in range(10)]
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    # Verify some requests are rate limited
```

## Error Testing Patterns

### HTTP Error Codes
```python
def test_enrichment_invalid_isbn():
    """Test invalid ISBN returns 400."""
    response = client.post("/api/v1/enrich", json={"isbn": "invalid"})
    assert response.status_code == 400
    assert "error" in response.json()
```

### Exception Handling
```python
@patch('src.services.enrichment_service.BookEnrichmentService.enrich_book')
def test_enrichment_service_error(mock_enrich):
    """Test service error handling."""
    mock_enrich.side_effect = Exception("Service error")
    
    response = client.post("/api/v1/enrich", json={"isbn": "9780441569595"})
    assert response.status_code == 500
```

## Test Execution

### Running Tests
```bash
# All tests
poetry run pytest tests/ -v

# Specific test file
poetry run pytest tests/api/test_enrichment.py -v

# Specific test method
poetry run pytest tests/api/test_enrichment.py::TestEnrichmentAPI::test_enrich_book_success -v

# Skip external API tests
poetry run pytest -m "not external_api" tests/ -v
```

### Test Markers
```python
import pytest

@pytest.mark.external_api
async def test_real_openlibrary_api():
    """Test with real OpenLibrary API (requires internet)."""
    pass

@pytest.mark.slow
async def test_batch_processing():
    """Test batch processing (takes longer time)."""
    pass
```