import { NextRequest, NextResponse } from "next/server";
import logger from "@/utils/logger";

export const runtime = "edge";
export const preferredRegion = [
  "cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1",
];

const API_PROXY_BASE_URL = 
  process.env.API_PROXY_BASE_URL || "https://generativelanguage.googleapis.com";

async function handler(req: NextRequest) {
  // Add CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-goog-api-key, x-goog-api-client, x-api-key");
  headers.set("Access-Control-Max-Age", "86400");
  
  // Handle preflight request
  if (req.method === "OPTIONS") {
    logger.debug("Handling OPTIONS preflight request");
    return new NextResponse(null, { 
      status: 204,
      headers 
    });
  }

  const { searchParams } = new URL(req.url);
  
  // Extract the path properly for Edge Runtime
  let pathPart = req.url.split("/api/ai/google/")[1];
  if (!pathPart) {
    logger.error("Invalid API route format");
    return NextResponse.json(
      { code: 400, message: "Invalid API route format" },
      { status: 400, headers }
    );
  }
  
  // Extract the path without breaking at colons
  const pathWithoutQuery = pathPart.split("?")[0];
  
  // Handle paths with colons (like :streamGenerateContent)
  let path = pathWithoutQuery.split("/");
  
  const params = searchParams.toString();
  const body = req.headers.get("Content-Type")?.includes("application/json")
    ? await req.json()
    : undefined;

  logger.info("API Request:", {
    method: req.method,
    path,
    params,
    hasBody: !!body,
    url: req.url
  });

  try {
    // IMPROVED API KEY RETRIEVAL APPROACH:
    // 1. Try to get API key from header (primary source)
    let apiKey = req.headers.get("x-api-key") || req.headers.get("x-goog-api-key");
    
    // 2. If not in header, check cookies
    if (!apiKey) {
      const cookieApiKey = req.cookies.get("google_api_key");
      if (cookieApiKey) {
        apiKey = cookieApiKey.value;
        logger.info("Retrieved API key from cookie");
      }
    }
    
    // If we found a key, log it (masked)
    if (apiKey) {
      const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
      logger.info(`Using API key: ${maskedKey}`);
    } else {
      // No key available
      logger.error("No API key found in request header or cookies");
      return NextResponse.json(
        { code: 401, message: "API key is required. Please provide your own in the settings." },
        { status: 401, headers }
      );
    }
    
    // Construct the URL for proxying to Google API
    let url = `${API_PROXY_BASE_URL}/${path.join("/")}`;
    
    // Create a new URLSearchParams object for the query
    const queryParams = new URLSearchParams();
    
    // Add the API key as a query parameter
    queryParams.set('key', apiKey);
    
    // Add any existing query parameters
    if (params) {
      const existingParams = new URLSearchParams(params);
      existingParams.forEach((value, key) => {
        if (key !== 'slug') {
          queryParams.append(key, value);
        }
      });
    }
    
    // Append all query parameters to the URL
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    // Log the request (with masked key)
    const maskedKey = apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : 'none';
    logger.info(`Making request to: ${url.replace(apiKey, 'REDACTED')} [maskedKey=${maskedKey}]`);
    
    // Detect if this is a streaming request for SSE
    const isStreamRequest = url.includes('streamGenerateContent') || searchParams.get('alt') === 'sse';
    
    // Set content type for SSE if needed
    if (isStreamRequest) {
      headers.set('Content-Type', 'text/event-stream');
      headers.set('Cache-Control', 'no-cache');
      headers.set('Connection', 'keep-alive');
    }

    const requestHeaders = {
      "Content-Type": req.headers.get("Content-Type") || "application/json",
      "x-goog-api-client": req.headers.get("x-goog-api-client") || "genai-js/0.24.0",
    };
    
    try {
      const response = await fetch(url, {
        method: req.method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch(e) {
          errorData = { rawError: errorText };
        }
        
        logger.error(`Error: status=${response.status} url=${url.replace(apiKey, 'REDACTED')} error=${JSON.stringify(errorData)}`);
                
        // Return a more detailed error
        return NextResponse.json({
          code: response.status,
          message: errorData.error?.message || response.statusText,
          details: errorData
        }, { status: response.status, headers });
      }
      
      logger.info("API Response Status:", response.status);
      
      // Create a new response with the original response body but with our CORS headers
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      // Add CORS headers to the response
      headers.forEach((value, key) => {
        newResponse.headers.set(key, value);
      });
      
      return newResponse;
    } catch (fetchError) {
      logger.error(`Fetch Error: ${fetchError} [maskedKey=${maskedKey}]`);
      
      return NextResponse.json(
        { code: 500, message: fetchError.message || "Failed to fetch from Google AI API" },
        { status: 500, headers }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("API Error:", error);
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500, headers }
      );
    }
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
