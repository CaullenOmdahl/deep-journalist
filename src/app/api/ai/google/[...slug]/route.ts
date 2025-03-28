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
  headers.set("Access-Control-Allow-Headers", "*");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { headers });
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
    apiKeyLength: apiKeys[0].length
  });

  try {
    // Construct the URL without adding extra slug parameters
    let url = `${API_PROXY_BASE_URL}/${path.join("/")}`;
    if (params) {
      // Filter out any slug parameters from the search params
      const cleanParams = new URLSearchParams(params);
      const paramsToRemove = ['slug'];
      
      paramsToRemove.forEach(param => {
        // Remove all occurrences of each param
        for (const key of Array.from(cleanParams.keys())) {
          if (key === param) {
            cleanParams.delete(key);
          }
        }
      });
      
      const cleanParamsString = cleanParams.toString();
      if (cleanParamsString) {
        url += `?${cleanParamsString}`;
      }
    }
    
    console.log("Making request to:", url);
    
    // Detect if this is a streaming request for SSE
    const isStreamRequest = url.includes('streamGenerateContent') || searchParams.get('alt') === 'sse';
    
    // Set content type for SSE if needed
    if (isStreamRequest) {
      headers.set('Content-Type', 'text/event-stream');
      headers.set('Cache-Control', 'no-cache');
      headers.set('Connection', 'keep-alive');
    }
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        "x-goog-api-client":
          req.headers.get("x-goog-api-client") || "genai-js/0.24.0",
        "x-goog-api-key": apiKeys[0],
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      return NextResponse.json(errorData, { status: response.status, headers });
    }
    
    console.log("API Response Status:", response.status);
    
    // Create a new response with the original response body but with our CORS headers
    const newResponse = new NextResponse(response.body, response);
    
    // Add CORS headers to the response
    headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
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
