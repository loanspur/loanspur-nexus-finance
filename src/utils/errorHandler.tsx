import React from 'react';

export interface AppError {
  message: string;
  code: string;
  statusCode: number;
  context?: string;
  timestamp: Date;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    context?: string;
    timestamp: string;
  };
}

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public context?: string;
  public timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    context?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date();
  }
}

// Simple logger for development
const logger = {
  error: (message: string, context?: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.error(`[${context || 'ErrorHandler'}] ${message}`, data);
    }
  },
  warn: (message: string, context?: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(`[${context || 'ErrorHandler'}] ${message}`, data);
    }
  },
  info: (message: string, context?: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.info(`[${context || 'ErrorHandler'}] ${message}`, data);
    }
  }
};

export const handleApiError = (error: any, context?: string): AppError => {
  // Handle Supabase errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new AppError('Resource not found', 'NOT_FOUND', 404, context);
      case '23505':
        return new AppError('Duplicate entry', 'DUPLICATE_ENTRY', 409, context);
      case '23503':
        return new AppError('Referenced record not found', 'FOREIGN_KEY_VIOLATION', 400, context);
      case '23514':
        return new AppError('Data validation failed', 'VALIDATION_ERROR', 400, context);
      case '42P01':
        return new AppError('Table not found', 'TABLE_NOT_FOUND', 500, context);
      case '42501':
        return new AppError('Insufficient permissions', 'PERMISSION_DENIED', 403, context);
      default:
        return new AppError(error.message || 'Database error', 'DATABASE_ERROR', 500, context);
    }
  }
  
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('Network error - please check your connection', 'NETWORK_ERROR', 503, context);
  }
  
  // Handle unknown errors
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, context);
  }
  
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, context);
};

export const createErrorResponse = (error: AppError): ErrorResponse => {
  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      timestamp: new Date().toISOString()
    }
  };
};

// Error boundary for React components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error }>
) => {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean; error: Error | null }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      logger.error('React Error Boundary caught error', 'ErrorBoundary', { error, errorInfo });
    }

    render() {
      if (this.state.hasError) {
        if (fallback) {
          return React.createElement(fallback, { error: this.state.error! });
        }
        return (
          <div className="p-4 text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Try Again
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Async error wrapper
export const withAsyncErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleApiError(error, context);
      throw appError;
    }
  };
};
