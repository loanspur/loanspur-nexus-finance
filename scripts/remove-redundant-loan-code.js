#!/usr/bin/env node

/**
 * Script to identify and remove redundant loan management code
 * This script helps migrate to the unified loan management system
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Files that should be removed (redundant)
const REDUNDANT_FILES = [
  'src/hooks/useLoanManagement.ts',
  'src/hooks/useLoanTransactionManager.ts', 
  'src/hooks/useHarmonizedLoanData.ts',
  'src/hooks/useLoanDataMigration.ts',
  'src/hooks/useLoanScheduleManager.ts',
  'src/lib/interest-calculation.ts',
  'src/lib/loan-calculation-harmonizer.ts',
  'src/lib/loan-repayment-strategy.ts'
];

// Files that need import updates
const COMPONENTS_TO_UPDATE = [
  'src/components/forms/LoanApplicationForm.tsx',
  'src/components/client/SimpleLoanApplicationDialog.tsx',
  'src/components/client/FullLoanApplicationDialog.tsx',
  'src/components/client/dialogs/NewLoanDialog.tsx',
  'src/components/client/AddLoanAccountDialog.tsx',
  'src/components/loan/LoanDetailsDialog.tsx',
  'src/components/loan/LoanDisbursementDialog.tsx',
  'src/components/loan/EnhancedLoanDisbursementDialog.tsx',
  'src/components/loan/LoanWorkflowDialog.tsx',
  'src/components/loan/BulkLoanActions.tsx',
  'src/components/loan/LoanListTabs.tsx',
  'src/components/loan/LoanWorkflowManagement.tsx',
  'src/components/client/LoanAccountStatusView.tsx',
  'src/components/forms/PaymentForm.tsx',
  'src/components/forms/UnifiedPaymentForm.tsx',
  'src/components/forms/SavingsTransactionForm.tsx'
];

// Import mappings
const IMPORT_MAPPINGS = {
  'useLoanManagement': 'useUnifiedLoanManagement',
  'useLoanTransactionManager': 'useUnifiedLoanManagement',
  'useHarmonizedLoanData': 'useUnifiedLoanManagement',
  'useLoanDataMigration': 'useUnifiedLoanManagement',
  'useLoanScheduleManager': 'useUnifiedLoanManagement'
};

// Hook usage mappings
const HOOK_MAPPINGS = {
  'useCreateLoanApplication': 'useCreateLoanApplication',
  'useProcessLoanDisbursement': 'useProcessLoanTransaction',
  'useProcessLoanApproval': 'useProcessLoanApproval',
  'useAllLoans': 'useAllLoans',
  'useLoanApplications': 'useLoanApplications',
  'useLoanSchedules': 'useLoanSchedules',
  'useLoanTransactionManager': 'useProcessLoanTransaction',
  'useLoanDisplayData': 'useLoanDisplayData'
};

function checkRedundantFiles() {
  console.log('🔍 Checking for redundant files...');
  
  const existingRedundantFiles = REDUNDANT_FILES.filter(file => fs.existsSync(file));
  
  if (existingRedundantFiles.length === 0) {
    console.log('✅ No redundant files found');
    return;
  }
  
  console.log('❌ Found redundant files:');
  existingRedundantFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  return existingRedundantFiles;
}

function checkComponentImports() {
  console.log('\n🔍 Checking component imports...');
  
  const componentsWithOldImports = [];
  
  COMPONENTS_TO_UPDATE.forEach(componentPath => {
    if (!fs.existsSync(componentPath)) {
      return;
    }
    
    const content = fs.readFileSync(componentPath, 'utf8');
    const hasOldImports = Object.keys(IMPORT_MAPPINGS).some(oldImport => 
      content.includes(`from "@/hooks/${oldImport}"`)
    );
    
    if (hasOldImports) {
      componentsWithOldImports.push(componentPath);
      console.log(`❌ ${componentPath} - Has old imports`);
    } else {
      console.log(`✅ ${componentPath} - Already updated`);
    }
  });
  
  return componentsWithOldImports;
}

function findHardcodedValues() {
  console.log('\n🔍 Searching for hardcoded loan calculation values...');
  
  const hardcodedPatterns = [
    /repaymentFrequency.*=.*['"]monthly['"]/g,
    /calculationMethod.*=.*['"]reducing_balance['"]/g,
    /daysInYearType.*=.*['"]365['"]/g,
    /interestRate.*=.*0\.\d+/g,
    /termMonths.*=.*\d+/g
  ];
  
  const filesWithHardcodedValues = [];
  
  glob.sync('src/components/**/*.tsx').forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasHardcoded = hardcodedPatterns.some(pattern => pattern.test(content));
    
    if (hasHardcoded) {
      filesWithHardcodedValues.push(file);
      console.log(`⚠️  ${file} - Contains hardcoded values`);
    }
  });
  
  return filesWithHardcodedValues;
}

