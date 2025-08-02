import * as Sentry from '@sentry/node';
import type { Request, Response, NextFunction } from 'express';

// Initialize Sentry configuration
export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
    return false;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Capture additional context
    beforeSend(event, hint) {
      // Add custom context
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Add custom tags for better error categorization
        event.tags = {
          ...event.tags,
          component: getErrorComponent(error),
          severity: getErrorSeverity(error),
        };

        // Add user context if available
        if (event.request?.headers) {
          const userId = event.request.headers['x-user-id'] as string;
          if (userId) {
            event.user = { id: userId };
          }
        }
      }

      return event;
    },

    // Configure which errors to ignore
    ignoreErrors: [
      // Browser extensions
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      
      // Network errors that aren't actionable
      'NetworkError',
      'fetch',
      
      // Common validation errors
      'ValidationError',
    ],
  });

  console.log('Sentry error monitoring initialized');
  return true;
}

// Express middleware for Sentry error handling
export function sentryRequestHandler() {
  if (!isSentryConfigured()) {
    return (req: any, res: any, next: any) => next();
  }
  
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email'],
    request: ['method', 'url', 'headers'],
    serverName: false, // Don't send server name for privacy
  });
}

export function sentryErrorHandler() {
  if (!isSentryConfigured()) {
    return (error: any, req: any, res: any, next: any) => next(error);
  }
  
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only capture 4xx and 5xx errors
      return error.status >= 400;
    },
  });
}

// Custom error tracking functions
export class ErrorTracker {
  /**
   * Track API errors with context
   */
  static trackApiError(error: Error, context: {
    endpoint: string;
    method: string;
    userId?: string;
    requestBody?: any;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error');
      scope.setTag('endpoint', context.endpoint);
      scope.setTag('method', context.method);
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      scope.setContext('request', {
        endpoint: context.endpoint,
        method: context.method,
        body: context.requestBody ? JSON.stringify(context.requestBody) : undefined,
      });
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track AI service errors
   */
  static trackAiError(error: Error, service: 'gemini' | 'perplexity', context?: any) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'ai_service_error');
      scope.setTag('ai_service', service);
      scope.setLevel('warning'); // AI errors are often recoverable
      
      if (context) {
        scope.setContext('ai_context', context);
      }
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track payment/subscription errors
   */
  static trackPaymentError(error: Error, context: {
    stripeEventType?: string;
    customerId?: string;
    subscriptionId?: string;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'payment_error');
      scope.setLevel('error'); // Payment errors are critical
      
      if (context.customerId) {
        scope.setUser({ id: context.customerId });
      }
      
      scope.setContext('payment', context);
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track database errors
   */
  static trackDatabaseError(error: Error, query?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'database_error');
      scope.setLevel('error');
      
      if (query) {
        scope.setContext('database', { query });
      }
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track custom business logic errors
   */
  static trackBusinessError(error: Error, context: {
    feature: string;
    userId?: string;
    metadata?: Record<string, any>;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'business_logic_error');
      scope.setTag('feature', context.feature);
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context.metadata) {
        scope.setContext('business_context', context.metadata);
      }
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track performance issues
   */
  static trackPerformanceIssue(name: string, duration: number, context?: any) {
    Sentry.withScope((scope) => {
      scope.setTag('performance_issue', true);
      scope.setTag('operation', name);
      
      scope.setContext('performance', {
        operation: name,
        duration,
        threshold_exceeded: duration > 5000, // 5 second threshold
        ...context,
      });
      
      // Only capture if it's actually slow
      if (duration > 5000) {
        Sentry.captureMessage(`Slow operation: ${name} took ${duration}ms`, 'warning');
      }
    });
  }
}

// Helper functions
function getErrorComponent(error: Error): string {
  const stack = error.stack || '';
  
  if (stack.includes('/api/')) return 'api';
  if (stack.includes('/services/')) return 'service';
  if (stack.includes('/middleware/')) return 'middleware';
  if (stack.includes('prisma')) return 'database';
  if (stack.includes('stripe')) return 'payment';
  if (stack.includes('gemini') || stack.includes('perplexity')) return 'ai';
  
  return 'unknown';
}

function getErrorSeverity(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('payment') || message.includes('stripe')) return 'critical';
  if (message.includes('database') || message.includes('prisma')) return 'high';
  if (message.includes('auth') || message.includes('unauthorized')) return 'medium';
  if (message.includes('validation') || message.includes('invalid')) return 'low';
  
  return 'medium';
}

// Middleware to add user context to Sentry
export function addUserContextMiddleware() {
  return (req: any, res: Response, next: NextFunction) => {
    if (req.user?.id) {
      Sentry.setUser({
        id: req.user.id,
        email: req.user.email,
      });
    }
    next();
  };
}

// Check if Sentry is configured
export function isSentryConfigured(): boolean {
  const dsn = process.env.SENTRY_DSN;
  return !!(dsn && dsn !== 'your_sentry_dsn_here' && dsn.startsWith('https://'));
}