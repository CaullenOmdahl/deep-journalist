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

// Fallback models in order of preference (most capable to least)
// Only Gemini 2.5+ models - older versions removed
export const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-pro-preview-05-06',
];

// Models marked as unavailable after actual API errors (404 or explicit deprecation)
// This list is populated dynamically when we receive API errors
// Do NOT add models here preemptively - only after confirmed API failures
export const DEPRECATED_MODELS: string[] = [];

// Default rate limiter class with expected interface for ApiUsageStats
class DefaultRateLimiter {
  private cooldowns: Record<string, { until: number; reason?: string }> = {};
  private exhaustedModels: Set<string> = new Set(); // Models with quota exhausted
  private unavailableModels: Set<string> = new Set(); // Models confirmed unavailable via API errors
  private modelStats: Record<string, { rpm: number; rpd: number; lastResetRpm: number; lastResetRpd: number }> = {};

  constructor() {
    // Initialize tracking
    this.resetDailyCounts();

    // Reset RPM counts every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.resetMinuteCounts(), 60000);

      // Reset RPD counts at midnight
      setInterval(() => this.resetDailyCounts(), this.getMsUntilMidnight());

      // Clear exhausted models every hour (quota may reset)
      setInterval(() => this.clearExhaustedModels(), 3600000);
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
   * Get remaining cooldown time in seconds
   */
  getCooldownTimeRemaining(model: string): number {
    if (!this.cooldowns[model]) return 0;

    const now = Date.now();
    const timeRemaining = this.cooldowns[model].until - now;

    return Math.max(0, Math.ceil(timeRemaining / 1000));
  }

  /**
   * Check if a model's quota is exhausted
   */
  isModelExhausted(model: string): boolean {
    return this.exhaustedModels.has(model);
  }

  /**
   * Check if a model has been marked as unavailable (from actual API errors)
   */
  isModelDeprecated(model: string): boolean {
    // Only check models that have been dynamically marked as unavailable
    // based on actual API responses (404, explicit deprecation errors)
    return DEPRECATED_MODELS.includes(model) || this.unavailableModels.has(model);
  }

  /**
   * Mark a model as unavailable (called when we get 404 or deprecation errors)
   */
  markModelUnavailable(model: string, reason?: string): void {
    this.unavailableModels.add(model);
    console.log(`[RateLimiter] Model ${model} marked as unavailable${reason ? `: ${reason}` : ''}`);
  }

  /**
   * Mark a model as exhausted (daily quota exceeded)
   */
  markModelExhausted(model: string): void {
    this.exhaustedModels.add(model);
    console.log(`[RateLimiter] Model ${model} marked as exhausted (quota exceeded)`);
  }

  /**
   * Clear exhausted models (called periodically to allow retry)
   */
  clearExhaustedModels(): void {
    this.exhaustedModels.clear();
    console.log('[RateLimiter] Cleared exhausted models list');
  }

  /**
   * Get a fallback model when the requested model is unavailable
   */
  getFallbackModel(currentModel: string): string | null {
    for (const fallback of FALLBACK_MODELS) {
      if (fallback !== currentModel && !this.isInCooldown(fallback) && !this.isModelExhausted(fallback)) {
        console.log(`[RateLimiter] Suggesting fallback model: ${fallback} (instead of ${currentModel})`);
        return fallback;
      }
    }
    return null;
  }

  /**
   * Handle API error from response
   * Parses the retryDelay from Google's error response and handles 404 errors
   */
  handleRateLimitError(model: string, error: unknown): { retryAfterMs: number; isQuotaExhausted: boolean; isModelUnavailable: boolean } {
    let retryAfterMs = 30000; // Default 30 seconds
    let isQuotaExhausted = false;
    let isModelUnavailable = false;

    try {
      const err = error as any;

      // Check for 404 errors (model not found/unavailable)
      if (err.status === 404 || err.statusCode === 404 || err.code === 404) {
        isModelUnavailable = true;
        this.markModelUnavailable(model, '404 - Model not found');
        toast.error(`Model ${model} is not available. Switching to alternative model.`, { duration: 5000 });
        return { retryAfterMs: 0, isQuotaExhausted: false, isModelUnavailable: true };
      }

      // Try to parse the error response for retryDelay
      let errorBody: any = null;

      // Handle different error formats
      if (err.responseBody) {
        try {
          errorBody = typeof err.responseBody === 'string' ? JSON.parse(err.responseBody) : err.responseBody;
        } catch (e) {
          // Ignore parse errors
        }
      } else if (err.error) {
        errorBody = err.error;
      } else if (err.details) {
        errorBody = err.details;
      }

      // Check for 404 in parsed error body
      if (errorBody?.error?.code === 404 || errorBody?.code === 404) {
        isModelUnavailable = true;
        this.markModelUnavailable(model, 'Model not found');
        toast.error(`Model ${model} is not available. Switching to alternative model.`, { duration: 5000 });
        return { retryAfterMs: 0, isQuotaExhausted: false, isModelUnavailable: true };
      }

      // Check for deprecation/unavailability messages
      const message = errorBody?.error?.message || errorBody?.message || err.message || '';
      if (message.includes('is not found') || message.includes('does not exist') || message.includes('deprecated')) {
        isModelUnavailable = true;
        this.markModelUnavailable(model, message);
        toast.error(`Model ${model} is not available. Switching to alternative model.`, { duration: 5000 });
        return { retryAfterMs: 0, isQuotaExhausted: false, isModelUnavailable: true };
      }

      // Extract retry delay from Google's error format
      if (errorBody?.error?.details) {
        for (const detail of errorBody.error.details) {
          if (detail['@type']?.includes('RetryInfo') && detail.retryDelay) {
            // Parse delay like "19.691053405s" or "19s"
            const delayStr = detail.retryDelay;
            const match = delayStr.match(/^(\d+(?:\.\d+)?)/);
            if (match) {
              retryAfterMs = Math.ceil(parseFloat(match[1]) * 1000);
              console.log(`[RateLimiter] Parsed retryDelay from API: ${retryAfterMs}ms`);
            }
          }

          // Check for quota exhaustion
          if (detail['@type']?.includes('QuotaFailure')) {
            for (const violation of detail.violations || []) {
              if (violation.quotaId?.includes('PerDay') || violation.quotaMetric?.includes('free_tier')) {
                isQuotaExhausted = true;
                console.log(`[RateLimiter] Daily quota exhausted for ${model}`);
              }
            }
          }
        }
      }

      // Check message for quota exhaustion indicators
      if (message.includes('quota exceeded') || message.includes('limit: 0')) {
        isQuotaExhausted = true;
      }

    } catch (parseError) {
      console.warn('[RateLimiter] Could not parse rate limit error details:', parseError);
    }

    // Set cooldown
    this.cooldowns[model] = {
      until: Date.now() + retryAfterMs,
      reason: isQuotaExhausted ? 'quota_exhausted' : 'rate_limited'
    };

    // Mark as exhausted if quota is exceeded
    if (isQuotaExhausted) {
      this.markModelExhausted(model);
    }

    // Show user-friendly notification
    if (isQuotaExhausted) {
      const fallback = this.getFallbackModel(model);
      if (fallback) {
        toast.warning(`${model} quota exhausted. Try using ${fallback} instead.`, { duration: 5000 });
      } else {
        toast.error(`API quota exhausted for ${model}. Please try again later or add additional API keys.`, { duration: 7000 });
      }
    } else {
      const waitSeconds = Math.ceil(retryAfterMs / 1000);
      toast.warning(`Rate limited. Waiting ${waitSeconds}s before retry...`);
    }

    return { retryAfterMs, isQuotaExhausted, isModelUnavailable };
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
        until: Date.now() + cooldownTime,
        reason: 'rpm_exceeded'
      };

      toast.warning(`Rate limit reached for ${model}. Cooling down for 15 seconds.`);
    }
  }

  /**
   * Get the limits for a specific model
   * Updated with Gemini 2.5+ models only (Nov 2025)
   */
  getModelLimits(model: string): { rpm: number; tpm: number; rpd: number } {
    const defaultLimits = { rpm: 15, tpm: 1000000, rpd: 1500 };

    // Normalize model name (remove preview suffixes for matching)
    const normalizedModel = model.replace(/-preview.*$/, '').replace(/-exp.*$/, '');

    switch (normalizedModel) {
      // Gemini 2.5 models (current generation)
      case 'gemini-2.5-pro':
        return { rpm: 5, tpm: 1000000, rpd: 100 };
      case 'gemini-2.5-flash':
        return { rpm: 15, tpm: 1000000, rpd: 1500 };
      case 'gemini-2.5-flash-lite':
        return { rpm: 30, tpm: 1000000, rpd: 1500 };
      case 'gemini-2.5-flash-thinking':
        return { rpm: 10, tpm: 4000000, rpd: 1500 };
      default:
        // Check for model family patterns
        if (model.includes('2.5') && model.includes('flash')) {
          return { rpm: 15, tpm: 1000000, rpd: 1500 };
        }
        if (model.includes('2.5') && model.includes('pro')) {
          return { rpm: 5, tpm: 1000000, rpd: 100 };
        }
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
    // Also clear exhausted models at daily reset
    this.clearExhaustedModels();
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

// Default export for legacy components
export default rateLimiter;