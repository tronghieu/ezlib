from __future__ import annotations

import html
import re
import unicodedata
from datetime import date, datetime
from typing import Any

import structlog

from src.core.config import settings
from src.core.exceptions import ValidationError
from src.models.database.book_metadata import BookMetadata
from src.utils.isbn_utils import is_valid_isbn, normalize_isbn

logger = structlog.get_logger(__name__)


class ValidationService:
    """Service for data quality assessment and validation."""

    def __init__(self) -> None:
        """Initialize validation service."""
        # Precompile regex patterns for better performance
        self._html_tag_pattern = re.compile(r"<[^>]+>")
        self._whitespace_pattern = re.compile(r"\s+")
        self._suspicious_text_pattern = re.compile(
            r"[^\w\s\-\.\'\"\,\!\?\:\;\(\)\/\&]", re.UNICODE
        )
        self._year_pattern = re.compile(r"\b(1[5-9]\d{2}|20[0-2]\d)\b")

    def validate_isbn(self, isbn: str) -> str:
        """Validate and normalize ISBN.

        Args:
            isbn: ISBN string to validate

        Returns:
            Normalized ISBN-13

        Raises:
            ValidationError: If ISBN is invalid
        """
        if not isbn or not isinstance(isbn, str):
            raise ValidationError(
                "ISBN must be a non-empty string", field="isbn", value=isbn
            )

        isbn_clean = isbn.strip().replace("-", "").replace(" ", "")

        if not is_valid_isbn(isbn_clean):
            raise ValidationError(
                f"Invalid ISBN format: {isbn}", field="isbn", value=isbn
            )

        normalized = normalize_isbn(isbn_clean)

        logger.debug(
            "ISBN validation successful", original_isbn=isbn, normalized_isbn=normalized
        )

        return normalized

    def sanitize_text(self, text: str | None, max_length: int = 1000) -> str | None:
        """Sanitize and normalize text input.

        Args:
            text: Text to sanitize
            max_length: Maximum allowed length

        Returns:
            Sanitized text or None if empty
        """
        if not text or not isinstance(text, str):
            return None

        # Remove HTML tags
        sanitized = self._html_tag_pattern.sub("", text)

        # Decode HTML entities
        sanitized = html.unescape(sanitized)

        # Normalize Unicode
        sanitized = unicodedata.normalize("NFKC", sanitized)

        # Normalize whitespace
        sanitized = self._whitespace_pattern.sub(" ", sanitized).strip()

        # Truncate if too long
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length].rsplit(" ", 1)[0] + "..."

        # Check for suspicious characters
        if self._suspicious_text_pattern.search(sanitized):
            logger.warning(
                "Suspicious characters detected in text",
                text=sanitized[:100] + "..." if len(sanitized) > 100 else sanitized,
            )

        return sanitized if sanitized else None

    def validate_publication_date(self, date_input: Any) -> date | None:
        """Validate and normalize publication date.

        Args:
            date_input: Date input (string, date object, or datetime)

        Returns:
            Validated date object or None

        Raises:
            ValidationError: If date is invalid or suspicious
        """
        if not date_input:
            return None

        # Handle different input types
        if isinstance(date_input, date):
            target_date = date_input
        elif isinstance(date_input, datetime):
            target_date = date_input.date()
        elif isinstance(date_input, str):
            # Try to extract year from string
            year_match = self._year_pattern.search(date_input)
            if year_match:
                year = int(year_match.group(1))
                target_date = date(year, 1, 1)  # Default to January 1st
            else:
                logger.warning(f"Could not parse date string: {date_input}")
                return None
        else:
            logger.warning(f"Unsupported date input type: {type(date_input)}")
            return None

        # Validate date range
        current_year = datetime.now().year
        if target_date.year < 1500:
            raise ValidationError(
                f"Publication year {target_date.year} is too early (minimum: 1500)",
                field="publication_date",
                value=date_input,
            )

        if target_date.year > current_year + 2:
            raise ValidationError(
                f"Publication year {target_date.year} is too far in future "
                f"(maximum: {current_year + 2})",
                field="publication_date",
                value=date_input,
            )

        return target_date

    def validate_publisher_name(self, publisher: str | None) -> str | None:
        """Validate and normalize publisher name.

        Args:
            publisher: Publisher name to validate

        Returns:
            Normalized publisher name or None
        """
        if not publisher:
            return None

        # Sanitize the publisher name
        sanitized = self.sanitize_text(publisher, max_length=200)

        if not sanitized:
            return None

        # Check for common invalid patterns
        invalid_patterns = [
            r"^unknown$",
            r"^n/a$",
            r"^not available$",
            r"^self.published$",
            r"^[0-9]+$",  # Just numbers
        ]

        for pattern in invalid_patterns:
            if re.match(pattern, sanitized.lower()):
                logger.debug(f"Invalid publisher pattern detected: {sanitized}")
                return None

        return sanitized

    def normalize_author_names(self, authors: list[str]) -> list[str]:
        """Normalize and deduplicate author names.

        Args:
            authors: List of author names

        Returns:
            Normalized and deduplicated author list
        """
        if not authors:
            return []

        normalized_authors = []
        seen_authors = set()

        for author in authors:
            # Sanitize author name
            clean_author = self.sanitize_text(author, max_length=100)

            if not clean_author:
                continue

            # Normalize name format (Handle "Last, First" format)
            if "," in clean_author and len(clean_author.split(",")) == 2:
                parts = [part.strip() for part in clean_author.split(",")]
                if all(parts):  # Both parts non-empty
                    normalized_name = f"{parts[1]} {parts[0]}"
                else:
                    normalized_name = clean_author
            else:
                normalized_name = clean_author

            # Deduplicate (case-insensitive)
            lower_name = normalized_name.lower()
            if lower_name not in seen_authors:
                seen_authors.add(lower_name)
                normalized_authors.append(normalized_name)

        return normalized_authors

    def calculate_completeness_score(self, metadata: BookMetadata) -> float:
        """Calculate data completeness score for book metadata.

        Args:
            metadata: Book metadata to score

        Returns:
            Completeness score (0.0 to 100.0)
        """
        # Define field weights based on importance
        field_weights = {
            "title": 25.0,
            "authors": 20.0,
            "publication_date": 15.0,
            "publisher": 10.0,
            "description": 10.0,
            "page_count": 8.0,
            "language": 7.0,
            "cover_image_url": 5.0,
        }

        total_weight = 0.0
        achieved_weight = 0.0

        for field, weight in field_weights.items():
            total_weight += weight

            value = getattr(metadata, field, None)
            if value:
                if field == "authors":
                    # Authors list should have at least one entry
                    if isinstance(value, list) and len(value) > 0 and value[0]:
                        achieved_weight += weight
                elif field == "page_count":
                    # Page count should be positive
                    if isinstance(value, int) and value > 0:
                        achieved_weight += weight
                elif isinstance(value, str):
                    # String fields should be non-empty after stripping
                    if value.strip():
                        achieved_weight += weight
                else:
                    # Other types (dates, etc.) are valid if not None
                    achieved_weight += weight

        return (achieved_weight / total_weight * 100.0) if total_weight > 0 else 0.0

    def detect_suspicious_data(self, metadata: BookMetadata) -> list[str]:
        """Detect suspicious or potentially invalid data.

        Args:
            metadata: Book metadata to analyze

        Returns:
            List of suspicious data warnings
        """
        warnings = []

        # Check for suspicious title patterns
        if metadata.title:
            if len(metadata.title) < 2:
                warnings.append("Title is too short")
            elif len(metadata.title) > 500:
                warnings.append("Title is unusually long")
            elif metadata.title.lower() in ["unknown", "n/a", "untitled"]:
                warnings.append("Title appears to be placeholder text")

        # Check for suspicious author data
        if metadata.authors:
            if len(metadata.authors) > 10:
                warnings.append("Unusually high number of authors")

            for author in metadata.authors:
                if len(author) < 2:
                    warnings.append(f"Author name too short: {author}")
                elif author.lower() in ["unknown", "anonymous", "n/a"]:
                    warnings.append(f"Author appears to be placeholder: {author}")

        # Check for suspicious publication date
        if metadata.publication_date:
            current_year = datetime.now().year
            pub_year = metadata.publication_date.year

            if pub_year < 1500:
                warnings.append("Publication date is suspiciously early")
            elif pub_year > current_year + 1:
                warnings.append("Publication date is in the future")

        # Check for suspicious page count
        if metadata.page_count:
            if metadata.page_count < 1:
                warnings.append("Page count is zero or negative")
            elif metadata.page_count > 10000:
                warnings.append("Page count is unusually high")

        # Check for suspicious publisher
        if metadata.publisher:
            if metadata.publisher.lower() in ["unknown", "self-published", "n/a"]:
                warnings.append("Publisher appears to be placeholder text")

        return warnings

    def validate_metadata_quality(
        self, metadata: BookMetadata, min_completeness: float = None
    ) -> dict[str, Any]:
        """Comprehensive metadata quality validation.

        Args:
            metadata: Book metadata to validate
            min_completeness: Minimum completeness threshold

        Returns:
            Quality assessment results

        Raises:
            DataQualityError: If quality is below acceptable threshold
        """
        min_completeness = min_completeness or settings.ENRICHMENT_MIN_QUALITY_SCORE

        # Calculate completeness score
        completeness_score = self.calculate_completeness_score(metadata)

        # Detect suspicious data
        warnings = self.detect_suspicious_data(metadata)

        # Determine overall quality status
        if completeness_score < min_completeness:
            quality_status = "below_threshold"
        elif warnings:
            quality_status = "suspicious"
        else:
            quality_status = "acceptable"

        # Get missing fields
        missing_fields = metadata.get_missing_fields()

        quality_report = {
            "completeness_score": completeness_score,
            "quality_status": quality_status,
            "warnings": warnings,
            "missing_fields": missing_fields,
            "meets_threshold": completeness_score >= min_completeness,
            "suspicion_level": len(warnings),
        }

        logger.info(
            "Metadata quality assessment completed",
            isbn=metadata.isbn_13,
            completeness_score=completeness_score,
            quality_status=quality_status,
            warnings_count=len(warnings),
            missing_fields_count=len(missing_fields),
        )

        return quality_report
