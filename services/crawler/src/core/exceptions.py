"""Custom exception hierarchy for the book crawler service."""

from __future__ import annotations

from typing import Any


class CrawlerServiceError(Exception):
    """Base exception for all crawler service errors."""

    def __init__(self, message: str, error_code: str | None = None, **context: Any) -> None:
        """Initialize crawler service error.

        Args:
            message: Error message
            error_code: Optional error code for categorization
            **context: Additional context information
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.context = context

    def to_dict(self) -> dict[str, Any]:
        """Convert error to dictionary representation."""
        result = {
            "error_type": self.__class__.__name__,
            "message": self.message,
        }

        if self.error_code:
            result["error_code"] = self.error_code

        if self.context:
            result["context"] = self.context

        return result


class ValidationError(CrawlerServiceError):
    """Error in data validation."""

    def __init__(
        self,
        message: str,
        field: str | None = None,
        value: Any | None = None,
        **context: Any
    ) -> None:
        """Initialize validation error.

        Args:
            message: Error message
            field: Field name that failed validation
            value: Invalid value
            **context: Additional context
        """
        super().__init__(message, error_code="VALIDATION_ERROR", **context)
        self.field = field
        self.value = value

    def to_dict(self) -> dict[str, Any]:
        """Convert validation error to dictionary."""
        result = super().to_dict()

        if self.field:
            result["field"] = self.field

        if self.value is not None:
            result["value"] = str(self.value)

        return result


class ExternalAPIError(CrawlerServiceError):
    """Error communicating with external APIs."""

    def __init__(
        self,
        message: str,
        api_name: str | None = None,
        status_code: int | None = None,
        response_data: str | None = None,
        **context: Any
    ) -> None:
        """Initialize external API error.

        Args:
            message: Error message
            api_name: Name of the external API
            status_code: HTTP status code if applicable
            response_data: Response data if available
            **context: Additional context
        """
        super().__init__(message, error_code="EXTERNAL_API_ERROR", **context)
        self.api_name = api_name
        self.status_code = status_code
        self.response_data = response_data

    def to_dict(self) -> dict[str, Any]:
        """Convert API error to dictionary."""
        result = super().to_dict()

        if self.api_name:
            result["api_name"] = self.api_name

        if self.status_code:
            result["status_code"] = self.status_code

        if self.response_data:
            result["response_data"] = self.response_data[:500]  # Truncate long responses

        return result


class OpenLibraryError(ExternalAPIError):
    """Specific error for OpenLibrary API issues."""

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response_data: str | None = None,
        **context: Any
    ) -> None:
        """Initialize OpenLibrary error."""
        super().__init__(
            message,
            api_name="OpenLibrary",
            status_code=status_code,
            response_data=response_data,
            **context
        )


class RateLimitError(ExternalAPIError):
    """Error when API rate limits are exceeded."""

    def __init__(
        self,
        message: str,
        api_name: str | None = None,
        retry_after: int | None = None,
        **context: Any
    ) -> None:
        """Initialize rate limit error.

        Args:
            message: Error message
            api_name: Name of the rate-limited API
            retry_after: Seconds to wait before retrying
            **context: Additional context
        """
        super().__init__(
            message,
            api_name=api_name,
            status_code=429,
            error_code="RATE_LIMIT_ERROR",
            **context
        )
        self.retry_after = retry_after

    def to_dict(self) -> dict[str, Any]:
        """Convert rate limit error to dictionary."""
        result = super().to_dict()

        if self.retry_after:
            result["retry_after"] = self.retry_after

        return result


class EnrichmentError(CrawlerServiceError):
    """Error during book enrichment process."""

    def __init__(
        self,
        message: str,
        isbn: str | None = None,
        source: str | None = None,
        stage: str | None = None,
        **context: Any
    ) -> None:
        """Initialize enrichment error.

        Args:
            message: Error message
            isbn: Book ISBN being processed
            source: Data source name
            stage: Stage of enrichment where error occurred
            **context: Additional context
        """
        super().__init__(message, error_code="ENRICHMENT_ERROR", **context)
        self.isbn = isbn
        self.source = source
        self.stage = stage

    def to_dict(self) -> dict[str, Any]:
        """Convert enrichment error to dictionary."""
        result = super().to_dict()

        if self.isbn:
            result["isbn"] = self.isbn

        if self.source:
            result["source"] = self.source

        if self.stage:
            result["stage"] = self.stage

        return result


class DataQualityError(EnrichmentError):
    """Error when enriched data quality is below threshold."""

    def __init__(
        self,
        message: str,
        quality_score: float,
        min_score: float,
        missing_fields: list[str] | None = None,
        **context: Any
    ) -> None:
        """Initialize data quality error.

        Args:
            message: Error message
            quality_score: Actual quality score
            min_score: Minimum required score
            missing_fields: List of missing important fields
            **context: Additional context
        """
        super().__init__(
            message,
            error_code="DATA_QUALITY_ERROR",
            stage="quality_validation",
            **context
        )
        self.quality_score = quality_score
        self.min_score = min_score
        self.missing_fields = missing_fields or []

    def to_dict(self) -> dict[str, Any]:
        """Convert data quality error to dictionary."""
        result = super().to_dict()
        result.update({
            "quality_score": self.quality_score,
            "min_score": self.min_score,
            "missing_fields": self.missing_fields
        })
        return result


class ConfigurationError(CrawlerServiceError):
    """Error in application configuration."""

    def __init__(
        self,
        message: str,
        config_key: str | None = None,
        **context: Any
    ) -> None:
        """Initialize configuration error.

        Args:
            message: Error message
            config_key: Configuration key that caused the error
            **context: Additional context
        """
        super().__init__(message, error_code="CONFIGURATION_ERROR", **context)
        self.config_key = config_key

    def to_dict(self) -> dict[str, Any]:
        """Convert configuration error to dictionary."""
        result = super().to_dict()

        if self.config_key:
            result["config_key"] = self.config_key

        return result


class DatabaseError(CrawlerServiceError):
    """Error in database operations."""

    def __init__(
        self,
        message: str,
        operation: str | None = None,
        table: str | None = None,
        **context: Any
    ) -> None:
        """Initialize database error.

        Args:
            message: Error message
            operation: Database operation that failed
            table: Database table involved
            **context: Additional context
        """
        super().__init__(message, error_code="DATABASE_ERROR", **context)
        self.operation = operation
        self.table = table

    def to_dict(self) -> dict[str, Any]:
        """Convert database error to dictionary."""
        result = super().to_dict()

        if self.operation:
            result["operation"] = self.operation

        if self.table:
            result["table"] = self.table

        return result


class ConcurrencyError(CrawlerServiceError):
    """Error related to concurrent request processing."""

    def __init__(
        self,
        message: str,
        current_requests: int | None = None,
        max_requests: int | None = None,
        **context: Any
    ) -> None:
        """Initialize concurrency error.

        Args:
            message: Error message
            current_requests: Current number of requests
            max_requests: Maximum allowed requests
            **context: Additional context
        """
        super().__init__(message, error_code="CONCURRENCY_ERROR", **context)
        self.current_requests = current_requests
        self.max_requests = max_requests

    def to_dict(self) -> dict[str, Any]:
        """Convert concurrency error to dictionary."""
        result = super().to_dict()

        if self.current_requests is not None:
            result["current_requests"] = self.current_requests

        if self.max_requests is not None:
            result["max_requests"] = self.max_requests

        return result
