"""Book enrichment API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from src.core.exceptions import (
    CrawlerServiceError,
    ExternalAPIError,
    ValidationError,
)
from src.models.requests.enrichment_request import (
    BatchEnrichmentRequest,
    EnrichmentRequest,
)
from src.models.responses.enrichment_result import (
    BatchEnrichmentResponse,
    EnrichmentResponse,
    ErrorResponse,
)
from src.services.enrichment_service import BookEnrichmentService, EnrichmentResult

router = APIRouter(prefix="/enrichment", tags=["enrichment"])


async def get_enrichment_service() -> BookEnrichmentService:
    """Dependency to get enrichment service instance."""
    service = BookEnrichmentService()
    try:
        await service._ensure_clients()
        yield service
    finally:
        await service.close()


def create_error_response(error: Exception) -> JSONResponse:
    """Create standardized error response from exception.

    Args:
        error: Exception to convert to error response

    Returns:
        JSON response with error details
    """
    if isinstance(error, CrawlerServiceError):
        error_dict = error.to_dict()

        # Map to HTTP status codes
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        if isinstance(error, ValidationError):
            status_code = status.HTTP_400_BAD_REQUEST
        elif isinstance(error, ExternalAPIError):
            if error.status_code == 404:
                status_code = status.HTTP_404_NOT_FOUND
            elif error.status_code == 429:
                status_code = status.HTTP_429_TOO_MANY_REQUESTS
            else:
                status_code = status.HTTP_502_BAD_GATEWAY

        return JSONResponse(
            status_code=status_code,
            content=ErrorResponse(**error_dict).dict()
        )

    else:
        # Generic error response
        error_response = ErrorResponse(
            error_type="InternalServerError",
            message=str(error)
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.dict()
        )


def enrichment_result_to_response(result: EnrichmentResult) -> EnrichmentResponse:
    """Convert EnrichmentResult to API response model.

    Args:
        result: Internal enrichment result

    Returns:
        API response model
    """
    return EnrichmentResponse(
        isbn=result.isbn,
        status=result.status,
        correlation_id=result.correlation_id,
        timestamp=result.timestamp,
        metadata=result.metadata,
        error=result.error,
        quality_score=result.quality_score,
        sources_used=result.sources_used,
        processing_time=result.processing_time
    )


@router.post(
    "/enrich",
    response_model=EnrichmentResponse,
    summary="Enrich single book metadata",
    description="Fetch and enrich metadata for a single book using its ISBN identifier",
    responses={
        200: {
            "description": "Book successfully enriched",
            "model": EnrichmentResponse
        },
        400: {
            "description": "Invalid request parameters",
            "model": ErrorResponse
        },
        404: {
            "description": "Book not found in external sources",
            "model": ErrorResponse
        },
        429: {
            "description": "Rate limit exceeded",
            "model": ErrorResponse
        },
        502: {
            "description": "External API error",
            "model": ErrorResponse
        }
    }
)
async def enrich_book(
    request: EnrichmentRequest,
    service: BookEnrichmentService = Depends(get_enrichment_service)
) -> EnrichmentResponse:
    """Enrich metadata for a single book.

    Args:
        request: Enrichment request with ISBN and options
        service: Enrichment service instance

    Returns:
        Enrichment result with metadata or error information
    """
    try:
        result = await service.enrich_book(
            isbn=request.isbn,
            force_refresh=request.force_refresh,
            min_quality_score=request.min_quality_score
        )

        response = enrichment_result_to_response(result)

        # Return appropriate HTTP status based on enrichment status
        if result.status == "failed":
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND if "not found" in (result.error or "").lower()
                else status.HTTP_502_BAD_GATEWAY,
                content=response.dict()
            )
        elif result.status == "partial":
            return JSONResponse(
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                content=response.dict()
            )

        return response

    except Exception as e:
        return create_error_response(e)


@router.post(
    "/batch",
    response_model=BatchEnrichmentResponse,
    summary="Enrich multiple books metadata",
    description="Fetch and enrich metadata for multiple books using their ISBN identifiers",
    responses={
        200: {
            "description": "Batch enrichment completed (may include partial failures)",
            "model": BatchEnrichmentResponse
        },
        400: {
            "description": "Invalid request parameters",
            "model": ErrorResponse
        },
        429: {
            "description": "Rate limit exceeded",
            "model": ErrorResponse
        }
    }
)
async def batch_enrich_books(
    request: BatchEnrichmentRequest,
    service: BookEnrichmentService = Depends(get_enrichment_service)
) -> BatchEnrichmentResponse:
    """Enrich metadata for multiple books concurrently.

    Args:
        request: Batch enrichment request with ISBNs and options
        service: Enrichment service instance

    Returns:
        Batch enrichment results with individual book results
    """
    try:
        import time
        start_time = time.time()

        results = await service.batch_enrich_books(
            isbns=request.isbns,
            force_refresh=request.force_refresh,
            min_quality_score=request.min_quality_score
        )

        processing_time = time.time() - start_time

        # Convert results to response format
        response_results = [enrichment_result_to_response(result) for result in results]

        # Calculate statistics
        successful = sum(1 for r in results if r.status == "success")
        failed = sum(1 for r in results if r.status == "failed")
        partial = sum(1 for r in results if r.status == "partial")

        response = BatchEnrichmentResponse(
            total_books=len(results),
            successful=successful,
            failed=failed,
            partial=partial,
            results=response_results,
            processing_time=processing_time
        )

        # Return 207 Multi-Status if there were any failures
        if failed > 0 or partial > 0:
            return JSONResponse(
                status_code=status.HTTP_207_MULTI_STATUS,
                content=response.dict()
            )

        return response

    except Exception as e:
        return create_error_response(e)


@router.get(
    "/status/{correlation_id}",
    response_model=EnrichmentResponse,
    summary="Get enrichment status",
    description="Get the status of a previous enrichment request by correlation ID",
    responses={
        200: {
            "description": "Enrichment status retrieved",
            "model": EnrichmentResponse
        },
        404: {
            "description": "Enrichment request not found",
            "model": ErrorResponse
        }
    }
)
async def get_enrichment_status(correlation_id: str) -> EnrichmentResponse:
    """Get enrichment status by correlation ID.

    Note: This is a placeholder endpoint. In a production system,
    this would query a job status database or cache.

    Args:
        correlation_id: Unique identifier for the enrichment request

    Returns:
        Enrichment status and results if available
    """
    # TODO: Implement job status tracking with database/cache
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Status tracking not yet implemented"
    )
