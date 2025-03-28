import { toast } from "sonner";

// Rate limits for free tier from https://ai.google.dev/gemini-api/docs/rate-limits
const MODEL_RATE_LIMITS: Record<string, { rpm: number; tpm: number; rpd: number }> = {
  "gemini-2.5-pro-exp": { rpm: 2, tpm: 1000000, rpd: 50 },
  "gemini-2.0-flash": { rpm: 15, tpm: 1000000, rpd: 1500 },
  "gemini-2.0-flash-exp": { rpm: 10, tpm: 1000000, rpd: 1500 },
  "gemini-2.0-flash-lite": { rpm: 30, tpm: 1000000, rpd: 1500 },
  "gemini-2.0-flash-thinking-exp": { rpm: 10, tpm: 4000000, rpd: 1500 },
  "gemini-1.5-flash": { rpm: 15, tpm: 1000000, rpd: 1500 },
  "gemini-1.5-flash-8b": { rpm: 15, tpm: 1000000, rpd: 1500 },
  "gemini-1.5-pro": { rpm: 2, tpm: 32000, rpd: 50 },
  // Default conservative limits if model not found
  "default": { rpm: 2, tpm: 32000, rpd: 50 }
};

// Track requests per model
interface RequestRecord {
  timestamp: number;
  tokens?: number;
}

class RateLimiter {
  private requestsByModel: Record<string, RequestRecord[]> = {};
  private cooldowns: Record<string, number> = {};

  // Check if a model is in cooldown
  isInCooldown(model: string): boolean {
    const now = Date.now();
    const cooldownUntil = this.cooldowns[model] || 0;
    return now < cooldownUntil;
  }

  // Get cooldown time remaining in seconds
  getCooldownTimeRemaining(model: string): number {
    if (!this.isInCooldown(model)) return 0;
    
    const now = Date.now();
    const cooldownUntil = this.cooldowns[model] || 0;
    return Math.ceil((cooldownUntil - now) / 1000);
  }

  // Track a new request
  trackRequest(model: string, tokens?: number): void {
    if (!this.requestsByModel[model]) {
      this.requestsByModel[model] = [];
    }
    
    this.requestsByModel[model].push({
      timestamp: Date.now(),
      tokens
    });
    
    // Clean up old records (older than 24 hours)
    this.cleanup();
  }

  // Clean up old request records
  private cleanup(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    Object.keys(this.requestsByModel).forEach(model => {
      this.requestsByModel[model] = this.requestsByModel[model].filter(
        record => record.timestamp > oneDayAgo
      );
    });
  }

  // Check if making a request would exceed rate limits
  canMakeRequest(model: string): boolean {
    if (this.isInCooldown(model)) {
      return false;
    }
    
    const limits = model in MODEL_RATE_LIMITS ? MODEL_RATE_LIMITS[model] : MODEL_RATE_LIMITS.default;
    const requests = this.requestsByModel[model] || [];
    
    // Check RPM (requests per minute)
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const requestsLastMinute = requests.filter(r => r.timestamp > oneMinuteAgo).length;
    
    if (requestsLastMinute >= limits.rpm) {
      this.setCooldown(model, "rpm");
      return false;
    }
    
    // Check RPD (requests per day)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const requestsLastDay = requests.filter(r => r.timestamp > oneDayAgo).length;
    
    if (requestsLastDay >= limits.rpd) {
      this.setCooldown(model, "rpd");
      return false;
    }
    
    return true;
  }

  // Handle a rate limit error and set appropriate cooldown
  handleRateLimitError(model: string, error: unknown): void {
    console.error(`Rate limit exceeded for model ${model}:`, error);
    
    // Check if error message contains retry-after header or information
    let retryAfterSeconds = 60; // Default 1 minute cooldown
    
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      if (errorObj?.response?.headers?.['retry-after']) {
        retryAfterSeconds = parseInt(errorObj.response.headers['retry-after'], 10);
      } else if (errorObj?.message?.includes('overloaded')) {
        retryAfterSeconds = 300; // 5 minutes for overloaded model
      } else if (errorObj?.message?.includes('Rate limit')) {
        retryAfterSeconds = 120; // 2 minutes for rate limit
      }
    }
    
    // Set cooldown with the retry-after value
    this.cooldowns[model] = Date.now() + (retryAfterSeconds * 1000);
    
    // Notify user
    toast.error(`Rate limit exceeded for ${model}. Cooling down for ${retryAfterSeconds} seconds.`);
  }

  // Set cooldown based on which limit was exceeded
  private setCooldown(model: string, limitType: 'rpm' | 'rpd'): void {
    let cooldownSeconds = 0;
    
    if (limitType === 'rpm') {
      // For RPM limits, cool down for the remainder of the minute plus 5s buffer
      cooldownSeconds = 65; 
    } else if (limitType === 'rpd') {
      // For RPD limits, cool down for a longer period (6 hours)
      cooldownSeconds = 6 * 60 * 60;
    }
    
    this.cooldowns[model] = Date.now() + (cooldownSeconds * 1000);
    
    // Notify user
    toast.error(`${limitType.toUpperCase()} limit reached for ${model}. Cooling down for ${Math.ceil(cooldownSeconds/60)} minutes.`);
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter();

export default rateLimiter; 