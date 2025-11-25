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

  // Mock response for the models endpoint - Gemini 2.5+ only
  const mockResponse = {
    models: [
      {
        name: "models/gemini-2.5-flash",
        version: "001",
        displayName: "Gemini 2.5 Flash",
        description: "Fast, efficient model for everyday tasks with excellent performance.",
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: [
          "streamGenerateContent",
          "generateContent",
          "countTokens"
        ],
        temperature: 0.9,
        topP: 0.95,
        topK: 40
      },
      {
        name: "models/gemini-2.5-pro",
        version: "001",
        displayName: "Gemini 2.5 Pro",
        description: "Most capable model for complex reasoning and analysis tasks.",
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: [
          "streamGenerateContent",
          "generateContent",
          "countTokens"
        ],
        temperature: 0.9,
        topP: 0.95,
        topK: 40
      },
      {
        name: "models/gemini-2.5-flash-preview-05-20",
        version: "preview",
        displayName: "Gemini 2.5 Flash (Preview)",
        description: "Preview version of Gemini 2.5 Flash with latest improvements.",
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: [
          "streamGenerateContent",
          "generateContent",
          "countTokens"
        ],
        temperature: 0.9,
        topP: 0.95,
        topK: 40
      }
    ]
  };
  
  return NextResponse.json(mockResponse, { status: 200, headers });
} 