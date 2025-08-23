"""API request models for book enrichment."""

from __future__ import annotations

from pydantic import BaseModel, Field, validator

from src.utils.isbn_utils import is_valid_isbn


class EnrichmentRequest(BaseModel):
    """Request model for single book enrichment."""

    isbn: str = Field(
        ..., min_length=10, max_length=17, description="Book ISBN identifier"
    )
    force_refresh: bool = Field(False, description="Skip cache and fetch fresh data")
    min_quality_score: float | None = Field(
        None, ge=0.0, le=1.0, description="Minimum quality score threshold (0.0-1.0)"
    )

    @validator("isbn")
    def validate_isbn_format(cls, v: str) -> str:
        """Validate ISBN format."""
        if not v:
            raise ValueError("ISBN is required")

        # Remove common formatting
        clean_isbn = v.replace("-", "").replace(" ", "").upper()

        if not is_valid_isbn(clean_isbn):
            raise ValueError(f"Invalid ISBN format: {v}")

        return clean_isbn

    class Config:
        """Pydantic configuration."""

        schema_extra = {
            "example": {
                "isbn": "9780134685991",
                "force_refresh": False,
                "min_quality_score": 0.7,
            }
        }


class BatchEnrichmentRequest(BaseModel):
    """Request model for batch book enrichment."""

    isbns: list[str] = Field(
        ..., min_items=1, max_items=50, description="List of book ISBN identifiers"
    )
    force_refresh: bool = Field(False, description="Skip cache and fetch fresh data")
    min_quality_score: float | None = Field(
        None, ge=0.0, le=1.0, description="Minimum quality score threshold (0.0-1.0)"
    )

    @validator("isbns")
    def validate_isbn_list(cls, v: list[str]) -> list[str]:
        """Validate all ISBNs in the list."""
        if not v:
            raise ValueError("At least one ISBN is required")

        validated_isbns = []
        for isbn in v:
            if not isbn:
                raise ValueError("Empty ISBN in list")

            # Clean and validate
            clean_isbn = isbn.replace("-", "").replace(" ", "").upper()

            if not is_valid_isbn(clean_isbn):
                raise ValueError(f"Invalid ISBN format: {isbn}")

            validated_isbns.append(clean_isbn)

        # Check for duplicates
        if len(set(validated_isbns)) != len(validated_isbns):
            raise ValueError("Duplicate ISBNs in request")

        return validated_isbns

    class Config:
        """Pydantic configuration."""

        schema_extra = {
            "example": {
                "isbns": ["9780134685991", "9780596517748"],
                "force_refresh": False,
                "min_quality_score": 0.7,
            }
        }
