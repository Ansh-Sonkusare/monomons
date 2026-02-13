type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${context.toUpperCase()}]`;
  
  if (data !== undefined) {
    return `${prefix} ${message} ${typeof data === 'object' ? JSON.stringify(data) : data}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(context: string, message: string, data?: unknown) {
    if (shouldLog('debug')) {
      console.log(formatMessage(context, message, data));
    }
  },

  info(context: string, message: string, data?: unknown) {
    if (shouldLog('info')) {
      console.log(formatMessage(context, message, data));
    }
  },

  warn(context: string, message: string, data?: unknown) {
    if (shouldLog('warn')) {
      console.warn(formatMessage(context, message, data));
    }
  },

  error(context: string, message: string, data?: unknown) {
    if (shouldLog('error')) {
      console.error(formatMessage(context, message, data));
    }
  },
};
