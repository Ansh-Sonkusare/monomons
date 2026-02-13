type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Use localStorage for frontend log level persistence
const getStoredLevel = (): LogLevel => {
  if (typeof window === 'undefined') return 'info';
  return (localStorage.getItem('LOG_LEVEL') as LogLevel) || 'info';
};

let currentLevel = getStoredLevel();

export const setLogLevel = (level: LogLevel) => {
  currentLevel = level;
  if (typeof window !== 'undefined') {
    localStorage.setItem('LOG_LEVEL', level);
  }
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(context: string, message: string): string {
  const timestamp = new Date().toLocaleTimeString();
  return `[${timestamp}] [${context.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(context: string, message: string, data?: unknown) {
    if (shouldLog('debug')) {
      if (data !== undefined) {
        console.log(formatMessage(context, message), data);
      } else {
        console.log(formatMessage(context, message));
      }
    }
  },

  info(context: string, message: string, data?: unknown) {
    if (shouldLog('info')) {
      if (data !== undefined) {
        console.log(formatMessage(context, message), data);
      } else {
        console.log(formatMessage(context, message));
      }
    }
  },

  warn(context: string, message: string, data?: unknown) {
    if (shouldLog('warn')) {
      if (data !== undefined) {
        console.warn(formatMessage(context, message), data);
      } else {
        console.warn(formatMessage(context, message));
      }
    }
  },

  error(context: string, message: string, data?: unknown) {
    if (shouldLog('error')) {
      if (data !== undefined) {
        console.error(formatMessage(context, message), data);
      } else {
        console.error(formatMessage(context, message));
      }
    }
  },
};
