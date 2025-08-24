export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle different error types
  if (error && typeof error === 'object' && 'status' in error) {
    const statusError = error as { status: number; message?: string };
    
    if (statusError.status === 401) {
      return new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }
    
    if (statusError.status === 403) {
      return new AppError('Access denied', 'ACCESS_DENIED', 403);
    }
    
    if (statusError.status === 404) {
      return new AppError('Resource not found', 'NOT_FOUND', 404);
    }
    
    if (statusError.status >= 500) {
      return new AppError('Server error', 'SERVER_ERROR', statusError.status);
    }
  }
  
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
};

export const logError = (error: unknown, context?: string) => {
  if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {
    console.error(`[ERROR]${context ? ` [${context}]` : ''}:`, error);
  }
  
  // In production, send to error tracking service
  if (import.meta.env.VITE_IS_DEVELOPMENT !== 'true' && import.meta.env.VITE_SENTRY_DSN) {
    // TODO: Implement Sentry error tracking
    // Sentry.captureException(error, { tags: { context } });
  }
};
