# Loan Migration Guide: Updating Existing Loan Accounts to Unified System

## Overview

This guide explains how to migrate existing loan accounts in the LoanspurCBS v2.0 system to adopt the new unified loan management features that have been deployed. The migration process updates all existing loans to use:

- **Mifos X-based interest calculations** for accurate daily, weekly, and monthly payments
- **Unified loan management system** for consistent operations
- **Proper schedule generation** using Mifos X standards
- **Harmonized loan data** for consistency across all components
- **Repayment strategy allocation** for proper payment distribution

## What's New in the Unified System

### 1. Mifos X-Based Interest Calculations
- **Declining Balance**: Interest calculated on outstanding balance
- **Flat Rate**: Fixed interest amount per period
- **Amortization Types**: Equal installments or equal principal
- **Day Conventions**: 360, 365, or actual days
- **Grace Periods**: Principal only, interest only, or both

### 2. Unified Loan Management
- Single source of truth for all loan operations
- Consistent transaction processing
- Unified interfaces and data structures
- Eliminated redundant code and hardcoded values

### 3. Enhanced Schedule Generation
- Accurate daily, weekly, and monthly payment schedules
- Proper interest calculation for each period
- Grace period handling
- Fee and charge integration

### 4. Harmonized Data
- Consistent outstanding balance calculations
- Accurate interest rate display
- Days in arrears calculation
- Schedule consistency validation

## Pre-Migration Checklist

Before running the migration, ensure:

1. **Database Backup**: Create a complete backup of your database
2. **Environment Variables**: Verify `.env` file has correct Supabase credentials
3. **System Access**: Ensure you have admin access to the database
4. **Maintenance Window**: Plan for system downtime during migration
5. **Testing**: Test the migration on a development environment first

## Migration Process

### Step 1: Apply Database Migration

First, apply the database schema changes:

```sql
-- Run the migration file
-- supabase/migrations/20240825000000_add_unified_loan_system_columns.sql
```

This adds new columns to support:
- Migration tracking
- Harmonized data fields
- Mifos X-specific parameters
- Grace period settings

### Step 2: Run the Migration Script

Use the provided migration script to update existing loans:

#### Option A: Windows Batch Script (Recommended)
```bash
# Run the interactive batch script
scripts/run-loan-migration.bat
```

#### Option B: Direct Node.js Command
```bash
# Dry run (test without changes)
node scripts/migrate-existing-loans.js --dry-run

# Live migration (apply changes)
node scripts/migrate-existing-loans.js

# Force migration (overwrite existing)
node scripts/migrate-existing-loans.js --force
```

### Step 3: Verify Migration Results

After migration, verify:

1. **Migration Status**: Check `migration_status` column in loans table
2. **Schedule Consistency**: Verify `schedule_consistent` is true
3. **Data Accuracy**: Compare old vs new outstanding balances
4. **Payment Allocation**: Check existing payments have proper allocation

## Migration Script Features

### Smart Migration Detection
- Automatically detects already migrated loans
- Skips loans that don't need migration
- Prevents duplicate processing

### Batch Processing
- Processes loans in batches of 10
- Includes delays to prevent database overload
- Provides progress updates

### Error Handling
- Comprehensive error logging
- Continues processing even if individual loans fail
- Provides detailed error reports

### Data Validation
- Validates loan parameters before migration
- Ensures required fields are present
- Checks data integrity

## What the Migration Does

### For Each Loan:

1. **Validates Loan Data**
   - Checks principal amount, interest rate, term
   - Verifies loan product and application exist
   - Ensures data integrity

2. **Generates New Schedule**
   - Uses Mifos X-based calculations
   - Applies proper interest calculation method
   - Handles grace periods correctly
   - Generates accurate payment dates

3. **Updates Loan Data**
   - Replaces existing schedules with new ones
   - Updates outstanding balance and totals
   - Sets migration status and date
   - Adds periodic payment amount

4. **Updates Existing Payments**
   - Recalculates payment allocation using strategy
   - Updates principal, interest, fee, and penalty amounts
   - Maintains payment history integrity

