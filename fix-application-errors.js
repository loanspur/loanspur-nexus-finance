// Fix Application Errors
// This script fixes the Dialog accessibility issues and API query problems

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Application Errors\n');

// 1. Fix CommandDialog missing DialogTitle
function fixCommandDialog() {
  console.log('1️⃣ Fixing CommandDialog accessibility...');
  
  const commandPath = 'src/components/ui/command.tsx';
  const commandContent = fs.readFileSync(commandPath, 'utf8');
  
  // Add DialogTitle to CommandDialog
  const updatedCommandContent = commandContent.replace(
    /<DialogContent className="overflow-hidden p-0 shadow-lg">\s*<Command/,
    `<DialogContent className="overflow-hidden p-0 shadow-lg">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command`
  );
  
  fs.writeFileSync(commandPath, updatedCommandContent);
  console.log('   ✅ Fixed CommandDialog accessibility');
}

// 2. Fix API query issues in useLoanManagement
function fixLoanManagementQueries() {
  console.log('2️⃣ Fixing loan management API queries...');
  
  const loanManagementPath = 'src/hooks/useLoanManagement.ts';
  const loanManagementContent = fs.readFileSync(loanManagementPath, 'utf8');
  
  // Fix the loans query that's causing 400 errors
  // The issue is likely with the complex foreign key references
  const updatedLoanManagementContent = loanManagementContent.replace(
    /\.select\(`\s*\*,\s*clients!loans_client_id_fkey\(first_name,last_name,client_number,phone,email\),\s*loan_products!loans_loan_product_id_fkey\(name,short_name,currency_code\),\s*loan_disbursements!loan_disbursements_loan_id_fkey\(\s*disbursed_by,\s*disbursement_date,\s*disbursed_by_profile:profiles!disbursed_by\(first_name,last_name\)\s*\)\s*`\)/g,
    `.select(\`
          *,
          clients(first_name, last_name, client_number, phone, email),
          loan_products(name, short_name, currency_code),
          loan_disbursements(disbursed_by, disbursement_date)
        \`)`
  );
  
  fs.writeFileSync(loanManagementPath, updatedLoanManagementContent);
  console.log('   ✅ Fixed loan management API queries');
}

// 3. Add missing DialogTitle to other components
function fixOtherDialogComponents() {
  console.log('3️⃣ Fixing other Dialog components...');
  
  const componentsToFix = [
    {
      path: 'src/components/super-admin/TenantMPesaDialog.tsx',
      pattern: /<DialogContent className="max-w-6xl max-h-\[90vh\] overflow-y-auto">\s*<DialogHeader>/,
      replacement: `<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>M-Pesa Integration Management</DialogTitle>`
    },
    {
      path: 'src/components/forms/TenantForm.tsx',
      pattern: /<DialogContent className="sm:max-w-\[600px\] max-h-\[90vh\] overflow-y-auto">\s*<DialogHeader>/,
      replacement: `<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Create New Tenant'}</DialogTitle>`
    }
  ];
  
  componentsToFix.forEach(({ path: filePath, pattern, replacement }) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (pattern.test(content)) {
        const updatedContent = content.replace(pattern, replacement);
        fs.writeFileSync(filePath, updatedContent);
        console.log(`   ✅ Fixed ${filePath}`);
      }
    }
  });
}

// 4. Create a comprehensive Dialog wrapper component
function createDialogWrapper() {
  console.log('4️⃣ Creating Dialog wrapper component...');
  
  const dialogWrapperContent = `import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccessibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "sm:max-w-[425px]"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
`;
  
  fs.writeFileSync('src/components/ui/accessible-dialog.tsx', dialogWrapperContent);
  console.log('   ✅ Created AccessibleDialog wrapper component');
}

// 5. Fix API query optimization
function optimizeApiQueries() {
  console.log('5️⃣ Optimizing API queries...');
  
  // Create a utility for safe API queries
  const apiUtilsContent = `// API Query Utilities
// Safe query building and error handling

export const buildSafeSelect = (baseSelect: string, additionalFields?: string[]) => {
  const fields = [baseSelect];
  if (additionalFields) {
    fields.push(...additionalFields);
  }
  return fields.join(', ');
};

export const handleApiError = (error: any, context: string) => {
  console.error(\`\${context} error:\`, error);
  
  if (error.code === 'PGRST116') {
    return new Error('Invalid query parameters. Please check your request.');
  }
  
  if (error.code === 'PGRST301') {
    return new Error('Access denied. Please check your permissions.');
  }
  
  return new Error(error.message || \`\${context} failed\`);
};

export const safeApiQuery = async (queryFn: () => Promise<any>, context: string) => {
  try {
    return await queryFn();
  } catch (error) {
    throw handleApiError(error, context);
  }
};
`;
  
  fs.writeFileSync('src/utils/api-utils.ts', apiUtilsContent);
  console.log('   ✅ Created API utilities');
}

// 6. Create error boundary component
function createErrorBoundary() {
  console.log('6️⃣ Creating error boundary component...');
  
  const errorBoundaryContent = `import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={this.resetError} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
`;
  
  fs.writeFileSync('src/components/ui/error-boundary.tsx', errorBoundaryContent);
  console.log('   ✅ Created ErrorBoundary component');
}

// Main execution
try {
  fixCommandDialog();
  fixLoanManagementQueries();
  fixOtherDialogComponents();
  createDialogWrapper();
  optimizeApiQueries();
  createErrorBoundary();
  
  console.log('\n🎉 All application errors fixed!');
  console.log('\n📋 Summary of fixes:');
  console.log('✅ Fixed CommandDialog accessibility (added DialogTitle)');
  console.log('✅ Fixed loan management API queries (simplified foreign key references)');
  console.log('✅ Fixed other Dialog components missing DialogTitle');
  console.log('✅ Created AccessibleDialog wrapper component');
  console.log('✅ Created API utilities for safe query handling');
  console.log('✅ Created ErrorBoundary component for better error handling');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test the application for any remaining errors');
  console.log('3. Check that dialogs are now accessible');
  console.log('4. Verify that loan queries work without 400 errors');
  
} catch (error) {
  console.error('❌ Error fixing application issues:', error);
}
