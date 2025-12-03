"""
Middleware for ProcessLab API

Provides request tracking, structured logging, and error handling.
"""

import time
import uuid
import json
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import FastAPI

logger = logging.getLogger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Adds a unique request_id to each request.
    The request_id is:
    - Generated as a UUID
    - Added to request.state for access in endpoints
    - Returned in response headers
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Store in request state for access in endpoints
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs all requests with structured data.
    Includes timing, method, path, status code, and request_id.
    
    Security: NEVER logs API keys or sensitive headers.
    """
    
    # Headers to exclude from logging (security)
    SENSITIVE_HEADERS = {
        "authorization", 
        "x-api-key", 
        "cookie", 
        "x-openai-api-key",
        "x-anthropic-api-key",
        "x-google-api-key"
    }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get request_id (set by RequestIdMiddleware)
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Build structured log
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params) if request.query_params else None,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }
        
        # Log at appropriate level
        if response.status_code >= 500:
            logger.error(f"Request completed: {json.dumps(log_data)}")
        elif response.status_code >= 400:
            logger.warning(f"Request completed: {json.dumps(log_data)}")
        else:
            logger.info(f"Request completed: {json.dumps(log_data)}")
        
        return response


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """
    Catches unhandled exceptions and logs them with structured data.
    Also ensures request_id is preserved in error responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = getattr(request.state, "request_id", "unknown")
        
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # Log the exception with structured data
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error_type": type(exc).__name__,
                "error_message": str(exc),
            }
            
            logger.exception(f"Unhandled exception: {json.dumps(log_data)}")
            
            # Re-raise to let FastAPI's exception handler deal with it
            raise


def setup_middlewares(app: FastAPI) -> None:
    """
    Configure all middlewares in the correct order.
    Order matters: RequestId -> Logging -> Error
    """
    # 1. Request ID (must be first to provide ID to other middlewares)
    app.add_middleware(RequestIdMiddleware)
    
    # 2. Logging (logs with request_id)
    app.add_middleware(LoggingMiddleware)
    
    # 3. Error logging (catches exceptions after logging)
    app.add_middleware(ErrorLoggingMiddleware)
    
    logger.info("Middlewares configured successfully")
