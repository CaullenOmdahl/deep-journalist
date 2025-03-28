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

  // Mock response for the models endpoint
  const mockResponse = {
    models: [
      {
        name: "models/gemini-1.0-pro",
        version: "001",
        displayName: "Gemini 1.0 Pro",
        description: "The best model for multi-turn text and code chat.",
        inputTokenLimit: 30720,
        outputTokenLimit: 2048,
        supportedGenerationMethods: [
          "generateContent",
          "countTokens"
        ],
        temperature: 0.9,
        topP: 0.95,
        topK: 40
      },
      {
        name: "models/gemini-1.0-pro-vision",
        version: "001",
        displayName: "Gemini 1.0 Pro Vision",
        description: "The best model for multi-turn text, code, and vision chat.",
        inputTokenLimit: 12288,
        outputTokenLimit: 4096,
        supportedGenerationMethods: [
          "generateContent",
          "countTokens"
        ],
        temperature: 0.4,
        topP: 1,
        topK: 32
      },
      {
        name: "models/gemini-2.0-flash-thinking-exp",
        version: "001",
        displayName: "Gemini 2.0 Flash (Thinking)",
        description: "A fast, powerful multimodal model optimized for production use cases.",
        inputTokenLimit: 30720,
        outputTokenLimit: 8192,
        supportedGenerationMethods: [
          "streamGenerateContent",
          "generateContent",
          "countTokens"
        ],
        temperature: 0.9,
        topP: 0.95,
        topK: 32
      }
    ]
  };
  
  return NextResponse.json(mockResponse, { status: 200, headers });
} 