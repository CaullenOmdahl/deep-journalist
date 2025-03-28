/**
 * URL Content Extractor
 * Provides functionality to fetch and extract content from web pages.
 */

interface ExtractedContent {
  title: string;
  author?: string;
  publishedDate?: string;
  content: string;
  siteName?: string;
  url: string;
  excerpt?: string;
  imageUrl?: string;
  failureReason?: string;
}

interface ExtractionOptions {
  fullContent?: boolean;
  followRedirects?: boolean;
  timeout?: number;
  userAgent?: string;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  fullContent: true,
  followRedirects: true,
  timeout: 10000, // 10 seconds
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

/**
 * Common user agents for rotation to avoid being blocked
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

/**
 * Get a random user agent from the list
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Extract content from a URL
 * @param url The URL to extract content from
 * @param options Extraction options
 */
export async function extractUrlContent(
  url: string,
  options: ExtractionOptions = {}
): Promise<ExtractedContent> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  if (!isValidUrl(url)) {
    return {
      title: 'Invalid URL',
      content: '',
      url,
      failureReason: 'Invalid URL format'
    };
  }

  try {
    // In a client-side environment, we need to use a proxy or server-side API
    // because of CORS restrictions. This is a simple implementation that should
    // be replaced with a server endpoint in production.
    
    // For now, we'll use a mock implementation that returns a message indicating
    // the need for a server implementation
    return {
      title: 'Server-side extraction needed',
      content: 'This functionality requires a server-side implementation due to CORS restrictions. Please implement an API endpoint on your server to fetch and extract content from URLs.',
      url,
      excerpt: 'Implementation required',
      failureReason: 'Client-side extraction not possible due to CORS restrictions'
    };
    
    // A real implementation would use fetch with appropriate headers:
    /*
    const response = await fetch(url, {
      headers: {
        'User-Agent': mergedOptions.userAgent || getRandomUserAgent()
      },
      redirect: mergedOptions.followRedirects ? 'follow' : 'manual',
      signal: AbortSignal.timeout(mergedOptions.timeout || DEFAULT_OPTIONS.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML and extract content
    // This would be done using a library like cheerio or similar
    // For a complete implementation
    
    return {
      title: extractedTitle,
      author: extractedAuthor,
      publishedDate: extractedDate,
      content: extractedContent,
      siteName: extractedSiteName,
      url,
      excerpt: extractedExcerpt,
      imageUrl: extractedImageUrl
    };
    */
  } catch (error) {
    console.error('Error extracting content from URL:', error);
    return {
      title: 'Extraction Failed',
      content: '',
      url,
      failureReason: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * API route handler for URL content extraction
 * This would be implemented as a server-side API endpoint
 */
export async function extractUrlContentFromServer(url: string): Promise<ExtractedContent> {
  // This is a placeholder for a server-side implementation
  // In a real application, this would make a fetch request to a backend API
  try {
    const response = await fetch('/api/extract-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      throw new Error(`API error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling extraction API:', error);
    return {
      title: 'API Extraction Failed',
      content: '',
      url,
      failureReason: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Extract domain name from URL
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Check if the URL is from a potential paywall site
 * This is a basic check that should be expanded with a more comprehensive list
 */
export function isPotentialPaywallSite(url: string): boolean {
  const paywallDomains = [
    'nytimes.com',
    'wsj.com',
    'ft.com',
    'economist.com',
    'washingtonpost.com',
    'newyorker.com',
    'bloomberg.com',
    'thetimes.co.uk',
  ];
  
  const domain = extractDomainFromUrl(url);
  return paywallDomains.some(paywallDomain => domain.includes(paywallDomain));
}

export default {
  extractUrlContent,
  extractUrlContentFromServer,
  isValidUrl,
  getRandomUserAgent,
  extractDomainFromUrl,
  isPotentialPaywallSite
}; 