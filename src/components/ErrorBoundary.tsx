
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { unifiedErrorHandler } from '@/utils/unifiedErrorHandling';
import { monitoring } from '@/utils/monitoring';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  unifiedErrorId?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  async componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });

    try {
      // Use unified error handler
      const unifiedError = await unifiedErrorHandler.handleError(
        error,
        'error_boundary',
        undefined,
        {
          component_stack: errorInfo.componentStack,
          retry_count: this.retryCount
        }
      );

      this.setState({ unifiedErrorId: unifiedError.id });
    } catch (handlingError) {
      console.error('Error in error boundary:', handlingError);
    }

    // Track error metrics
    monitoring.recordMetric('error_boundary_triggered', 1, {
      error_name: error.name,
      error_message: error.message,
      component_stack: errorInfo.componentStack
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        unifiedErrorId: undefined
      });
      
      monitoring.recordMetric('error_boundary_retry', 1, {
        retry_count: this.retryCount.toString(),
        max_retries: this.maxRetries.toString()
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-base">
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error details (only in development or when explicitly enabled) */}
              {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) && this.state.error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-destructive mb-2">
                    <Bug className="h-4 w-4" />
                    <span>Error Details</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.name}
                    </div>
                    <div className="mb-2">
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.unifiedErrorId && (
                      <div className="mb-2">
                        <strong>Error ID:</strong> {this.state.unifiedErrorId}
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-destructive hover:text-destructive/80">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-muted p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reload Page</span>
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>
              </div>

              {/* Retry limit message */}
              {this.retryCount >= this.maxRetries && (
                <div className="text-center text-sm text-muted-foreground">
                  Maximum retry attempts reached. Please reload the page or contact support.
                </div>
              )}

              {/* Support information */}
              <div className="text-center text-sm text-muted-foreground">
                If this problem persists, please contact our support team
                {this.state.unifiedErrorId && (
                  <span> and include this error ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{this.state.unifiedErrorId}</code></span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Async error boundary for handling promise rejections
export const AsyncErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, ...props }) => {
  React.useEffect(() => {
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      await unifiedErrorHandler.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        'async_error_boundary',
        undefined,
        { reason: event.reason }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary {...props}>
      {children}
    </ErrorBoundary>
  );
};
