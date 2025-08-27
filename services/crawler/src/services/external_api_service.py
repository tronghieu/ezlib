from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

import structlog

from src.clients.openlibrary_client import OpenLibraryClient
from src.core.config import settings
from src.core.exceptions import ExternalAPIError
from src.models.external.openlibrary_models import OpenLibraryBookDetails

logger = structlog.get_logger(__name__)


@dataclass
class APICallMetrics:
    """Metrics for individual API calls."""

    api_name: str
    start_time: float
    end_time: float
    success: bool
    error: str | None = None

    @property
    def duration(self) -> float:
        """Calculate call duration in seconds."""
        return self.end_time - self.start_time


@dataclass
class CacheEntry:
    """Cache entry for API responses."""

    data: Any
    timestamp: datetime
    ttl_seconds: int

    @property
    def is_expired(self) -> bool:
        """Check if cache entry has expired."""
        return datetime.now() > self.timestamp + timedelta(seconds=self.ttl_seconds)


class ExternalAPIService:
    """Service for coordinating calls to multiple external APIs."""

    def __init__(
        self, openlibrary_client: OpenLibraryClient | None = None, cache_ttl: int = None
    ) -> None:
        """Initialize external API service.

        Args:
            openlibrary_client: OpenLibrary client instance
            cache_ttl: Cache time-to-live in seconds
        """
        self._openlibrary_client = openlibrary_client
        self._cache_ttl = cache_ttl or settings.ENRICHMENT_CACHE_TTL

        # In-memory cache for API responses
        self._response_cache: dict[str, CacheEntry] = {}

        # Semaphores for rate limiting per API
        self._api_semaphores: dict[str, asyncio.Semaphore] = {
            "openlibrary": asyncio.Semaphore(10),  # Conservative limit
        }

        # Metrics tracking
        self._call_metrics: list[APICallMetrics] = []
        self._health_status: dict[str, dict[str, Any]] = {}

    async def __aenter__(self) -> ExternalAPIService:
        """Async context manager entry."""
        await self._ensure_clients()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_clients(self) -> None:
        """Ensure all API clients are initialized."""
        if self._openlibrary_client is None:
            self._openlibrary_client = OpenLibraryClient()

        # Initialize clients if they support context management
        if hasattr(self._openlibrary_client, "__aenter__"):
            await self._openlibrary_client.__aenter__()

    async def close(self) -> None:
        """Close all API clients and clean up resources."""
        if self._openlibrary_client and hasattr(self._openlibrary_client, "close"):
            await self._openlibrary_client.close()

        # Clear cache and metrics to free memory
        self._response_cache.clear()
        self._call_metrics.clear()

    def _get_cache_key(self, api_name: str, method: str, **params) -> str:
        """Generate cache key for API call.

        Args:
            api_name: Name of the API
            method: Method being called
            **params: Call parameters

        Returns:
            Cache key string
        """
        # Sort params for consistent key generation
        param_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
        return f"{api_name}:{method}:{param_str}"

    def _get_cached_response(self, cache_key: str) -> Any | None:
        """Get cached response if available and not expired.

        Args:
            cache_key: Cache key to look up

        Returns:
            Cached data or None if not available/expired
        """
        if cache_key not in self._response_cache:
            return None

        entry = self._response_cache[cache_key]
        if entry.is_expired:
            # Remove expired entry
            del self._response_cache[cache_key]
            logger.debug("Cache entry expired", cache_key=cache_key)
            return None

        logger.debug("Cache hit", cache_key=cache_key)
        return entry.data

    def _cache_response(self, cache_key: str, data: Any) -> None:
        """Cache API response.

        Args:
            cache_key: Cache key
            data: Response data to cache
        """
        self._response_cache[cache_key] = CacheEntry(
            data=data, timestamp=datetime.now(), ttl_seconds=self._cache_ttl
        )
        logger.debug("Response cached", cache_key=cache_key)

    async def _record_api_call(
        self, api_name: str, start_time: float, success: bool, error: str | None = None
    ) -> None:
        """Record metrics for API call.

        Args:
            api_name: Name of the API
            start_time: Call start time
            success: Whether call was successful
            error: Error message if call failed
        """
        end_time = time.time()
        metrics = APICallMetrics(
            api_name=api_name,
            start_time=start_time,
            end_time=end_time,
            success=success,
            error=error,
        )

        self._call_metrics.append(metrics)

        # Keep only recent metrics (last 1000 calls)
        if len(self._call_metrics) > 1000:
            self._call_metrics = self._call_metrics[-1000:]

        logger.debug(
            "API call recorded",
            api_name=api_name,
            duration=metrics.duration,
            success=success,
            error=error,
        )

    async def fetch_book_by_isbn(
        self, isbn: str, force_refresh: bool = False
    ) -> tuple[OpenLibraryBookDetails | None, list[str]]:
        """Fetch book data from available APIs.

        Args:
            isbn: Book ISBN to fetch
            force_refresh: Skip cache and fetch fresh data

        Returns:
            Tuple of (book_details, sources_used)
        """
        sources_used = []

        # Generate cache key
        cache_key = self._get_cache_key("openlibrary", "fetch_book", isbn=isbn)

        # Check cache unless force refresh is requested
        if not force_refresh:
            cached_data = self._get_cached_response(cache_key)
            if cached_data:
                logger.debug("Returning cached book data", isbn=isbn)
                return cached_data, ["openlibrary:cached"]

        # Try OpenLibrary first (primary source)
        book_details = await self._fetch_from_openlibrary(isbn)
        if book_details:
            sources_used.append("openlibrary")

            # Cache the successful result
            self._cache_response(cache_key, book_details)

            return book_details, sources_used

        # TODO: Add fallback APIs in future iterations
        # - Google Books API
        # - ISBN Database API
        # - Wikidata API

        logger.info(
            "No book data found from any API",
            isbn=isbn,
            sources_tried=sources_used or ["openlibrary"],
        )

        return None, sources_used or ["openlibrary"]

    async def _fetch_from_openlibrary(self, isbn: str) -> OpenLibraryBookDetails | None:
        """Fetch book data from OpenLibrary API.

        Args:
            isbn: Book ISBN to fetch

        Returns:
            Book details or None if not found
        """
        api_name = "openlibrary"
        start_time = time.time()

        try:
            # Use semaphore for rate limiting
            async with self._api_semaphores[api_name]:
                await self._ensure_clients()
                assert self._openlibrary_client is not None

                logger.debug(
                    "Fetching from OpenLibrary",
                    isbn=isbn,
                    semaphore_value=self._api_semaphores[api_name]._value,
                )

                # Set timeout for individual API call
                data = await asyncio.wait_for(
                    self._openlibrary_client.fetch_book_by_isbn(isbn),
                    timeout=30.0,  # 30 second timeout per API
                )

                if data:
                    book_details = OpenLibraryBookDetails(**data)
                    await self._record_api_call(api_name, start_time, True)

                    logger.debug(
                        "Successfully fetched from OpenLibrary",
                        isbn=isbn,
                        title=book_details.title,
                        authors_count=len(book_details.authors or []),
                    )

                    return book_details
                else:
                    await self._record_api_call(api_name, start_time, True)
                    logger.debug("Book not found in OpenLibrary", isbn=isbn)
                    return None

        except asyncio.TimeoutError:
            error_msg = "OpenLibrary API timeout"
            await self._record_api_call(api_name, start_time, False, error_msg)
            logger.warning("OpenLibrary API timeout", isbn=isbn)
            raise ExternalAPIError(api_name, 408, error_msg) from None

        except Exception as e:
            error_msg = f"OpenLibrary API error: {str(e)}"
            await self._record_api_call(api_name, start_time, False, error_msg)
            logger.error(
                "Error fetching from OpenLibrary",
                isbn=isbn,
                error=str(e),
                error_type=type(e).__name__,
            )
            raise ExternalAPIError(api_name, 500, error_msg) from e

    async def fetch_books_parallel(
        self, isbns: list[str], max_concurrent: int = None
    ) -> list[tuple[str, OpenLibraryBookDetails | None, list[str]]]:
        """Fetch multiple books in parallel with concurrency control.

        Args:
            isbns: List of ISBNs to fetch
            max_concurrent: Maximum concurrent requests (defaults to setting)

        Returns:
            List of (isbn, book_details, sources_used) tuples
        """
        if not isbns:
            return []

        max_concurrent = max_concurrent or settings.ENRICHMENT_MAX_CONCURRENT

        logger.info(
            "Starting parallel book fetch",
            book_count=len(isbns),
            max_concurrent=max_concurrent,
        )

        # Create semaphore for overall concurrency control
        semaphore = asyncio.Semaphore(max_concurrent)

        async def fetch_single(
            isbn: str,
        ) -> tuple[str, OpenLibraryBookDetails | None, list[str]]:
            async with semaphore:
                try:
                    book_details, sources = await self.fetch_book_by_isbn(isbn)
                    return isbn, book_details, sources
                except Exception as e:
                    logger.error(
                        "Error in parallel fetch",
                        isbn=isbn,
                        error=str(e),
                        error_type=type(e).__name__,
                    )
                    return isbn, None, []

        # Execute all fetches concurrently
        tasks = [fetch_single(isbn) for isbn in isbns]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results and handle exceptions
        processed_results = []
        for isbn, result in zip(isbns, results, strict=True):
            if isinstance(result, Exception):
                logger.error(
                    "Exception in parallel fetch", isbn=isbn, error=str(result)
                )
                processed_results.append((isbn, None, []))
            else:
                processed_results.append(result)

        # Log summary
        successful = sum(
            1 for _, details, _ in processed_results if details is not None
        )
        logger.info(
            "Parallel book fetch completed",
            total_books=len(isbns),
            successful=successful,
            failed=len(isbns) - successful,
        )

        return processed_results

    def get_api_metrics(self, minutes: int = 60) -> dict[str, Any]:
        """Get API performance metrics for the specified time period.

        Args:
            minutes: Time period in minutes to analyze

        Returns:
            Dictionary containing API metrics
        """
        cutoff_time = time.time() - (minutes * 60)
        recent_metrics = [m for m in self._call_metrics if m.start_time >= cutoff_time]

        if not recent_metrics:
            return {"period_minutes": minutes, "no_data": True}

        # Calculate aggregate metrics
        total_calls = len(recent_metrics)
        successful_calls = sum(1 for m in recent_metrics if m.success)
        failed_calls = total_calls - successful_calls

        durations = [m.duration for m in recent_metrics]
        avg_duration = sum(durations) / len(durations)

        # Group by API
        api_breakdown = {}
        for metric in recent_metrics:
            api_name = metric.api_name
            if api_name not in api_breakdown:
                api_breakdown[api_name] = {
                    "total_calls": 0,
                    "successful_calls": 0,
                    "failed_calls": 0,
                    "avg_duration": 0.0,
                    "errors": [],
                }

            api_breakdown[api_name]["total_calls"] += 1
            if metric.success:
                api_breakdown[api_name]["successful_calls"] += 1
            else:
                api_breakdown[api_name]["failed_calls"] += 1
                if metric.error:
                    api_breakdown[api_name]["errors"].append(metric.error)

        # Calculate average durations per API
        for api_name in api_breakdown:
            api_metrics = [m for m in recent_metrics if m.api_name == api_name]
            api_durations = [m.duration for m in api_metrics]
            api_breakdown[api_name]["avg_duration"] = sum(api_durations) / len(
                api_durations
            )

        return {
            "period_minutes": minutes,
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": failed_calls,
            "success_rate": (successful_calls / total_calls * 100)
            if total_calls > 0
            else 0,
            "average_duration": avg_duration,
            "api_breakdown": api_breakdown,
            "cache_size": len(self._response_cache),
        }

    async def health_check(self) -> dict[str, Any]:
        """Check health of all external APIs.

        Returns:
            Health status for all APIs
        """
        health_status = {
            "overall_status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "apis": {},
        }

        # Check OpenLibrary
        try:
            await self._ensure_clients()
            assert self._openlibrary_client is not None

            ol_healthy = await self._openlibrary_client.health_check()
            health_status["apis"]["openlibrary"] = {
                "status": "healthy" if ol_healthy else "unhealthy",
                "available": ol_healthy,
            }

        except Exception as e:
            health_status["apis"]["openlibrary"] = {
                "status": "unhealthy",
                "error": str(e),
                "available": False,
            }

        # Update overall status
        unhealthy_apis = [
            name
            for name, status in health_status["apis"].items()
            if status["status"] != "healthy"
        ]

        if unhealthy_apis:
            health_status["overall_status"] = "degraded"
            health_status["unhealthy_apis"] = unhealthy_apis

        # Add recent metrics
        metrics = self.get_api_metrics(15)  # Last 15 minutes
        health_status["recent_metrics"] = metrics

        return health_status

    def clear_cache(self) -> int:
        """Clear the response cache.

        Returns:
            Number of entries cleared
        """
        count = len(self._response_cache)
        self._response_cache.clear()
        logger.info("Response cache cleared", entries_cleared=count)
        return count

    def cleanup_expired_cache(self) -> int:
        """Remove expired entries from cache.

        Returns:
            Number of entries removed
        """
        len(self._response_cache)

        # Find expired keys
        expired_keys = [
            key for key, entry in self._response_cache.items() if entry.is_expired
        ]

        # Remove expired entries
        for key in expired_keys:
            del self._response_cache[key]

        removed_count = len(expired_keys)
        logger.debug(
            "Cache cleanup completed",
            removed_entries=removed_count,
            remaining_entries=len(self._response_cache),
        )

        return removed_count
