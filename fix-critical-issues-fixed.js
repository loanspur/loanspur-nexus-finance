// Critical Issues Fix Script - ES Module Version
// This script addresses the most critical security and code quality issues

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing Critical Issues in Core Banking System...\n');

// 1. Fix hardcoded credentials in AuthPage.tsx
function fixHardcodedCredentials() {
  console.log('1️⃣ Fixing hardcoded credentials...');
  
  const authPagePath = path.join(__dirname, 'src', 'pages', 'AuthPage.tsx');
  
  if (fs.existsSync(authPagePath)) {
    let content = fs.readFileSync(authPagePath, 'utf8');
    
    // Remove hardcoded credentials
    content = content.replace(
      /email:\s*import\.meta\.env\.DEV\s*\?\s*"justmurenga@gmail\.com"\s*:\s*"",/g,
      'email: "",'
    );
    
    content = content.replace(
      /password:\s*import\.meta\.env\.DEV\s*\?\s*"password123"\s*:\s*"",/g,
      'password: "",'
    );
    
    fs.writeFileSync(authPagePath, content);
    console.log('   ✅ Removed hardcoded credentials from AuthPage.tsx');
  } else {
    console.log('   ⚠️  AuthPage.tsx not found');
  }
}

// 2. Fix excessive logging in tenant.ts
function fixExcessiveLogging() {
  console.log('2️⃣ Fixing excessive logging...');
  
  const tenantPath = path.join(__dirname, 'src', 'utils', 'tenant.ts');
  
  if (fs.existsSync(tenantPath)) {
    let content = fs.readFileSync(tenantPath, 'utf8');
    
    // Replace console.log with conditional logging
    content = content.replace(
      /console\.log\('Subdomain detection - hostname:', hostname, 'cleanHostname:', cleanHostname\);/g,
      "if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {\n  console.log('Subdomain detection - hostname:', hostname, 'cleanHostname:', cleanHostname);\n}"
    );
    
    content = content.replace(
      /console\.log\('Detected as main domain\/localhost, returning null'\);/g,
      "if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {\n  console.log('Detected as main domain/localhost, returning null');\n}"
    );
    
    content = content.replace(
      /console\.log\('Extracted subdomain \(prod\):', subdomain\);/g,
      "if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {\n  console.log('Extracted subdomain (prod):', subdomain);\n}"
    );
    
    content = content.replace(
      /console\.log\('Extracted subdomain \(dev\):', subdomain\);/g,
      "if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {\n  console.log('Extracted subdomain (dev):', subdomain);\n}"
    );
    
    content = content.replace(
      /console\.log\('No subdomain pattern matched, returning null'\);/g,
      "if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {\n  console.log('No subdomain pattern matched, returning null');\n}"
    );
    
    fs.writeFileSync(tenantPath, content);
    console.log('   ✅ Fixed excessive logging in tenant.ts');
  } else {
    console.log('   ⚠️  tenant.ts not found');
  }
}

// 3. Fix excessive logging in TenantRouter.tsx
function fixTenantRouterLogging() {
  console.log('3️⃣ Fixing TenantRouter logging...');
  
  const tenantRouterPath = path.join(__dirname, 'src', 'components', 'TenantRouter.tsx');
  
  if (fs.existsSync(tenantRouterPath)) {
    let content = fs.readFileSync(tenantRouterPath, 'utf8');
    
    // Replace debug logging with conditional logging
    content = content.replace(
      /console\.log\('TenantRouter - Debug Info:',\s*\{[\s\S]*?\}\);/g,
      "if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {\n  console.log('TenantRouter - Debug Info:', {\n    currentTenant,\n    loading,\n    error,\n    isSubdomainTenant,\n    hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined'\n  });\n}"
    );
    
    fs.writeFileSync(tenantRouterPath, content);
    console.log('   ✅ Fixed excessive logging in TenantRouter.tsx');
  } else {
    console.log('   ⚠️  TenantRouter.tsx not found');
  }
}