function generateMigrationReport() {
  console.log('\n📊 Migration Report');
  console.log('==================');
  
  const redundantFiles = checkRedundantFiles();
  const componentsToUpdate = checkComponentImports();
  const hardcodedFiles = findHardcodedValues();
  
  console.log('\n📋 Summary:');
  console.log(`   - Redundant files to remove: ${redundantFiles?.length || 0}`);
  console.log(`   - Components to update: ${componentsToUpdate?.length || 0}`);
  console.log(`   - Files with hardcoded values: ${hardcodedFiles?.length || 0}`);
  
  if (redundantFiles?.length > 0) {
    console.log('\n🗑️  To remove redundant files:');
    redundantFiles.forEach(file => {
      console.log(`   rm ${file}`);
    });
  }
  
  if (componentsToUpdate?.length > 0) {
    console.log('\n🔄 To update component imports:');
    console.log('   Update import statements to use useUnifiedLoanManagement');
  }
  
  if (hardcodedFiles?.length > 0) {
    console.log('\n🔧 To fix hardcoded values:');
    console.log('   Replace hardcoded values with product-based parameters');
  }
}

function removeRedundantFiles() {
  console.log('\n🗑️  Removing redundant files...');
  
  REDUNDANT_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`✅ Removed: ${file}`);
      } catch (error) {
        console.log(`❌ Failed to remove: ${file} - ${error.message}`);
      }
    }
  });
}

function updateComponentImports() {
  console.log('\n🔄 Updating component imports...');
  
  COMPONENTS_TO_UPDATE.forEach(componentPath => {
    if (!fs.existsSync(componentPath)) {
      return;
    }
    
    let content = fs.readFileSync(componentPath, 'utf8');
    let updated = false;
    
    // Update import statements
    Object.entries(IMPORT_MAPPINGS).forEach(([oldImport, newImport]) => {
      const oldPattern = new RegExp(`from ["']@/hooks/${oldImport}["']`, 'g');
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, `from "@/hooks/${newImport}"`);
        updated = true;
      }
    });
    
    // Update hook usage
    Object.entries(HOOK_MAPPINGS).forEach(([oldHook, newHook]) => {
      const oldPattern = new RegExp(`const\\s+${oldHook}\\s*=\\s*${oldHook}\\(\\)`, 'g');
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, `const { ${newHook} } = useUnifiedLoanManagement();\n  const ${newHook}Hook = ${newHook}()`);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(componentPath, content);
      console.log(`✅ Updated: ${componentPath}`);
    } else {
      console.log(`⏭️  No changes needed: ${componentPath}`);
    }
  });
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'check':
    generateMigrationReport();
    break;
  case 'remove':
    removeRedundantFiles();
    break;
  case 'update':
    updateComponentImports();
    break;
  case 'migrate':
    removeRedundantFiles();
    updateComponentImports();
    generateMigrationReport();
    break;
  default:
    console.log('Usage: node remove-redundant-loan-code.js [check|remove|update|migrate]');
    console.log('  check   - Generate migration report');
    console.log('  remove  - Remove redundant files');
    console.log('  update  - Update component imports');
    console.log('  migrate - Perform complete migration');
    break;
}
