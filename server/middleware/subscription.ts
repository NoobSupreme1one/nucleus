import { Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe';
import { PrismaClient } from '@prisma/client';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Middleware to check if user has an active pro subscription
 */
export function requireProSubscription(prisma: PrismaClient) {
  const stripeService = new StripeService(prisma);

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const userId = req.user.id;

      // Check if user has active subscription
      const hasActiveSubscription = await stripeService.hasActiveSubscription(userId);

      if (!hasActiveSubscription) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'Pro subscription required to access this feature',
            upgradeUrl: '/pricing'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_CHECK_FAILED',
          message: 'Failed to verify subscription status'
        }
      });
    }
  };
}

/**
 * Middleware to check subscription and add subscription info to request
 */
export function addSubscriptionInfo(prisma: PrismaClient) {
  const stripeService = new StripeService(prisma);

  return async (req: AuthenticatedRequest & { subscription?: any }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        req.subscription = {
          tier: 'free',
          status: null,
          subscriptionId: null,
          periodEnd: null,
          cancelAtPeriodEnd: false
        };
        return next();
      }

      const userId = req.user.id;

      // Get subscription details
      const subscription = await stripeService.getUserSubscription(userId);
      req.subscription = subscription;

      next();
    } catch (error) {
      console.error('Error adding subscription info:', error);
      // Continue without subscription info rather than failing
      req.subscription = {
        tier: 'free',
        status: null,
        subscriptionId: null,
        periodEnd: null,
        cancelAtPeriodEnd: false
      };
      next();
    }
  };
}

/**
 * Rate limiting middleware for free users
 */
export function rateLimitFreeUsers(
  prisma: PrismaClient,
  limit: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour
) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const userId = req.user.id;
      const stripeService = new StripeService(prisma);

      // Check if user has pro subscription
      const hasActiveSubscription = await stripeService.hasActiveSubscription(userId);

      // Skip rate limiting for pro users
      if (hasActiveSubscription) {
        return next();
      }

      // Apply rate limiting for free users
      const now = Date.now();
      const userRequests = requestCounts.get(userId);

      if (!userRequests || now > userRequests.resetTime) {
        // Reset or initialize counter
        requestCounts.set(userId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (userRequests.count >= limit) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Free users are limited to ${limit} requests per hour. Upgrade to Pro for unlimited access.`,
            upgradeUrl: '/pricing',
            resetTime: new Date(userRequests.resetTime).toISOString()
          }
        });
      }

      // Increment counter
      userRequests.count++;
      requestCounts.set(userId, userRequests);

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting rather than failing
      next();
    }
  };
}

/**
 * Feature flag middleware - checks if feature is available for user's subscription tier
 */
export function requireFeature(
  prisma: PrismaClient,
  featureName: string,
  proOnly: boolean = true
) {
  const stripeService = new StripeService(prisma);

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const userId = req.user.id;

      if (proOnly) {
        const hasActiveSubscription = await stripeService.hasActiveSubscription(userId);

        if (!hasActiveSubscription) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FEATURE_REQUIRES_PRO',
              message: `The ${featureName} feature requires a Pro subscription`,
              feature: featureName,
              upgradeUrl: '/pricing'
            }
          });
        }
      }

      next();
    } catch (error) {
      console.error(`Feature check error for ${featureName}:`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FEATURE_CHECK_FAILED',
          message: 'Failed to verify feature access'
        }
      });
    }
  };
}
