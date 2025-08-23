"""Tests for book enrichment service."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from src.clients.openlibrary_client import OpenLibraryClient
from src.models.database.book_metadata import BookMetadata
from src.services.enrichment_service import (
    BookEnrichmentService,
    EnrichmentResult,
    EnrichmentStatus,
)


class TestBookEnrichmentService:
    """Test suite for BookEnrichmentService."""

    @pytest.fixture
    async def mock_openlibrary_client(self):
        """Create mock OpenLibrary client."""
        client = AsyncMock(spec=OpenLibraryClient)
        return client

    @pytest.fixture
    async def service(self, mock_openlibrary_client):
        """Create enrichment service for testing."""
        service = BookEnrichmentService(openlibrary_client=mock_openlibrary_client)
        await service._ensure_clients()
        yield service
        await service.close()

    @pytest.fixture
    def sample_ol_data(self):
        """Sample OpenLibrary book data."""
        return {
            "title": "Effective Java",
            "authors": [{"name": "Joshua Bloch"}],
            "publish_date": "2017",
            "publishers": ["Addison-Wesley"],
            "isbn_13": ["9780134685991"],
            "isbn_10": ["0134685997"],
            "number_of_pages": 412,
            "covers": [8439134],
            "subjects": ["Java (Computer program language)", "Programming"],
        }

    async def test_enrich_book_success(self, service, sample_ol_data):
        """Test successful book enrichment."""
        isbn = "9780134685991"
        service._openlibrary_client.fetch_book_by_isbn.return_value = sample_ol_data

        result = await service.enrich_book(isbn)

        assert result.isbn == isbn
        assert result.status == EnrichmentStatus.SUCCESS
        assert result.metadata is not None
        assert result.metadata.title == "Effective Java"
        assert "Joshua Bloch" in result.metadata.authors
        assert result.quality_score is not None
        assert result.quality_score > 0
        assert "openlibrary" in result.sources_used
        assert result.correlation_id is not None
        assert result.processing_time is not None

    async def test_enrich_book_not_found(self, service):
        """Test book not found in external sources."""
        isbn = "9999999999999"
        service._openlibrary_client.fetch_book_by_isbn.return_value = None

        result = await service.enrich_book(isbn)

        assert result.isbn == isbn
        assert result.status == EnrichmentStatus.FAILED
        assert result.metadata is None
        assert result.error == "Book not found in OpenLibrary"
        assert "openlibrary" in result.sources_used

    async def test_enrich_book_invalid_isbn(self, service):
        """Test enrichment with invalid ISBN."""
        result = await service.enrich_book("invalid-isbn")

        assert result.status == EnrichmentStatus.FAILED
        assert "Invalid ISBN format" in result.error
        assert result.metadata is None

    async def test_enrich_book_low_quality(self, service, sample_ol_data):
        """Test enrichment with low quality data."""
        isbn = "9780134685991"
        # Create minimal data that will have low quality score
        low_quality_data = {
            "title": "Test",  # Very minimal data
            "authors": [],
            "publishers": [],
        }
        service._openlibrary_client.fetch_book_by_isbn.return_value = low_quality_data

        result = await service.enrich_book(isbn, min_quality_score=0.8)

        assert result.isbn == isbn
        assert result.status == EnrichmentStatus.PARTIAL
        assert result.metadata is not None
        assert "quality below threshold" in result.error.lower()
        assert result.quality_score is not None
        assert result.quality_score < 0.8

    async def test_enrich_book_timeout(self, service):
        """Test enrichment timeout."""
        isbn = "9780134685991"

        # Mock a slow response that exceeds timeout
        async def slow_response(*args, **kwargs):
            await asyncio.sleep(20)  # Longer than default timeout
            return {"title": "Test"}

        service._openlibrary_client.fetch_book_by_isbn.side_effect = slow_response

        # Use a very short timeout for testing
        with patch("src.core.config.settings.ENRICHMENT_TIMEOUT", 0.1):
            result = await service.enrich_book(isbn)

        assert result.status == EnrichmentStatus.FAILED
        assert "timeout" in result.error.lower()

    async def test_enrich_book_api_error(self, service):
        """Test enrichment with API error."""
        isbn = "9780134685991"
        service._openlibrary_client.fetch_book_by_isbn.side_effect = Exception(
            "API Error"
        )

        result = await service.enrich_book(isbn)

        assert result.status == EnrichmentStatus.FAILED
        assert "API Error" in result.error
        assert result.metadata is None

    async def test_batch_enrich_books_success(self, service, sample_ol_data):
        """Test successful batch enrichment."""
        isbns = ["9780134685991", "9780596517748"]
        service._openlibrary_client.fetch_book_by_isbn.return_value = sample_ol_data

        results = await service.batch_enrich_books(isbns)

        assert len(results) == 2
        for result in results:
            assert result.status == EnrichmentStatus.SUCCESS
            assert result.metadata is not None

    async def test_batch_enrich_books_mixed_results(self, service, sample_ol_data):
        """Test batch enrichment with mixed success/failure."""
        isbns = ["9780134685991", "9999999999999"]

        async def mock_fetch(isbn):
            if isbn == "9780134685991":
                return sample_ol_data
            else:
                return None

        service._openlibrary_client.fetch_book_by_isbn.side_effect = mock_fetch

        results = await service.batch_enrich_books(isbns)

        assert len(results) == 2
        assert results[0].status == EnrichmentStatus.SUCCESS
        assert results[1].status == EnrichmentStatus.FAILED

    async def test_batch_enrich_books_with_exceptions(self, service):
        """Test batch enrichment with exceptions."""
        isbns = ["9780134685991", "invalid-isbn"]
        service._openlibrary_client.fetch_book_by_isbn.return_value = {"title": "Test"}

        results = await service.batch_enrich_books(isbns)

        assert len(results) == 2
        # First should succeed, second should fail due to invalid ISBN
        assert any(r.status == EnrichmentStatus.SUCCESS for r in results)
        assert any(r.status == EnrichmentStatus.FAILED for r in results)

    async def test_concurrency_control(self, service, sample_ol_data):
        """Test concurrency control with semaphore."""
        service._openlibrary_client.fetch_book_by_isbn.return_value = sample_ol_data

        # Create many concurrent requests
        tasks = [service.enrich_book(f"978013468599{i}") for i in range(5)]

        results = await asyncio.gather(*tasks)

        # All should complete (though some may fail due to invalid ISBNs)
        assert len(results) == 5
        for result in results:
            assert result.correlation_id is not None

    async def test_health_check_healthy(self, service):
        """Test health check when all services are healthy."""
        service._openlibrary_client.health_check.return_value = True

        health = await service.health_check()

        assert health["status"] == "healthy"
        assert health["services"]["openlibrary"]["status"] == "healthy"
        assert health["services"]["openlibrary"]["available"] is True

    async def test_health_check_degraded(self, service):
        """Test health check when OpenLibrary is down."""
        service._openlibrary_client.health_check.return_value = False

        health = await service.health_check()

        assert health["status"] == "degraded"
        assert health["services"]["openlibrary"]["status"] == "unhealthy"
        assert health["services"]["openlibrary"]["available"] is False

    async def test_health_check_error(self, service):
        """Test health check with error."""
        service._openlibrary_client.health_check.side_effect = Exception(
            "Connection failed"
        )

        health = await service.health_check()

        assert health["status"] == "degraded"
        assert health["services"]["openlibrary"]["status"] == "unhealthy"
        assert "Connection failed" in health["services"]["openlibrary"]["error"]

    async def test_enrichment_result_methods(self):
        """Test EnrichmentResult utility methods."""
        # Successful result
        result = EnrichmentResult(
            isbn="9780134685991", status=EnrichmentStatus.SUCCESS, quality_score=0.8
        )

        assert result.is_successful is True
        assert result.is_high_quality is True  # Above default threshold

        # Failed result
        failed_result = EnrichmentResult(
            isbn="9999999999999", status=EnrichmentStatus.FAILED, error="Not found"
        )

        assert failed_result.is_successful is False
        assert failed_result.is_high_quality is False

        # Low quality result
        low_quality_result = EnrichmentResult(
            isbn="9780134685991", status=EnrichmentStatus.PARTIAL, quality_score=0.3
        )

        assert low_quality_result.is_successful is False
        assert low_quality_result.is_high_quality is False

    async def test_enrichment_result_to_dict(self):
        """Test EnrichmentResult to_dict method."""
        metadata = BookMetadata(
            isbn_13="9780134685991", title="Test Book", authors=["Test Author"]
        )

        result = EnrichmentResult(
            isbn="9780134685991",
            status=EnrichmentStatus.SUCCESS,
            metadata=metadata,
            quality_score=0.8,
            sources_used=["openlibrary"],
            processing_time=1.5,
        )

        result_dict = result.to_dict()

        assert result_dict["isbn"] == "9780134685991"
        assert result_dict["status"] == EnrichmentStatus.SUCCESS
        assert result_dict["metadata"]["title"] == "Test Book"
        assert result_dict["quality_score"] == 0.8
        assert result_dict["sources_used"] == ["openlibrary"]
        assert result_dict["processing_time"] == 1.5
        assert "timestamp" in result_dict
        assert "correlation_id" in result_dict

    async def test_context_manager(self, mock_openlibrary_client):
        """Test service as async context manager."""
        async with BookEnrichmentService(
            openlibrary_client=mock_openlibrary_client
        ) as service:
            assert service is not None
            assert service._openlibrary_client is not None

    async def test_service_without_client(self):
        """Test service initialization without client."""
        service = BookEnrichmentService()
        await service._ensure_clients()

        assert service._openlibrary_client is not None
        assert isinstance(service._openlibrary_client, OpenLibraryClient)

        await service.close()
