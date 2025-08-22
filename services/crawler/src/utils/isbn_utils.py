"""ISBN validation and conversion utilities."""

from __future__ import annotations

import re

from src.core.exceptions import ValidationError


def clean_isbn(isbn: str) -> str:
    """Remove hyphens, spaces, and other formatting from ISBN.

    Args:
        isbn: ISBN with possible formatting

    Returns:
        Clean ISBN with only digits and X
    """
    if not isbn:
        return ""

    # Remove common formatting characters
    return re.sub(r"[-\s]", "", isbn.upper())


def validate_isbn_10(isbn: str) -> bool:
    """Validate ISBN-10 format and checksum.

    Args:
        isbn: ISBN-10 string (may contain formatting)

    Returns:
        True if valid ISBN-10
    """
    clean = clean_isbn(isbn)

    # Must be exactly 10 characters
    if len(clean) != 10:
        return False

    # First 9 must be digits, last can be digit or X
    if not re.match(r"^\d{9}[\dX]$", clean):
        return False

    # Calculate checksum
    checksum = 0
    for i, char in enumerate(clean[:9]):
        checksum += int(char) * (10 - i)

    # Last character validation
    last_char = clean[9]
    if last_char == "X":
        checksum += 10
    else:
        checksum += int(last_char)

    return checksum % 11 == 0


def validate_isbn_13(isbn: str) -> bool:
    """Validate ISBN-13 format and checksum.

    Args:
        isbn: ISBN-13 string (may contain formatting)

    Returns:
        True if valid ISBN-13
    """
    clean = clean_isbn(isbn)

    # Must be exactly 13 digits
    if len(clean) != 13:
        return False

    # Must contain only digits
    if not clean.isdigit():
        return False

    # Must start with 978 or 979
    if not (clean.startswith("978") or clean.startswith("979")):
        return False

    # Calculate checksum using ISBN-13 algorithm
    checksum = 0
    for i, digit in enumerate(clean[:12]):
        weight = 1 if i % 2 == 0 else 3
        checksum += int(digit) * weight

    check_digit = (10 - (checksum % 10)) % 10
    return check_digit == int(clean[12])


def isbn_10_to_13(isbn_10: str) -> str:
    """Convert ISBN-10 to ISBN-13.

    Args:
        isbn_10: Valid ISBN-10 string

    Returns:
        Corresponding ISBN-13

    Raises:
        ValidationError: If ISBN-10 is invalid
    """
    clean = clean_isbn(isbn_10)

    if not validate_isbn_10(clean):
        raise ValidationError("Invalid ISBN-10 format", field="isbn_10", value=isbn_10)

    # Remove check digit and add 978 prefix
    isbn_12 = "978" + clean[:9]

    # Calculate new check digit
    checksum = 0
    for i, digit in enumerate(isbn_12):
        weight = 1 if i % 2 == 0 else 3
        checksum += int(digit) * weight

    check_digit = (10 - (checksum % 10)) % 10

    return isbn_12 + str(check_digit)


def isbn_13_to_10(isbn_13: str) -> str | None:
    """Convert ISBN-13 to ISBN-10 if possible.

    Args:
        isbn_13: Valid ISBN-13 string

    Returns:
        Corresponding ISBN-10 or None if not convertible

    Raises:
        ValidationError: If ISBN-13 is invalid
    """
    clean = clean_isbn(isbn_13)

    if not validate_isbn_13(clean):
        raise ValidationError("Invalid ISBN-13 format", field="isbn_13", value=isbn_13)

    # Only 978-prefixed ISBNs can be converted to ISBN-10
    if not clean.startswith("978"):
        return None

    # Remove 978 prefix and last check digit
    isbn_9 = clean[3:12]

    # Calculate ISBN-10 check digit
    checksum = 0
    for i, digit in enumerate(isbn_9):
        checksum += int(digit) * (10 - i)

    check_remainder = checksum % 11
    if check_remainder == 0:
        check_digit = "0"
    elif check_remainder == 1:
        check_digit = "X"
    else:
        check_digit = str(11 - check_remainder)

    return isbn_9 + check_digit


def normalize_isbn(isbn: str) -> str:
    """Normalize ISBN to ISBN-13 format.

    Args:
        isbn: ISBN in any valid format

    Returns:
        Normalized ISBN-13

    Raises:
        ValidationError: If ISBN is invalid
    """
    clean = clean_isbn(isbn)

    if not clean:
        raise ValidationError("Empty ISBN", field="isbn", value=isbn)

    if len(clean) == 10:
        if validate_isbn_10(clean):
            return isbn_10_to_13(clean)
        else:
            raise ValidationError("Invalid ISBN-10", field="isbn", value=isbn)

    elif len(clean) == 13:
        if validate_isbn_13(clean):
            return clean
        else:
            raise ValidationError("Invalid ISBN-13", field="isbn", value=isbn)

    else:
        raise ValidationError(
            f"ISBN must be 10 or 13 digits, got {len(clean)}",
            field="isbn",
            value=isbn
        )


def is_valid_isbn(isbn: str) -> bool:
    """Check if ISBN is valid in any format.

    Args:
        isbn: ISBN string to validate

    Returns:
        True if valid ISBN-10 or ISBN-13
    """
    try:
        normalize_isbn(isbn)
        return True
    except ValidationError:
        return False


def format_isbn_13(isbn: str) -> str:
    """Format ISBN-13 with hyphens for display.

    Args:
        isbn: Clean ISBN-13 digits

    Returns:
        Formatted ISBN-13 (e.g., 978-0-123-45678-9)
    """
    clean = clean_isbn(isbn)

    if len(clean) != 13:
        return clean

    # Basic formatting - can be enhanced with proper group identification
    return f"{clean[:3]}-{clean[3]}-{clean[4:7]}-{clean[7:12]}-{clean[12]}"


def format_isbn_10(isbn: str) -> str:
    """Format ISBN-10 with hyphens for display.

    Args:
        isbn: Clean ISBN-10 digits

    Returns:
        Formatted ISBN-10 (e.g., 0-123-45678-9)
    """
    clean = clean_isbn(isbn)

    if len(clean) != 10:
        return clean

    # Basic formatting - can be enhanced with proper group identification
    return f"{clean[0]}-{clean[1:4]}-{clean[4:9]}-{clean[9]}"


def extract_isbn_from_text(text: str) -> list[str]:
    """Extract potential ISBNs from text.

    Args:
        text: Text that may contain ISBNs

    Returns:
        List of valid ISBNs found in text
    """
    if not text:
        return []

    # Pattern to match potential ISBNs
    isbn_pattern = r"\b(?:ISBN[-:\s]*)?(?:97[89][-\s]*)?(?:\d[-\s]*){9,12}[\dX]\b"

    potential_isbns = re.findall(isbn_pattern, text.upper())
    valid_isbns = []

    for isbn in potential_isbns:
        # Clean up the match
        cleaned = re.sub(r"^ISBN[-:\s]*", "", isbn)
        cleaned = clean_isbn(cleaned)

        if is_valid_isbn(cleaned):
            # Normalize to ISBN-13
            try:
                normalized = normalize_isbn(cleaned)
                if normalized not in valid_isbns:
                    valid_isbns.append(normalized)
            except ValidationError:
                continue

    return valid_isbns
