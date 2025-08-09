import type { Request, Response, NextFunction } from "express";

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
export const getStorage = async () => {
  // Use dynamic import for ES modules
  try {
    const { storage } = await import('../storage.js');
    return storage;
  } catch (error) {
    console.error('Storage import error:', error);
    // Fallback to localStorage if storage import fails
    try {
      const { localStorage } = await import('../localStorage.js');
      return localStorage;
    } catch (fallbackError) {
      console.error('localStorage import error:', fallbackError);
      throw new Error('Unable to load storage system');
    }
  }
};

// Analytics helper
export const getAnalytics = () => {
  return {
    trackEvent: () => {},
    trackProReportGeneration: () => {},
    trackError: () => {},
  } as any; // Mock analytics for now
};