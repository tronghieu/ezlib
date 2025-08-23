"""Tests for external API service."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock
import pytest
from datetime import datetime, timedelta

from src.services.external_api_service import ExternalAPIService, CacheEntry, APICallMetrics
from src.clients.openlibrary_client import OpenLibraryClient
from src.models.external.openlibrary_models import OpenLibraryBookDetails
from src.core.exceptions import ExternalAPIError


class TestExternalAPIService:
    """Test suite for ExternalAPIService."""

    @pytest.fixture
    def mock_openlibrary_client(self):
        """Create mock OpenLibrary client."""
        client = AsyncMock(spec=OpenLibraryClient)
        client.fetch_book_by_isbn = AsyncMock()
        client.health_check = AsyncMock(return_value=True)
        client.close = AsyncMock()
        return client

    @pytest.fixture
    def external_api_service(self, mock_openlibrary_client):
        """Create external API service with mock client."""
        return ExternalAPIService(
            openlibrary_client=mock_openlibrary_client,
            cache_ttl=3600  # 1 hour for testing
        )

    @pytest.fixture
    def sample_book_data(self):
        """Sample OpenLibrary book data."""
        return {
            "title": "Design Patterns",
            "authors": [{"name": "Erich Gamma"}],
            "publish_date": "1994",
            "publishers": ["Addison-Wesley"],
            "number_of_pages": 395,
            "covers": [12345],
            "description": "A classic software engineering book."
        }

    @pytest.fixture
    def sample_book_details(self, sample_book_data):
        """Sample OpenLibraryBookDetails object."""
        return OpenLibraryBookDetails(**sample_book_data)

    # Basic Functionality Tests
    @pytest.mark.asyncio
    async def test_context_manager(self, mock_openlibrary_client):
        """Test async context manager functionality."""
        service = ExternalAPIService(openlibrary_client=mock_openlibrary_client)
        
        async with service as svc:
            assert svc is service
            mock_openlibrary_client.__aenter__.assert_called_once()
        
        mock_openlibrary_client.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_ensure_clients_creates_default_client(self):
        """Test that _ensure_clients creates default client if none provided."""
        service = ExternalAPIService()
        await service._ensure_clients()
        
        assert service._openlibrary_client is not None
        
        # Clean up
        await service.close()

    @pytest.mark.asyncio
    async def test_close_cleans_up_resources(self, external_api_service, mock_openlibrary_client):
        """Test that close method cleans up resources."""
        # Add some cache entries and metrics
        external_api_service._response_cache["test_key"] = CacheEntry(
            data="test_data", 
            timestamp=datetime.now(), 
            ttl_seconds=3600
        )
        external_api_service._call_metrics.append(
            APICallMetrics("test_api", 0.0, 1.0, True)
        )
        
        await external_api_service.close()
        
        mock_openlibrary_client.close.assert_called_once()
        assert len(external_api_service._response_cache) == 0
        assert len(external_api_service._call_metrics) == 0

    # Cache Functionality Tests
    def test_get_cache_key(self, external_api_service):
        """Test cache key generation."""
        key1 = external_api_service._get_cache_key("openlibrary", "fetch_book", isbn="123")
        key2 = external_api_service._get_cache_key("openlibrary", "fetch_book", isbn="456")
        key3 = external_api_service._get_cache_key("openlibrary", "fetch_book", isbn="123")
        
        assert key1 != key2
        assert key1 == key3
        assert "openlibrary" in key1
        assert "fetch_book" in key1
        assert "isbn=123" in key1

    def test_cache_entry_expiration(self):
        """Test cache entry expiration logic."""
        # Fresh entry
        fresh_entry = CacheEntry(
            data="test_data",
            timestamp=datetime.now(),
            ttl_seconds=3600
        )
        assert not fresh_entry.is_expired
        
        # Expired entry
        expired_entry = CacheEntry(
            data="test_data",
            timestamp=datetime.now() - timedelta(hours=2),
            ttl_seconds=3600
        )
        assert expired_entry.is_expired

    def test_cache_response_and_retrieval(self, external_api_service):
        """Test caching and retrieving responses."""
        cache_key = "test_key"
        test_data = {"test": "data"}
        
        # Cache data
        external_api_service._cache_response(cache_key, test_data)
        
        # Retrieve data
        cached_data = external_api_service._get_cached_response(cache_key)
        assert cached_data == test_data

    def test_cache_expired_entry_removal(self, external_api_service):
        """Test that expired cache entries are removed when accessed."""
        cache_key = "expired_key"
        
        # Create expired entry manually
        external_api_service._response_cache[cache_key] = CacheEntry(
            data="expired_data",
            timestamp=datetime.now() - timedelta(hours=2),
            ttl_seconds=3600
        )
        
        # Try to retrieve expired data
        cached_data = external_api_service._get_cached_response(cache_key)
        
        assert cached_data is None
        assert cache_key not in external_api_service._response_cache

    # Single Book Fetch Tests
    @pytest.mark.asyncio
    async def test_fetch_book_by_isbn_success(
        self, external_api_service, mock_openlibrary_client, sample_book_data, sample_book_details
    ):
        """Test successful book fetch from OpenLibrary."""
        isbn = "9780321125217"
        mock_openlibrary_client.fetch_book_by_isbn.return_value = sample_book_data
        
        book_details, sources_used = await external_api_service.fetch_book_by_isbn(isbn)
        
        assert book_details is not None
        assert book_details.title == sample_book_details.title
        assert "openlibrary" in sources_used
        mock_openlibrary_client.fetch_book_by_isbn.assert_called_once_with(isbn)

    @pytest.mark.asyncio
    async def test_fetch_book_by_isbn_cached_response(
        self, external_api_service, mock_openlibrary_client, sample_book_details
    ):
        """Test fetching book with cached response."""
        isbn = "9780321125217"
        
        # Pre-populate cache
        cache_key = external_api_service._get_cache_key("openlibrary", "fetch_book", isbn=isbn)
        external_api_service._cache_response(cache_key, sample_book_details)
        
        book_details, sources_used = await external_api_service.fetch_book_by_isbn(isbn)
        
        assert book_details == sample_book_details
        assert sources_used == ["openlibrary:cached"]
        # Client should not be called for cached response
        mock_openlibrary_client.fetch_book_by_isbn.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetch_book_by_isbn_force_refresh(
        self, external_api_service, mock_openlibrary_client, sample_book_data, sample_book_details
    ):
        """Test force refresh bypasses cache."""
        isbn = "9780321125217"
        
        # Pre-populate cache
        cache_key = external_api_service._get_cache_key("openlibrary", "fetch_book", isbn=isbn)
        external_api_service._cache_response(cache_key, "old_data")
        
        mock_openlibrary_client.fetch_book_by_isbn.return_value = sample_book_data
        
        book_details, sources_used = await external_api_service.fetch_book_by_isbn(
            isbn, force_refresh=True
        )
        
        assert book_details.title == sample_book_details.title
        assert "openlibrary" in sources_used
        mock_openlibrary_client.fetch_book_by_isbn.assert_called_once_with(isbn)

    @pytest.mark.asyncio
    async def test_fetch_book_by_isbn_not_found(
        self, external_api_service, mock_openlibrary_client
    ):
        """Test behavior when book is not found."""
        isbn = "9780000000000"
        mock_openlibrary_client.fetch_book_by_isbn.return_value = None
        
        book_details, sources_used = await external_api_service.fetch_book_by_isbn(isbn)
        
        assert book_details is None
        assert "openlibrary" in sources_used

    @pytest.mark.asyncio
    async def test_fetch_book_by_isbn_api_timeout(
        self, external_api_service, mock_openlibrary_client
    ):
        """Test handling of API timeout."""
        isbn = "9780321125217"
        mock_openlibrary_client.fetch_book_by_isbn.side_effect = asyncio.TimeoutError()
        
        with pytest.raises(ExternalAPIError) as exc_info:
            await external_api_service.fetch_book_by_isbn(isbn)
        
        assert exc_info.value.api_name == "openlibrary"
        assert exc_info.value.status_code == 408

    @pytest.mark.asyncio
    async def test_fetch_book_by_isbn_api_error(
        self, external_api_service, mock_openlibrary_client
    ):
        """Test handling of general API errors."""
        isbn = "9780321125217"
        mock_openlibrary_client.fetch_book_by_isbn.side_effect = Exception("API Error")
        
        with pytest.raises(ExternalAPIError) as exc_info:
            await external_api_service.fetch_book_by_isbn(isbn)
        
        assert exc_info.value.api_name == "openlibrary"
        assert exc_info.value.status_code == 500

    # Parallel Fetch Tests
    @pytest.mark.asyncio
    async def test_fetch_books_parallel_success(
        self, external_api_service, mock_openlibrary_client, sample_book_data
    ):
        """Test parallel fetching of multiple books."""
        isbns = ["9780321125217", "9780321125218", "9780321125219"]
        mock_openlibrary_client.fetch_book_by_isbn.return_value = sample_book_data
        
        results = await external_api_service.fetch_books_parallel(isbns)
        
        assert len(results) == 3
        for isbn, book_details, sources_used in results:
            assert isbn in isbns
            assert book_details is not None
            assert "openlibrary" in sources_used

    @pytest.mark.asyncio
    async def test_fetch_books_parallel_empty_list(self, external_api_service):
        """Test parallel fetching with empty ISBN list."""
        results = await external_api_service.fetch_books_parallel([])
        assert results == []

    @pytest.mark.asyncio
    async def test_fetch_books_parallel_mixed_results(
        self, external_api_service, mock_openlibrary_client, sample_book_data
    ):
        """Test parallel fetching with mixed success/failure results."""
        isbns = ["9780321125217", "9780000000000", "9780321125219"]
        
        def mock_fetch(isbn):
            if isbn == "9780000000000":
                return None
            return sample_book_data
        
        mock_openlibrary_client.fetch_book_by_isbn.side_effect = mock_fetch
        
        results = await external_api_service.fetch_books_parallel(isbns)
        
        assert len(results) == 3
        assert results[0][1] is not None  # First book found
        assert results[1][1] is None     # Second book not found
        assert results[2][1] is not None  # Third book found

    @pytest.mark.asyncio
    async def test_fetch_books_parallel_concurrency_limit(
        self, external_api_service, mock_openlibrary_client, sample_book_data
    ):
        """Test that parallel fetching respects concurrency limits."""
        isbns = [f"978032112521{i}" for i in range(10)]
        mock_openlibrary_client.fetch_book_by_isbn.return_value = sample_book_data
        
        results = await external_api_service.fetch_books_parallel(
            isbns, max_concurrent=3
        )
        
        assert len(results) == 10
        # All should succeed
        assert all(result[1] is not None for result in results)

    # Metrics Tests
    def test_api_call_metrics_duration(self):
        """Test API call metrics duration calculation."""
        start_time = 1000.0
        end_time = 1002.5
        
        metrics = APICallMetrics(
            api_name="test_api",
            start_time=start_time,
            end_time=end_time,
            success=True
        )
        
        assert metrics.duration == 2.5

    @pytest.mark.asyncio
    async def test_record_api_call_metrics(self, external_api_service):
        """Test recording of API call metrics."""
        await external_api_service._record_api_call(
            "test_api", 1000.0, True, None
        )
        
        assert len(external_api_service._call_metrics) == 1
        metric = external_api_service._call_metrics[0]
        assert metric.api_name == "test_api"
        assert metric.success is True
        assert metric.error is None

    @pytest.mark.asyncio
    async def test_record_api_call_metrics_limit(self, external_api_service):
        """Test that metrics list is limited to prevent memory growth."""
        # Add more than 1000 metrics
        for i in range(1100):
            await external_api_service._record_api_call(
                f"api_{i}", float(i), True, None
            )
        
        # Should be limited to 1000
        assert len(external_api_service._call_metrics) == 1000
        # Should keep the most recent entries
        assert external_api_service._call_metrics[-1].api_name == "api_1099"

    def test_get_api_metrics_no_data(self, external_api_service):
        """Test getting metrics when no data is available."""
        metrics = external_api_service.get_api_metrics(60)
        
        assert metrics["period_minutes"] == 60
        assert metrics["no_data"] is True

    def test_get_api_metrics_with_data(self, external_api_service):
        """Test getting metrics with data."""
        import time
        current_time = time.time()
        
        # Add some recent metrics
        external_api_service._call_metrics = [
            APICallMetrics("openlibrary", current_time - 30, current_time - 29, True),
            APICallMetrics("openlibrary", current_time - 20, current_time - 18, True),
            APICallMetrics("openlibrary", current_time - 10, current_time - 9, False, "Error"),
        ]
        
        metrics = external_api_service.get_api_metrics(60)
        
        assert metrics["total_calls"] == 3
        assert metrics["successful_calls"] == 2
        assert metrics["failed_calls"] == 1
        assert metrics["success_rate"] == pytest.approx(66.67, rel=1e-2)
        assert "openlibrary" in metrics["api_breakdown"]

    # Health Check Tests
    @pytest.mark.asyncio
    async def test_health_check_healthy(self, external_api_service, mock_openlibrary_client):
        """Test health check when all APIs are healthy."""
        mock_openlibrary_client.health_check.return_value = True
        
        health = await external_api_service.health_check()
        
        assert health["overall_status"] == "healthy"
        assert health["apis"]["openlibrary"]["status"] == "healthy"
        assert "recent_metrics" in health

    @pytest.mark.asyncio
    async def test_health_check_degraded(self, external_api_service, mock_openlibrary_client):
        """Test health check when API is unhealthy."""
        mock_openlibrary_client.health_check.return_value = False
        
        health = await external_api_service.health_check()
        
        assert health["overall_status"] == "degraded"
        assert health["apis"]["openlibrary"]["status"] == "unhealthy"
        assert "openlibrary" in health["unhealthy_apis"]

    @pytest.mark.asyncio
    async def test_health_check_exception(self, external_api_service, mock_openlibrary_client):
        """Test health check when API check raises exception."""
        mock_openlibrary_client.health_check.side_effect = Exception("Connection failed")
        
        health = await external_api_service.health_check()
        
        assert health["overall_status"] == "degraded"
        assert health["apis"]["openlibrary"]["status"] == "unhealthy"
        assert "Connection failed" in health["apis"]["openlibrary"]["error"]

    # Cache Management Tests
    def test_clear_cache(self, external_api_service):
        """Test clearing the response cache."""
        # Add some cache entries
        external_api_service._response_cache["key1"] = CacheEntry(
            data="data1", timestamp=datetime.now(), ttl_seconds=3600
        )
        external_api_service._response_cache["key2"] = CacheEntry(
            data="data2", timestamp=datetime.now(), ttl_seconds=3600
        )
        
        count = external_api_service.clear_cache()
        
        assert count == 2
        assert len(external_api_service._response_cache) == 0

    def test_cleanup_expired_cache(self, external_api_service):
        """Test cleanup of expired cache entries."""
        current_time = datetime.now()
        
        # Add mix of fresh and expired entries
        external_api_service._response_cache["fresh"] = CacheEntry(
            data="fresh_data", timestamp=current_time, ttl_seconds=3600
        )
        external_api_service._response_cache["expired"] = CacheEntry(
            data="expired_data", timestamp=current_time - timedelta(hours=2), ttl_seconds=3600
        )
        
        count = external_api_service.cleanup_expired_cache()
        
        assert count == 1
        assert "fresh" in external_api_service._response_cache
        assert "expired" not in external_api_service._response_cache

    # Rate Limiting Tests
    @pytest.mark.asyncio
    async def test_rate_limiting_semaphore(self, external_api_service, mock_openlibrary_client):
        """Test that rate limiting semaphore is respected."""
        isbn = "9780321125217"
        mock_openlibrary_client.fetch_book_by_isbn.return_value = {"title": "Test Book"}
        
        # Check that semaphore exists and has expected initial value
        assert "openlibrary" in external_api_service._api_semaphores
        semaphore = external_api_service._api_semaphores["openlibrary"]
        initial_value = semaphore._value
        
        # Make a request
        await external_api_service.fetch_book_by_isbn(isbn)
        
        # Semaphore should be back to original value after request
        assert semaphore._value == initial_value