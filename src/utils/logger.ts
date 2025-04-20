/**
 * Deep Journalist Logger
 * 
 * Universal logger that works in all environments:
 * - Browser client-side
 * - Node.js server-side
 * - Edge Runtime API routes
 */

// Determine runtime environment
const isServer = typeof window === 'undefined';
const isEdgeRuntime = isServer && typeof process !== 'undefined' && !('version' in process);
const isNodeRuntime = isServer && !isEdgeRuntime;

// Log levels with their corresponding priorities
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  useColors: boolean;
  includeTimestamps: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  useColors: true,
  includeTimestamps: true
};

// ANSI Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  timestamp: '\x1b[90m', // Grey
};

// Current configuration
let config: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the logger
 */
function configure(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
  return config;
}

/**
 * Format a message with timestamp if configured
 */
function formatMessage(level: string, ...args: any[]): string {
  const timestamp = config.includeTimestamps 
    ? `[${new Date().toISOString()}] ` 
    : '';

  // Format objects for better readability
  const formatted = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(arg);
  }).join(' ');
  
  return `${timestamp}[${level.toUpperCase()}] ${formatted}`;
}

/**
 * Create a logger function for the specified level
 */
function createLogger(level: LogLevel, levelName: string) {
  return (...args: any[]) => {
    // Skip logging if below configured level
    if (level < config.level) return;

    // Format the message
    const formattedMsg = formatMessage(levelName, ...args);
    
    if (isServer) {
      // Server-side logging (both Node.js and Edge Runtime)
      if (config.useColors) {
        const color = COLORS[levelName as keyof typeof COLORS] || '';
        const timestampPart = config.includeTimestamps 
          ? `${COLORS.timestamp}[${new Date().toISOString()}]${COLORS.reset} ` 
          : '';
        const levelPart = `${color}[${levelName.toUpperCase()}]${COLORS.reset} `;
        
        let content = '';
        if (args.length === 1 && typeof args[0] === 'string') {
          content = args[0];
        } else {
          try {
            content = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
          } catch (e) {
            content = args.join(' ');
          }
        }
        
        console[levelName as 'log' | 'info' | 'warn' | 'error'](
          `${timestampPart}${levelPart}${content}`
        );
      } else {
        console[levelName as 'log' | 'info' | 'warn' | 'error'](formattedMsg);
      }
      
      // Only write to log files for Node.js runtime, not Edge runtime
      if (isNodeRuntime) {
        writeToLogFile(formattedMsg);
      }
    } else {
      // Client-side logging
      console[levelName as 'log' | 'info' | 'warn' | 'error'](`[CLIENT]${formattedMsg}`);
      
      // Send to server logger API if in browser
      if (typeof fetch !== 'undefined') {
        try {
          fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              level: levelName, 
              message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
              context: {
                url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                timestamp: new Date().toISOString()
              }
            }),
          }).catch(() => {
            // Silently fail to avoid cascading errors
          });
        } catch (err) {
          // If anything goes wrong with fetch, just ignore it
        }
      }
    }
  };
}

/**
 * Safely write to a log file - only called in Node.js environment
 * 
 * IMPORTANT: This function must NOT be called or referenced in Edge Runtime!
 */
function writeToLogFile(message: string): void {
  // Skip file logging in Edge Runtime or browser
  if (typeof process === 'undefined' || typeof window !== 'undefined' || isEdgeRuntime) {
    return; // Skip file logging in browser or Edge Runtime
  }
  
  try {
    // Dynamic imports to prevent Edge Runtime errors
    // Only import these in a Node.js environment
    if (isNodeRuntime) {
      const fs = require('fs');
      const path = require('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      
      if (!fs.existsSync(logDir)) {
        try {
          fs.mkdirSync(logDir, { recursive: true });
        } catch (err) {
          console.error('Failed to create logs directory:', err);
          return;
        }
      }
      
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const logFile = path.join(logDir, `server-${dateStr}.log`);
      
      fs.appendFileSync(logFile, message + '\n');
    }
  } catch (e) {
    // Silently handle errors in Edge Runtime
    console.error('Error writing to log file (likely in Edge Runtime):', e);
  }
}

// Create the logger functions
const debug = createLogger(LogLevel.DEBUG, 'debug');
const info = createLogger(LogLevel.INFO, 'info');
const warn = createLogger(LogLevel.WARN, 'warn');
const error = createLogger(LogLevel.ERROR, 'error');

// Log initialization in appropriate environment
if (isServer) {
  if (isEdgeRuntime) {
    info('Edge Runtime logger initialized');
  } else {
    info('Node.js server-side logger initialized');
  }
} else {
  info('Client-side logger initialized');
}

// Export the logger instance
const logger = {
  debug,
  info,
  warn,
  error,
  configure
};

export default logger;