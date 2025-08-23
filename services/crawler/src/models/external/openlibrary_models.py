"""OpenLibrary API response models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, validator


class OpenLibraryAuthor(BaseModel):
    """OpenLibrary author information."""

    key: str | None = Field(None, description="OpenLibrary author key")
    name: str | None = Field(None, description="Author name")


class OpenLibraryCover(BaseModel):
    """OpenLibrary cover information."""

    small: str | None = Field(None, description="Small cover image URL")
    medium: str | None = Field(None, description="Medium cover image URL")
    large: str | None = Field(None, description="Large cover image URL")


class OpenLibraryBookDetails(BaseModel):
    """OpenLibrary book details from API response."""

    title: str | None = Field(None, description="Book title")
    subtitle: str | None = Field(None, description="Book subtitle")
    authors: list[OpenLibraryAuthor] = Field(
        default_factory=list, description="Book authors"
    )
    publish_date: str | None = Field(None, description="Publication date as string")
    publishers: list[str] = Field(default_factory=list, description="Publishers")
    isbn_10: list[str] = Field(default_factory=list, description="ISBN-10 identifiers")
    isbn_13: list[str] = Field(default_factory=list, description="ISBN-13 identifiers")
    number_of_pages: int | None = Field(None, description="Number of pages")
    covers: list[int] = Field(default_factory=list, description="Cover image IDs")
    description: str | None = Field(None, description="Book description")
    subjects: list[str] = Field(default_factory=list, description="Subject tags")
    key: str | None = Field(None, description="OpenLibrary book key")

    @validator("authors", pre=True)
    def parse_authors(cls, v: Any) -> list[OpenLibraryAuthor]:
        """Parse authors from various OpenLibrary formats."""
        if not v:
            return []

        if not isinstance(v, list):
            return []

        authors = []
        for author in v:
            if isinstance(author, dict):
                # Handle {"key": "/authors/...", "name": "..."}
                authors.append(OpenLibraryAuthor(**author))
            elif isinstance(author, str):
                # Handle plain string names
                authors.append(OpenLibraryAuthor(name=author))

        return authors

    @validator("description", pre=True)
    def parse_description(cls, v: Any) -> str | None:
        """Parse description from OpenLibrary format."""
        if not v:
            return None

        if isinstance(v, str):
            return v

        if isinstance(v, dict):
            # Handle {"type": "/type/text", "value": "description text"}
            return v.get("value")

        return None

    @validator("covers", pre=True)
    def parse_covers(cls, v: Any) -> list[int]:
        """Parse cover IDs from OpenLibrary format."""
        if not v:
            return []

        if isinstance(v, list):
            # Filter out non-integer values
            return [cover for cover in v if isinstance(cover, int)]

        return []

    def get_primary_isbn_13(self) -> str | None:
        """Get the primary ISBN-13 from the available ISBNs."""
        if self.isbn_13:
            return self.isbn_13[0]
        return None

    def get_primary_isbn_10(self) -> str | None:
        """Get the primary ISBN-10 from the available ISBNs."""
        if self.isbn_10:
            return self.isbn_10[0]
        return None

    def get_author_names(self) -> list[str]:
        """Get list of author names."""
        return [author.name for author in self.authors if author.name]

    def get_cover_url(self, size: str = "M") -> str | None:
        """Generate cover image URL from OpenLibrary cover ID.

        Args:
            size: Cover size - "S" (small), "M" (medium), "L" (large)

        Returns:
            Cover image URL or None if no covers available
        """
        if not self.covers:
            return None

        cover_id = self.covers[0]  # Use first cover
        return f"https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg"

    def get_publication_year(self) -> int | None:
        """Extract publication year from publish_date string."""
        if not self.publish_date:
            return None

        # Try to extract year from various date formats
        import re

        # Look for 4-digit year
        year_match = re.search(r"\b(1[5-9]\d\d|20\d\d|21\d\d)\b", self.publish_date)
        if year_match:
            return int(year_match.group(1))

        return None


class OpenLibraryResponse(BaseModel):
    """Complete OpenLibrary API response."""

    details: OpenLibraryBookDetails = Field(..., description="Book details")

    @classmethod
    def from_api_response(cls, data: dict[str, Any], isbn: str) -> OpenLibraryResponse:
        """Create response model from raw API data.

        Args:
            data: Raw API response dictionary
            isbn: ISBN used for the request

        Returns:
            Parsed OpenLibrary response
        """
        book_key = f"ISBN:{isbn}"
        if book_key in data:
            book_data = data[book_key]
            details = book_data.get("details", {})
            return cls(details=OpenLibraryBookDetails(**details))

        # If no data found, return empty response
        return cls(details=OpenLibraryBookDetails())


class OpenLibrarySearchResult(BaseModel):
    """OpenLibrary search result item."""

    key: str | None = Field(None, description="OpenLibrary work key")
    title: str | None = Field(None, description="Book title")
    author_name: list[str] = Field(default_factory=list, description="Author names")
    first_publish_year: int | None = Field(None, description="First publication year")
    isbn: list[str] = Field(default_factory=list, description="All ISBN identifiers")
    cover_i: int | None = Field(None, description="Cover image ID")

    def get_cover_url(self, size: str = "M") -> str | None:
        """Generate cover URL for search result."""
        if self.cover_i:
            return f"https://covers.openlibrary.org/b/id/{self.cover_i}-{size}.jpg"
        return None


class OpenLibrarySearchResponse(BaseModel):
    """OpenLibrary search API response."""

    docs: list[OpenLibrarySearchResult] = Field(
        default_factory=list, description="Search results"
    )
    num_found: int = Field(0, description="Total number of results found")
    start: int = Field(0, description="Starting index of results")

    @classmethod
    def from_api_response(cls, data: dict[str, Any]) -> OpenLibrarySearchResponse:
        """Create search response from raw API data."""
        docs_data = data.get("docs", [])
        docs = [OpenLibrarySearchResult(**doc) for doc in docs_data]

        return cls(
            docs=docs, num_found=data.get("num_found", 0), start=data.get("start", 0)
        )
