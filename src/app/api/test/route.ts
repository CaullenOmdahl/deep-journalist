import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // Add CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY as string;
  const API_PROXY_BASE_URL = process.env.API_PROXY_BASE_URL || "https://generativelanguage.googleapis.com";

  if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500, headers }
    );
  }

  const apiKeys = GOOGLE_GENERATIVE_AI_API_KEY.split(",");
  const results = [];
  
  for (const apiKey of apiKeys) {
    try {
      const url = `${API_PROXY_BASE_URL}/v1beta/models?key=${apiKey}`;
      console.log(`Testing key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      let result;
      try {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch (e) {
          result = { rawResponse: text };
        }
      } catch (e) {
        result = { error: "Failed to parse response" };
      }
      
      results.push({
        key: `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`,
        status: response.status,
        ok: response.ok,
        result: response.ok ? { success: true } : result,
      });
    } catch (error) {
      results.push({
        key: `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`,
        error: error.message || "Unknown error",
      });
    }
  }
  
  return NextResponse.json({ results }, { status: 200, headers });
} 