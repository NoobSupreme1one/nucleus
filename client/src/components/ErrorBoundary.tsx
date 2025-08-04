import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with error monitoring services like Sentry
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
              <CardTitle className="text-2xl text-foreground">
                Oops! Something went wrong
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Badge className="bg-red-100 text-red-800 mr-2">
                      Development Mode
                    </Badge>
                    <span className="text-sm font-medium text-red-800">Error Details</span>
                  </div>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Stack Trace</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Component Stack</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* User-Friendly Error Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  What can you do?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start">
                    <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                    <span>Try refreshing the page or retrying your action</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                    <span>Check your internet connection</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                    <span>Clear your browser cache and cookies</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                    <span>Contact support if the problem persists</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center">
                  <i className="fas fa-redo mr-2"></i>
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex items-center">
                  <i className="fas fa-refresh mr-2"></i>
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex items-center">
                  <i className="fas fa-home mr-2"></i>
                  Go Home
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>
                  Need help? Contact our support team at{' '}
                  <a href="mailto:support@nucleus.com" className="text-primary hover:underline">
                    support@nucleus.com
                  </a>
                </p>
                <p className="mt-1">
                  Error ID: {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // In production, this would send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  };

  return { handleError };
}

// Retry mechanism hook
export function useRetry() {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = async (fn: () => Promise<any>, maxRetries: number = 3, delay: number = 1000) => {
    if (retryCount >= maxRetries) {
      throw new Error(`Max retries (${maxRetries}) exceeded`);
    }

    setIsRetrying(true);
    
    try {
      const result = await fn();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      
      if (retryCount < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retryCount))); // Exponential backoff
        return retry(fn, maxRetries, delay);
      } else {
        throw error;
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return { retry, retryCount, isRetrying, resetRetryCount: () => setRetryCount(0) };
}
