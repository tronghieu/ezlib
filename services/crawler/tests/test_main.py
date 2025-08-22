"""Test FastAPI application and health endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from httpx import AsyncClient


def test_health_endpoint(client: TestClient) -> None:
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ezlib-book-crawler"


def test_root_endpoint(client: TestClient) -> None:
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "EzLib Book Crawler Service"
    assert data["version"] == "0.1.0"
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"


async def test_health_endpoint_async(async_client: AsyncClient) -> None:
    """Test health check endpoint with async client."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ezlib-book-crawler"


def test_openapi_docs_available(client: TestClient) -> None:
    """Test that OpenAPI documentation is available."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "html" in response.headers.get("content-type", "").lower()


def test_redoc_docs_available(client: TestClient) -> None:
    """Test that ReDoc documentation is available."""
    response = client.get("/redoc")
    assert response.status_code == 200
    assert "html" in response.headers.get("content-type", "").lower()
