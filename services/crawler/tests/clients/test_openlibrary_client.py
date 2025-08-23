"""Tests for OpenLibrary API client."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from src.clients.openlibrary_client import OpenLibraryClient
from src.core.exceptions import OpenLibraryError, ValidationError


class TestOpenLibraryClient:
    """Test suite for OpenLibrary API client."""

    @pytest.fixture
    async def client(self):
        """Create OpenLibrary client for testing."""
        client = OpenLibraryClient()
        async with client:
            yield client

    @pytest.fixture
    def sample_openlibrary_response(self):
        """Sample OpenLibrary API response."""
        return {
            "ISBN:9780134685991": {
                "details": {
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
            }
        }

    @pytest.fixture
    def empty_openlibrary_response(self):
        """Empty OpenLibrary API response."""
        return {}

    async def test_fetch_book_by_isbn_success(
        self, client, sample_openlibrary_response
    ):
        """Test successful book retrieval."""
        isbn = "9780134685991"

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = sample_openlibrary_response
            mock_response.text = ""
            mock_get.return_value = mock_response

            result = await client.fetch_book_by_isbn(isbn)

            assert result is not None
            assert result["title"] == "Effective Java"
            assert len(result["authors"]) == 1
            assert result["authors"][0]["name"] == "Joshua Bloch"

            # Verify API call
            mock_get.assert_called_once_with(
                "/api/books",
                params={
                    "bibkeys": f"ISBN:{isbn}",
                    "format": "json",
                    "jscmd": "details",
                },
            )

    async def test_fetch_book_by_isbn_not_found(
        self, client, empty_openlibrary_response
    ):
        """Test book not found in OpenLibrary."""
        isbn = "9999999999999"

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = empty_openlibrary_response
            mock_get.return_value = mock_response

            result = await client.fetch_book_by_isbn(isbn)

            assert result is None

    async def test_fetch_book_by_isbn_invalid_isbn(self, client):
        """Test invalid ISBN validation."""
        with pytest.raises(ValidationError) as exc_info:
            await client.fetch_book_by_isbn("invalid")

        assert "ISBN must be 13 digits" in str(exc_info.value)

        with pytest.raises(ValidationError) as exc_info:
            await client.fetch_book_by_isbn("123456789012a")

        assert "ISBN must contain only digits" in str(exc_info.value)

    async def test_fetch_book_by_isbn_empty_isbn(self, client):
        """Test empty ISBN validation."""
        with pytest.raises(ValidationError) as exc_info:
            await client.fetch_book_by_isbn("")

        assert "ISBN must be 13 digits" in str(exc_info.value)

    async def test_fetch_book_by_isbn_api_error(self, client):
        """Test OpenLibrary API error handling."""
        isbn = "9780134685991"

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 500
            mock_response.text = "Internal Server Error"
            mock_get.return_value = mock_response

            with pytest.raises(OpenLibraryError) as exc_info:
                await client.fetch_book_by_isbn(isbn)

            assert "OpenLibrary API returned 500" in str(exc_info.value)
            assert exc_info.value.status_code == 500

    async def test_fetch_book_by_isbn_404_error(self, client):
        """Test OpenLibrary 404 error handling."""
        isbn = "9780134685991"

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 404
            mock_get.return_value = mock_response

            result = await client.fetch_book_by_isbn(isbn)

            assert result is None

    async def test_fetch_book_by_isbn_invalid_json(self, client):
        """Test invalid JSON response handling."""
        isbn = "9780134685991"

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.side_effect = ValueError("Invalid JSON")
            mock_response.text = "invalid json"
            mock_get.return_value = mock_response

            with pytest.raises(OpenLibraryError) as exc_info:
                await client.fetch_book_by_isbn(isbn)

            assert "Invalid JSON response" in str(exc_info.value)

    async def test_fetch_book_by_isbn_missing_details(self, client):
        """Test response missing details section."""
        isbn = "9780134685991"
        response_without_details = {"ISBN:9780134685991": {"info": "some other info"}}

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = response_without_details
            mock_get.return_value = mock_response

            result = await client.fetch_book_by_isbn(isbn)

            assert result is None

    async def test_search_books_success(self, client):
        """Test successful book search."""
        search_response = {
            "docs": [
                {
                    "key": "/works/OL123W",
                    "title": "Test Book",
                    "author_name": ["Test Author"],
                    "first_publish_year": 2023,
                    "isbn": ["9780134685991"],
                    "cover_i": 12345,
                }
            ],
            "num_found": 1,
            "start": 0,
        }

        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = search_response
            mock_get.return_value = mock_response

            results = await client.search_books(title="Test Book")

            assert len(results) == 1
            assert results[0]["title"] == "Test Book"
            assert results[0]["author_name"] == ["Test Author"]

            # Verify API call
            mock_get.assert_called_once_with(
                "/search.json",
                params={
                    "q": 'title:"Test Book"',
                    "limit": 10,
                    "fields": "key,title,author_name,first_publish_year,isbn,cover_i",
                },
            )

    async def test_search_books_with_author(self, client):
        """Test book search with author parameter."""
        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"docs": [], "num_found": 0}
            mock_get.return_value = mock_response

            await client.search_books(title="Test Book", author="Test Author")

            # Verify query construction
            mock_get.assert_called_once()
            call_args = mock_get.call_args
            params = call_args[1]["params"]
            assert 'title:"Test Book"' in params["q"]
            assert 'author:"Test Author"' in params["q"]
            assert " AND " in params["q"]

    async def test_search_books_invalid_params(self, client):
        """Test search with invalid parameters."""
        with pytest.raises(ValidationError) as exc_info:
            await client.search_books()

        assert "Must provide title or author" in str(exc_info.value)

        with pytest.raises(ValidationError) as exc_info:
            await client.search_books(title="Test", limit=0)

        assert "Limit must be between 1 and 100" in str(exc_info.value)

        with pytest.raises(ValidationError) as exc_info:
            await client.search_books(title="Test", limit=101)

        assert "Limit must be between 1 and 100" in str(exc_info.value)

    async def test_search_books_api_error(self, client):
        """Test search API error handling."""
        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 500
            mock_get.return_value = mock_response

            with pytest.raises(OpenLibraryError) as exc_info:
                await client.search_books(title="Test Book")

            assert "OpenLibrary search returned 500" in str(exc_info.value)

    async def test_health_check_success(self, client):
        """Test successful health check."""
        with patch.object(client, "get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            result = await client.health_check()

            assert result is True

    async def test_health_check_failure(self, client):
        """Test failed health check."""
        with patch.object(client, "get") as mock_get:
            mock_get.side_effect = httpx.RequestError("Connection failed")

            result = await client.health_check()

            assert result is False

    async def test_rate_limiting(self):
        """Test rate limiting functionality."""
        # Create client with very low rate limit for testing
        client = OpenLibraryClient()
        client._rate_limit_per_minute = 2  # Very low limit

        async with client:
            with patch.object(client, "_retry_request") as mock_request:
                mock_response = AsyncMock()
                mock_response.status_code = 200
                mock_response.json.return_value = {}
                mock_request.return_value = mock_response

                # Make requests rapidly
                start_time = asyncio.get_event_loop().time()

                tasks = [
                    client.fetch_book_by_isbn("9780134685991"),
                    client.fetch_book_by_isbn("9780596517748"),
                    client.fetch_book_by_isbn("9781449373320"),
                ]

                await asyncio.gather(*tasks)

                end_time = asyncio.get_event_loop().time()
                elapsed = end_time - start_time

                # Should have been rate limited and taken some time
                assert elapsed > 0.1  # At least some delay
                assert mock_request.call_count == 3

    async def test_retry_logic(self, client):
        """Test retry logic for failed requests."""
        with patch.object(client, "_retry_request") as mock_retry:
            # Mock a timeout followed by success
            mock_retry.side_effect = [
                httpx.TimeoutException("Timeout"),
                httpx.TimeoutException("Timeout"),
                AsyncMock(status_code=200, json=lambda: {}),
            ]

            result = await client.fetch_book_by_isbn("9780134685991")

            # Should have retried and eventually succeeded
            assert mock_retry.call_count == 3
            assert result is None  # Empty response

    async def test_context_manager(self):
        """Test async context manager functionality."""
        client = OpenLibraryClient()

        async with client as ctx_client:
            assert ctx_client is client
            assert client._client is not None

        # Client should be closed after context exit
        assert client._client is None
