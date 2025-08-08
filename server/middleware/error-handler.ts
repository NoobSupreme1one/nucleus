import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
// Sentry has been removed from the application

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Enhanced error handler middleware
export function enhancedErrorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    // Generate request ID for tracking
    const requestId = req.headers['x-request-id'] as string || 
                     Math.random().toString(36).substring(2, 15);

    // Log error with context
    const errorContext = {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
    };

    console.error('Error occurred:', {
      error: {
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode,
      },
      context: errorContext,
    });

    // Log high severity errors
    if (err.isOperational === false || err.statusCode >= 500) {
      console.error('High severity error:', err.message);
    }

    // Handle different error types
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal Server Error';
    let details: any = undefined;

    if (err instanceof AppError) {
      statusCode = err.statusCode;
      code = err.code;
      message = err.message;
      details = err.details;
    } else if (err instanceof ZodError) {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Invalid request data';
      details = err.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
      }));
    } else if (err instanceof PrismaClientKnownRequestError) {
      statusCode = 400;
      code = 'DATABASE_ERROR';
      
      switch (err.code) {
        case 'P2002':
          message = 'A record with this data already exists';
          code = 'DUPLICATE_RECORD';
          break;
        case 'P2025':
          message = 'Record not found';
          code = 'NOT_FOUND';
          statusCode = 404;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          code = 'CONSTRAINT_VIOLATION';
          break;
        default:
          message = 'Database operation failed';
      }
    } else if (err instanceof PrismaClientValidationError) {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Invalid data provided';
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      code = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      code = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      statusCode = 502;
      code = 'EXTERNAL_SERVICE_ERROR';
      message = 'External service unavailable';
    } else if (err.type === 'entity.too.large') {
      statusCode = 413;
      code = 'PAYLOAD_TOO_LARGE';
      message = 'Request payload too large';
    }

    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && statusCode >= 500) {
      message = 'Internal Server Error';
      details = undefined;
    }

    // Create error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    // Remove undefined fields
    if (!details) delete errorResponse.error.details;

    res.status(statusCode).json(errorResponse);
  };
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation middleware with enhanced error handling
export function validateSchema(schema: any, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);
      
      if (!result.success) {
        throw new ValidationError('Invalid request data', result.error.errors);
      }
      
      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Database operation wrapper
export async function dbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError || 
        error instanceof PrismaClientValidationError) {
      throw error; // Let the error handler deal with Prisma errors
    }
    throw new AppError(errorMessage, 500, 'DATABASE_ERROR', false);
  }
}

// External service operation wrapper
export async function externalServiceOperation<T>(
  operation: () => Promise<T>,
  serviceName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ExternalServiceError(serviceName, message);
  }
}

// Rate limit error handler
export function handleRateLimit(req: Request, res: Response) {
  const resetTime = req.rateLimit?.resetTime || new Date(Date.now() + 15 * 60 * 1000);
  
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
      timestamp: new Date().toISOString(),
    },
  });
}

// 404 handler
export function notFoundHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    const error = new NotFoundError(`Route ${req.method} ${req.path}`);
    next(error);
  };
}

// Graceful shutdown handler
export function setupGracefulShutdown(server: any) {
  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Unhandled error handlers
export function setupUnhandledErrorHandlers() {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // ErrorTracker.trackError(error, {
    //   feature: 'uncaught_exception',
    //   metadata: { type: 'uncaughtException' },
    // });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // ErrorTracker.trackError(new Error(`Unhandled Rejection: ${reason}`), {
    //   feature: 'unhandled_rejection',
    //   metadata: { type: 'unhandledRejection' },
    // });
  });
}
