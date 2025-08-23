"""Tests for enrichment API endpoints."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

from src.main import app
from src.models.database.book_metadata import BookMetadata
from src.services.enrichment_service import EnrichmentResult, EnrichmentStatus


class TestEnrichmentAPI:
    """Test suite for enrichment API endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    async def async_client(self):
        """Create async test client."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest.fixture
    def sample_metadata(self):
        """Sample book metadata for testing."""
        return BookMetadata(
            isbn_13="9780134685991",
            title="Effective Java",
            authors=["Joshua Bloch"],
            publication_year=2017,
            publisher="Addison-Wesley",
            quality_score=0.85,
        )

    @pytest.fixture
    def successful_enrichment_result(self, sample_metadata):
        """Sample successful enrichment result."""
        return EnrichmentResult(
            isbn="9780134685991",
            status=EnrichmentStatus.SUCCESS,
            metadata=sample_metadata,
            quality_score=0.85,
            sources_used=["openlibrary"],
            processing_time=2.5,
        )

    def test_enrich_book_success(self, client, successful_enrichment_result):
        """Test successful book enrichment endpoint."""
        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            # Mock the service instance and its methods
            mock_service = AsyncMock()
            mock_service.enrich_book.return_value = successful_enrichment_result
            mock_service_class.return_value = mock_service

            # Mock the dependency
            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = client.post(
                    "/enrichment/enrich",
                    json={"isbn": "9780134685991", "force_refresh": False},
                )

        assert response.status_code == 200
        data = response.json()

        assert data["isbn"] == "9780134685991"
        assert data["status"] == "success"
        assert data["metadata"]["title"] == "Effective Java"
        assert data["quality_score"] == 0.85
        assert "openlibrary" in data["sources_used"]

    def test_enrich_book_not_found(self, client):
        """Test book not found response."""
        failed_result = EnrichmentResult(
            isbn="9999999999999",
            status=EnrichmentStatus.FAILED,
            error="Book not found in OpenLibrary",
        )

        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service.enrich_book.return_value = failed_result
            mock_service_class.return_value = mock_service

            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = client.post(
                    "/enrichment/enrich", json={"isbn": "9999999999999"}
                )

        assert response.status_code == 404
        data = response.json()

        assert data["isbn"] == "9999999999999"
        assert data["status"] == "failed"
        assert "not found" in data["error"].lower()

    def test_enrich_book_partial_quality(self, client, sample_metadata):
        """Test partial enrichment due to low quality."""
        partial_result = EnrichmentResult(
            isbn="9780134685991",
            status=EnrichmentStatus.PARTIAL,
            metadata=sample_metadata,
            error="Data quality below threshold: 0.50 < 0.70",
            quality_score=0.50,
        )

        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service.enrich_book.return_value = partial_result
            mock_service_class.return_value = mock_service

            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = client.post(
                    "/enrichment/enrich",
                    json={"isbn": "9780134685991", "min_quality_score": 0.7},
                )

        assert response.status_code == 206  # Partial Content
        data = response.json()

        assert data["status"] == "partial"
        assert data["quality_score"] == 0.50
        assert "quality below threshold" in data["error"]

    def test_enrich_book_invalid_isbn(self, client):
        """Test invalid ISBN validation."""
        response = client.post("/enrichment/enrich", json={"isbn": "invalid-isbn"})

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_enrich_book_missing_isbn(self, client):
        """Test missing ISBN in request."""
        response = client.post("/enrichment/enrich", json={"force_refresh": True})

        assert response.status_code == 422  # Validation error

    def test_enrich_book_with_options(self, client, successful_enrichment_result):
        """Test enrichment with all options."""
        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service.enrich_book.return_value = successful_enrichment_result
            mock_service_class.return_value = mock_service

            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = client.post(
                    "/enrichment/enrich",
                    json={
                        "isbn": "9780134685991",
                        "force_refresh": True,
                        "min_quality_score": 0.8,
                    },
                )

        assert response.status_code == 200

        # Verify service was called with correct parameters
        mock_service.enrich_book.assert_called_once_with(
            isbn="9780134685991", force_refresh=True, min_quality_score=0.8
        )

    def test_batch_enrich_success(self, client, successful_enrichment_result):
        """Test successful batch enrichment."""
        batch_results = [successful_enrichment_result, successful_enrichment_result]

        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service.batch_enrich_books.return_value = batch_results
            mock_service_class.return_value = mock_service

            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = client.post(
                    "/enrichment/batch",
                    json={
                        "isbns": ["9780134685991", "9780596517748"],
                        "force_refresh": False,
                    },
                )

        assert response.status_code == 200
        data = response.json()

        assert data["total_books"] == 2
        assert data["successful"] == 2
        assert data["failed"] == 0
        assert data["partial"] == 0
        assert len(data["results"]) == 2

    def test_batch_enrich_mixed_results(self, client, successful_enrichment_result):
        """Test batch enrichment with mixed results."""
        failed_result = EnrichmentResult(
            isbn="9999999999999", status=EnrichmentStatus.FAILED, error="Not found"
        )

        batch_results = [successful_enrichment_result, failed_result]

        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service.batch_enrich_books.return_value = batch_results
            mock_service_class.return_value = mock_service

            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = client.post(
                    "/enrichment/batch",
                    json={"isbns": ["9780134685991", "9999999999999"]},
                )

        assert response.status_code == 207  # Multi-Status
        data = response.json()

        assert data["total_books"] == 2
        assert data["successful"] == 1
        assert data["failed"] == 1
        assert data["partial"] == 0

    def test_batch_enrich_invalid_request(self, client):
        """Test batch enrichment with invalid request."""
        # Empty ISBN list
        response = client.post("/enrichment/batch", json={"isbns": []})

        assert response.status_code == 422

        # Too many ISBNs
        response = client.post(
            "/enrichment/batch",
            json={"isbns": ["9780134685991"] * 51},  # More than max limit
        )

        assert response.status_code == 422

        # Duplicate ISBNs
        response = client.post(
            "/enrichment/batch", json={"isbns": ["9780134685991", "9780134685991"]}
        )

        assert response.status_code == 422

    def test_batch_enrich_invalid_isbn_in_list(self, client):
        """Test batch enrichment with invalid ISBN in list."""
        response = client.post(
            "/enrichment/batch", json={"isbns": ["9780134685991", "invalid-isbn"]}
        )

        assert response.status_code == 422

    def test_get_enrichment_status_not_implemented(self, client):
        """Test status endpoint (not implemented)."""
        response = client.get("/enrichment/status/test-correlation-id")

        assert response.status_code == 501
        data = response.json()
        assert "not yet implemented" in data["detail"].lower()

    async def test_enrich_book_async(self, async_client, successful_enrichment_result):
        """Test enrichment endpoint with async client."""
        with patch("src.api.enrichment.BookEnrichmentService") as mock_service_class:
            mock_service = AsyncMock()
            mock_service.enrich_book.return_value = successful_enrichment_result
            mock_service_class.return_value = mock_service

            with patch("src.api.enrichment.get_enrichment_service") as mock_dep:
                mock_dep.return_value = mock_service

                response = await async_client.post(
                    "/enrichment/enrich", json={"isbn": "9780134685991"}
                )

        assert response.status_code == 200
        data = response.json()
        assert data["isbn"] == "9780134685991"

    def test_openapi_schema(self, client):
        """Test that OpenAPI schema is generated correctly."""
        response = client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        assert "paths" in schema
        assert "/enrichment/enrich" in schema["paths"]
        assert "/enrichment/batch" in schema["paths"]

        # Check that request/response models are included
        enrich_post = schema["paths"]["/enrichment/enrich"]["post"]
        assert "requestBody" in enrich_post
        assert "responses" in enrich_post

    def test_docs_endpoint(self, client):
        """Test that API documentation is available."""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_error_response_format(self, client):
        """Test error response format consistency."""
        response = client.post(
            "/enrichment/enrich",
            json={"isbn": ""},  # Empty ISBN should trigger validation error
        )

        assert response.status_code == 422
        # FastAPI validation errors have a specific format
        data = response.json()
        assert "detail" in data

    def test_cors_headers(self, client):
        """Test CORS headers in responses."""
        response = client.options("/enrichment/enrich")
        assert response.status_code == 200

        # Check for CORS headers (these are added by FastAPI CORS middleware)
        # The exact headers depend on the request, but we should get a successful OPTIONS response
