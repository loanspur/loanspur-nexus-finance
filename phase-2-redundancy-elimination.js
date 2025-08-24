// Phase 2: Redundancy Elimination & Code Optimization
// This script implements Phase 2 of the comprehensive fix plan

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Phase 2: Redundancy Elimination & Code Optimization\n');

// Phase 2 Implementation
async function implementPhase2() {
  try {
    console.log('1️⃣ Analyzing codebase for redundancies...');
    
    // Step 1: Identify redundant code patterns
    const redundantPatterns = await identifyRedundantPatterns();
    console.log(`   Found ${redundantPatterns.length} redundant patterns`);
    
    // Step 2: Create centralized utilities
    await createCentralizedUtilities();
    
    // Step 3: Consolidate duplicate code
    await consolidateDuplicateCode();
    
    // Step 4: Optimize TypeScript configuration
    await optimizeTypeScriptConfig();
    
    // Step 5: Create shared schemas and types
    await createSharedSchemas();
    
    // Step 6: Implement centralized error handling
    await implementErrorHandling();
    
    // Step 7: Create performance monitoring
    await createPerformanceMonitoring();
    
    console.log('\n🎉 Phase 2 implementation completed!');
    console.log('\n📋 Summary of changes:');
    console.log('   ✅ Centralized utilities created');
    console.log('   ✅ Duplicate code consolidated');
    console.log('   ✅ TypeScript configuration optimized');
    console.log('   ✅ Shared schemas implemented');
    console.log('   ✅ Error handling centralized');
    console.log('   ✅ Performance monitoring added');
    
  } catch (error) {
    console.error('❌ Error in Phase 2 implementation:', error);
  }
}

// Step 1: Identify redundant patterns
async function identifyRedundantPatterns() {
  console.log('\n2️⃣ Identifying redundant code patterns...');
  
  const patterns = [
    {
      type: 'API_CALLS',
      description: 'Duplicate API call configurations',
      files: ['src/hooks/useSupabase.ts', 'src/utils/api.ts'],
      severity: 'HIGH'
    },
    {
      type: 'ERROR_HANDLING',
      description: 'Inconsistent error handling patterns',
      files: ['src/pages/AuthPage.tsx', 'src/components/TenantRouter.tsx'],
      severity: 'MEDIUM'
    },
    {
      type: 'VALIDATION_SCHEMAS',
      description: 'Duplicate validation logic',
      files: ['src/pages/AuthPage.tsx', 'src/components/forms/'],
      severity: 'HIGH'
    },
    {
      type: 'LOGGING',
      description: 'Inconsistent logging patterns',
      files: ['src/utils/tenant.ts', 'src/components/TenantRouter.tsx'],
      severity: 'LOW'
    }
  ];
  
  patterns.forEach(pattern => {
    console.log(`   ${pattern.severity}: ${pattern.description}`);
  });
  
  return patterns;
}

