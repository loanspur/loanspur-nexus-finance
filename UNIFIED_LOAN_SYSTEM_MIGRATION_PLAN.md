# Unified Loan System Migration Plan

## Overview

This document outlines the comprehensive plan to remove redundant, hardcoded, and duplicate code in the loan management system and ensure all loan operations use the unified system.

## Current Issues Identified

### 1. **Redundant Loan Management Hooks**
- `useLoanManagement.ts` (1688 lines) - Contains duplicate functionality
- `useLoanTransactionManager.ts` (751 lines) - Overlapping transaction processing
- `useHarmonizedLoanData.ts` - Redundant data harmonization
- `useLoanDataMigration.ts` - Migration logic that should be integrated

### 2. **Duplicate Interest Calculation Methods**
- Multiple interest calculation functions across different files
- Hardcoded calculation methods in components
- Inconsistent formulas for daily, weekly, monthly payments

### 3. **Redundant Schedule Generation**
- Schedule generation logic duplicated in multiple components
- Hardcoded schedule parameters
- Inconsistent schedule formats

### 4. **Multiple Transaction Processing Systems**
- Different transaction processing in different hooks
- Inconsistent accounting entries
- Duplicate validation logic

## Migration Strategy

### Phase 1: Create Unified System ✅ COMPLETED
- ✅ Created `useUnifiedLoanManagement.ts` - Single source of truth
- ✅ Unified interfaces for all loan operations
- ✅ Mifos X-based interest calculations
- ✅ Consistent transaction processing

### Phase 2: Update Components to Use Unified System

#### 2.1 Update Loan Application Components
**Files to Update:**
- `src/components/forms/LoanApplicationForm.tsx`
- `src/components/client/SimpleLoanApplicationDialog.tsx`
- `src/components/client/FullLoanApplicationDialog.tsx`
- `src/components/client/dialogs/NewLoanDialog.tsx`
- `src/components/client/AddLoanAccountDialog.tsx`

**Changes Required:**
```typescript
// OLD
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";

// NEW
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";
const { useCreateLoanApplication } = useUnifiedLoanManagement();
```

#### 2.2 Update Loan Management Components
**Files to Update:**
- `src/components/loan/LoanDetailsDialog.tsx`
- `src/components/loan/LoanDisbursementDialog.tsx`
- `src/components/loan/EnhancedLoanDisbursementDialog.tsx`
- `src/components/loan/LoanWorkflowDialog.tsx`
- `src/components/loan/BulkLoanActions.tsx`

**Changes Required:**
```typescript
// OLD
import { useProcessLoanDisbursement, useProcessLoanApproval } from "@/hooks/useLoanManagement";
import { useLoanTransactionManager } from "@/hooks/useLoanTransactionManager";

// NEW
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";
const { useProcessLoanTransaction, useProcessLoanApproval } = useUnifiedLoanManagement();
```

#### 2.3 Update Loan Display Components
**Files to Update:**
- `src/components/loan/LoanListTabs.tsx`
- `src/components/loan/LoanWorkflowManagement.tsx`
- `src/components/client/LoanAccountStatusView.tsx`

**Changes Required:**
```typescript
// OLD
import { useAllLoans, useLoanApplications } from "@/hooks/useLoanManagement";
import { useLoanDisplayData } from "@/hooks/useHarmonizedLoanData";

// NEW
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";
const { useAllLoans, useLoanApplications } = useUnifiedLoanManagement();
```

#### 2.4 Update Payment Components
**Files to Update:**
- `src/components/forms/PaymentForm.tsx`
- `src/components/forms/UnifiedPaymentForm.tsx`
- `src/components/forms/SavingsTransactionForm.tsx`

**Changes Required:**
```typescript
// OLD
import { useLoanTransactionManager } from "@/hooks/useLoanTransactionManager";
import { useClientLoans } from "@/hooks/useLoanManagement";

// NEW
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";
const { useProcessLoanTransaction, useAllLoans } = useUnifiedLoanManagement();
```

### Phase 3: Remove Redundant Files

#### 3.1 Files to Delete
- `src/hooks/useLoanManagement.ts` (1688 lines) - Replace with unified system
- `src/hooks/useLoanTransactionManager.ts` (751 lines) - Functionality merged
- `src/hooks/useHarmonizedLoanData.ts` - Redundant data harmonization
- `src/hooks/useLoanDataMigration.ts` - Migration logic integrated
- `src/hooks/useLoanScheduleManager.ts` - Schedule management unified

#### 3.2 Remove Duplicate Interest Calculation Files
- `src/lib/interest-calculation.ts` - Replace with Mifos X system
- `src/lib/loan-calculation-harmonizer.ts` - Harmonization unified
- `src/lib/loan-repayment-strategy.ts` - Strategy integrated

### Phase 4: Clean Up Hardcoded Values

