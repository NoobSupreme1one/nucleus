import rateLimit from 'express-rate-limit';
import slowDownLib from 'express-slow-down';
import type { Request, Response } from 'express';

// Rate limiting configurations for different endpoints
const rateLimitConfigs = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
      });
      
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      });
    },
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  }),

  // Rate limiting for AI-powered features (expensive operations)
  aiFeatures: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 AI requests per hour
    message: {
      error: 'AI feature usage limit exceeded. Please try again in an hour.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Rate limiting for file uploads
  fileUpload: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 file uploads per 15 minutes
    message: {
      error: 'File upload limit exceeded, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Rate limiting for Pro report generation (resource intensive)
  proReports: rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // limit each IP to 5 pro reports per day
    message: {
      error: 'Daily Pro report limit exceeded. Please try again tomorrow.',
      retryAfter: '24 hours'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Rate limiting for search/matching operations
  search: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limit each IP to 50 search requests per 5 minutes
    message: {
      error: 'Search rate limit exceeded, please try again in a few minutes.',
      retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// Slow down configurations for specific endpoints
const slowDownConfigs = {
  // Gradually slow down requests to AI endpoints
  ai: slowDownLib({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // allow 2 requests per 15 minutes at full speed
    delayMs: (used) => used * 500, // add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // max delay of 20 seconds
  }),

  // Slow down password-related operations (brute force protection)
  password: slowDownLib({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // allow 2 requests per 15 minutes at full speed
    delayMs: (used) => Math.pow(2, used - 2) * 1000, // exponential delay: 1s, 2s, 4s, 8s, etc.
    maxDelayMs: 60000, // max delay of 1 minute
  }),
};

// User-specific rate limiting for free vs pro users
export function createUserBasedRateLimit(
  freeUserLimit: number,
  proUserLimit: number,
  windowMs: number = 60 * 60 * 1000 // 1 hour default
) {
  return rateLimit({
    windowMs,
    max: (req: any) => {
      // Check user subscription tier
      const user = req.user;
      if (!user) return freeUserLimit;
      
      const isProUser = user.subscriptionTier === 'pro' || 
                       user.subscription_tier === 'pro';
      
      return isProUser ? proUserLimit : freeUserLimit;
    },
    message: (req: any) => {
      const user = req.user;
      const isProUser = user?.subscriptionTier === 'pro' || 
                       user?.subscription_tier === 'pro';
      
      return {
        error: `Rate limit exceeded for ${isProUser ? 'Pro' : 'Free'} users.`,
        retryAfter: `${windowMs / 1000 / 60} minutes`,
        upgradeMessage: !isProUser ? 'Upgrade to Pro for higher limits!' : undefined,
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// DDoS protection - very strict limits
export const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 requests per minute per IP
  message: {
    error: 'Too many requests. DDoS protection activated.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`DDoS protection triggered for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
    });
    
    res.status(429).json({
      error: 'Too many requests. DDoS protection activated.',
      retryAfter: '1 minute'
    });
  },
});

// Custom rate limiter for specific business logic
export function createCustomRateLimit(config: {
  windowMs: number;
  max: number | ((req: Request) => number);
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: { error: config.message },
    keyGenerator: config.keyGenerator,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Export configured rate limiters
export const rateLimiters = rateLimitConfigs;
export const slowDownLimiters = slowDownConfigs;

// Helper to check if rate limiting should be applied
export function shouldApplyRateLimit(): boolean {
  // Disable rate limiting in development for easier testing
  if (process.env.NODE_ENV === 'development') {
    return process.env.ENABLE_RATE_LIMITING === 'true';
  }
  
  // Always apply in production
  return true;
}

// Middleware to apply rate limiting conditionally
export function conditionalRateLimit(limiter: any) {
  return (req: Request, res: Response, next: Function) => {
    if (shouldApplyRateLimit()) {
      return limiter(req, res, next);
    }
    next();
  };
}

// Rate limit bypass for admin users or testing
export function createBypassableRateLimit(limiter: any) {
  return (req: any, res: Response, next: Function) => {
    // Check for bypass conditions
    const bypassToken = req.headers['x-bypass-rate-limit'];
    const isAdmin = req.user?.role === 'admin';
    const isTestMode = process.env.NODE_ENV === 'test';
    
    if (bypassToken === process.env.RATE_LIMIT_BYPASS_TOKEN || isAdmin || isTestMode) {
      return next();
    }
    
    return limiter(req, res, next);
  };
}