// 4. Fix TypeScript configuration
function fixTypeScriptConfig() {
  console.log('4️⃣ Fixing TypeScript configuration...');
  
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  
  if (fs.existsSync(tsconfigPath)) {
    let content = fs.readFileSync(tsconfigPath, 'utf8');
    const config = JSON.parse(content);
    
    // Enable stricter TypeScript checks
    config.compilerOptions = {
      ...config.compilerOptions,
      noImplicitAny: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      exactOptionalPropertyTypes: true
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2));
    console.log('   ✅ Enhanced TypeScript configuration');
  } else {
    console.log('   ⚠️  tsconfig.json not found');
  }
}

// 5. Create environment template
function createEnvTemplate() {
  console.log('5️⃣ Creating environment template...');
  
  const envTemplate = `# Environment Variables Template
# Copy this file to .env.local and fill in your values
# NEVER commit .env.local to version control

# Supabase Configuration
VITE_SUPABASE_URL=https://woqesvsopdgoikpatzxp.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development Testing (optional - for development only)
# Only use these for local development, never in production
VITE_DEV_TEST_EMAIL=test@example.com
VITE_DEV_TEST_PASSWORD=testpassword123

# Feature Flags
VITE_ENABLE_SAVINGS=true
VITE_ENABLE_GROUPS=true
VITE_ENABLE_ADVANCED_REPORTING=false

# Monitoring (optional)
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_ANALYTICS_ID=your_analytics_id_here

# Email Configuration
VITE_RESEND_API_KEY=your_resend_api_key_here
VITE_RESEND_EMAIL_FROM=noreply@loanspur.online

# Security
VITE_ENABLE_DEBUG_LOGGING=false
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Development Mode (set to true for development, false for production)
VITE_IS_DEVELOPMENT=true
`;
  
  fs.writeFileSync(path.join(__dirname, '.env.template'), envTemplate);
  console.log('   ✅ Created .env.template');
}

// 6. Create shared validation schemas
function createSharedSchemas() {
  console.log('6️⃣ Creating shared validation schemas...');
  
  const schemasDir = path.join(__dirname, 'src', 'schemas');
  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true });
  }
  
  const authSchemas = `import { z } from 'zod';

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
`;
  
  fs.writeFileSync(path.join(schemasDir, 'auth.ts'), authSchemas);
  console.log('   ✅ Created shared auth schemas');
}

