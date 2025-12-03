"""
Custom Exceptions and Exception Handlers for ProcessLab API

Provides standardized error responses and exception handling.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import DatabaseError, IntegrityError
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Custom Exceptions
# ============================================================================

class ProcessLabException(Exception):
    """Base exception for ProcessLab"""
    def __init__(
        self, 
        message: str, 
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ResourceNotFoundError(ProcessLabException):
    """Raised when a requested resource is not found"""
    def __init__(self, resource_type: str, resource_id: str, details: Optional[Dict[str, Any]] = None):
        message = f"{resource_type} with ID '{resource_id}' not found"
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class ValidationError(ProcessLabException):
    """Raised when input validation fails"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class AuthenticationError(ProcessLabException):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class AuthorizationError(ProcessLabException):
    """Raised when user lacks permissions"""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class ExternalServiceError(ProcessLabException):
    """Raised when external service (MinIO, LLM, etc.) fails"""
    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None):
        full_message = f"External service '{service}' error: {message}"
        super().__init__(full_message, status.HTTP_502_BAD_GATEWAY, details)


class RateLimitError(ProcessLabException):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)


# ============================================================================
# Exception Handlers
# ============================================================================

async def processlab_exception_handler(request: Request, exc: ProcessLabException) -> JSONResponse:
    """Handler for all ProcessLab custom exceptions"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log the error
    log_data = {
        "request_id": request_id,
        "error_type": type(exc).__name__,
        "message": exc.message,
        "status_code": exc.status_code,
        "path": request.url.path,
    }
    
    if exc.status_code >= 500:
        logger.error(f"ProcessLab exception: {log_data}")
    else:
        logger.warning(f"ProcessLab exception: {log_data}")
    
    # Return standardized error response
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": type(exc).__name__,
                "message": exc.message,
                "details": exc.details,
                "request_id": request_id,
            }
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler for FastAPI HTTPException"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": "HTTPException",
                "message": exc.detail,
                "request_id": request_id,
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handler for Pydantic validation errors"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Extract validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    logger.warning(f"Validation error: {errors} (request_id: {request_id})")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "type": "ValidationError",
                "message": "Input validation failed",
                "details": {"errors": errors},
                "request_id": request_id,
            }
        }
    )


async def database_exception_handler(request: Request, exc: DatabaseError) -> JSONResponse:
    """Handler for database errors"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log the database error
    logger.error(f"Database error: {str(exc)} (request_id: {request_id})")
    
    # Don't expose internal database errors to client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "type": "DatabaseError",
                "message": "A database error occurred. Please try again later.",
                "request_id": request_id,
            }
        }
    )


async def integrity_exception_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Handler for database integrity errors (unique violations, etc.)"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.warning(f"Database integrity error: {str(exc)} (request_id: {request_id})")
    
    # Try to provide helpful message
    message = "A database constraint was violated."
    if "unique" in str(exc).lower():
        message = "A record with this value already exists."
    elif "foreign key" in str(exc).lower():
        message = "Referenced resource does not exist."
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": {
                "type": "IntegrityError",
                "message": message,
                "request_id": request_id,
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for any unhandled exceptions"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log the unexpected error
    logger.exception(f"Unhandled exception: {str(exc)} (request_id: {request_id})")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "type": "InternalServerError",
                "message": "An unexpected error occurred. Please try again later.",
                "request_id": request_id,
            }
        }
    )


def setup_exception_handlers(app) -> None:
    """Configure all exception handlers"""
    from fastapi import FastAPI
    
    # Custom exceptions
    app.add_exception_handler(ProcessLabException, processlab_exception_handler)
    
    # FastAPI built-in exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Database exceptions
    app.add_exception_handler(DatabaseError, database_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_exception_handler)
    
    # Catch-all
    app.add_exception_handler(Exception, generic_exception_handler)
    
    logger.info("Exception handlers configured successfully")
