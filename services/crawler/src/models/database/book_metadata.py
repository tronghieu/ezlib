"""Internal book metadata models for standardized representation."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, validator

from src.models.external.openlibrary_models import OpenLibraryBookDetails


class BookMetadata(BaseModel):
    """Standardized book metadata model for internal use."""

    isbn_13: str = Field(..., description="13-digit ISBN identifier")
    title: str = Field(..., min_length=1, max_length=500, description="Book title")
    subtitle: str | None = Field(None, max_length=200, description="Book subtitle")
    authors: list[str] = Field(default_factory=list, description="List of author names")
    publication_date: date | None = Field(None, description="Publication date")
    publication_year: int | None = Field(None, description="Publication year")
    publisher: str | None = Field(None, max_length=200, description="Primary publisher")
    publishers: list[str] = Field(default_factory=list, description="All publishers")
    page_count: int | None = Field(None, ge=1, le=10000, description="Number of pages")
    cover_image_url: str | None = Field(None, description="Cover image URL")
    description: str | None = Field(None, description="Book description")
    subjects: list[str] = Field(default_factory=list, description="Subject categories")
    isbn_10: str | None = Field(None, description="10-digit ISBN (if available)")
    language: str | None = Field(None, description="Primary language code")

    # Metadata about the enrichment
    source: str = Field("openlibrary", description="Data source identifier")
    enriched_at: datetime = Field(default_factory=datetime.utcnow, description="Enrichment timestamp")
    quality_score: float | None = Field(None, ge=0.0, le=1.0, description="Data quality score")

    @validator("publication_date")
    def validate_publication_date(cls, v: date | None) -> date | None:
        """Validate publication date is reasonable."""
        if v is None:
            return v

        current_year = datetime.now().year
        if v.year < 1450 or v.year > current_year + 2:
            raise ValueError(f"Publication year {v.year} is not reasonable")

        return v

    @validator("publication_year")
    def validate_publication_year(cls, v: int | None) -> int | None:
        """Validate publication year is reasonable."""
        if v is None:
            return v

        current_year = datetime.now().year
        if v < 1450 or v > current_year + 2:
            raise ValueError(f"Publication year {v} is not reasonable")

        return v

    @validator("authors")
    def validate_authors(cls, v: list[str]) -> list[str]:
        """Validate and clean author names."""
        if not v:
            return []

        # Clean and filter author names
        cleaned_authors = []
        for author in v:
            if author and isinstance(author, str):
                cleaned = author.strip()
                if cleaned and len(cleaned) <= 200:
                    cleaned_authors.append(cleaned)

        return cleaned_authors

    @validator("subjects")
    def validate_subjects(cls, v: list[str]) -> list[str]:
        """Validate and clean subject tags."""
        if not v:
            return []

        # Clean and deduplicate subjects
        cleaned_subjects = []
        seen = set()

        for subject in v:
            if subject and isinstance(subject, str):
                cleaned = subject.strip().lower()
                if cleaned and cleaned not in seen and len(cleaned) <= 100:
                    cleaned_subjects.append(subject.strip())  # Keep original casing
                    seen.add(cleaned)

        return cleaned_subjects[:10]  # Limit to 10 subjects

    @validator("cover_image_url")
    def validate_cover_url(cls, v: str | None) -> str | None:
        """Validate cover image URL."""
        if not v:
            return None

        if not v.startswith(("http://", "https://")):
            return None

        # Basic URL validation
        if len(v) > 500:
            return None

        return v

    def calculate_quality_score(self) -> float:
        """Calculate data quality score based on completeness and validity.

        Returns:
            Quality score between 0.0 and 1.0
        """
        score = 0.0
        max_score = 0.0

        # Core fields (higher weight)
        if self.title:
            score += 0.2
        max_score += 0.2

        if self.authors:
            score += 0.2
        max_score += 0.2

        if self.isbn_13 and len(self.isbn_13) == 13:
            score += 0.15
        max_score += 0.15

        # Important fields (medium weight)
        if self.publication_date or self.publication_year:
            score += 0.1
        max_score += 0.1

        if self.publisher:
            score += 0.1
        max_score += 0.1

        # Nice-to-have fields (lower weight)
        if self.cover_image_url:
            score += 0.1
        max_score += 0.1

        if self.description:
            score += 0.05
        max_score += 0.05

        if self.page_count:
            score += 0.05
        max_score += 0.05

        if self.subjects:
            score += 0.05
        max_score += 0.05

        return score / max_score if max_score > 0 else 0.0

    @classmethod
    def from_openlibrary(
        cls,
        isbn: str,
        ol_details: OpenLibraryBookDetails
    ) -> BookMetadata:
        """Create BookMetadata from OpenLibrary details.

        Args:
            isbn: The ISBN-13 used for the request
            ol_details: OpenLibrary book details

        Returns:
            Standardized BookMetadata instance
        """
        # Extract publication info
        pub_year = ol_details.get_publication_year()
        pub_date = None

        # Try to create date if we have enough info
        if pub_year and ol_details.publish_date:
            try:
                # Simple date parsing - can be enhanced later
                if len(ol_details.publish_date) >= 4:
                    pub_date = date(pub_year, 1, 1)  # Default to Jan 1st
            except (ValueError, TypeError):
                pass

        # Get primary publisher
        primary_publisher = None
        if ol_details.publishers:
            primary_publisher = ol_details.publishers[0]

        # Create metadata instance
        metadata = cls(
            isbn_13=isbn,
            title=ol_details.title or "Unknown Title",
            subtitle=ol_details.subtitle,
            authors=ol_details.get_author_names(),
            publication_date=pub_date,
            publication_year=pub_year,
            publisher=primary_publisher,
            publishers=ol_details.publishers,
            page_count=ol_details.number_of_pages,
            cover_image_url=ol_details.get_cover_url("L"),  # Large cover
            description=ol_details.description,
            subjects=ol_details.subjects,
            isbn_10=ol_details.get_primary_isbn_10(),
            source="openlibrary"
        )

        # Calculate and set quality score
        metadata.quality_score = metadata.calculate_quality_score()

        return metadata

    def is_high_quality(self, min_score: float = 0.7) -> bool:
        """Check if metadata meets quality threshold."""
        if self.quality_score is None:
            self.quality_score = self.calculate_quality_score()

        return self.quality_score >= min_score

    def get_missing_fields(self) -> list[str]:
        """Get list of important missing fields."""
        missing = []

        if not self.title or self.title == "Unknown Title":
            missing.append("title")

        if not self.authors:
            missing.append("authors")

        if not self.publication_date and not self.publication_year:
            missing.append("publication_date")

        if not self.publisher:
            missing.append("publisher")

        if not self.cover_image_url:
            missing.append("cover_image")

        if not self.description:
            missing.append("description")

        return missing


class AuthorData(BaseModel):
    """Author information for database storage."""

    id: UUID | None = Field(None, description="Author UUID")
    name: str = Field(..., min_length=1, max_length=200, description="Author name")
    canonical_name: str = Field(..., description="Normalized name for deduplication")
    birth_date: date | None = Field(None, description="Birth date")
    death_date: date | None = Field(None, description="Death date")
    nationality: str | None = Field(None, max_length=100, description="Nationality")
    biography: str | None = Field(None, description="Author biography")
    photo_url: str | None = Field(None, description="Author photo URL")

    @validator("canonical_name", pre=True, always=True)
    def generate_canonical_name(cls, v: str | None, values: dict) -> str:
        """Generate canonical name for deduplication."""
        if v:
            return v

        name = values.get("name", "")
        if not name:
            return ""

        # Normalize name for deduplication
        import re

        # Convert to lowercase
        canonical = name.lower()

        # Remove common prefixes/suffixes
        canonical = re.sub(r"\b(dr|prof|mr|mrs|ms|sir|dame)\.?\s+", "", canonical)
        canonical = re.sub(r"\s+(jr|sr|ii|iii|iv)\.?$", "", canonical)

        # Remove extra whitespace and punctuation
        canonical = re.sub(r"[^\w\s]", "", canonical)
        canonical = re.sub(r"\s+", " ", canonical).strip()

        return canonical


class BookContributor(BaseModel):
    """Book-contributor relationship model."""

    book_id: UUID = Field(..., description="Book UUID")
    author_id: UUID = Field(..., description="Author UUID")
    contribution_type: str = Field("author", description="Type of contribution")
    contribution_order: int | None = Field(None, description="Order of contribution")

    @validator("contribution_type")
    def validate_contribution_type(cls, v: str) -> str:
        """Validate contribution type."""
        valid_types = {"author", "editor", "translator", "illustrator", "contributor"}
        if v.lower() not in valid_types:
            raise ValueError(f"Invalid contribution type: {v}")

        return v.lower()
