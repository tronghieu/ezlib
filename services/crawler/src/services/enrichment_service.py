"""Book enrichment service with OpenLibrary integration."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime

import structlog

from src.clients.openlibrary_client import OpenLibraryClient
from src.core.config import settings
from src.core.exceptions import ValidationError
from src.models.database.book_metadata import BookMetadata
from src.models.external.openlibrary_models import OpenLibraryBookDetails
from src.utils.isbn_utils import is_valid_isbn, normalize_isbn

logger = structlog.get_logger(__name__)


class EnrichmentStatus:
    """Enumeration of enrichment status values."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


class EnrichmentResult:
    """Result of book enrichment operation."""

    def __init__(
        self,
        isbn: str,
        status: str,
        metadata: BookMetadata | None = None,
        error: str | None = None,
        quality_score: float | None = None,
        sources_used: list[str] | None = None,
        processing_time: float | None = None,
        correlation_id: str | None = None,
    ) -> None:
        """Initialize enrichment result.

        Args:
            isbn: Book ISBN that was processed
            status: Enrichment status
            metadata: Enriched book metadata if successful
            error: Error message if failed
            quality_score: Data quality score
            sources_used: List of data sources used
            processing_time: Processing duration in seconds
            correlation_id: Unique identifier for tracking
        """
        self.isbn = isbn
        self.status = status
        self.metadata = metadata
        self.error = error
        self.quality_score = quality_score
        self.sources_used = sources_used or []
        self.processing_time = processing_time
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert result to dictionary representation."""
        result = {
            "isbn": self.isbn,
            "status": self.status,
            "correlation_id": self.correlation_id,
            "timestamp": self.timestamp.isoformat(),
            "sources_used": self.sources_used,
        }

        if self.metadata:
            result["metadata"] = self.metadata.dict()

        if self.error:
            result["error"] = self.error

        if self.quality_score is not None:
            result["quality_score"] = self.quality_score

        if self.processing_time is not None:
            result["processing_time"] = self.processing_time

        return result

    @property
    def is_successful(self) -> bool:
        """Check if enrichment was successful."""
        return self.status == EnrichmentStatus.SUCCESS

    @property
    def is_high_quality(self) -> bool:
        """Check if enrichment met quality threshold."""
        if not self.quality_score:
            return False

        return self.quality_score >= settings.ENRICHMENT_MIN_QUALITY_SCORE


class BookEnrichmentService:
    """Service for enriching book metadata from external sources."""

    def __init__(self, openlibrary_client: OpenLibraryClient | None = None) -> None:
        """Initialize enrichment service.

        Args:
            openlibrary_client: OpenLibrary client instance
        """
        self._openlibrary_client = openlibrary_client
        self._concurrency_semaphore = asyncio.Semaphore(settings.ENRICHMENT_MAX_CONCURRENT)

    async def __aenter__(self) -> BookEnrichmentService:
        """Async context manager entry."""
        await self._ensure_clients()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_clients(self) -> None:
        """Ensure API clients are initialized."""
        if self._openlibrary_client is None:
            self._openlibrary_client = OpenLibraryClient()

        # Start the clients if they support context management
        if hasattr(self._openlibrary_client, '__aenter__'):
            await self._openlibrary_client.__aenter__()

    async def close(self) -> None:
        """Close all API clients."""
        if self._openlibrary_client and hasattr(self._openlibrary_client, 'close'):
            await self._openlibrary_client.close()

    async def enrich_book(
        self,
        isbn: str,
        force_refresh: bool = False,
        min_quality_score: float | None = None,
    ) -> EnrichmentResult:
        """Enrich book metadata from external sources.

        Args:
            isbn: Book ISBN identifier
            force_refresh: Skip cache and fetch fresh data
            min_quality_score: Minimum quality score threshold

        Returns:
            Enrichment result with metadata or error information

        Raises:
            ValidationError: If ISBN is invalid
            EnrichmentError: If enrichment fails
        """
        correlation_id = str(uuid.uuid4())
        start_time = asyncio.get_event_loop().time()

        logger.info(
            "Starting book enrichment",
            isbn=isbn,
            correlation_id=correlation_id,
            force_refresh=force_refresh
        )

        # Validate and normalize ISBN
        try:
            if not is_valid_isbn(isbn):
                raise ValidationError(f"Invalid ISBN format: {isbn}", field="isbn", value=isbn)

            normalized_isbn = normalize_isbn(isbn)

        except ValidationError as e:
            logger.warning("ISBN validation failed", isbn=isbn, error=str(e))
            return EnrichmentResult(
                isbn=isbn,
                status=EnrichmentStatus.FAILED,
                error=str(e),
                correlation_id=correlation_id
            )

        # Use concurrency control
        async with self._concurrency_semaphore:
            try:
                # Set timeout for the entire enrichment process
                result = await asyncio.wait_for(
                    self._enrich_single_book(normalized_isbn, correlation_id, min_quality_score),
                    timeout=settings.ENRICHMENT_TIMEOUT
                )

                processing_time = asyncio.get_event_loop().time() - start_time
                result.processing_time = processing_time

                logger.info(
                    "Book enrichment completed",
                    isbn=normalized_isbn,
                    correlation_id=correlation_id,
                    status=result.status,
                    quality_score=result.quality_score,
                    processing_time=processing_time
                )

                return result

            except asyncio.TimeoutError:
                processing_time = asyncio.get_event_loop().time() - start_time
                error_msg = f"Enrichment timeout after {settings.ENRICHMENT_TIMEOUT}s"

                logger.error(
                    "Enrichment timeout",
                    isbn=normalized_isbn,
                    correlation_id=correlation_id,
                    timeout=settings.ENRICHMENT_TIMEOUT,
                    processing_time=processing_time
                )

                return EnrichmentResult(
                    isbn=normalized_isbn,
                    status=EnrichmentStatus.FAILED,
                    error=error_msg,
                    correlation_id=correlation_id,
                    processing_time=processing_time
                )

            except Exception as e:
                processing_time = asyncio.get_event_loop().time() - start_time
                error_msg = f"Unexpected error: {str(e)}"

                logger.error(
                    "Unexpected error during enrichment",
                    isbn=normalized_isbn,
                    correlation_id=correlation_id,
                    error=error_msg,
                    error_type=type(e).__name__,
                    processing_time=processing_time,
                    exc_info=True
                )

                return EnrichmentResult(
                    isbn=normalized_isbn,
                    status=EnrichmentStatus.FAILED,
                    error=error_msg,
                    correlation_id=correlation_id,
                    processing_time=processing_time
                )

    async def _enrich_single_book(
        self,
        isbn: str,
        correlation_id: str,
        min_quality_score: float | None = None
    ) -> EnrichmentResult:
        """Enrich a single book from OpenLibrary.

        Args:
            isbn: Normalized ISBN-13
            correlation_id: Unique tracking identifier
            min_quality_score: Minimum quality threshold

        Returns:
            Enrichment result
        """
        min_score = min_quality_score or settings.ENRICHMENT_MIN_QUALITY_SCORE

        try:
            # Fetch from OpenLibrary
            logger.debug(
                "Fetching book data from OpenLibrary",
                isbn=isbn,
                correlation_id=correlation_id
            )

            await self._ensure_clients()
            assert self._openlibrary_client is not None

            ol_data = await self._openlibrary_client.fetch_book_by_isbn(isbn)

            if not ol_data:
                logger.info(
                    "Book not found in OpenLibrary",
                    isbn=isbn,
                    correlation_id=correlation_id
                )

                return EnrichmentResult(
                    isbn=isbn,
                    status=EnrichmentStatus.FAILED,
                    error="Book not found in OpenLibrary",
                    sources_used=["openlibrary"],
                    correlation_id=correlation_id
                )

            # Convert to internal metadata format
            ol_details = OpenLibraryBookDetails(**ol_data)
            metadata = BookMetadata.from_openlibrary(isbn, ol_details)

            logger.debug(
                "Converted OpenLibrary data to internal format",
                isbn=isbn,
                correlation_id=correlation_id,
                title=metadata.title,
                authors_count=len(metadata.authors),
                quality_score=metadata.quality_score
            )

            # Validate data quality
            if metadata.quality_score and metadata.quality_score < min_score:
                missing_fields = metadata.get_missing_fields()
                error_msg = f"Data quality below threshold: {metadata.quality_score:.2f} < {min_score:.2f}"

                logger.warning(
                    "Data quality below threshold",
                    isbn=isbn,
                    correlation_id=correlation_id,
                    quality_score=metadata.quality_score,
                    min_score=min_score,
                    missing_fields=missing_fields
                )

                return EnrichmentResult(
                    isbn=isbn,
                    status=EnrichmentStatus.PARTIAL,
                    metadata=metadata,
                    error=error_msg,
                    quality_score=metadata.quality_score,
                    sources_used=["openlibrary"],
                    correlation_id=correlation_id
                )

            # Successful enrichment
            return EnrichmentResult(
                isbn=isbn,
                status=EnrichmentStatus.SUCCESS,
                metadata=metadata,
                quality_score=metadata.quality_score,
                sources_used=["openlibrary"],
                correlation_id=correlation_id
            )

        except Exception as e:
            logger.error(
                "Error during book enrichment",
                isbn=isbn,
                correlation_id=correlation_id,
                error=str(e),
                error_type=type(e).__name__
            )

            return EnrichmentResult(
                isbn=isbn,
                status=EnrichmentStatus.FAILED,
                error=str(e),
                sources_used=["openlibrary"],
                correlation_id=correlation_id
            )

    async def batch_enrich_books(
        self,
        isbns: list[str],
        force_refresh: bool = False,
        min_quality_score: float | None = None,
    ) -> list[EnrichmentResult]:
        """Enrich multiple books concurrently.

        Args:
            isbns: List of ISBN identifiers
            force_refresh: Skip cache and fetch fresh data
            min_quality_score: Minimum quality score threshold

        Returns:
            List of enrichment results
        """
        logger.info(
            "Starting batch book enrichment",
            book_count=len(isbns),
            force_refresh=force_refresh
        )

        # Create enrichment tasks
        tasks = [
            self.enrich_book(isbn, force_refresh, min_quality_score)
            for isbn in isbns
        ]

        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to failed results
        enrichment_results = []
        for isbn, result in zip(isbns, results):
            if isinstance(result, Exception):
                enrichment_results.append(
                    EnrichmentResult(
                        isbn=isbn,
                        status=EnrichmentStatus.FAILED,
                        error=str(result)
                    )
                )
            else:
                enrichment_results.append(result)

        # Log summary
        successful = sum(1 for r in enrichment_results if r.is_successful)
        failed = len(enrichment_results) - successful

        logger.info(
            "Batch enrichment completed",
            total_books=len(isbns),
            successful=successful,
            failed=failed
        )

        return enrichment_results

    async def health_check(self) -> dict:
        """Check health of enrichment service and dependencies.

        Returns:
            Health status dictionary
        """
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {}
        }

        # Check OpenLibrary
        try:
            await self._ensure_clients()
            assert self._openlibrary_client is not None

            ol_healthy = await self._openlibrary_client.health_check()
            health_status["services"]["openlibrary"] = {
                "status": "healthy" if ol_healthy else "unhealthy",
                "available": ol_healthy
            }
        except Exception as e:
            health_status["services"]["openlibrary"] = {
                "status": "unhealthy",
                "error": str(e)
            }

        # Overall status based on critical services
        if not health_status["services"]["openlibrary"]["status"] == "healthy":
            health_status["status"] = "degraded"

        return health_status