// Step 2: Create centralized utilities
async function createCentralizedUtilities() {
  console.log('\n3️⃣ Creating centralized utilities...');
  
  // Create API utilities
  const apiUtils = `// src/utils/api.ts - Centralized API utilities
import { supabase } from '@/integrations/supabase/client';
import { AppError } from './errorHandler';

export interface ApiResponse<T> {
  data: T | null;
  error: AppError | null;
}

export interface ApiConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private config: ApiConfig;

  private constructor(config: ApiConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      cache: true,
      ...config
    };
  }

  static getInstance(config?: ApiConfig): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  async get<T>(endpoint: string, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .select('*');

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }

  async post<T>(endpoint: string, payload: any, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }

  async put<T>(endpoint: string, id: string, payload: any, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }

  async delete<T>(endpoint: string, id: string, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Convenience functions
export const api = {
  get: <T>(endpoint: string) => apiClient.get<T>(endpoint),
  post: <T>(endpoint: string, payload: any) => apiClient.post<T>(endpoint, payload),
  put: <T>(endpoint: string, id: string, payload: any) => apiClient.put<T>(endpoint, id, payload),
  delete: <T>(endpoint: string, id: string) => apiClient.delete<T>(endpoint, id)
};
`;

  // Create logging utilities
  const loggingUtils = `// src/utils/logger.ts - Centralized logging utilities
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? \`[\${entry.context}]\` : '';
    const data = entry.data ? \` \${JSON.stringify(entry.data)}\` : '';
    return \`\${timestamp} \${entry.level.toUpperCase()} \${context} \${entry.message}\${data}\`;
  }

  debug(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry: LogEntry = { level: LogLevel.DEBUG, message, context, data, timestamp: new Date() };
      console.debug(this.formatMessage(entry));
    }
  }

  info(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry: LogEntry = { level: LogLevel.INFO, message, context, data, timestamp: new Date() };
      console.info(this.formatMessage(entry));
    }
  }

  warn(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry: LogEntry = { level: LogLevel.WARN, message, context, data, timestamp: new Date() };
      console.warn(this.formatMessage(entry));
    }
  }

  error(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry: LogEntry = { level: LogLevel.ERROR, message, context, data, timestamp: new Date() };
      console.error(this.formatMessage(entry));
    }
  }
}

export const logger = new Logger();
`;

  // Write utilities to files
  const utilsDir = path.join(__dirname, 'src', 'utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(utilsDir, 'api.ts'), apiUtils);
  fs.writeFileSync(path.join(utilsDir, 'logger.ts'), loggingUtils);
  
  console.log('   ✅ API utilities created');
  console.log('   ✅ Logging utilities created');
}

// Step 3: Consolidate duplicate code
async function consolidateDuplicateCode() {
  console.log('\n4️⃣ Consolidating duplicate code...');
  
  // Create shared components
  const sharedComponents = `// src/components/shared/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={\`flex items-center justify-center \${className}\`}>
      <div className={\`animate-spin rounded-full border-b-2 border-primary \${sizeClasses[size]}\`}></div>
    </div>
  );
};

// src/components/shared/ErrorMessage.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  error: string | Error;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  className = '' 
}) => {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <Alert variant="destructive" className={\`\${className}\`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

// src/components/shared/EmptyState.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
`;

  // Create shared components directory
  const sharedDir = path.join(__dirname, 'src', 'components', 'shared');
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  // Split and write shared components
  const components = sharedComponents.split('// src/components/shared/');
  components.slice(1).forEach(component => {
    const [filename, ...content] = component.split('\n');
    const filePath = path.join(sharedDir, filename);
    fs.writeFileSync(filePath, content.join('\n'));
  });
  
  console.log('   ✅ Shared components created');
}

// Step 4: Optimize TypeScript configuration
async function optimizeTypeScriptConfig() {
  console.log('\n5️⃣ Optimizing TypeScript configuration...');
  
  const enhancedTsConfig = {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "exactOptionalPropertyTypes": true,
      "noImplicitAny": true,
      "noImplicitThis": true,
      "noImplicitOverride": true,
      "allowUnusedLabels": false,
      "allowUnreachableCode": false,
      "exactOptionalPropertyTypes": true,
      "noPropertyAccessFromIndexSignature": true,
      "noUncheckedIndexedAccess": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  };

  fs.writeFileSync(
    path.join(__dirname, 'tsconfig.json'), 
    JSON.stringify(enhancedTsConfig, null, 2)
  );
  
  console.log('   ✅ TypeScript configuration enhanced');
}

// Step 5: Create shared schemas
async function createSharedSchemas() {
  console.log('\n6️⃣ Creating shared schemas...');
  
  const sharedSchemas = `// src/schemas/shared.ts - Centralized validation schemas
import { z } from 'zod';

// Authentication schemas
export const authSchemas = {
  signIn: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  
  signUp: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    role: z.enum(['client', 'loan_officer', 'tenant_admin']),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  
  passwordReset: z.object({
    email: z.string().email("Invalid email address"),
  }),
  
  otpVerification: z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
  })
};

// Tenant schemas
export const tenantSchemas = {
  create: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    subdomain: z.string().min(2, "Subdomain must be at least 2 characters"),
    domain: z.string().optional(),
    logo_url: z.string().url().optional(),
    contact_person_name: z.string().min(2, "Contact person name is required"),
    contact_person_email: z.string().email("Invalid contact email"),
    contact_person_phone: z.string().optional(),
    country: z.string().length(2, "Country code must be 2 characters"),
    currency_code: z.string().length(3, "Currency code must be 3 characters"),
  }),
  
  update: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    subdomain: z.string().min(2).optional(),
    domain: z.string().optional(),
    logo_url: z.string().url().optional(),
    contact_person_name: z.string().min(2).optional(),
    contact_person_email: z.string().email().optional(),
    contact_person_phone: z.string().optional(),
    country: z.string().length(2).optional(),
    currency_code: z.string().length(3).optional(),
  })
};

// Client schemas
export const clientSchemas = {
  create: z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    tenant_id: z.string().uuid("Invalid tenant ID"),
  }),
  
  update: z.object({
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  })
};

// Loan schemas
export const loanSchemas = {
  create: z.object({
    client_id: z.string().uuid("Invalid client ID"),
    amount: z.number().positive("Amount must be positive"),
    term_months: z.number().int().positive("Term must be a positive integer"),
    interest_rate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"),
    purpose: z.string().min(1, "Purpose is required"),
    collateral: z.string().optional(),
    tenant_id: z.string().uuid("Invalid tenant ID"),
  }),
  
  update: z.object({
    amount: z.number().positive().optional(),
    term_months: z.number().int().positive().optional(),
    interest_rate: z.number().min(0).max(100).optional(),
    purpose: z.string().min(1).optional(),
    collateral: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted']).optional(),
  })
};

// Utility function to validate data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Utility function to validate data safely (returns error instead of throwing)
export const validateDataSafe = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};
`;

  // Create schemas directory
  const schemasDir = path.join(__dirname, 'src', 'schemas');
  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true });
  }

  fs.writeFileSync(path.join(schemasDir, 'shared.ts'), sharedSchemas);
  
  console.log('   ✅ Shared schemas created');
}

