from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class EnrichmentStatus(str, Enum):
    """Enrichment job status enumeration."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


class ErrorCategory(str, Enum):
    """Error category enumeration for classification."""

    VALIDATION_ERROR = "validation_error"
    API_ERROR = "api_error"
    TIMEOUT_ERROR = "timeout_error"
    QUALITY_ERROR = "quality_error"
    CONCURRENCY_ERROR = "concurrency_error"
    UNKNOWN_ERROR = "unknown_error"


@dataclass
class ErrorDetails:
    """Detailed error information."""

    category: ErrorCategory
    message: str
    api_source: str | None = None
    field_name: str | None = None
    error_code: str | None = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        result = asdict(self)
        result["timestamp"] = self.timestamp.isoformat()
        return result


@dataclass
class ProcessingMetrics:
    """Metrics for enrichment processing."""

    started_at: datetime
    completed_at: datetime | None = None
    processing_time_seconds: float | None = None
    api_calls_made: int = 0
    cache_hits: int = 0
    sources_used: list[str] = None
    retry_attempts: int = 0

    def __post_init__(self):
        if self.sources_used is None:
            self.sources_used = []

    def mark_completed(self) -> None:
        """Mark processing as completed and calculate duration."""
        self.completed_at = datetime.utcnow()
        if self.started_at:
            self.processing_time_seconds = (
                self.completed_at - self.started_at
            ).total_seconds()

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        result = asdict(self)
        result["started_at"] = self.started_at.isoformat()
        if self.completed_at:
            result["completed_at"] = self.completed_at.isoformat()
        return result


class EnrichmentJob(BaseModel):
    """Model for tracking enrichment job state and progress."""

    # Job identification
    job_id: str = Field(..., description="Unique job identifier")
    correlation_id: str = Field(..., description="Correlation ID for tracking")
    isbn: str = Field(..., description="Book ISBN being enriched")

    # Job status and timing
    status: EnrichmentStatus = Field(default=EnrichmentStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Processing configuration
    force_refresh: bool = Field(default=False, description="Whether to skip cache")
    min_quality_score: float | None = Field(
        None, description="Minimum quality threshold"
    )
    timeout_seconds: int | None = Field(None, description="Job timeout")

    # Results and quality
    quality_score: float | None = Field(None, description="Data quality score")
    completeness_score: float | None = Field(
        None, description="Data completeness score"
    )

    # Error tracking
    error_message: str | None = Field(None, description="Primary error message")
    error_details: dict[str, Any] | None = Field(
        None, description="Detailed error information"
    )
    error_category: ErrorCategory | None = Field(
        None, description="Error classification"
    )

    # Processing metrics
    processing_metrics: dict[str, Any] | None = Field(
        None, description="Processing performance metrics"
    )

    # Data quality flags
    has_warnings: bool = Field(
        default=False, description="Whether quality warnings exist"
    )
    requires_review: bool = Field(
        default=False, description="Whether manual review is required"
    )
    suspicious_data_flags: list[str] = Field(
        default_factory=list, description="List of data quality concerns"
    )

    class Config:
        """Pydantic configuration."""

        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ErrorCategory: lambda v: v.value,
            EnrichmentStatus: lambda v: v.value,
        }

    def update_status(self, status: EnrichmentStatus) -> None:
        """Update job status and timestamp.

        Args:
            status: New status to set
        """
        self.status = status
        self.updated_at = datetime.utcnow()

    def set_error(
        self,
        error: str,
        category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR,
        details: ErrorDetails | None = None,
    ) -> None:
        """Set error information and update status.

        Args:
            error: Error message
            category: Error category
            details: Detailed error information
        """
        self.error_message = error
        self.error_category = category
        self.status = EnrichmentStatus.FAILED
        self.updated_at = datetime.utcnow()

        if details:
            self.error_details = details.to_dict()

    def set_quality_scores(
        self, quality_score: float, completeness_score: float | None = None
    ) -> None:
        """Set quality assessment scores.

        Args:
            quality_score: Overall quality score
            completeness_score: Data completeness score
        """
        self.quality_score = quality_score
        if completeness_score is not None:
            self.completeness_score = completeness_score
        self.updated_at = datetime.utcnow()

    def add_quality_warnings(self, warnings: list[str]) -> None:
        """Add quality warning flags.

        Args:
            warnings: List of quality warning messages
        """
        if warnings:
            self.has_warnings = True
            self.suspicious_data_flags.extend(warnings)
            self.updated_at = datetime.utcnow()

    def mark_for_review(self, reason: str = None) -> None:
        """Mark job as requiring manual review.

        Args:
            reason: Reason for requiring review
        """
        self.requires_review = True
        if reason:
            self.suspicious_data_flags.append(f"Review required: {reason}")
        self.updated_at = datetime.utcnow()

    def set_processing_metrics(self, metrics: ProcessingMetrics) -> None:
        """Set processing performance metrics.

        Args:
            metrics: Processing metrics to store
        """
        self.processing_metrics = metrics.to_dict()
        self.updated_at = datetime.utcnow()

    def is_completed(self) -> bool:
        """Check if job has completed (successfully or with errors).

        Returns:
            True if job is in a terminal state
        """
        return self.status in [
            EnrichmentStatus.SUCCESS,
            EnrichmentStatus.FAILED,
            EnrichmentStatus.PARTIAL,
        ]

    def is_successful(self) -> bool:
        """Check if job completed successfully.

        Returns:
            True if job status is SUCCESS
        """
        return self.status == EnrichmentStatus.SUCCESS

    def get_duration(self) -> float | None:
        """Get job processing duration if available.

        Returns:
            Duration in seconds or None if not available
        """
        if self.processing_metrics:
            return self.processing_metrics.get("processing_time_seconds")
        return None

    def to_summary_dict(self) -> dict[str, Any]:
        """Convert to summary dictionary for API responses.

        Returns:
            Dictionary with key job information
        """
        return {
            "job_id": self.job_id,
            "correlation_id": self.correlation_id,
            "isbn": self.isbn,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "quality_score": self.quality_score,
            "has_warnings": self.has_warnings,
            "requires_review": self.requires_review,
            "error_message": self.error_message,
            "processing_time": self.get_duration(),
        }

    @classmethod
    def create_job(
        cls, job_id: str, isbn: str, correlation_id: str | None = None, **kwargs
    ) -> EnrichmentJob:
        """Create a new enrichment job.

        Args:
            job_id: Unique job identifier
            isbn: Book ISBN to enrich
            correlation_id: Optional correlation ID
            **kwargs: Additional job parameters

        Returns:
            New EnrichmentJob instance
        """
        import uuid

        if correlation_id is None:
            correlation_id = str(uuid.uuid4())

        return cls(job_id=job_id, correlation_id=correlation_id, isbn=isbn, **kwargs)


class BatchEnrichmentJob(BaseModel):
    """Model for tracking batch enrichment operations."""

    # Batch identification
    batch_id: str = Field(..., description="Unique batch identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Batch configuration
    total_books: int = Field(..., description="Total number of books in batch")
    force_refresh: bool = Field(default=False)
    min_quality_score: float | None = Field(None)

    # Progress tracking
    completed_jobs: int = Field(default=0)
    successful_jobs: int = Field(default=0)
    failed_jobs: int = Field(default=0)
    partial_jobs: int = Field(default=0)

    # Batch status
    status: str = Field(default="processing")  # processing, completed, failed
    started_at: datetime | None = Field(None)
    completed_at: datetime | None = Field(None)

    # Individual job tracking
    job_ids: list[str] = Field(
        default_factory=list, description="List of individual job IDs"
    )

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}

    def start_processing(self) -> None:
        """Mark batch as started."""
        self.started_at = datetime.utcnow()
        self.status = "processing"
        self.updated_at = datetime.utcnow()

    def update_progress(
        self, completed: int = 0, successful: int = 0, failed: int = 0, partial: int = 0
    ) -> None:
        """Update batch progress counters.

        Args:
            completed: Increment completed jobs counter
            successful: Increment successful jobs counter
            failed: Increment failed jobs counter
            partial: Increment partial jobs counter
        """
        self.completed_jobs += completed
        self.successful_jobs += successful
        self.failed_jobs += failed
        self.partial_jobs += partial
        self.updated_at = datetime.utcnow()

        # Check if batch is complete
        if self.completed_jobs >= self.total_books:
            self.complete_batch()

    def complete_batch(self) -> None:
        """Mark batch as completed."""
        self.completed_at = datetime.utcnow()
        self.status = "completed"
        self.updated_at = datetime.utcnow()

    def get_success_rate(self) -> float:
        """Calculate batch success rate.

        Returns:
            Success rate as percentage (0.0 to 100.0)
        """
        if self.completed_jobs == 0:
            return 0.0
        return (self.successful_jobs / self.completed_jobs) * 100.0

    def get_progress_percentage(self) -> float:
        """Calculate batch progress percentage.

        Returns:
            Progress as percentage (0.0 to 100.0)
        """
        if self.total_books == 0:
            return 100.0
        return (self.completed_jobs / self.total_books) * 100.0

    def to_summary_dict(self) -> dict[str, Any]:
        """Convert to summary dictionary for API responses.

        Returns:
            Dictionary with batch status information
        """
        return {
            "batch_id": self.batch_id,
            "status": self.status,
            "total_books": self.total_books,
            "completed_jobs": self.completed_jobs,
            "successful_jobs": self.successful_jobs,
            "failed_jobs": self.failed_jobs,
            "partial_jobs": self.partial_jobs,
            "success_rate": self.get_success_rate(),
            "progress_percentage": self.get_progress_percentage(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat()
            if self.completed_at
            else None,
        }
