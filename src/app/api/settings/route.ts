import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get server environment variables
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const apiProxy = process.env.API_PROXY_BASE_URL || "";
    const accessPassword = process.env.ACCESS_PASSWORD || "";

    // Return only what's needed by the client
    return NextResponse.json({
      apiKey,
      apiProxy,
      accessPassword,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch server settings",
      },
      { status: 500 }
    );
  }
} 