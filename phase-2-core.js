// Phase 2 Core: Redundancy Elimination & Code Optimization
// This script implements the core Phase 2 fixes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Phase 2 Core: Redundancy Elimination & Code Optimization\n');

async function implementPhase2Core() {
  try {
    console.log('1️⃣ Creating centralized utilities...');
    await createCentralizedUtilities();
    
    console.log('\n2️⃣ Optimizing TypeScript configuration...');
    await optimizeTypeScriptConfig();
    
    console.log('\n3️⃣ Creating shared schemas...');
    await createSharedSchemas();
    
    console.log('\n4️⃣ Implementing error handling...');
    await implementErrorHandling();
    
    console.log('\n🎉 Phase 2 Core implementation completed!');
    
  } catch (error) {
    console.error('❌ Error in Phase 2 Core implementation:', error);
  }
}

async function createCentralizedUtilities() {
  // Create API utilities
  const apiUtils = `// src/utils/api.ts - Centralized API utilities
import { supabase } from '@/integrations/supabase/client';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export class ApiClient {
  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase.from(endpoint).select('*');
      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async post<T>(endpoint: string, payload: any): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase.from(endpoint).insert(payload).select().single();
      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async put<T>(endpoint: string, id: string, payload: any): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase.from(endpoint).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async delete<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase.from(endpoint).delete().eq('id', id).select().single();
      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
}

export const api = {
  get: <T>(endpoint: string) => ApiClient.get<T>(endpoint),
  post: <T>(endpoint: string, payload: any) => ApiClient.post<T>(endpoint, payload),
  put: <T>(endpoint: string, id: string, payload: any) => ApiClient.put<T>(endpoint, id, payload),
  delete: <T>(endpoint: string, id: string) => ApiClient.delete<T>(endpoint, id)
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

class Logger {
  private isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';

  debug(message: string, context?: string, data?: any) {
    if (this.isDevelopment) {
      console.debug(\`[DEBUG] \${context ? '[' + context + '] ' : ''}\${message}\`, data || '');
    }
  }

  info(message: string, context?: string, data?: any) {
    console.info(\`[INFO] \${context ? '[' + context + '] ' : ''}\${message}\`, data || '');
  }

  warn(message: string, context?: string, data?: any) {
    console.warn(\`[WARN] \${context ? '[' + context + '] ' : ''}\${message}\`, data || '');
  }

  error(message: string, context?: string, data?: any) {
    console.error(\`[ERROR] \${context ? '[' + context + '] ' : ''}\${message}\`, data || '');
  }
}

export const logger = new Logger();
`;

  // Create utilities directory
  const utilsDir = path.join(__dirname, 'src', 'utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(utilsDir, 'api.ts'), apiUtils);
  fs.writeFileSync(path.join(utilsDir, 'logger.ts'), loggingUtils);
  
  console.log('   ✅ API utilities created');
  console.log('   ✅ Logging utilities created');
}

async function optimizeTypeScriptConfig() {
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

async function createSharedSchemas() {
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
    contact_person_name: z.string().min(2, "Contact person name is required"),
    contact_person_email: z.string().email("Invalid contact email"),
    country: z.string().length(2, "Country code must be 2 characters"),
    currency_code: z.string().length(3, "Currency code must be 3 characters"),
  }),
  
  update: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    subdomain: z.string().min(2).optional(),
    domain: z.string().optional(),
    contact_person_name: z.string().min(2).optional(),
    contact_person_email: z.string().email().optional(),
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
    tenant_id: z.string().uuid("Invalid tenant ID"),
  }),
  
  update: z.object({
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
};

// Utility function to validate data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Utility function to validate data safely
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

async function implementErrorHandling() {
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

export const handleApiError = (error: unknown, context?: string): AppError => {
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

// Run Phase 2 Core implementation
implementPhase2Core();