#### 4.1 Remove Hardcoded Interest Calculations
**Files to Clean:**
- `src/components/client/dialogs/NewLoanDialog.tsx` (lines 68-1344)
- `src/components/loan/wizard-steps/LoanDetailsStep.tsx` (lines 33-611)
- `src/components/loan/LoanDetailsDialog.tsx` (lines 75-1934)

**Replace with:**
```typescript
// OLD - Hardcoded calculations
const generateRepaymentSchedule = () => {
  // ... 100+ lines of hardcoded calculation logic
};

// NEW - Unified Mifos X system
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";
const { useGenerateLoanSchedule } = useUnifiedLoanManagement();
```

#### 4.2 Remove Hardcoded Schedule Parameters
**Replace hardcoded values with product-based parameters:**
```typescript
// OLD
const scheduleParams = {
  repaymentFrequency: 'monthly', // Hardcoded
  calculationMethod: 'reducing_balance', // Hardcoded
  daysInYearType: '365', // Hardcoded
};

// NEW
const scheduleParams = {
  repaymentFrequency: loanProduct.repayment_frequency || 'monthly',
  calculationMethod: loanProduct.interest_calculation_method || 'reducing_balance',
  daysInYearType: loanProduct.days_in_year_type || '365',
};
```

### Phase 5: Database Migration

#### 5.1 Update Existing Loans
- Migrate existing loans to use unified system
- Update loan product snapshots
- Ensure all loans have proper Mifos X parameters

#### 5.2 Clean Up Database
- Remove unused columns from loan tables
- Standardize loan status values
- Ensure consistent data formats

## Implementation Steps

### Step 1: Update All Import Statements
```bash
# Find all files using old hooks
grep -r "useLoanManagement\|useLoanTransactionManager\|useHarmonizedLoanData" src/components/

# Replace imports systematically
find src/components -name "*.tsx" -exec sed -i 's/useLoanManagement/useUnifiedLoanManagement/g' {} \;
```

### Step 2: Update Component Logic
```typescript
// Example: Update LoanApplicationForm.tsx
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";

export const LoanApplicationForm = () => {
  const { useCreateLoanApplication } = useUnifiedLoanManagement();
  const createApplication = useCreateLoanApplication();
  
  // Rest of component logic remains the same
};
```

### Step 3: Remove Redundant Files
```bash
# Remove old files after confirming all components updated
rm src/hooks/useLoanManagement.ts
rm src/hooks/useLoanTransactionManager.ts
rm src/hooks/useHarmonizedLoanData.ts
rm src/hooks/useLoanDataMigration.ts
rm src/hooks/useLoanScheduleManager.ts
rm src/lib/interest-calculation.ts
rm src/lib/loan-calculation-harmonizer.ts
```

### Step 4: Update TypeScript Types
```typescript
// Update all type imports to use unified interfaces
import { 
  UnifiedLoanApplication, 
  UnifiedLoan, 
  UnifiedLoanTransaction,
  UnifiedLoanApproval 
} from "@/hooks/useUnifiedLoanManagement";
```

## Benefits After Migration

### ✅ **Eliminated Redundancy**
- Single source of truth for all loan operations
- No duplicate interest calculation methods
- Unified transaction processing

### ✅ **Removed Hardcoded Values**
- All calculations use product-based parameters
- Consistent Mifos X standards
- Configurable loan products

### ✅ **Improved Maintainability**
- Single file to maintain for loan logic
- Consistent error handling
- Unified validation rules

### ✅ **Enhanced Performance**
- Reduced bundle size (removed 2000+ lines of duplicate code)
- Optimized database queries
- Cached calculations

### ✅ **Better Compliance**
- Mifos X compliant calculations
- International banking standards
- Regulatory compliance

## Testing Strategy

### 1. **Unit Tests**
- Test all unified hook functions
- Verify Mifos X calculations
- Validate transaction processing

### 2. **Integration Tests**
- Test complete loan lifecycle
- Verify accounting entries
- Test schedule generation

### 3. **Migration Tests**
- Test existing loans work with new system
- Verify data consistency
- Test backward compatibility

## Rollback Plan

### If Issues Arise:
1. Keep old files as backup during migration
2. Use feature flags to switch between systems
3. Gradual rollout to test groups
4. Database backup before migration

## Timeline

- **Week 1**: Update all component imports and basic functionality
- **Week 2**: Remove redundant files and clean up hardcoded values
- **Week 3**: Database migration and testing
- **Week 4**: Performance optimization and final validation

## Success Criteria

- ✅ All loan operations use unified system
- ✅ No duplicate code exists
- ✅ No hardcoded values in loan calculations
- ✅ All components updated to use new hooks
- ✅ Performance improved (reduced bundle size)
- ✅ All tests passing
- ✅ No breaking changes to existing functionality

## Conclusion

This migration will result in a **clean, maintainable, and efficient** loan management system that follows **Mifos X standards** and eliminates all redundancy. The unified system will be the **single source of truth** for all loan operations in LoanspurCBS v2.0.