5. **Harmonizes Data**
   - Calculates consistent outstanding balance
   - Determines days in arrears
   - Validates schedule consistency
   - Sets last and next payment dates

## Migration Modes

### Dry Run Mode
- Shows what would be changed
- No database modifications
- Perfect for testing and validation
- Provides detailed preview

### Live Migration Mode
- Applies all changes to database
- Updates loan schedules and data
- Processes existing payments
- Marks loans as migrated

### Force Migration Mode
- Overwrites already migrated loans
- Useful for fixing migration issues
- Recalculates everything from scratch
- Use with caution

## Post-Migration Tasks

### 1. Data Verification
```sql
-- Check migration status
SELECT migration_status, COUNT(*) 
FROM loans 
GROUP BY migration_status;

-- Verify schedule consistency
SELECT COUNT(*) as inconsistent_loans
FROM loans 
WHERE schedule_consistent = false;

-- Check for migration errors
SELECT loan_number, migration_notes
FROM loans 
WHERE migration_status = 'failed';
```

### 2. System Testing
- Test loan creation with new system
- Verify payment processing works correctly
- Check interest calculations are accurate
- Test schedule generation for new loans

### 3. User Training
- Update user documentation
- Train staff on new features
- Explain changes in loan calculations
- Demonstrate new capabilities

## Troubleshooting

### Common Issues

#### Migration Fails for Specific Loans
```bash
# Check specific loan details
SELECT * FROM loans WHERE loan_number = 'LOAN-123';

# Review migration notes
SELECT migration_notes FROM loans WHERE migration_status = 'failed';
```

#### Schedule Inconsistencies
```sql
-- Find inconsistent schedules
SELECT loan_number, outstanding_balance, calculated_outstanding_balance
FROM loans 
WHERE ABS(outstanding_balance - calculated_outstanding_balance) > 0.01;
```

#### Payment Allocation Issues
```sql
-- Check payment allocations
SELECT loan_id, payment_amount, principal_amount, interest_amount, fee_amount, penalty_amount
FROM loan_payments 
WHERE principal_amount + interest_amount + fee_amount + penalty_amount != payment_amount;
```

### Recovery Procedures

#### Rollback Migration
```sql
-- Mark loans as pending for re-migration
UPDATE loans 
SET migration_status = 'pending', 
    migration_date = NULL
WHERE migration_status = 'completed';
```

#### Fix Individual Loans
```bash
# Force migrate specific loan
node scripts/migrate-existing-loans.js --force --loan-id=LOAN-123
```

## Performance Considerations

### Database Impact
- Migration processes loans in batches
- Includes delays to prevent overload
- Uses efficient queries and indexes
- Minimizes lock contention

### System Resources
- Monitor database CPU and memory usage
- Check for long-running transactions
- Ensure adequate disk space
- Monitor network connectivity

### Timing Estimates
- Small systems (< 100 loans): 5-10 minutes
- Medium systems (100-1000 loans): 30-60 minutes
- Large systems (> 1000 loans): 2-4 hours

## Security Considerations

### Data Protection
- Migration script uses read-only queries initially
- Changes are applied in transactions
- Rollback capability for failed migrations
- Audit trail of all changes

### Access Control
- Requires admin database access
- Validates tenant isolation
- Respects existing RLS policies
- Logs all migration activities

## Support and Maintenance

### Monitoring
- Check migration logs regularly
- Monitor loan data consistency
- Verify calculation accuracy
- Track system performance

### Updates
- Keep migration scripts updated
- Apply new database migrations
- Update calculation algorithms
- Maintain backward compatibility

## Conclusion

The loan migration process updates your existing loan accounts to use the new unified loan management system with Mifos X-based calculations. This provides:

- **Better Accuracy**: More precise interest and payment calculations
- **Consistency**: Unified approach across all loan operations
- **Flexibility**: Support for various payment frequencies and methods
- **Reliability**: Robust error handling and data validation
- **Maintainability**: Cleaner codebase with reduced redundancy

Follow this guide carefully to ensure a smooth migration process and maximize the benefits of the new unified system.