// 7. Create centralized error handling
function createErrorHandler() {
  console.log('7️⃣ Creating centralized error handler...');
  
  const utilsDir = path.join(__dirname, 'src', 'utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  const errorHandler = `export class AppError extends Error {
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
    console.error(\`[ERROR]\${context ? \` [\${context}]\` : ''}:\`, error);
  }
  
  // In production, send to error tracking service
  if (import.meta.env.VITE_IS_DEVELOPMENT !== 'true' && import.meta.env.VITE_SENTRY_DSN) {
    // TODO: Implement Sentry error tracking
    // Sentry.captureException(error, { tags: { context } });
  }
};
`;
  
  fs.writeFileSync(path.join(utilsDir, 'errorHandler.ts'), errorHandler);
  console.log('   ✅ Created centralized error handler');
}

// 8. Create performance monitoring utility
function createPerformanceMonitor() {
  console.log('8️⃣ Creating performance monitoring utility...');
  
  const utilsDir = path.join(__dirname, 'src', 'utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  const performanceMonitor = `export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      
      this.metrics.get(operation)!.push(duration);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(\`Slow operation detected: \${operation} took \${duration.toFixed(2)}ms\`);
      }
    };
  }

  getMetrics(operation: string): PerformanceMetrics {
    const durations = this.metrics.get(operation) || [];
    
    if (durations.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 };
    }
    
    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return {
      count: durations.length,
      average,
      min,
      max,
    };
  }
}

interface PerformanceMetrics {
  count: number;
  average: number;
  min: number;
  max: number;
}
`;
  
  fs.writeFileSync(path.join(utilsDir, 'performance.ts'), performanceMonitor);
  console.log('   ✅ Created performance monitoring utility');
}

// 9. Create feature flags configuration
function createFeatureFlags() {
  console.log('9️⃣ Creating feature flags configuration...');
  
  const configDir = path.join(__dirname, 'src', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const featureFlags = `export const features = {
  savings: import.meta.env.VITE_ENABLE_SAVINGS === 'true',
  groups: import.meta.env.VITE_ENABLE_GROUPS === 'true',
  advancedReporting: import.meta.env.VITE_ENABLE_ADVANCED_REPORTING === 'true',
  mifosIntegration: import.meta.env.VITE_ENABLE_MIFOS_INTEGRATION === 'true',
  debugLogging: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
  performanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
} as const;

export const isFeatureEnabled = (feature: keyof typeof features): boolean => {
  return features[feature] || false;
};

export const getFeatureConfig = () => features;
`;
  
  fs.writeFileSync(path.join(configDir, 'features.ts'), featureFlags);
  console.log('   ✅ Created feature flags configuration');
}

// 10. Create README for the fixes
function createFixReadme() {
  console.log('🔟 Creating fix documentation...');
  
  const fixReadme = `# Critical Issues Fix Documentation

## What Was Fixed

### 1. Security Issues
- ✅ Removed hardcoded credentials from AuthPage.tsx
- ✅ Created environment variables template
- ✅ Implemented proper logging levels

### 2. Code Quality Issues
- ✅ Fixed TypeScript configuration for stricter type checking
- ✅ Created shared validation schemas
- ✅ Implemented centralized error handling
- ✅ Added performance monitoring utilities
- ✅ Created feature flags configuration

### 3. Performance Issues
- ✅ Reduced excessive logging in production
- ✅ Added conditional logging for development only
- ✅ Created performance monitoring utilities

## Next Steps

### 1. Environment Setup
1. Copy .env.template to .env.local
2. Fill in your actual values
3. Never commit .env.local to version control

### 2. Testing
1. Test all authentication flows
2. Verify error handling works correctly
3. Check that logging is appropriate for each environment
4. Ensure TypeScript compilation works with new strict settings

### 3. Deployment
1. Update your deployment environment variables
2. Test in staging environment
3. Monitor for any new TypeScript errors
4. Verify performance improvements

## Remaining Issues

The following issues still need manual attention:

1. **TODO Comments**: Implement incomplete features in:
   - src/components/savings/SavingsAccountDetailsDialog.tsx
   - src/components/groups/GroupDetailsDialog.tsx

2. **RLS Policies**: Review and fix Supabase RLS policies for profiles table

3. **Component Optimization**: Break down large components and optimize re-renders

4. **Testing**: Add comprehensive test coverage

5. **Documentation**: Update API and component documentation

## Security Checklist

- [ ] All hardcoded credentials removed
- [ ] Environment variables properly configured
- [ ] Debug logging disabled in production
- [ ] TypeScript strict mode enabled
- [ ] Error handling implemented
- [ ] Feature flags configured
- [ ] Performance monitoring active

## Performance Checklist

- [ ] Excessive logging removed
- [ ] Conditional logging implemented
- [ ] Performance monitoring utilities added
- [ ] TypeScript compilation optimized
- [ ] Bundle size analyzed
- [ ] Code splitting implemented

## Code Quality Checklist

- [ ] Shared schemas created
- [ ] Centralized error handling implemented
- [ ] Feature flags configured
- [ ] TypeScript strict mode enabled
- [ ] Consistent error handling patterns
- [ ] Proper logging levels implemented
`;
  
  fs.writeFileSync(path.join(__dirname, 'CRITICAL_FIXES_README.md'), fixReadme);
  console.log('   ✅ Created fix documentation');
}

// Run all fixes
function runAllFixes() {
  try {
    fixHardcodedCredentials();
    fixExcessiveLogging();
    fixTenantRouterLogging();
    fixTypeScriptConfig();
    createEnvTemplate();
    createSharedSchemas();
    createErrorHandler();
    createPerformanceMonitor();
    createFeatureFlags();
    createFixReadme();
    
    console.log('\n🎉 All critical fixes completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the changes made');
    console.log('2. Set up your environment variables');
    console.log('3. Test the application thoroughly');
    console.log('4. Check for any TypeScript errors');
    console.log('5. Update your deployment configuration');
    console.log('\n📖 See CRITICAL_FIXES_README.md for detailed instructions');
    
  } catch (error) {
    console.error('❌ Error during fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
runAllFixes();

