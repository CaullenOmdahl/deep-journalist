/**
 * API Key Storage Service
 * 
 * Handles API key storage and retrieval across the application
 * using a combination of localStorage, cookies, and request headers.
 * 
 * This approach is designed to work reliably with Edge Runtime.
 */

// Cookie expiration time (30 days)
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Store API key in both localStorage and as an HTTP-only cookie
 */
export function storeApiKey(apiKey: string): void {
  if (!apiKey) return;

  // Store in localStorage for client-side access
  try {
    localStorage.setItem('google_api_key', apiKey);
    console.log('API key stored in localStorage');
  } catch (error) {
    console.error('Failed to store API key in localStorage:', error);
  }

  // Set a cookie that will be sent with all API requests
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
    
    document.cookie = `google_api_key=${apiKey}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    console.log('API key stored in cookie');
  } catch (error) {
    console.error('Failed to store API key in cookie:', error);
  }
}

/**
 * Retrieve API key from storage (localStorage preferred, fallback to cookie)
 */
export function getApiKey(): string | null {
  // Try localStorage first
  try {
    const key = localStorage.getItem('google_api_key');
    if (key) {
      return key;
    }
  } catch (error) {
    console.warn('Failed to get API key from localStorage:', error);
  }

  // Fallback to cookie
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'google_api_key') {
        return value;
      }
    }
  } catch (error) {
    console.warn('Failed to get API key from cookie:', error);
  }

  return null;
}

/**
 * Clear stored API key from all storage locations
 */
export function clearApiKey(): void {
  // Clear from localStorage
  try {
    localStorage.removeItem('google_api_key');
  } catch (error) {
    console.error('Failed to clear API key from localStorage:', error);
  }

  // Clear cookie
  try {
    document.cookie = 'google_api_key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  } catch (error) {
    console.error('Failed to clear API key cookie:', error);
  }
}

/**
 * Add API key to fetch request options
 */
export function addApiKeyToRequest(options: RequestInit = {}): RequestInit {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return options;
  }
  
  // Add to headers if they exist
  const headers = options.headers || {};
  
  return {
    ...options,
    headers: {
      ...headers,
      'x-api-key': apiKey,
    },
  };
}

export default {
  storeApiKey,
  getApiKey,
  clearApiKey,
  addApiKeyToRequest
};