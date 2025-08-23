"""Enhanced book enrichment service with comprehensive validation and quality control."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from typing import Any

import structlog

from src.clients.openlibrary_client import OpenLibraryClient
from src.core.config import settings
from src.core.exceptions import ValidationError
from src.models.database.book_metadata import BookMetadata
from src.models.database.enrichment_job import (
    BatchEnrichmentJob,
    EnrichmentJob,
    EnrichmentStatus,
    ErrorCategory,
    ErrorDetails,
    ProcessingMetrics,
)

logger = structlog.get_logger(__name__)


# Forward references for type hints
if False:
    from src.services.validation_service import ValidationService
    from src.services.external_api_service import ExternalAPIService




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
    """Enhanced service for enriching book metadata with comprehensive validation and quality control."""

    def __init__(
        self,
        validation_service: "ValidationService" | None = None,
        external_api_service: "ExternalAPIService" | None = None,
        openlibrary_client: OpenLibraryClient | None = None,
    ) -> None:
        """Initialize enrichment service with dependency injection.

        Args:
            validation_service: Service for data validation and quality assessment
            external_api_service: Service for coordinating external API calls
            openlibrary_client: Direct OpenLibrary client (for backward compatibility)
        """
        self._validation_service = validation_service
        self._external_api_service = external_api_service
        self._openlibrary_client = openlibrary_client

        # Concurrency control
        self._concurrency_semaphore = asyncio.Semaphore(
            settings.ENRICHMENT_MAX_CONCURRENT
        )

        # Job tracking
        self._active_jobs: dict[str, EnrichmentJob] = {}
        self._job_history: list[EnrichmentJob] = []

    async def __aenter__(self) -> BookEnrichmentService:
        """Async context manager entry."""
        await self._ensure_services()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_services(self) -> None:
        """Ensure all services are initialized."""
        # Initialize validation service
        if self._validation_service is None:
            from src.services.validation_service import ValidationService
            self._validation_service = ValidationService()

        # Initialize external API service
        if self._external_api_service is None:
            from src.services.external_api_service import ExternalAPIService
            self._external_api_service = ExternalAPIService(
                openlibrary_client=self._openlibrary_client
            )

        # Start external API service
        if hasattr(self._external_api_service, "__aenter__"):
            await self._external_api_service.__aenter__()

    async def close(self) -> None:
        """Close all services and clean up resources."""
        if self._external_api_service and hasattr(self._external_api_service, "close"):
            await self._external_api_service.close()

    def _create_enrichment_job(
        self,
        isbn: str,
        force_refresh: bool = False,
        min_quality_score: float | None = None,
        correlation_id: str | None = None,
    ) -> EnrichmentJob:
        """Create a new enrichment job for tracking.

        Args:
            isbn: Book ISBN
            force_refresh: Whether to skip cache
            min_quality_score: Minimum quality threshold
            correlation_id: Optional correlation ID

        Returns:
            New enrichment job instance
        """
        job_id = str(uuid.uuid4())

        if correlation_id is None:
            correlation_id = str(uuid.uuid4())

        job = EnrichmentJob.create_job(
            job_id=job_id,
            isbn=isbn,
            correlation_id=correlation_id,
            force_refresh=force_refresh,
            min_quality_score=min_quality_score,
            timeout_seconds=settings.ENRICHMENT_TIMEOUT,
        )

        # Store in active jobs
        self._active_jobs[job_id] = job

        logger.info(
            "Created enrichment job",
            job_id=job_id,
            correlation_id=correlation_id,
            isbn=isbn
        )

        return job

    def _complete_job(self, job: EnrichmentJob) -> None:
        """Mark job as complete and move to history.

        Args:
            job: Enrichment job to complete
        """
        # Move to history
        self._job_history.append(job)

        # Remove from active jobs
        if job.job_id in self._active_jobs:
            del self._active_jobs[job.job_id]

        # Keep history size manageable
        if len(self._job_history) > 1000:
            self._job_history = self._job_history[-1000:]

        logger.debug(
            "Job completed and archived",
            job_id=job.job_id,
            status=job.status,
            duration=job.get_duration()
        )

    async def enrich_book(
        self,
        isbn: str,
        force_refresh: bool = False,
        min_quality_score: float | None = None,
        correlation_id: str | None = None,
    ) -> EnrichmentResult:
        """Enrich book metadata with comprehensive validation and quality control.

        Args:
            isbn: Book ISBN identifier
            force_refresh: Skip cache and fetch fresh data
            min_quality_score: Minimum quality score threshold
            correlation_id: Optional correlation ID for tracking

        Returns:
            Enrichment result with metadata or error information

        Raises:
            ValidationError: If ISBN is invalid
            EnrichmentError: If enrichment fails
        """
        # Create job for tracking
        job = self._create_enrichment_job(
            isbn=isbn,
            force_refresh=force_refresh,
            min_quality_score=min_quality_score,
            correlation_id=correlation_id,
        )

        start_time = asyncio.get_event_loop().time()
        processing_metrics = ProcessingMetrics(started_at=datetime.utcnow())

        logger.info(
            "Starting enhanced book enrichment",
            job_id=job.job_id,
            correlation_id=job.correlation_id,
            isbn=isbn,
            force_refresh=force_refresh,
        )

        # Update job status
        job.update_status(EnrichmentStatus.IN_PROGRESS)

        try:
            await self._ensure_services()
            assert self._validation_service is not None

            # Step 1: Validate and normalize ISBN
            try:
                normalized_isbn = self._validation_service.validate_isbn(isbn)
                job.isbn = normalized_isbn  # Update job with normalized ISBN

            except ValidationError as e:
                job.set_error(
                    str(e),
                    ErrorCategory.VALIDATION_ERROR,
                    ErrorDetails(
                        category=ErrorCategory.VALIDATION_ERROR,
                        message=str(e),
                        field_name="isbn"
                    )
                )

                result = self._create_error_result(job, str(e))
                self._complete_job(job)
                return result

            # Step 2: Use concurrency control and timeout
            async with self._concurrency_semaphore:
                try:
                    result = await asyncio.wait_for(
                        self._enrich_single_book_enhanced(job, processing_metrics),
                        timeout=settings.ENRICHMENT_TIMEOUT,
                    )

                    # Update processing time
                    processing_time = asyncio.get_event_loop().time() - start_time
                    result.processing_time = processing_time
                    processing_metrics.processing_time_seconds = processing_time

                    # Set final job metrics
                    job.set_processing_metrics(processing_metrics)

                    logger.info(
                        "Enhanced book enrichment completed",
                        job_id=job.job_id,
                        correlation_id=job.correlation_id,
                        isbn=normalized_isbn,
                        status=result.status,
                        quality_score=result.quality_score,
                        processing_time=processing_time,
                    )

                    self._complete_job(job)
                    return result

                except asyncio.TimeoutError:
                    processing_time = asyncio.get_event_loop().time() - start_time
                    error_msg = f"Enrichment timeout after {settings.ENRICHMENT_TIMEOUT}s"

                    job.set_error(
                        error_msg,
                        ErrorCategory.TIMEOUT_ERROR,
                        ErrorDetails(
                            category=ErrorCategory.TIMEOUT_ERROR,
                            message=error_msg
                        )
                    )

                    logger.error(
                        "Enrichment timeout",
                        job_id=job.job_id,
                        correlation_id=job.correlation_id,
                        isbn=normalized_isbn,
                        timeout=settings.ENRICHMENT_TIMEOUT,
                        processing_time=processing_time,
                    )

                    result = EnrichmentResult(
                        isbn=normalized_isbn,
                        status=EnrichmentStatus.FAILED,
                        error=error_msg,
                        correlation_id=job.correlation_id,
                        processing_time=processing_time,
                    )

                    self._complete_job(job)
                    return result

        except Exception as e:
            processing_time = asyncio.get_event_loop().time() - start_time
            error_msg = f"Unexpected error: {str(e)}"

            job.set_error(
                error_msg,
                ErrorCategory.UNKNOWN_ERROR,
                ErrorDetails(
                    category=ErrorCategory.UNKNOWN_ERROR,
                    message=str(e)
                )
            )

            logger.error(
                "Unexpected error during enrichment",
                job_id=job.job_id,
                correlation_id=job.correlation_id,
                isbn=isbn,
                error=error_msg,
                error_type=type(e).__name__,
                processing_time=processing_time,
                exc_info=True,
            )

            result = EnrichmentResult(
                isbn=job.isbn,
                status=EnrichmentStatus.FAILED,
                error=error_msg,
                correlation_id=job.correlation_id,
                processing_time=processing_time,
            )

            self._complete_job(job)
            return result

    async def _enrich_single_book_enhanced(
        self,
        job: EnrichmentJob,
        metrics: ProcessingMetrics
    ) -> EnrichmentResult:
        """Enhanced single book enrichment with full quality control.

        Args:
            job: Enrichment job being processed
            metrics: Processing metrics to update

        Returns:
            Enrichment result
        """
        assert self._validation_service is not None
        assert self._external_api_service is not None

        min_score = job.min_quality_score or settings.ENRICHMENT_MIN_QUALITY_SCORE

        try:
            # Step 3: Fetch data from external APIs
            logger.debug(
                "Fetching book data from external APIs",
                job_id=job.job_id,
                isbn=job.isbn,
            )

            book_details, sources_used = await self._external_api_service.fetch_book_by_isbn(
                job.isbn,
                force_refresh=job.force_refresh
            )

            metrics.sources_used = sources_used
            metrics.api_calls_made = len([s for s in sources_used if not s.endswith(':cached')])
            metrics.cache_hits = len([s for s in sources_used if s.endswith(':cached')])

            if not book_details:
                error_msg = "Book not found in any external source"
                job.set_error(
                    error_msg,
                    ErrorCategory.API_ERROR,
                    ErrorDetails(
                        category=ErrorCategory.API_ERROR,
                        message=error_msg,
                        api_source=", ".join(sources_used)
                    )
                )

                logger.info(
                    "Book not found in external sources",
                    job_id=job.job_id,
                    isbn=job.isbn,
                    sources_tried=sources_used,
                )

                return EnrichmentResult(
                    isbn=job.isbn,
                    status=EnrichmentStatus.FAILED,
                    error=error_msg,
                    sources_used=sources_used,
                    correlation_id=job.correlation_id,
                )

            # Step 4: Convert to internal metadata format
            metadata = BookMetadata.from_openlibrary(job.isbn, book_details)

            # Step 5: Enhanced data validation and quality assessment
            quality_report = self._validation_service.validate_metadata_quality(
                metadata, min_completeness=min_score
            )

            # Update job with quality scores
            job.set_quality_scores(
                quality_score=quality_report["completeness_score"],
                completeness_score=quality_report["completeness_score"]
            )

            # Step 6: Process quality warnings
            if quality_report["warnings"]:
                job.add_quality_warnings(quality_report["warnings"])

                # Mark for review if highly suspicious
                if quality_report["suspicion_level"] >= 3:
                    job.mark_for_review("Multiple data quality concerns detected")

            logger.debug(
                "Data quality assessment completed",
                job_id=job.job_id,
                isbn=job.isbn,
                completeness_score=quality_report["completeness_score"],
                quality_status=quality_report["quality_status"],
                warnings_count=len(quality_report["warnings"]),
            )

            # Step 7: Determine enrichment result based on quality
            if not quality_report["meets_threshold"]:
                error_msg = f"Data quality below threshold: {quality_report['completeness_score']:.2f} < {min_score:.2f}"

                job.set_error(
                    error_msg,
                    ErrorCategory.QUALITY_ERROR,
                    ErrorDetails(
                        category=ErrorCategory.QUALITY_ERROR,
                        message=error_msg,
                        field_name="quality_score"
                    )
                )

                logger.warning(
                    "Data quality below threshold",
                    job_id=job.job_id,
                    isbn=job.isbn,
                    quality_score=quality_report["completeness_score"],
                    min_score=min_score,
                    missing_fields=quality_report["missing_fields"],
                )

                return EnrichmentResult(
                    isbn=job.isbn,
                    status=EnrichmentStatus.PARTIAL,
                    metadata=metadata,
                    error=error_msg,
                    quality_score=quality_report["completeness_score"],
                    sources_used=sources_used,
                    correlation_id=job.correlation_id,
                )

            # Step 8: Successful enrichment
            job.update_status(EnrichmentStatus.SUCCESS)
            metrics.mark_completed()

            return EnrichmentResult(
                isbn=job.isbn,
                status=EnrichmentStatus.SUCCESS,
                metadata=metadata,
                quality_score=quality_report["completeness_score"],
                sources_used=sources_used,
                correlation_id=job.correlation_id,
            )

        except Exception as e:
            error_msg = f"Error during enhanced enrichment: {str(e)}"

            job.set_error(
                error_msg,
                ErrorCategory.UNKNOWN_ERROR,
                ErrorDetails(
                    category=ErrorCategory.UNKNOWN_ERROR,
                    message=str(e)
                )
            )

            logger.error(
                "Error during enhanced book enrichment",
                job_id=job.job_id,
                isbn=job.isbn,
                error=str(e),
                error_type=type(e).__name__,
            )

            return EnrichmentResult(
                isbn=job.isbn,
                status=EnrichmentStatus.FAILED,
                error=error_msg,
                sources_used=getattr(metrics, 'sources_used', []),
                correlation_id=job.correlation_id,
            )

    def _create_error_result(self, job: EnrichmentJob, error_message: str) -> EnrichmentResult:
        """Create an error result from a failed job.

        Args:
            job: Failed enrichment job
            error_message: Error message

        Returns:
            EnrichmentResult indicating failure
        """
        return EnrichmentResult(
            isbn=job.isbn,
            status=EnrichmentStatus.FAILED,
            error=error_message,
            correlation_id=job.correlation_id,
        )

    async def batch_enrich_books(
        self,
        isbns: list[str],
        force_refresh: bool = False,
        min_quality_score: float | None = None,
    ) -> list[EnrichmentResult]:
        """Enrich multiple books concurrently with enhanced tracking.

        Args:
            isbns: List of ISBN identifiers
            force_refresh: Skip cache and fetch fresh data
            min_quality_score: Minimum quality score threshold

        Returns:
            List of enrichment results
        """
        batch_id = str(uuid.uuid4())

        # Create batch job for tracking
        batch_job = BatchEnrichmentJob(
            batch_id=batch_id,
            total_books=len(isbns),
            force_refresh=force_refresh,
            min_quality_score=min_quality_score,
        )
        batch_job.start_processing()

        logger.info(
            "Starting enhanced batch book enrichment",
            batch_id=batch_id,
            book_count=len(isbns),
            force_refresh=force_refresh,
        )

        # Create enrichment tasks
        tasks = [
            self.enrich_book(isbn, force_refresh, min_quality_score)
            for isbn in isbns
        ]

        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results and update batch tracking
        enrichment_results = []
        for isbn, result in zip(isbns, results, strict=True):
            if isinstance(result, Exception):
                error_result = EnrichmentResult(
                    isbn=isbn,
                    status=EnrichmentStatus.FAILED,
                    error=str(result)
                )
                enrichment_results.append(error_result)
                batch_job.update_progress(completed=1, failed=1)
            else:
                enrichment_results.append(result)
                if result.is_successful:
                    batch_job.update_progress(completed=1, successful=1)
                elif result.status == EnrichmentStatus.PARTIAL:
                    batch_job.update_progress(completed=1, partial=1)
                else:
                    batch_job.update_progress(completed=1, failed=1)

        # Complete batch
        batch_job.complete_batch()

        logger.info(
            "Enhanced batch enrichment completed",
            batch_id=batch_id,
            total_books=len(isbns),
            successful=batch_job.successful_jobs,
            failed=batch_job.failed_jobs,
            partial=batch_job.partial_jobs,
            success_rate=batch_job.get_success_rate(),
        )

        return enrichment_results

    def get_job_status(self, job_id: str) -> dict[str, Any] | None:
        """Get status of an enrichment job.

        Args:
            job_id: Job identifier

        Returns:
            Job status dictionary or None if not found
        """
        # Check active jobs
        if job_id in self._active_jobs:
            return self._active_jobs[job_id].to_summary_dict()

        # Check history
        for job in self._job_history:
            if job.job_id == job_id:
                return job.to_summary_dict()

        return None

    def get_active_jobs(self) -> list[dict[str, Any]]:
        """Get list of currently active jobs.

        Returns:
            List of active job summaries
        """
        return [job.to_summary_dict() for job in self._active_jobs.values()]

    async def health_check(self) -> dict[str, Any]:
        """Enhanced health check including all services.

        Returns:
            Health status dictionary
        """
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {},
            "job_stats": {
                "active_jobs": len(self._active_jobs),
                "jobs_in_history": len(self._job_history),
            }
        }

        # Check external API service
        try:
            await self._ensure_services()
            assert self._external_api_service is not None

            api_health = await self._external_api_service.health_check()
            health_status["services"]["external_apis"] = api_health

            if api_health["overall_status"] != "healthy":
                health_status["status"] = "degraded"

        except Exception as e:
            health_status["services"]["external_apis"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["status"] = "degraded"

        # Add validation service health (always healthy as it's stateless)
        health_status["services"]["validation"] = {
            "status": "healthy",
            "available": True,
        }

        return health_status
