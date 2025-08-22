"""Base HTTP client with common functionality for external APIs."""

from __future__ import annotations

import asyncio
import time
from abc import ABC, abstractmethod
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)


class BaseHTTPClient(ABC):
    """Abstract base class for HTTP clients with rate limiting and retry logic."""

    def __init__(
        self,
        base_url: str,
        max_concurrent: int = 10,
        rate_limit_per_minute: int = 100,
        timeout: float = 10.0,
        max_retries: int = 3,
    ) -> None:
        """Initialize base HTTP client.

        Args:
            base_url: Base URL for the API
            max_concurrent: Maximum concurrent requests
            rate_limit_per_minute: Maximum requests per minute
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for failed requests
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

        # Rate limiting
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._rate_limit_per_minute = rate_limit_per_minute
        self._request_times: list[float] = []
        self._rate_limit_lock = asyncio.Lock()

        # HTTP client
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> BaseHTTPClient:
        """Async context manager entry."""
        await self._ensure_client()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_client(self) -> None:
        """Ensure HTTP client is initialized."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
            )

    async def close(self) -> None:
        """Close HTTP client and cleanup resources."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _wait_for_rate_limit(self) -> None:
        """Wait if rate limit would be exceeded."""
        async with self._rate_limit_lock:
            now = time.time()
            # Remove requests older than 1 minute
            self._request_times = [t for t in self._request_times if now - t < 60]

            # Wait if we would exceed rate limit
            if len(self._request_times) >= self._rate_limit_per_minute:
                sleep_time = 60 - (now - self._request_times[0])
                if sleep_time > 0:
                    logger.info(
                        "Rate limit reached, waiting",
                        sleep_time=sleep_time,
                        current_requests=len(self._request_times)
                    )
                    await asyncio.sleep(sleep_time)
                    # Clean up old requests after sleeping
                    now = time.time()
                    self._request_times = [t for t in self._request_times if now - t < 60]

            # Record this request
            self._request_times.append(now)

    async def _retry_request(
        self,
        method: str,
        url: str,
        **kwargs: Any
    ) -> httpx.Response:
        """Make HTTP request with exponential backoff retry."""
        await self._ensure_client()
        assert self._client is not None

        last_exception = None

        for attempt in range(self.max_retries + 1):
            try:
                if attempt > 0:
                    # Exponential backoff: 1s, 2s, 4s
                    sleep_time = 2 ** (attempt - 1)
                    logger.info(
                        "Retrying request after failure",
                        attempt=attempt,
                        sleep_time=sleep_time,
                        url=url
                    )
                    await asyncio.sleep(sleep_time)

                await self._wait_for_rate_limit()

                logger.debug(
                    "Making HTTP request",
                    method=method,
                    url=url,
                    attempt=attempt + 1
                )

                response = await self._client.request(method, url, **kwargs)

                # Log successful requests
                logger.debug(
                    "HTTP request completed",
                    method=method,
                    url=url,
                    status_code=response.status_code,
                    attempt=attempt + 1
                )

                return response

            except (httpx.TimeoutException, httpx.ConnectError, httpx.ReadError) as e:
                last_exception = e
                logger.warning(
                    "HTTP request failed",
                    method=method,
                    url=url,
                    attempt=attempt + 1,
                    error=str(e),
                    error_type=type(e).__name__
                )

                if attempt == self.max_retries:
                    break

            except Exception as e:
                # Don't retry on non-network errors
                logger.error(
                    "Unexpected error in HTTP request",
                    method=method,
                    url=url,
                    error=str(e),
                    error_type=type(e).__name__
                )
                raise

        # All retries exhausted
        logger.error(
            "All retry attempts exhausted",
            method=method,
            url=url,
            max_retries=self.max_retries
        )
        raise last_exception or httpx.RequestError("All retry attempts failed")

    async def get(self, path: str, **kwargs: Any) -> httpx.Response:
        """Make GET request with rate limiting and retry."""
        url = f"{self.base_url}{path}"

        async with self._semaphore:
            return await self._retry_request("GET", url, **kwargs)

    async def post(self, path: str, **kwargs: Any) -> httpx.Response:
        """Make POST request with rate limiting and retry."""
        url = f"{self.base_url}{path}"

        async with self._semaphore:
            return await self._retry_request("POST", url, **kwargs)

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the external API is healthy."""
        pass
