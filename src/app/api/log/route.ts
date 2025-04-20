import { NextRequest, NextResponse } from "next/server";
import logger from "@/utils/logger";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to get log data
    const logData = await req.json();
    const { level = 'info', message, context = {} } = logData;
    
    // Validate log level
    const validLevels = ['debug', 'info', 'warn', 'error'];
    const logLevel = validLevels.includes(level) ? level : 'info';
    
    // Add source context to indicate this came from client
    const logContext = {
      ...context,
      source: 'client',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    // Log with the appropriate level
    logger[logLevel as 'debug' | 'info' | 'warn' | 'error'](message, logContext);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing client log:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}