"""
Rate limiting utilities for Deep-Journalist.
"""
from datetime import datetime, timedelta
from typing import Dict, Tuple

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.core.config.settings import get_settings
from app.utils.logging.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Store request counts and timestamps per IP
request_store: Dict[str, Tuple[int, datetime]] = {}

def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host

async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware.
    
    Limits requests based on client IP using a sliding window approach.
    """
    client_ip = get_client_ip(request)
    now = datetime.now()
    window = timedelta(seconds=settings.RATE_LIMIT_WINDOW)
    
    # Clean up old entries
    for ip in list(request_store.keys()):
        count, timestamp = request_store[ip]
        if now - timestamp > window:
            del request_store[ip]
    
    # Check current IP's request count
    if client_ip in request_store:
        count, timestamp = request_store[client_ip]
        if now - timestamp > window:
            # Reset if window has passed
            request_store[client_ip] = (1, now)
        elif count >= settings.RATE_LIMIT_REQUESTS:
            # Rate limit exceeded
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": int((timestamp + window - now).total_seconds())
                }
            )
        else:
            # Increment count
            request_store[client_ip] = (count + 1, timestamp)
    else:
        # First request from this IP
        request_store[client_ip] = (1, now)
    
    return await call_next(request)

def check_rate_limit(client_ip: str) -> None:
    """
    Check if a client has exceeded their rate limit.
    
    Raises:
        HTTPException: If rate limit is exceeded.
    """
    now = datetime.now()
    window = timedelta(seconds=settings.RATE_LIMIT_WINDOW)
    
    if client_ip in request_store:
        count, timestamp = request_store[client_ip]
        if now - timestamp <= window and count >= settings.RATE_LIMIT_REQUESTS:
            retry_after = int((timestamp + window - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Too many requests. Please try again later.",
                    "retry_after": retry_after
                }
            ) 