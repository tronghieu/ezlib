"""FastAPI application entry point for EzLib Book Crawler Service."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:  # type: ignore
    """Handle application startup and shutdown."""
    # Startup
    print("🚀 EzLib Book Crawler Service starting up...")
    yield
    # Shutdown
    print("🛑 EzLib Book Crawler Service shutting down...")


# Create FastAPI application
app = FastAPI(
    title="EzLib Book Crawler Service",
    description="Service for enriching book metadata from external sources",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "ezlib-book-crawler"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "EzLib Book Crawler Service",
        "version": "0.1.0",
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
