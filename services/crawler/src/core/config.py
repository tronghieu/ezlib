"""Application configuration management."""

from __future__ import annotations

import os

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Application settings
    APP_NAME: str = Field("EzLib Book Crawler Service", description="Application name")
    APP_VERSION: str = Field("0.1.0", description="Application version")
    DEBUG: bool = Field(False, description="Debug mode")
    LOG_LEVEL: str = Field("INFO", description="Logging level")

    # Server settings
    HOST: str = Field("0.0.0.0", description="Server host")
    PORT: int = Field(8000, description="Server port")
    WORKERS: int = Field(1, description="Number of worker processes")

    # OpenLibrary API settings
    OPENLIBRARY_BASE_URL: str = Field(
        "https://openlibrary.org",
        description="OpenLibrary API base URL"
    )
    OPENLIBRARY_RATE_LIMIT: int = Field(
        100,
        description="OpenLibrary requests per minute"
    )
    OPENLIBRARY_TIMEOUT: float = Field(
        10.0,
        description="OpenLibrary request timeout in seconds"
    )
    OPENLIBRARY_MAX_RETRIES: int = Field(
        3,
        description="Maximum retry attempts for OpenLibrary requests"
    )

    # Cache settings
    CACHE_TTL: int = Field(
        86400,  # 24 hours
        description="Default cache TTL in seconds"
    )
    REDIS_URL: str | None = Field(
        None,
        description="Redis connection URL for caching"
    )

    # Database settings
    SUPABASE_URL: str | None = Field(
        None,
        description="Supabase project URL"
    )
    SUPABASE_SERVICE_ROLE_KEY: str | None = Field(
        None,
        description="Supabase service role key"
    )
    SUPABASE_MAX_CONNECTIONS: int = Field(
        20,
        description="Maximum database connections"
    )
    SUPABASE_CONNECTION_TIMEOUT: int = Field(
        30,
        description="Database connection timeout in seconds"
    )

    # External API settings
    GOOGLE_BOOKS_API_KEY: str | None = Field(
        None,
        description="Google Books API key"
    )
    ISBN_DB_API_KEY: str | None = Field(
        None,
        description="ISBN Database API key"
    )

    # Enrichment settings
    ENRICHMENT_TIMEOUT: float = Field(
        10.0,
        description="Maximum time for single book enrichment"
    )
    ENRICHMENT_MAX_CONCURRENT: int = Field(
        100,
        description="Maximum concurrent enrichment requests"
    )
    ENRICHMENT_MIN_QUALITY_SCORE: float = Field(
        0.6,
        description="Minimum acceptable quality score"
    )

    # Security settings
    SECRET_KEY: str | None = Field(
        None,
        description="Secret key for JWT tokens"
    )
    ALLOWED_HOSTS: list[str] = Field(
        ["*"],
        description="List of allowed host headers"
    )
    CORS_ORIGINS: list[str] = Field(
        ["*"],
        description="List of allowed CORS origins"
    )

    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.DEBUG or os.getenv("ENVIRONMENT", "").lower() in ("dev", "development")

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return os.getenv("ENVIRONMENT", "").lower() in ("prod", "production")

    def get_openlibrary_api_url(self, path: str) -> str:
        """Get full OpenLibrary API URL for a path."""
        return f"{self.OPENLIBRARY_BASE_URL.rstrip('/')}/{path.lstrip('/')}"


# Global settings instance
settings = Settings()
