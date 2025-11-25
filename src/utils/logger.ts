/**
 * Deep Journalist Logger
 *
 * Universal logger that works in all environments:
 * - Browser client-side
 * - Node.js server-side
 * - Edge Runtime API routes
 *
 * Note: File logging is disabled to ensure Edge Runtime compatibility.
 * Logs are output to console only.
 */

// Determine runtime environment
const isServer = typeof window === 'undefined';

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
function formatMessage(level: string, ...args: unknown[]): string {
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
  return (...args: unknown[]) => {
    // Skip logging if below configured level
    if (level < config.level) return;

    // Format the message
    const formattedMsg = formatMessage(levelName, ...args);

    // Get the console method to use
    const consoleMethod = levelName === 'debug' ? 'log' : levelName as 'log' | 'info' | 'warn' | 'error';

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
            content = args.map(String).join(' ');
          }
        }

        console[consoleMethod](`${timestampPart}${levelPart}${content}`);
      } else {
        console[consoleMethod](formattedMsg);
      }
    } else {
      // Client-side logging
      console[consoleMethod](`[CLIENT]${formattedMsg}`);

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
                timestamp: new Date().toISOString(),
                source: 'client',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
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

// Create the logger functions
const debug = createLogger(LogLevel.DEBUG, 'debug');
const info = createLogger(LogLevel.INFO, 'info');
const warn = createLogger(LogLevel.WARN, 'warn');
const error = createLogger(LogLevel.ERROR, 'error');

// Export the logger instance
const logger = {
  debug,
  info,
  warn,
  error,
  configure
};

export default logger;
