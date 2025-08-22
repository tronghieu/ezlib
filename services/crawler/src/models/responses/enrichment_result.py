"""API response models for book enrichment."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from src.models.database.book_metadata import BookMetadata


class EnrichmentResponse(BaseModel):
    """Response model for single book enrichment."""

    isbn: str = Field(..., description="Book ISBN identifier")
    status: str = Field(..., description="Enrichment status")
    correlation_id: str = Field(..., description="Unique tracking identifier")
    timestamp: datetime = Field(..., description="Processing timestamp")
    metadata: BookMetadata | None = Field(None, description="Enriched book metadata")
    error: str | None = Field(None, description="Error message if failed")
    quality_score: float | None = Field(None, description="Data quality score (0.0-1.0)")
    sources_used: list[str] = Field(default_factory=list, description="Data sources used")
    processing_time: float | None = Field(None, description="Processing time in seconds")

    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "isbn": "9780134685991",
                "status": "success",
                "correlation_id": "12345678-1234-1234-1234-123456789012",
                "timestamp": "2023-01-01T12:00:00Z",
                "metadata": {
                    "isbn_13": "9780134685991",
                    "title": "Effective Java",
                    "authors": ["Joshua Bloch"],
                    "publication_year": 2017,
                    "publisher": "Addison-Wesley",
                    "quality_score": 0.85
                },
                "quality_score": 0.85,
                "sources_used": ["openlibrary"],
                "processing_time": 2.5
            }
        }


class BatchEnrichmentResponse(BaseModel):
    """Response model for batch book enrichment."""

    total_books: int = Field(..., description="Total number of books processed")
    successful: int = Field(..., description="Number of successful enrichments")
    failed: int = Field(..., description="Number of failed enrichments")
    partial: int = Field(..., description="Number of partial enrichments")
    results: list[EnrichmentResponse] = Field(..., description="Individual enrichment results")
    processing_time: float | None = Field(None, description="Total processing time in seconds")

    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "total_books": 2,
                "successful": 1,
                "failed": 1,
                "partial": 0,
                "processing_time": 5.2,
                "results": [
                    {
                        "isbn": "9780134685991",
                        "status": "success",
                        "correlation_id": "12345678-1234-1234-1234-123456789012",
                        "timestamp": "2023-01-01T12:00:00Z",
                        "quality_score": 0.85,
                        "sources_used": ["openlibrary"],
                        "processing_time": 2.5
                    }
                ]
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error_type: str = Field(..., description="Error type identifier")
    message: str = Field(..., description="Human-readable error message")
    error_code: str | None = Field(None, description="Machine-readable error code")
    field: str | None = Field(None, description="Field that caused validation error")
    value: str | None = Field(None, description="Invalid value")
    context: dict[str, Any] | None = Field(None, description="Additional error context")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "error_type": "ValidationError",
                "message": "Invalid ISBN format",
                "error_code": "VALIDATION_ERROR",
                "field": "isbn",
                "value": "invalid-isbn",
                "timestamp": "2023-01-01T12:00:00Z"
            }
        }


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str = Field(..., description="Overall health status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    services: dict[str, dict[str, Any]] = Field(
        default_factory=dict,
        description="Status of individual services"
    )

    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2023-01-01T12:00:00Z",
                "services": {
                    "openlibrary": {
                        "status": "healthy",
                        "available": True
                    }
                }
            }
        }
