import { toast } from "sonner";
import apiKeyManager from './api-key-manager';

/**
 * Enhanced Rate Limiter
 * Provides token bucket algorithm for rate limiting API requests
 */

interface RateLimiterOptions {
  tokensPerInterval: number;  // How many tokens are added per interval
  interval: number;           // Interval in milliseconds
  maxTokens: number;          // Maximum number of tokens that can be accumulated
}

interface RateLimiterState {
  tokens: number;
  lastRefill: number;
}

/**
 * Token bucket rate limiter implementation
 * Uses a token bucket algorithm for smooth rate limiting
 */
class RateLimiter {
  private options: RateLimiterOptions;
  private state: Map<string, RateLimiterState> = new Map();
  
  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.options = {
      tokensPerInterval: options.tokensPerInterval || 10,
      interval: options.interval || 60000, // Default: 1 minute
      maxTokens: options.maxTokens || 20,
    };
  }

  /**
   * Refill tokens based on time elapsed since last refill
   */
  private refillTokens(key: string): void {
    const now = Date.now();
    let limiterState = this.state.get(key);
    
    if (!limiterState) {
      // Initialize with maximum tokens for new entries
      limiterState = {
        tokens: this.options.maxTokens,
        lastRefill: now
      };
      this.state.set(key, limiterState);
      return;
    }
    
    // Calculate time elapsed since last refill
    const timeElapsed = now - limiterState.lastRefill;
    
    // Calculate tokens to add based on time elapsed
    const tokensToAdd = (timeElapsed / this.options.interval) * this.options.tokensPerInterval;
    
    if (tokensToAdd > 0) {
      // Update tokens and last refill time
      limiterState.tokens = Math.min(limiterState.tokens + tokensToAdd, this.options.maxTokens);
      limiterState.lastRefill = now;
      this.state.set(key, limiterState);
    }
  }

  /**
   * Try to consume tokens for a request
   * @param key Identifier for the rate limit bucket
   * @param tokens Number of tokens to consume (default: 1)
   * @returns true if tokens were consumed, false if rate limited
   */
  tryConsume(key: string, tokens: number = 1): boolean {
    this.refillTokens(key);
    
    const limiterState = this.state.get(key);
    if (!limiterState) {
      return false;
    }
    
    if (limiterState.tokens >= tokens) {
      limiterState.tokens -= tokens;
      this.state.set(key, limiterState);
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining tokens for a key
   */
  getRemainingTokens(key: string): number {
    this.refillTokens(key);
    return this.state.get(key)?.tokens || 0;
  }
  
  /**
   * Get estimated wait time in milliseconds until the specified tokens will be available
   */
  getWaitTimeMs(key: string, tokens: number = 1): number {
    this.refillTokens(key);
    
    const limiterState = this.state.get(key);
    if (!limiterState) {
      return 0;
    }
    
    const missingTokens = tokens - limiterState.tokens;
    if (missingTokens <= 0) {
      return 0;
    }
    
    // Calculate how long it will take to refill the missing tokens
    return (missingTokens / this.options.tokensPerInterval) * this.options.interval;
  }
  
  /**
   * Reset rate limiter state for a key
   */
  reset(key: string): void {
    this.state.delete(key);
  }
  
  /**
   * Reset all rate limiter state
   */
  resetAll(): void {
    this.state.clear();
  }
}

// Create separate rate limiters for different API services
export const googleGenerativeAiLimiter = new RateLimiter({
  tokensPerInterval: 25,  // 25 requests per minute
  interval: 60000,        // 1 minute
  maxTokens: 50           // Allow burst up to 50 requests
});

// Rate limiter that tracks usage per API key
class PerApiKeyRateLimiter {
  private rateLimiter: RateLimiter;
  
  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.rateLimiter = new RateLimiter(options);
  }
  
  /**
   * Try to consume tokens for a specific API key
   */
  tryConsume(tokens: number = 1): boolean {
    const apiKey = apiKeyManager.getNextKey();
    
    if (!apiKey) {
      return false;
    }
    
    // Create a hash of the API key as the rate limiter bucket key
    const keyHash = this.hashApiKey(apiKey);
    
    return this.rateLimiter.tryConsume(keyHash, tokens);
  }
  
  /**
   * Hash API key to avoid storing it in memory directly
   */
  private hashApiKey(apiKey: string): string {
    // Simple hash function - in production, use a proper crypto hash
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'key_' + Math.abs(hash).toString(16);
  }
  
  /**
   * Get rate limit status for all API keys
   */
  getRateLimitStatus(): Record<string, { remaining: number, waitMs: number }> {
    const status: Record<string, { remaining: number, waitMs: number }> = {};
    
    apiKeyManager.getAllKeys().forEach(key => {
      const keyHash = this.hashApiKey(key);
      const remaining = this.rateLimiter.getRemainingTokens(keyHash);
      const waitMs = this.rateLimiter.getWaitTimeMs(keyHash);
      
      // Use a masked version of the key as the status key
      const maskedKey = this.maskApiKey(key);
      status[maskedKey] = { remaining, waitMs };
    });
    
    return status;
  }
  
  /**
   * Mask API key for display
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '****';
    }
    return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  }
}

// Create a per-API key rate limiter
export const perKeyRateLimiter = new PerApiKeyRateLimiter({
  tokensPerInterval: 10,  // 10 requests per minute per API key
  interval: 60000,        // 1 minute
  maxTokens: 20           // Allow burst up to 20 requests per API key
});

// Global flag to check if rate limiting is enabled
export const isRateLimitingEnabled = true;