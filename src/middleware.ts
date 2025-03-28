import { NextRequest, NextResponse } from 'next/server';
import { isEqual } from "radash";

// Define protected routes
const apiRoutes = ["/api/ai/", "/api/callback"];

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://lz2c5b0.glddns.com:3000",
];

export function middleware(request: NextRequest) {
  // Get the referer header
  const referer = request.headers.get('referer') || '';
  console.log('Referer:', referer);

  // Check if the request is to the API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('API request to:', request.nextUrl.pathname);
    
    // Clone the headers to avoid modifying the original
    const requestHeaders = new Headers(request.headers);
    
    // Add our API key header to all requests
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (apiKey) {
      requestHeaders.set('x-goog-api-key', apiKey.split(',')[0]);
    }
    
    // Continue to the next middleware/API route with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  for (const apiRoute of apiRoutes) {
    if (request.nextUrl.pathname.startsWith(apiRoute)) {
      const origin = request.headers.get("origin") ?? "";
      const accessPassword = request.headers.get("x-access-password");
      const requireAuthByEnv = process.env.ACCESS_PASSWORD?.length ?? 0 > 0;

      if (
        !requireAuthByEnv ||
        isEqual(accessPassword, process.env.ACCESS_PASSWORD)
      ) {
        return handleCors(request, origin);
      } else {
        return NextResponse.json(
          { code: 401, message: "Unauthorized" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

function handleCors(request: NextRequest, origin: string) {
  // Check if the origin is allowed
  const isAllowedOrigin =
    !origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:");
  const isCorsRequest = request.method === "OPTIONS";

  // For CORS preflight requests
  if (isCorsRequest) {
    const headers = new Headers();
    // Always enable CORS
    headers.set("Access-Control-Allow-Origin", isAllowedOrigin ? origin : allowedOrigins[0]);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Access-Control-Max-Age", "86400");

    return new NextResponse(null, { status: 204, headers });
  }

  // For actual requests, append CORS headers
  const response = NextResponse.next();
  response.headers.set(
    "Access-Control-Allow-Origin",
    isAllowedOrigin ? origin : allowedOrigins[0]
  );
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "*");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

// Configure the middleware to run for API requests only
export const config = {
  matcher: '/api/:path*',
}
