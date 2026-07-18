import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Lightweight structured logger
// Uses Winston when available, otherwise falls back to a formatted console
// implementation so the app never hard-crashes if the dependency is missing.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let logger;

try {
  const winston = (await import('winston')).default;

  const { combine, timestamp, printf, colorize, errors } = winston.format;

  const logDir = path.join(__dirname, '..', '..', 'logs');

  const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp: ts, level, message, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${ts} ${level}: ${stack || message}${metaStr}`;
    })
  );

  const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    winston.format.json()
  );

  const isProduction = process.env.NODE_ENV === 'production';

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'restaurant-platform' },
    transports: [
      new winston.transports.Console(),
      ...(isProduction
        ? [
            new winston.transports.File({
              filename: path.join(logDir, 'error.log'),
              level: 'error',
              maxsize: 5 * 1024 * 1024,
              maxFiles: 5
            }),
            new winston.transports.File({
              filename: path.join(logDir, 'combined.log'),
              maxsize: 10 * 1024 * 1024,
              maxFiles: 10
            })
          ]
        : [])
    ]
  });
} catch {
  // Fallback when winston is not installed yet
  const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
  const colors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    http: '\x1b[35m',
    debug: '\x1b[90m',
    reset: '\x1b[0m'
  };

  const configuredLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

  const makeLog = (level) => (message, meta = {}) => {
    if (levels[level] > levels[configuredLevel]) return;
    const ts = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const c = colors[level] || '';
    console.log(`${c}${ts} [${level.toUpperCase()}]${colors.reset} ${message}${metaStr}`);
  };

  logger = {
    error: makeLog('error'),
    warn: makeLog('warn'),
    info: makeLog('info'),
    http: makeLog('http'),
    debug: makeLog('debug')
  };
}

export default logger;
