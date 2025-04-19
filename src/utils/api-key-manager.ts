/**
 * API Key Manager
 * 
 * This utility provides secure API key management including:
 * - Key rotation
 * - Usage tracking
 * - Rate limiting support
 */

interface ApiKeyUsage {
  key: string;
  usageCount: number;
  lastUsed: number;
  errorCount: number;
  lastError?: {
    timestamp: number;
    message: string;
    code?: string;
  };
}

class ApiKeyManager {
  private keys: string[] = [];
  private keyUsage: Map<string, ApiKeyUsage> = new Map();
  private currentKeyIndex = 0;
  
  constructor(apiKeys?: string | string[]) {
    if (apiKeys) {
      this.addKeys(apiKeys);
    }
  }

  /**
   * Add API keys to the manager
   */
  addKeys(keys: string | string[]): void {
    if (typeof keys === 'string') {
      // Split by commas and trim whitespace
      const keyArray = keys.split(',').map(key => key.trim()).filter(Boolean);
      this.keys.push(...keyArray);
      
      // Initialize usage tracking for each key
      keyArray.forEach(key => {
        if (!this.keyUsage.has(key)) {
          this.keyUsage.set(key, {
            key,
            usageCount: 0,
            lastUsed: 0,
            errorCount: 0
          });
        }
      });
    } else if (Array.isArray(keys)) {
      const validKeys = keys.filter(Boolean);
      this.keys.push(...validKeys);
      
      // Initialize usage tracking for each key
      validKeys.forEach(key => {
        if (!this.keyUsage.has(key)) {
          this.keyUsage.set(key, {
            key,
            usageCount: 0,
            lastUsed: 0,
            errorCount: 0
          });
        }
      });
    }
  }

  /**
   * Get the next API key using round-robin rotation
   */
  getNextKey(): string | null {
    if (this.keys.length === 0) {
      return null;
    }
    
    // Round-robin selection
    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    
    // Track usage
    if (key) {
      const usage = this.keyUsage.get(key) || {
        key,
        usageCount: 0,
        lastUsed: 0,
        errorCount: 0
      };
      
      usage.usageCount++;
      usage.lastUsed = Date.now();
      this.keyUsage.set(key, usage);
    }
    
    return key;
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return [...this.keys];
  }

  /**
   * Get the least used key (for load balancing)
   */
  getLeastUsedKey(): string | null {
    if (this.keys.length === 0) {
      return null;
    }
    
    let leastUsed = this.keys[0];
    let minUsage = Infinity;
    
    for (const key of this.keys) {
      const usage = this.keyUsage.get(key)?.usageCount || 0;
      if (usage < minUsage) {
        minUsage = usage;
        leastUsed = key;
      }
    }
    
    // Track usage
    if (leastUsed) {
      const usage = this.keyUsage.get(leastUsed) || {
        key: leastUsed,
        usageCount: 0,
        lastUsed: 0,
        errorCount: 0
      };
      
      usage.usageCount++;
      usage.lastUsed = Date.now();
      this.keyUsage.set(leastUsed, usage);
    }
    
    return leastUsed;
  }

  /**
   * Record an error for a specific key
   */
  recordError(key: string, errorMessage: string, errorCode?: string): void {
    const usage = this.keyUsage.get(key);
    if (usage) {
      usage.errorCount++;
      usage.lastError = {
        timestamp: Date.now(),
        message: errorMessage,
        code: errorCode
      };
      this.keyUsage.set(key, usage);
    }
  }

  /**
   * Get usage statistics for all keys
   */
  getKeyUsageStats(): ApiKeyUsage[] {
    return Array.from(this.keyUsage.values());
  }
  
  /**
   * Check if any API keys are available
   */
  hasKeys(): boolean {
    return this.keys.length > 0;
  }
}

// Create a singleton instance for the application
const apiKeyManager = new ApiKeyManager(
  typeof process !== 'undefined' && process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? process.env.GOOGLE_GENERATIVE_AI_API_KEY
    : undefined
);

export default apiKeyManager;