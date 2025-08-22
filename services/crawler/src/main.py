"""FastAPI application entry point for EzLib Book Crawler Service."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import enrichment, health
from src.core.config import settings
from src.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:  # type: ignore
    """Handle application startup and shutdown."""
    # Startup
    setup_logging()
    print("🚀 EzLib Book Crawler Service starting up...")
    yield
    # Shutdown
    print("🛑 EzLib Book Crawler Service shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Service for enriching book metadata from external sources",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(enrichment.router)
app.include_router(health.router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
