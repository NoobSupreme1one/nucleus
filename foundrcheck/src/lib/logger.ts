interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  error(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      timestamp,
      message,
      ...context
    };

    if (this.isDevelopment) {
      console.error(`[${timestamp}] ERROR: ${message}`, context);
    } else {
      // In production, you might want to send to a logging service
      console.error(JSON.stringify(logEntry));
    }
  }

  warn(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN',
      timestamp,
      message,
      ...context
    };

    if (this.isDevelopment) {
      console.warn(`[${timestamp}] WARN: ${message}`, context);
    } else {
      console.warn(JSON.stringify(logEntry));
    }
  }

  info(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      timestamp,
      message,
      ...context
    };

    if (this.isDevelopment) {
      console.info(`[${timestamp}] INFO: ${message}`, context);
    } else {
      console.info(JSON.stringify(logEntry));
    }
  }
}

export const logger = new Logger();