import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://*.pages.dev',
      process.env.CLOUDFLARE_PAGES_URL,
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'stripe-signature',
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
};

// Security headers configuration
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.clerk.com", "https://*.clerk.accounts.dev"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://*.clerk.com", "https://*.clerk.accounts.dev"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.clerk.com", "https://*.clerk.accounts.dev"], // unsafe-eval needed for Vite in dev
      workerSrc: ["'self'", "blob:", "https://*.clerk.com", "https://*.clerk.accounts.dev"], // Allow Clerk workers
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:", "https://*.clerk.com", "https://*.clerk.accounts.dev"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://*.clerk.com", "https://*.clerk.accounts.dev"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

// Input sanitization middleware
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }

      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid input data'
        }
      });
    }
  };
}

// Recursive object sanitization
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] }); // Strip all HTML
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Request validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: result.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          }
        });
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Request validation error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed'
        }
      });
    }
  };
}

// Security logging middleware
export function securityLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log security-relevant events
    const securityEvents = [
      'login', 'logout', 'register', 'password-reset',
      'subscription', 'payment', 'admin'
    ];
    
    const isSecurityEvent = securityEvents.some(event => 
      req.path.includes(event) || req.path.includes('auth')
    );
    
    if (isSecurityEvent) {
      console.log(`[SECURITY] ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        userId: (req as any).user?.id,
      });
    }
    
    // Log response time for monitoring
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      if (duration > 5000) { // Log slow requests
        console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
    });
    
    next();
  };
}

// Account lockout protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

export function accountLockoutProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.body.email || req.ip;
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);
    
    // Check if account is locked
    if (attempts?.lockedUntil && now < attempts.lockedUntil) {
      const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
          lockedUntil: new Date(attempts.lockedUntil).toISOString(),
        }
      });
    }
    
    // Reset if lock period has expired
    if (attempts?.lockedUntil && now >= attempts.lockedUntil) {
      loginAttempts.delete(identifier);
    }
    
    next();
  };
}

// Track failed login attempts
export function trackLoginAttempt(success: boolean, identifier: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  if (success) {
    // Reset on successful login
    loginAttempts.delete(identifier);
  } else {
    // Increment failed attempts
    attempts.count++;
    attempts.lastAttempt = now;
    
    // Lock account after 5 failed attempts
    if (attempts.count >= 5) {
      attempts.lockedUntil = now + (15 * 60 * 1000); // 15 minutes
      console.warn(`[SECURITY] Account locked for ${identifier} after ${attempts.count} failed attempts`);
    }
    
    loginAttempts.set(identifier, attempts);
  }
}

// Error handling middleware
export function secureErrorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log error for debugging
    console.error('Error:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    
    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const status = err.status || err.statusCode || 500;
    
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    
    // Safe error messages for common cases
    if (status === 400) {
      message = 'Bad Request';
      code = 'BAD_REQUEST';
    } else if (status === 401) {
      message = 'Unauthorized';
      code = 'UNAUTHORIZED';
    } else if (status === 403) {
      message = 'Forbidden';
      code = 'FORBIDDEN';
    } else if (status === 404) {
      message = 'Not Found';
      code = 'NOT_FOUND';
    } else if (status === 429) {
      message = 'Too Many Requests';
      code = 'RATE_LIMITED';
    }
    
    // Include original message in development
    if (!isProduction && err.message) {
      message = err.message;
    }
    
    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      }
    });
  };
}

// Export configured middleware
export const corsMiddleware = cors(corsOptions);
export const helmetMiddleware = helmet(helmetOptions);

// Session timeout configuration
export const sessionConfig = {
  maxAge: 60 * 60 * 1000, // 1 hour
  refreshThreshold: 15 * 60 * 1000, // Refresh if less than 15 minutes remaining
};

// IP whitelist for admin operations
const adminWhitelist = [
  '127.0.0.1',
  '::1',
  // Add your admin IPs here
];

export function adminIPWhitelist() {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!clientIP || !adminWhitelist.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_WHITELISTED',
          message: 'Access denied from this IP address'
        }
      });
    }
    
    next();
  };
}
