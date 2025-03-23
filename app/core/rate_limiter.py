import time
from collections import deque
from typing import Deque, Tuple

class RateLimiter:
    """Simple rate limiter using sliding window."""

    def __init__(self, max_requests: int, time_window: int):
        """Initialize rate limiter.
        
        Args:
            max_requests: Maximum number of requests allowed in the time window
            time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests: Deque[float] = deque()

    def allow_request(self) -> bool:
        """Check if a request is allowed under current rate limits.
        
        Returns:
            bool: True if request is allowed, False if rate limit exceeded
        """
        now = time.time()
        
        # Remove requests outside the time window
        while self.requests and self.requests[0] <= now - self.time_window:
            self.requests.popleft()
            
        # Check if we're at the limit
        if len(self.requests) >= self.max_requests:
            return False
            
        # Add current request
        self.requests.append(now)
        return True

    def time_until_reset(self) -> float:
        """Get time until the rate limit resets.
        
        Returns:
            float: Seconds until the rate limit resets
        """
        if not self.requests:
            return 0
            
        oldest_request = self.requests[0]
        return max(0, self.time_window - (time.time() - oldest_request))

    def remaining_requests(self) -> int:
        """Get number of remaining requests in current window.
        
        Returns:
            int: Number of requests remaining
        """
        self.allow_request()  # Clean up old requests
        return max(0, self.max_requests - len(self.requests)) 