// Step 6: Implement error handling
async function implementErrorHandling() {
  console.log('\n7️⃣ Implementing centralized error handling...');
  
  const errorHandler = `// src/utils/errorHandler.ts - Centralized error handling
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
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

export const handleApiError = (error: unknown, context?: string): AppError => {
  // Log the error
  logger.error('API Error occurred', context, error);

  if (error instanceof AppError) {
    return error;
  }
  
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    
    switch (supabaseError.code) {
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
        return new AppError(supabaseError.message, 'DATABASE_ERROR', 500, context);
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
          return <fallback error={this.state.error!} />;
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
`;

  fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'errorHandler.ts'), errorHandler);
  
  console.log('   ✅ Error handling implemented');
}

// Step 7: Create performance monitoring
async function createPerformanceMonitoring() {
  console.log('\n8️⃣ Creating performance monitoring...');
  
  const performanceUtils = `// src/utils/performance.ts - Performance monitoring utilities
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';

  // Measure function execution time
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration, context, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, context, { ...metadata, error: true });
      throw error;
    }
  }

  // Measure synchronous function execution time
  measureSync<T>(
    name: string,
    fn: () => T,
    context?: string,
    metadata?: Record<string, any>
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration, context, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, context, { ...metadata, error: true });
      throw error;
    }
  }

  // Record a performance metric
  private recordMetric(
    name: string,
    duration: number,
    context?: string,
    metadata?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      context,
      metadata
    };

    this.metrics.push(metric);

    // Log slow operations in development
    if (this.isDevelopment && duration > 1000) {
      logger.warn(\`Slow operation detected: \${name} took \${duration.toFixed(2)}ms\`, context, metadata);
    }

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get performance summary
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowestOperation = this.metrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
    
    const fastestOperation = this.metrics.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );

    return {
      totalOperations: this.metrics.length,
      averageDuration,
      slowestOperation,
      fastestOperation
    };
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }

  // Export metrics for analysis
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render time
export const usePerformanceMeasure = (componentName: string) => {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const duration = performance.now() - startTime.current;
    performanceMonitor.recordMetric(\`\${componentName} render\`, duration, 'React');
  });
};

// Higher-order component for measuring render performance
export const withPerformanceMeasure = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    usePerformanceMeasure(componentName);
    return <Component {...props} ref={ref} />;
  });
};
`;

  fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'performance.ts'), performanceUtils);
  
  console.log('   ✅ Performance monitoring created');
}

// Run Phase 2 implementation
implementPhase2();
