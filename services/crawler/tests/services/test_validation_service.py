"""Tests for validation service."""

from __future__ import annotations

import pytest
from datetime import date, datetime

from src.services.validation_service import ValidationService
from src.core.exceptions import ValidationError, DataQualityError
from src.models.database.book_metadata import BookMetadata


class TestValidationService:
    """Test suite for ValidationService."""

    @pytest.fixture
    def validation_service(self):
        """Create validation service for testing."""
        return ValidationService()

    @pytest.fixture
    def sample_metadata(self):
        """Sample book metadata for testing."""
        return BookMetadata(
            isbn_13="9780321125217",
            title="Design Patterns: Elements of Reusable Object-Oriented Software",
            authors=["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"],
            publication_date=date(1994, 10, 31),
            publisher="Addison-Wesley Professional",
            page_count=395,
            language="en",
            description="A classic book on software design patterns.",
        )

    # ISBN Validation Tests
    def test_validate_isbn_valid_isbn13(self, validation_service):
        """Test ISBN-13 validation with valid input."""
        isbn = "978-0-321-12521-7"
        result = validation_service.validate_isbn(isbn)
        assert result == "9780321125217"

    def test_validate_isbn_valid_isbn10(self, validation_service):
        """Test ISBN-10 validation and conversion."""
        isbn = "0-321-12521-5"
        result = validation_service.validate_isbn(isbn)
        assert result == "9780321125217"

    def test_validate_isbn_invalid_format(self, validation_service):
        """Test ISBN validation with invalid format."""
        with pytest.raises(ValidationError) as exc_info:
            validation_service.validate_isbn("123456789")
        
        assert exc_info.value.field == "isbn"
        assert "Invalid ISBN format" in str(exc_info.value)

    def test_validate_isbn_empty_string(self, validation_service):
        """Test ISBN validation with empty string."""
        with pytest.raises(ValidationError) as exc_info:
            validation_service.validate_isbn("")
        
        assert "must be a non-empty string" in str(exc_info.value)

    def test_validate_isbn_none(self, validation_service):
        """Test ISBN validation with None."""
        with pytest.raises(ValidationError) as exc_info:
            validation_service.validate_isbn(None)
        
        assert "must be a non-empty string" in str(exc_info.value)

    # Text Sanitization Tests
    def test_sanitize_text_html_removal(self, validation_service):
        """Test HTML tag removal from text."""
        text = "<p>This is a <b>bold</b> statement.</p>"
        result = validation_service.sanitize_text(text)
        assert result == "This is a bold statement."

    def test_sanitize_text_html_entities(self, validation_service):
        """Test HTML entity decoding."""
        text = "AT&amp;T &gt; Verizon &lt; Sprint"
        result = validation_service.sanitize_text(text)
        assert result == "AT&T > Verizon < Sprint"

    def test_sanitize_text_whitespace_normalization(self, validation_service):
        """Test whitespace normalization."""
        text = "This   has    multiple\t\tspaces\n\nand newlines"
        result = validation_service.sanitize_text(text)
        assert result == "This has multiple spaces and newlines"

    def test_sanitize_text_length_limit(self, validation_service):
        """Test text length limiting."""
        text = "A" * 1000 + " extra words here"
        result = validation_service.sanitize_text(text, max_length=100)
        assert len(result) <= 103  # Account for ellipsis
        assert result.endswith("...")

    def test_sanitize_text_empty_input(self, validation_service):
        """Test text sanitization with empty input."""
        assert validation_service.sanitize_text("") is None
        assert validation_service.sanitize_text(None) is None
        assert validation_service.sanitize_text("   ") is None

    def test_sanitize_text_suspicious_characters(self, validation_service):
        """Test detection of suspicious characters."""
        text = "This text has weird characters: ♠♣♥♦"
        result = validation_service.sanitize_text(text)
        # Should still return the text but log a warning
        assert "weird characters" in result

    # Date Validation Tests
    def test_validate_publication_date_valid_date(self, validation_service):
        """Test publication date validation with valid date object."""
        test_date = date(2020, 5, 15)
        result = validation_service.validate_publication_date(test_date)
        assert result == test_date

    def test_validate_publication_date_datetime_input(self, validation_service):
        """Test publication date validation with datetime input."""
        test_datetime = datetime(2020, 5, 15, 14, 30, 0)
        result = validation_service.validate_publication_date(test_datetime)
        assert result == date(2020, 5, 15)

    def test_validate_publication_date_string_input(self, validation_service):
        """Test publication date validation with string input."""
        result = validation_service.validate_publication_date("Published in 2020")
        assert result == date(2020, 1, 1)

    def test_validate_publication_date_too_early(self, validation_service):
        """Test publication date validation with date too early."""
        with pytest.raises(ValidationError) as exc_info:
            validation_service.validate_publication_date(date(1400, 1, 1))
        
        assert "too early" in str(exc_info.value)
        assert exc_info.value.field == "publication_date"

    def test_validate_publication_date_future_date(self, validation_service):
        """Test publication date validation with future date."""
        future_year = datetime.now().year + 10
        with pytest.raises(ValidationError) as exc_info:
            validation_service.validate_publication_date(date(future_year, 1, 1))
        
        assert "too far in future" in str(exc_info.value)

    def test_validate_publication_date_none(self, validation_service):
        """Test publication date validation with None."""
        result = validation_service.validate_publication_date(None)
        assert result is None

    def test_validate_publication_date_unparseable_string(self, validation_service):
        """Test publication date validation with unparseable string."""
        result = validation_service.validate_publication_date("not a date")
        assert result is None

    # Publisher Name Validation Tests
    def test_validate_publisher_name_valid(self, validation_service):
        """Test publisher name validation with valid input."""
        result = validation_service.validate_publisher_name("Penguin Random House")
        assert result == "Penguin Random House"

    def test_validate_publisher_name_invalid_patterns(self, validation_service):
        """Test publisher name validation with invalid patterns."""
        invalid_names = ["unknown", "n/a", "not available", "self.published", "123456"]
        
        for name in invalid_names:
            result = validation_service.validate_publisher_name(name)
            assert result is None

    def test_validate_publisher_name_empty(self, validation_service):
        """Test publisher name validation with empty input."""
        assert validation_service.validate_publisher_name("") is None
        assert validation_service.validate_publisher_name(None) is None

    # Author Name Normalization Tests
    def test_normalize_author_names_valid(self, validation_service):
        """Test author name normalization with valid input."""
        authors = ["John Smith", "Jane Doe", "Bob Johnson"]
        result = validation_service.normalize_author_names(authors)
        assert result == authors

    def test_normalize_author_names_lastname_first_format(self, validation_service):
        """Test author name normalization with 'Last, First' format."""
        authors = ["Smith, John", "Doe, Jane"]
        result = validation_service.normalize_author_names(authors)
        assert result == ["John Smith", "Jane Doe"]

    def test_normalize_author_names_deduplication(self, validation_service):
        """Test author name deduplication."""
        authors = ["John Smith", "JOHN SMITH", "john smith", "Jane Doe"]
        result = validation_service.normalize_author_names(authors)
        assert len(result) == 2
        assert "John Smith" in result
        assert "Jane Doe" in result

    def test_normalize_author_names_empty_input(self, validation_service):
        """Test author name normalization with empty input."""
        assert validation_service.normalize_author_names([]) == []
        assert validation_service.normalize_author_names(None) == []

    def test_normalize_author_names_filter_empty(self, validation_service):
        """Test author name normalization filters empty names."""
        authors = ["John Smith", "", "   ", "Jane Doe", None]
        result = validation_service.normalize_author_names(authors)
        assert result == ["John Smith", "Jane Doe"]

    # Completeness Score Tests
    def test_calculate_completeness_score_full_metadata(self, validation_service, sample_metadata):
        """Test completeness score calculation with full metadata."""
        score = validation_service.calculate_completeness_score(sample_metadata)
        assert score == 100.0

    def test_calculate_completeness_score_minimal_metadata(self, validation_service):
        """Test completeness score with minimal metadata."""
        metadata = BookMetadata(
            isbn_13="9780321125217",
            title="Test Book"
        )
        score = validation_service.calculate_completeness_score(metadata)
        # Should have title (25) + isbn (implicit, but no separate weight)
        assert score == 25.0

    def test_calculate_completeness_score_empty_metadata(self, validation_service):
        """Test completeness score with empty metadata."""
        metadata = BookMetadata(isbn_13="9780321125217")
        score = validation_service.calculate_completeness_score(metadata)
        assert score == 0.0

    def test_calculate_completeness_score_partial_authors(self, validation_service):
        """Test completeness score with empty authors list."""
        metadata = BookMetadata(
            isbn_13="9780321125217",
            title="Test Book",
            authors=[]
        )
        score = validation_service.calculate_completeness_score(metadata)
        assert score == 25.0  # Only title weight

    # Suspicious Data Detection Tests
    def test_detect_suspicious_data_clean_metadata(self, validation_service, sample_metadata):
        """Test suspicious data detection with clean metadata."""
        warnings = validation_service.detect_suspicious_data(sample_metadata)
        assert warnings == []

    def test_detect_suspicious_data_short_title(self, validation_service):
        """Test detection of suspiciously short title."""
        metadata = BookMetadata(isbn_13="9780321125217", title="X")
        warnings = validation_service.detect_suspicious_data(metadata)
        assert any("too short" in w for w in warnings)

    def test_detect_suspicious_data_long_title(self, validation_service):
        """Test detection of suspiciously long title."""
        metadata = BookMetadata(isbn_13="9780321125217", title="X" * 600)
        warnings = validation_service.detect_suspicious_data(metadata)
        assert any("unusually long" in w for w in warnings)

    def test_detect_suspicious_data_placeholder_title(self, validation_service):
        """Test detection of placeholder title."""
        metadata = BookMetadata(isbn_13="9780321125217", title="Unknown")
        warnings = validation_service.detect_suspicious_data(metadata)
        assert any("placeholder text" in w for w in warnings)

    def test_detect_suspicious_data_many_authors(self, validation_service):
        """Test detection of unusually many authors."""
        metadata = BookMetadata(
            isbn_13="9780321125217", 
            title="Test Book",
            authors=[f"Author {i}" for i in range(15)]
        )
        warnings = validation_service.detect_suspicious_data(metadata)
        assert any("high number of authors" in w for w in warnings)

    def test_detect_suspicious_data_future_date(self, validation_service):
        """Test detection of future publication date."""
        future_year = datetime.now().year + 5
        metadata = BookMetadata(
            isbn_13="9780321125217",
            title="Test Book",
            publication_date=date(future_year, 1, 1)
        )
        warnings = validation_service.detect_suspicious_data(metadata)
        assert any("in the future" in w for w in warnings)

    def test_detect_suspicious_data_high_page_count(self, validation_service):
        """Test detection of unusually high page count."""
        metadata = BookMetadata(
            isbn_13="9780321125217",
            title="Test Book",
            page_count=15000
        )
        warnings = validation_service.detect_suspicious_data(metadata)
        assert any("unusually high" in w for w in warnings)

    # Comprehensive Quality Validation Tests
    def test_validate_metadata_quality_high_quality(self, validation_service, sample_metadata):
        """Test comprehensive quality validation with high-quality metadata."""
        report = validation_service.validate_metadata_quality(sample_metadata)
        
        assert report["completeness_score"] == 100.0
        assert report["quality_status"] == "acceptable"
        assert report["meets_threshold"] is True
        assert report["warnings"] == []
        assert report["suspicion_level"] == 0

    def test_validate_metadata_quality_below_threshold(self, validation_service):
        """Test quality validation with data below threshold."""
        metadata = BookMetadata(isbn_13="9780321125217", title="Test")
        report = validation_service.validate_metadata_quality(metadata, min_completeness=50.0)
        
        assert report["completeness_score"] == 25.0
        assert report["quality_status"] == "below_threshold"
        assert report["meets_threshold"] is False

    def test_validate_metadata_quality_suspicious(self, validation_service):
        """Test quality validation with suspicious data."""
        metadata = BookMetadata(
            isbn_13="9780321125217",
            title="X",  # Too short
            authors=["Unknown"],  # Placeholder
            page_count=-5  # Invalid
        )
        report = validation_service.validate_metadata_quality(metadata)
        
        assert report["quality_status"] == "suspicious"
        assert len(report["warnings"]) > 0
        assert report["suspicion_level"] > 0

    @pytest.mark.asyncio
    async def test_validation_service_performance(self, validation_service, sample_metadata):
        """Test validation service performance with multiple operations."""
        import time
        
        start_time = time.time()
        
        # Run multiple validation operations
        for _ in range(100):
            validation_service.validate_isbn("978-0-321-12521-7")
            validation_service.sanitize_text("Sample text with <b>HTML</b>")
            validation_service.calculate_completeness_score(sample_metadata)
            validation_service.detect_suspicious_data(sample_metadata)
        
        end_time = time.time()
        
        # Should complete quickly (under 1 second for 100 iterations)
        assert end_time - start_time < 1.0