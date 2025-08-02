import * as Sentry from '@sentry/react';

// Initialize Sentry for frontend error monitoring
export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Frontend Sentry DSN not configured - error monitoring disabled');
    return false;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Enable session replay in development
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      // Browser integrations
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    beforeSend(event, hint) {
      // Filter out development errors
      if (import.meta.env.DEV) {
        console.warn('Sentry Event (Dev):', event);
      }

      // Add user context if available
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          event.user = {
            id: user.id,
            email: user.email,
          };
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      return event;
    },

    // Ignore common browser errors that aren't actionable
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
      'ChunkLoadError',
      'Loading chunk',
      'AbortError',
    ],
  });

  console.log('Frontend Sentry initialized');
  return true;
}

// Custom error tracking for React components
export class FrontendErrorTracker {
  /**
   * Track authentication errors
   */
  static trackAuthError(error: Error, context?: {
    action?: string;
    userId?: string;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'auth_error');
      scope.setTag('component', 'authentication');
      
      if (context?.action) {
        scope.setTag('auth_action', context.action);
      }
      
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track API call errors
   */
  static trackApiError(error: Error, context: {
    endpoint: string;
    method: string;
    status?: number;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error');
      scope.setTag('endpoint', context.endpoint);
      scope.setTag('method', context.method);
      
      if (context.status) {
        scope.setTag('status_code', context.status);
      }
      
      scope.setContext('api_call', context);
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track form submission errors
   */
  static trackFormError(error: Error, formName: string, formData?: any) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'form_error');
      scope.setTag('form_name', formName);
      
      scope.setContext('form', {
        name: formName,
        data: formData ? Object.keys(formData) : undefined, // Only log field names, not values
      });
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track component render errors
   */
  static trackRenderError(error: Error, componentName: string, props?: any) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'render_error');
      scope.setTag('component', componentName);
      
      scope.setContext('component', {
        name: componentName,
        props: props ? Object.keys(props) : undefined,
      });
      
      Sentry.captureException(error);
    });
  }

  /**
   * Track user actions that lead to errors
   */
  static trackUserActionError(error: Error, action: string, metadata?: any) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'user_action_error');
      scope.setTag('user_action', action);
      
      if (metadata) {
        scope.setContext('user_action', {
          action,
          metadata,
        });
      }
      
      Sentry.captureException(error);
    });
  }
}

// React Error Boundary component with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Performance monitoring
export function trackPageLoad(pageName: string) {
  const transaction = Sentry.startTransaction({
    name: `Page Load: ${pageName}`,
    op: 'navigation',
  });
  
  // Finish the transaction when the page is fully loaded
  window.addEventListener('load', () => {
    transaction.finish();
  });
  
  return transaction;
}

// Check if Sentry is configured
export function isSentryConfigured(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN;
}