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
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  try {
    const url = `${API_PROXY_BASE_URL}/v1beta/models?key=${apiKey}`;
    console.log(`Making request to Google API: ${url.replace(apiKey, "REDACTED")}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Error fetching models: ${response.statusText}`, details: errorText },
        { status: response.status, headers }
      );
    }
    
    const data = await response.json();
    console.log("Successfully fetched models");
    
    return NextResponse.json(data, { status: 200, headers });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Error fetching models", details: error.message || "Unknown error" },
      { status: 500, headers }
    );
  }
} 