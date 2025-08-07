import type { Request, Response, NextFunction } from "express";
import { ErrorTracker } from "../services/sentry";

// Common types for route handlers
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

// Error response helper
export const sendErrorResponse = (res: Response, statusCode: number, error: {
  code: string;
  message: string;
  details?: string;
}) => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};

// Success response helper
export const sendSuccessResponse = (res: Response, data: any, message?: string) => {
  res.json({
    success: true,
    ...(message && { message }),
    ...data,
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error handling for API routes
export const handleRouteError = (
  error: Error, 
  req: Request, 
  res: Response, 
  defaultMessage: string = "Internal server error"
) => {
  console.error(`Error in ${req.method} ${req.path}:`, error);
  
  // Track error with Sentry if available
  ErrorTracker.trackAiError(error, {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  // Determine error type and provide appropriate response
  let errorCode = 'INTERNAL_ERROR';
  let errorMessage = defaultMessage;

  if (error.message.includes('API')) {
    errorCode = 'API_ERROR';
    errorMessage = 'External service temporarily unavailable';
  } else if (error.message.includes('database') || error.message.includes('prisma')) {
    errorCode = 'DATABASE_ERROR';
    errorMessage = 'Database error occurred';
  } else if (error.message.includes('validation')) {
    errorCode = 'VALIDATION_ERROR';
    errorMessage = 'Invalid request data';
  }

  sendErrorResponse(res, 500, {
    code: errorCode,
    message: errorMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Storage helper function
export const getStorage = () => {
  const { storage } = require('../storage');
  const { localStorage } = require('../localStorage');
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? storage : localStorage;
};

// Analytics helper
export const getAnalytics = () => {
  return {
    trackEvent: () => {},
    trackProReportGeneration: () => {},
    trackError: () => {},
  } as any; // Mock analytics for now
};