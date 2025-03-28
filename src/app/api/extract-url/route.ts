import { NextRequest, NextResponse } from 'next/server';
import { isValidUrl, getRandomUserAgent } from '@/utils/url-extractor';

export const runtime = 'edge';

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

/**
 * Extract content from a URL on the server side to avoid CORS issues
 * This is a basic implementation and should be enhanced with proper HTML parsing
 * libraries in a production environment.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        {
          error: 'Invalid URL',
          message: 'Please provide a valid URL',
        },
        { status: 400 }
      );
    }

    // Get a random user agent to reduce chances of being blocked
    const userAgent = getRandomUserAgent();

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch URL',
          message: `HTTP error: ${response.status}`,
          url,
        },
        { status: 500 }
      );
    }

    const html = await response.text();

    // Basic content extraction
    // In production, use a proper HTML parser like cheerio, jsdom, etc.
    const extractedContent = extractBasicContent(html, url);

    return NextResponse.json(extractedContent);
  } catch (error) {
    console.error('Error in URL extraction API:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Basic content extraction using regex
 * For production use, replace with a proper HTML parsing library
 */
function extractBasicContent(html: string, url: string): ExtractedContent {
  // Basic extraction using regex. This is not reliable for all sites.
  // In production, use proper HTML parsing.
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

  // Extract meta description
  const metaDescriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i);
  const excerpt = metaDescriptionMatch 
    ? metaDescriptionMatch[1].trim() 
    : getTextPreview(html);

  // Extract meta author
  const metaAuthorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["'](.*?)["'][^>]*>/i);
  const author = metaAuthorMatch ? metaAuthorMatch[1].trim() : undefined;

  // Extract meta publish date (multiple common formats)
  const publishDateMatches = [
    html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["'](.*?)["'][^>]*>/i),
    html.match(/<meta[^>]*name=["']published_time["'][^>]*content=["'](.*?)["'][^>]*>/i),
    html.match(/<meta[^>]*name=["']publication_date["'][^>]*content=["'](.*?)["'][^>]*>/i)
  ];
  const publishedDate = publishDateMatches.find(m => m)
    ? publishDateMatches.find(m => m)?.[1].trim()
    : undefined;

  // Extract meta image
  const metaImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["'][^>]*>/i);
  const imageUrl = metaImageMatch ? metaImageMatch[1].trim() : undefined;

  // Extract site name
  const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["'](.*?)["'][^>]*>/i);
  const siteName = siteNameMatch ? siteNameMatch[1].trim() : undefined;

  // Extract main content (very basic approach)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = '';
  
  if (bodyMatch) {
    // Remove scripts, styles, and comments
    content = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '');
    
    // Extract article or main content if present
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    
    if (articleMatch) {
      content = articleMatch[1];
    } else if (mainMatch) {
      content = mainMatch[1];
    }
    
    // Remove HTML tags and clean up
    content = content
      .replace(/<[^>]*>/g, ' ')    // Replace tags with space
      .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
      .trim();
  }

  return {
    title,
    author,
    publishedDate,
    content,
    siteName,
    url,
    excerpt,
    imageUrl
  };
}

/**
 * Get a text preview from HTML content
 */
function getTextPreview(html: string, maxLength = 150): string {
  // Remove HTML tags, then extract first paragraph of text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;
} 