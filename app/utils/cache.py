"""
Caching utilities for Deep-Journalist.
"""
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Dict, Optional, Tuple

from app.core.config.settings import get_settings
from app.utils.logging.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

class Cache:
    """Simple in-memory cache with TTL and size limit."""
    
    def __init__(self, ttl: int = None, max_size: int = None):
        """
        Initialize cache.
        
        Args:
            ttl: Time-to-live in seconds for cache entries
            max_size: Maximum number of items to store in cache
        """
        self._store: Dict[str, Tuple[Any, datetime]] = {}
        self.ttl = ttl or settings.cache_ttl
        self.max_size = max_size or settings.max_cache_size
    
    def _cleanup(self) -> None:
        """Remove expired entries and enforce size limit."""
        now = datetime.now()
        # Remove expired entries
        expired = [
            key for key, (_, timestamp) in self._store.items()
            if now - timestamp > timedelta(seconds=self.ttl)
        ]
        for key in expired:
            del self._store[key]
            
        # Enforce size limit
        if len(self._store) > self.max_size:
            # Remove oldest entries
            sorted_items = sorted(
                self._store.items(),
                key=lambda x: x[1][1]  # Sort by timestamp
            )
            to_remove = len(self._store) - self.max_size
            for key, _ in sorted_items[:to_remove]:
                del self._store[key]
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value if exists and not expired, None otherwise
        """
        if key in self._store:
            value, timestamp = self._store[key]
            if datetime.now() - timestamp <= timedelta(seconds=self.ttl):
                return value
            del self._store[key]
        return None
    
    def set(self, key: str, value: Any) -> None:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self._cleanup()
        self._store[key] = (value, datetime.now())
    
    def delete(self, key: str) -> None:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
        """
        if key in self._store:
            del self._store[key]
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self._store.clear()

# Global cache instance
cache = Cache()

def cached(ttl: Optional[int] = None):
    """
    Decorator for caching function results.
    
    Args:
        ttl: Optional override for cache TTL in seconds
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check cache
            result = cache.get(key)
            if result is not None:
                logger.debug(f"Cache hit for {key}")
                return result
            
            # Get fresh result
            result = await func(*args, **kwargs)
            
            # Cache result
            if ttl:
                temp_cache = Cache(ttl=ttl)
                temp_cache.set(key, result)
            else:
                cache.set(key, result)
            
            logger.debug(f"Cache miss for {key}")
            return result
        return wrapper
    return decorator 