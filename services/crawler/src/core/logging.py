"""Structured logging configuration."""

from __future__ import annotations

import logging
import sys
from typing import Any

import structlog

from src.core.config import settings


def setup_logging() -> None:
    """Configure structured logging for the application."""

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    )

    # Configure structlog processors
    processors = [
        # Add timestamp
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="ISO", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    # Add development-friendly formatting or JSON for production
    if settings.is_development:
        processors.extend(
            [
                structlog.dev.ConsoleRenderer(colors=True),
            ]
        )
    else:
        processors.extend(
            [
                structlog.processors.JSONRenderer(),
            ]
        )

    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Structured logger instance
    """
    return structlog.get_logger(name)


class LoggerMixin:
    """Mixin class to add structured logging to any class."""

    @property
    def logger(self) -> structlog.BoundLogger:
        """Get logger instance for this class."""
        if not hasattr(self, "_logger"):
            class_name = f"{self.__class__.__module__}.{self.__class__.__qualname__}"
            self._logger = structlog.get_logger(class_name)
        return self._logger


def log_function_call(func_name: str, **kwargs: Any) -> dict[str, Any]:
    """Create log context for function calls.

    Args:
        func_name: Name of the function being called
        **kwargs: Function arguments to log

    Returns:
        Logging context dictionary
    """
    context = {
        "function": func_name,
        "args": {k: v for k, v in kwargs.items() if not k.startswith("_")},
    }
    return context


def log_api_request(
    method: str, url: str, status_code: int, response_time: float, **extra: Any
) -> dict[str, Any]:
    """Create log context for API requests.

    Args:
        method: HTTP method
        url: Request URL
        status_code: Response status code
        response_time: Request duration in seconds
        **extra: Additional context

    Returns:
        Logging context dictionary
    """
    context = {
        "api_request": {
            "method": method,
            "url": url,
            "status_code": status_code,
            "response_time": response_time,
        }
    }
    context.update(extra)
    return context


def log_enrichment_request(
    isbn: str,
    source: str,
    success: bool,
    quality_score: float = None,
    error: str = None,
    **extra: Any,
) -> dict[str, Any]:
    """Create log context for book enrichment requests.

    Args:
        isbn: Book ISBN
        source: Data source name
        success: Whether enrichment succeeded
        quality_score: Data quality score if available
        error: Error message if failed
        **extra: Additional context

    Returns:
        Logging context dictionary
    """
    context = {
        "enrichment": {
            "isbn": isbn,
            "source": source,
            "success": success,
        }
    }

    if quality_score is not None:
        context["enrichment"]["quality_score"] = quality_score

    if error:
        context["enrichment"]["error"] = error

    context.update(extra)
    return context
