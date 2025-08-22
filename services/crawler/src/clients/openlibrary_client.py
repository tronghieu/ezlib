"""OpenLibrary API client for book metadata retrieval."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from src.clients.base_client import BaseHTTPClient
from src.core.config import settings
from src.core.exceptions import OpenLibraryError, ValidationError

logger = structlog.get_logger(__name__)


class OpenLibraryClient(BaseHTTPClient):
    """Client for OpenLibrary API with book metadata retrieval."""

    def __init__(self) -> None:
        """Initialize OpenLibrary client with configuration."""
        super().__init__(
            base_url=settings.OPENLIBRARY_BASE_URL,
            max_concurrent=10,
            rate_limit_per_minute=settings.OPENLIBRARY_RATE_LIMIT,
            timeout=settings.OPENLIBRARY_TIMEOUT,
            max_retries=settings.OPENLIBRARY_MAX_RETRIES,
        )

    async def health_check(self) -> bool:
        """Check if OpenLibrary API is healthy."""
        try:
            response = await self.get("/")
            return response.status_code == 200
        except Exception as e:
            logger.warning("OpenLibrary health check failed", error=str(e))
            return False

    async def fetch_book_by_isbn(self, isbn: str) -> dict[str, Any] | None:
        """Fetch book metadata from OpenLibrary by ISBN.

        Args:
            isbn: ISBN-13 identifier

        Returns:
            Book metadata dictionary or None if not found

        Raises:
            OpenLibraryError: On API errors
            ValidationError: On invalid ISBN format
        """
        if not isbn or len(isbn) != 13:
            raise ValidationError("ISBN must be 13 digits", field="isbn", value=isbn)

        # Validate ISBN contains only digits
        if not isbn.isdigit():
            raise ValidationError("ISBN must contain only digits", field="isbn", value=isbn)

        # OpenLibrary API endpoint for book details
        path = "/api/books"
        params = {
            "bibkeys": f"ISBN:{isbn}",
            "format": "json",
            "jscmd": "details"
        }

        logger.info("Fetching book from OpenLibrary", isbn=isbn)

        try:
            response = await self.get(path, params=params)

            if response.status_code == 404:
                logger.info("Book not found in OpenLibrary", isbn=isbn)
                return None

            if response.status_code != 200:
                error_msg = f"OpenLibrary API returned {response.status_code}"
                logger.warning(
                    "OpenLibrary API error",
                    isbn=isbn,
                    status_code=response.status_code,
                    response_text=response.text[:500]
                )
                raise OpenLibraryError(error_msg, status_code=response.status_code)

            try:
                data = response.json()
            except Exception as e:
                logger.error(
                    "Failed to parse OpenLibrary response as JSON",
                    isbn=isbn,
                    error=str(e),
                    response_text=response.text[:500]
                )
                raise OpenLibraryError("Invalid JSON response from OpenLibrary") from e

            # OpenLibrary returns data keyed by "ISBN:{isbn}"
            book_key = f"ISBN:{isbn}"
            if book_key not in data:
                logger.info("Book not found in OpenLibrary response", isbn=isbn, keys=list(data.keys()))
                return None

            book_data = data[book_key]

            # Validate response structure
            if "details" not in book_data:
                logger.warning("OpenLibrary response missing details", isbn=isbn, keys=list(book_data.keys()))
                return None

            details = book_data["details"]

            logger.info(
                "Successfully fetched book from OpenLibrary",
                isbn=isbn,
                title=details.get("title", "Unknown"),
                authors_count=len(details.get("authors", []))
            )

            return details

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error from OpenLibrary",
                isbn=isbn,
                status_code=e.response.status_code,
                error=str(e)
            )
            raise OpenLibraryError(
                f"HTTP {e.response.status_code} from OpenLibrary",
                status_code=e.response.status_code
            ) from e

        except httpx.RequestError as e:
            logger.error(
                "Request error to OpenLibrary",
                isbn=isbn,
                error=str(e),
                error_type=type(e).__name__
            )
            raise OpenLibraryError(f"Failed to connect to OpenLibrary: {str(e)}") from e

    async def search_books(
        self,
        title: str | None = None,
        author: str | None = None,
        limit: int = 10
    ) -> list[dict[str, Any]]:
        """Search for books by title and/or author.

        Args:
            title: Book title to search for
            author: Author name to search for
            limit: Maximum number of results

        Returns:
            List of book dictionaries

        Raises:
            OpenLibraryError: On API errors
            ValidationError: On invalid parameters
        """
        if not title and not author:
            raise ValidationError("Must provide title or author for search")

        if limit < 1 or limit > 100:
            raise ValidationError("Limit must be between 1 and 100", field="limit", value=limit)

        # Build search query
        query_parts = []
        if title:
            query_parts.append(f'title:"{title}"')
        if author:
            query_parts.append(f'author:"{author}"')

        query = " AND ".join(query_parts)

        path = "/search.json"
        params = {
            "q": query,
            "limit": limit,
            "fields": "key,title,author_name,first_publish_year,isbn,cover_i"
        }

        logger.info("Searching books in OpenLibrary", query=query, limit=limit)

        try:
            response = await self.get(path, params=params)

            if response.status_code != 200:
                error_msg = f"OpenLibrary search returned {response.status_code}"
                logger.warning(
                    "OpenLibrary search error",
                    query=query,
                    status_code=response.status_code
                )
                raise OpenLibraryError(error_msg, status_code=response.status_code)

            try:
                data = response.json()
            except Exception as e:
                logger.error("Failed to parse search response as JSON", error=str(e))
                raise OpenLibraryError("Invalid JSON response from OpenLibrary search") from e

            docs = data.get("docs", [])
            logger.info("Search completed", query=query, results_count=len(docs))

            return docs

        except httpx.HTTPStatusError as e:
            logger.error("HTTP error in OpenLibrary search", error=str(e))
            raise OpenLibraryError(
                f"HTTP {e.response.status_code} from OpenLibrary search",
                status_code=e.response.status_code
            ) from e

        except httpx.RequestError as e:
            logger.error("Request error in OpenLibrary search", error=str(e))
            raise OpenLibraryError(f"Failed to connect to OpenLibrary: {str(e)}") from e
