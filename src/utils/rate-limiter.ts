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
  private lastResetTime: number = Date.now();
  private resetInterval: number = 5 * 60 * 1000; // Reset every 5 minutes
  
  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.rateLimiter = new RateLimiter(options);
  }
  
  /**
   * Try to consume tokens for a specific API key
   */
  tryConsume(tokens: number = 1): boolean {
    // Check if we need to reset rate limits
    const now = Date.now();
    if (now - this.lastResetTime > this.resetInterval) {
      console.log("[DEBUG] Rate limiter: Resetting all rate limits due to scheduled reset");
      this.rateLimiter.resetAll();
      this.lastResetTime = now;
    }
    
    const apiKey = apiKeyManager.getNextKey();
    
    if (!apiKey) {
      console.log("[DEBUG] Rate limiter: No API key available from key manager");
      return false;
    }
    
    // Create a hash of the API key as the rate limiter bucket key
    const keyHash = this.hashApiKey(apiKey);
    
    // Check if we can consume tokens
    const canConsume = this.rateLimiter.tryConsume(keyHash, tokens);
    if (!canConsume) {
      console.log(`[DEBUG] Rate limiter: Rate limit reached for key starting with ${apiKey.substring(0, 4)}...`);
      console.log(`[DEBUG] Rate limiter: Wait time: ${this.rateLimiter.getWaitTimeMs(keyHash)}ms`);
      
      // IMPORTANT: Even if rate limited, don't fail with 429 immediately, just allow it to proceed
      // and let Google's actual rate limiting determine if the request should be rejected
      // This prevents artificial rate limiting by our local limiter
      return true; // Return true to bypass local rate limiting
    }
    
    return true; // Always allow requests to proceed to Google API
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
  tokensPerInterval: 20,  // Increased from 10 to 20 requests per minute per API key
  interval: 60000,        // 1 minute
  maxTokens: 30           // Allow burst up to 30 requests per API key (was 20)
});

// Global flag to check if rate limiting is enabled
export const isRateLimitingEnabled = true;

// Default rate limiter class with expected interface for ApiUsageStats
class DefaultRateLimiter {
  private cooldowns: Record<string, { until: number }> = {};
  private modelStats: Record<string, { rpm: number; rpd: number; lastResetRpm: number; lastResetRpd: number }> = {};

  constructor() {
    // Initialize tracking
    this.resetDailyCounts();
    
    // Reset RPM counts every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.resetMinuteCounts(), 60000);
      
      // Reset RPD counts at midnight
      setInterval(() => this.resetDailyCounts(), this.getMsUntilMidnight());
    }
  }

  /**
   * Check if a model is in cooldown period
   */
  isInCooldown(model: string): boolean {
    if (!this.cooldowns[model]) return false;
    
    const now = Date.now();
    if (now < this.cooldowns[model].until) {
      return true;
    }
    
    // Clear expired cooldown
    delete this.cooldowns[model];
    return false;
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  getCooldownTimeRemaining(model: string): number {
    if (!this.cooldowns[model]) return 0;
    
    const now = Date.now();
    const timeRemaining = this.cooldowns[model].until - now;
    
    return Math.max(0, timeRemaining);
  }

  /**
   * Track a request for rate limiting purposes
   */
  trackRequest(model: string, tokens?: number): void {
    if (!this.modelStats[model]) {
      this.modelStats[model] = {
        rpm: 0,
        rpd: 0,
        lastResetRpm: Date.now(),
        lastResetRpd: Date.now()
      };
    }
    
    this.modelStats[model].rpm += 1;
    this.modelStats[model].rpd += 1;
    
    const limits = this.getModelLimits(model);
    
    // Check if we've exceeded RPM limit
    if (this.modelStats[model].rpm >= limits.rpm) {
      const cooldownTime = 15000; // 15 seconds cooldown
      this.cooldowns[model] = {
        until: Date.now() + cooldownTime
      };
      
      toast.warning(`Rate limit reached for ${model}. Cooling down for 15 seconds.`);
    }
  }

  /**
   * Get the limits for a specific model
   */
  getModelLimits(model: string): { rpm: number; tpm: number; rpd: number } {
    const defaultLimits = { rpm: 2, tpm: 32000, rpd: 50 };
    
    switch (model) {
      case 'gemini-2.5-pro-exp':
        return { rpm: 2, tpm: 1000000, rpd: 50 };
      case 'gemini-2.0-flash':
        return { rpm: 15, tpm: 1000000, rpd: 1500 };
      case 'gemini-2.0-flash-exp':
        return { rpm: 10, tpm: 1000000, rpd: 1500 };
      case 'gemini-2.0-flash-lite':
        return { rpm: 30, tpm: 1000000, rpd: 1500 };
      case 'gemini-2.0-flash-thinking-exp':
        return { rpm: 10, tpm: 4000000, rpd: 1500 };
      case 'gemini-2.0-flash-thinking-exp-01-21': // Added explicit support for your model
        return { rpm: 10, tpm: 4000000, rpd: 1500 };
      case 'gemini-1.5-flash':
        return { rpm: 15, tpm: 1000000, rpd: 1500 };
      case 'gemini-1.5-flash-8b':
        return { rpm: 15, tpm: 1000000, rpd: 1500 };
      case 'gemini-1.5-pro':
        return { rpm: 2, tpm: 32000, rpd: 50 };
      default:
        return defaultLimits;
    }
  }

  /**
   * Get current usage statistics for a model
   */
  getModelStats(model: string): { rpm: number; rpd: number } {
    if (!this.modelStats[model]) {
      return { rpm: 0, rpd: 0 };
    }
    return {
      rpm: this.modelStats[model].rpm,
      rpd: this.modelStats[model].rpd
    };
  }

  /**
   * Reset minute-based counts
   */
  private resetMinuteCounts(): void {
    Object.keys(this.modelStats).forEach(model => {
      this.modelStats[model].rpm = 0;
      this.modelStats[model].lastResetRpm = Date.now();
    });
  }

  /**
   * Reset daily counts
   */
  private resetDailyCounts(): void {
    Object.keys(this.modelStats).forEach(model => {
      this.modelStats[model].rpd = 0;
      this.modelStats[model].lastResetRpd = Date.now();
    });
  }

  /**
   * Calculate milliseconds until midnight for daily reset
   */
  private getMsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }
}

// Create default rate limiter instance
const rateLimiter = new DefaultRateLimiter();

// Export all rate limiters
export {
  googleGenerativeAiLimiter,
  perKeyRateLimiter,
  isRateLimitingEnabled
};

// Default export for legacy components
export default rateLimiter;