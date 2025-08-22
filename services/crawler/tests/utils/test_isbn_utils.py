"""Tests for ISBN utility functions."""

from __future__ import annotations

import pytest

from src.core.exceptions import ValidationError
from src.utils.isbn_utils import (
    clean_isbn,
    validate_isbn_10,
    validate_isbn_13,
    isbn_10_to_13,
    isbn_13_to_10,
    normalize_isbn,
    is_valid_isbn,
    format_isbn_13,
    format_isbn_10,
    extract_isbn_from_text
)


class TestIsbnUtils:
    """Test suite for ISBN utility functions."""

    def test_clean_isbn(self):
        """Test ISBN cleaning functionality."""
        assert clean_isbn("978-0-13-468599-1") == "9780134685991"
        assert clean_isbn("978 0 13 468599 1") == "9780134685991"
        assert clean_isbn("978-0-13-468599-1") == "9780134685991"
        assert clean_isbn("0-13-468599-7") == "0134685997"
        assert clean_isbn("0-13-468599-X") == "013468599X"
        assert clean_isbn("") == ""
        assert clean_isbn("9780134685991") == "9780134685991"

    def test_validate_isbn_10_valid(self):
        """Test valid ISBN-10 validation."""
        # Standard ISBN-10
        assert validate_isbn_10("0134685997") is True
        assert validate_isbn_10("0596517742") is True
        
        # ISBN-10 with X check digit
        assert validate_isbn_10("080442957X") is True
        
        # With formatting
        assert validate_isbn_10("0-13-468599-7") is True

    def test_validate_isbn_10_invalid(self):
        """Test invalid ISBN-10 validation."""
        assert validate_isbn_10("") is False
        assert validate_isbn_10("123") is False
        assert validate_isbn_10("12345678901") is False  # Too long
        assert validate_isbn_10("013468599A") is False  # Invalid character
        assert validate_isbn_10("0134685996") is False  # Wrong check digit
        assert validate_isbn_10("X134685997") is False  # X in wrong position

    def test_validate_isbn_13_valid(self):
        """Test valid ISBN-13 validation."""
        assert validate_isbn_13("9780134685991") is True
        assert validate_isbn_13("9780596517748") is True
        assert validate_isbn_13("9791220109062") is True  # 979 prefix
        
        # With formatting
        assert validate_isbn_13("978-0-13-468599-1") is True

    def test_validate_isbn_13_invalid(self):
        """Test invalid ISBN-13 validation."""
        assert validate_isbn_13("") is False
        assert validate_isbn_13("123456789") is False  # Too short
        assert validate_isbn_13("12345678901234") is False  # Too long
        assert validate_isbn_13("123456789012A") is False  # Invalid character
        assert validate_isbn_13("9780134685990") is False  # Wrong check digit
        assert validate_isbn_13("9770134685991") is False  # Invalid prefix
        assert validate_isbn_13("1234567890123") is False  # Invalid prefix

    def test_isbn_10_to_13_conversion(self):
        """Test ISBN-10 to ISBN-13 conversion."""
        assert isbn_10_to_13("0134685997") == "9780134685991"
        assert isbn_10_to_13("0596517742") == "9780596517748"
        assert isbn_10_to_13("080442957X") == "9780804429573"
        
        # With formatting
        assert isbn_10_to_13("0-13-468599-7") == "9780134685991"

    def test_isbn_10_to_13_invalid(self):
        """Test ISBN-10 to ISBN-13 conversion with invalid input."""
        with pytest.raises(ValidationError) as exc_info:
            isbn_10_to_13("invalid")
        
        assert "Invalid ISBN-10 format" in str(exc_info.value)

    def test_isbn_13_to_10_conversion(self):
        """Test ISBN-13 to ISBN-10 conversion."""
        assert isbn_13_to_10("9780134685991") == "0134685997"
        assert isbn_13_to_10("9780804429573") == "080442957X"
        
        # With formatting
        assert isbn_13_to_10("978-0-13-468599-1") == "0134685997"

    def test_isbn_13_to_10_979_prefix(self):
        """Test ISBN-13 with 979 prefix cannot be converted."""
        result = isbn_13_to_10("9791220109062")
        assert result is None

    def test_isbn_13_to_10_invalid(self):
        """Test ISBN-13 to ISBN-10 conversion with invalid input."""
        with pytest.raises(ValidationError) as exc_info:
            isbn_13_to_10("invalid")
        
        assert "Invalid ISBN-13 format" in str(exc_info.value)

    def test_normalize_isbn_isbn10(self):
        """Test ISBN normalization for ISBN-10."""
        assert normalize_isbn("0134685997") == "9780134685991"
        assert normalize_isbn("0-13-468599-7") == "9780134685991"
        assert normalize_isbn("080442957X") == "9780804429573"

    def test_normalize_isbn_isbn13(self):
        """Test ISBN normalization for ISBN-13."""
        assert normalize_isbn("9780134685991") == "9780134685991"
        assert normalize_isbn("978-0-13-468599-1") == "9780134685991"
        assert normalize_isbn("9791220109062") == "9791220109062"

    def test_normalize_isbn_invalid(self):
        """Test ISBN normalization with invalid input."""
        with pytest.raises(ValidationError) as exc_info:
            normalize_isbn("")
        
        assert "Empty ISBN" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            normalize_isbn("123")
        
        assert "ISBN must be 10 or 13 digits" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            normalize_isbn("1234567890")  # 10 digits but invalid checksum
        
        assert "Invalid ISBN-10" in str(exc_info.value)

    def test_is_valid_isbn(self):
        """Test ISBN validity checking."""
        # Valid ISBNs
        assert is_valid_isbn("9780134685991") is True
        assert is_valid_isbn("0134685997") is True
        assert is_valid_isbn("978-0-13-468599-1") is True
        assert is_valid_isbn("0-13-468599-7") is True
        assert is_valid_isbn("080442957X") is True
        
        # Invalid ISBNs
        assert is_valid_isbn("") is False
        assert is_valid_isbn("invalid") is False
        assert is_valid_isbn("1234567890") is False
        assert is_valid_isbn("9780134685990") is False  # Wrong check digit

    def test_format_isbn_13(self):
        """Test ISBN-13 formatting."""
        assert format_isbn_13("9780134685991") == "978-0-134-68599-1"
        assert format_isbn_13("9791234567890") == "979-1-234-56789-0"
        
        # Invalid length returns as-is
        assert format_isbn_13("123") == "123"

    def test_format_isbn_10(self):
        """Test ISBN-10 formatting."""
        assert format_isbn_10("0134685997") == "0-134-68599-7"
        assert format_isbn_10("080442957X") == "0-804-42957-X"
        
        # Invalid length returns as-is
        assert format_isbn_10("123") == "123"

    def test_extract_isbn_from_text(self):
        """Test ISBN extraction from text."""
        text = """
        This book has ISBN 978-0-13-468599-1 and also ISBN-10: 0-804-42957-X.
        Another book: ISBN: 9791220109062
        Invalid: 1234567890
        """
        
        isbns = extract_isbn_from_text(text)
        
        # Should extract and normalize valid ISBNs
        expected = {"9780134685991", "9780804429573", "9791220109062"}
        assert set(isbns) == expected

    def test_extract_isbn_from_empty_text(self):
        """Test ISBN extraction from empty text."""
        assert extract_isbn_from_text("") == []
        assert extract_isbn_from_text(None) == []

    def test_extract_isbn_no_duplicates(self):
        """Test ISBN extraction removes duplicates."""
        text = """
        ISBN: 978-0-13-468599-1
        Also: 9780134685991
        And: 0-13-468599-7
        """
        
        isbns = extract_isbn_from_text(text)
        
        # All should normalize to the same ISBN-13
        assert isbns == ["9780134685991"]

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # ISBN-10 with X check digit
        assert validate_isbn_10("123456789X") is True
        assert isbn_10_to_13("123456789X") == "9781234567897"
        
        # ISBN-13 with 979 prefix
        assert validate_isbn_13("9791220109062") is True
        assert isbn_13_to_10("9791220109062") is None
        
        # Edge case with valid checksum
        assert validate_isbn_13("9780000000002") is True

    def test_real_world_isbns(self):
        """Test with real-world ISBN examples."""
        real_isbns = [
            ("0134685997", "9780134685991"),  # Effective Java
            ("0596517742", "9780596517748"),  # JavaScript: The Good Parts
            ("1449373321", "9781449373320"),  # Learning Python
            ("0321125215", "9780321125217"),  # Effective C++
        ]
        
        for isbn_10, isbn_13 in real_isbns:
            # Validate both formats
            assert validate_isbn_10(isbn_10) is True
            assert validate_isbn_13(isbn_13) is True
            
            # Test conversion
            assert isbn_10_to_13(isbn_10) == isbn_13
            assert isbn_13_to_10(isbn_13) == isbn_10
            
            # Test normalization
            assert normalize_isbn(isbn_10) == isbn_13
            assert normalize_isbn(isbn_13) == isbn_13
            
            # Test validity
            assert is_valid_isbn(isbn_10) is True
            assert is_valid_isbn(isbn_13) is True