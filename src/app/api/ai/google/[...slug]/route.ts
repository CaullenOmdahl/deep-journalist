import { NextRequest, NextResponse } from "next/server";
import { shuffle } from "radash";

export const runtime = "edge";
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

const GOOGLE_GENERATIVE_AI_API_KEY = process.env
  .GOOGLE_GENERATIVE_AI_API_KEY as string;
const API_PROXY_BASE_URL =
  process.env.API_PROXY_BASE_URL || "https://generativelanguage.googleapis.com";

async function handler(req: NextRequest) {
  // Add CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-goog-api-key, x-goog-api-client");
  headers.set("Access-Control-Max-Age", "86400");
  
  // Add specific domain in case of restriction
  const refererHeader = req.headers.get("referer");
  console.log("Referer:", refererHeader);

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { 
      status: 204,
      headers 
    });
  }

  const apiKeys = GOOGLE_GENERATIVE_AI_API_KEY.split(",");
  if (!apiKeys[0]) {
    console.error("No API key found");
    return NextResponse.json(
      { code: 401, message: "API key is required" },
      { status: 401, headers }
    );
  }

  const { searchParams } = new URL(req.url);
  const path = req.url.split("/api/ai/google/")[1].split("?")[0].split("/");
  const params = searchParams.toString();
  const body = req.headers.get("Content-Type")?.includes("application/json")
    ? await req.json()
    : undefined;

  console.log("API Request:", {
    method: req.method,
    path,
    params,
    hasBody: !!body,
    apiKeyLength: apiKeys[0].length,
    url: req.url
  });

  try {
    // Construct the URL without adding extra slug parameters
    let url = `${API_PROXY_BASE_URL}/${path.join("/")}`;
    
    // Create a new URLSearchParams object for the query
    const queryParams = new URLSearchParams();
    
    // Add the API key as a query parameter
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
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
    
    console.log("Making request to:", url.replace(apiKey, 'REDACTED'));
    console.log("Full request path:", req.url);
    
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

    console.log("Request headers:", requestHeaders);
    
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
        
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: url.replace(apiKey, 'REDACTED'),
          error: errorData
        });
        
        // Return a more detailed error
        return NextResponse.json({
          code: response.status,
          message: errorData.error?.message || response.statusText,
          details: errorData
        }, { status: response.status, headers });
      }
      
      console.log("API Response Status:", response.status);
      
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
      console.error("Fetch Error:", fetchError);
      return NextResponse.json(
        { code: 500, message: fetchError.message || "Failed to fetch from Google AI API" },
        { status: 500, headers }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500, headers }
      );
    }
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
