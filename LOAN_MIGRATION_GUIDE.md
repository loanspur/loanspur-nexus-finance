# 🚀 Loan System Migration Guide

## Overview

This guide explains how to migrate existing loans in your LoanspurCBS v2.0 system to use the new **unified loan management system** with Mifos X-based interest calculations, harmonized data, and enhanced features.

## 🎯 What This Migration Does

### **Enhanced Features Added to Existing Loans:**

1. **📊 Harmonized Data Calculation**
   - Accurate outstanding balance calculation from schedules and payments
   - Days in arrears calculation
   - Total scheduled vs paid amounts tracking
   - Data consistency validation

2. **🏦 Mifos X Integration**
   - Loan product snapshots with all parameters
   - Standardized interest calculation methods
   - Multiple amortization types support
- Grace period handling

3. **📅 Enhanced Schedule Management**
   - Automatic schedule generation for loans without schedules
   - Payment status tracking
   - Next payment date calculation
   - Outstanding amount per schedule

4. **🔄 Status Standardization**
   - Unified loan status mapping
   - Automatic status updates based on payment history
   - Consistent status across all loan operations

5. **📈 Migration Tracking**
   - Migration status and date tracking
   - Migration notes for audit trail
   - Harmonization timestamp

## 🔧 Prerequisites

### **Database Requirements**
Make sure you have the required database columns. Run this migration first:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20240825000000_add_unified_loan_system_columns.sql

-- Add migration tracking columns to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS migration_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS migration_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS migration_notes TEXT;

-- Add harmonized calculation columns to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS calculated_outstanding_balance DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS corrected_interest_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS days_in_arrears INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS schedule_consistent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS total_scheduled_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS total_paid_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS next_payment_date DATE,
ADD COLUMN IF NOT EXISTS harmonized_at TIMESTAMP WITH TIME ZONE;

-- Add Mifos X-specific columns to loan_products table
ALTER TABLE loan_products 
ADD COLUMN IF NOT EXISTS days_in_year_type VARCHAR(10) DEFAULT '365' CHECK (days_in_year_type IN ('360', '365', 'actual')),
ADD COLUMN IF NOT EXISTS days_in_month_type VARCHAR(10) DEFAULT 'actual' CHECK (days_in_month_type IN ('30', 'actual')),
ADD COLUMN IF NOT EXISTS amortization_type VARCHAR(20) DEFAULT 'equal_installments' CHECK (amortization_type IN ('equal_installments', 'equal_principal')),
ADD COLUMN IF NOT EXISTS grace_period_type VARCHAR(20) DEFAULT 'none' CHECK (grace_period_type IN ('none', 'principal_only', 'interest_only', 'principal_and_interest'));

-- Add grace period columns to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_type VARCHAR(20) DEFAULT 'none' CHECK (grace_period_type IN ('none', 'principal_only', 'interest_only', 'principal_and_interest'));

-- Add loan product snapshot column
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS loan_product_snapshot JSONB;
```

### **Environment Setup**
Ensure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Migration Process

### **Step 1: Validate Prerequisites**

First, validate that your system is ready for migration:

```bash
node scripts/run-loan-migration.js validate
```

This will check:
- ✅ Required database columns exist
- ✅ Loan data is accessible
- ✅ Loan products are properly configured

### **Step 2: Dry Run (Preview Changes)**

Preview what changes will be made without applying them:

```bash
node scripts/run-loan-migration.js dry-run
```

This will show you:
- 📊 How many loans will be updated
- 🔄 What status changes will occur
- 📅 How many schedules will be generated
- 💰 Outstanding balance recalculations

### **Step 3: Run Full Migration**

Execute the actual migration:

```bash
node scripts/run-loan-migration.js migrate
```

This will:
- ⚠️ Ask for confirmation before proceeding
- 🔄 Update all existing loans with new features
- 📅 Generate missing loan schedules
- 📊 Recalculate outstanding balances
- 🏷️ Update loan statuses
- 📝 Create migration report

## 📊 What Gets Updated

### **For Each Loan:**

1. **Harmonized Calculations**
   ```sql
   calculated_outstanding_balance = [recalculated from schedules/payments]
   days_in_arrears = [calculated from overdue schedules]
   total_scheduled_amount = [sum of all schedule amounts]
   total_paid_amount = [sum of all payments]
   ```

2. **Loan Product Snapshot**
   ```json
   {
     "id": "product_id",
     "name": "Product Name",
     "interest_rate": 15.0,
     "amortization_type": "equal_installments",
     "days_in_year_type": "365",
     "grace_period_days": 0,
     // ... all product parameters
   }
   ```

3. **Status Updates**
   - `pending` → `pending_disbursement`
   - `approved` → `pending_disbursement`
   - `disbursed` → `active`
   - Overdue loans → `overdue` or `in_arrears`

4. **Schedule Generation**
   - Creates repayment schedules for loans without them
   - Uses Mifos X calculation methods
   - Includes proper payment status tracking

## 📈 Migration Report

After migration, you'll get a detailed report showing:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "results": {
    "total": 150,
    "successful": 148,
    "failed": 2,
    "schedulesGenerated": 45,
    "statusChanges": {
      "pending -> pending_disbursement": 25,
      "approved -> pending_disbursement": 15,
      "disbursed -> active": 80
    }
  },
  "summary": {
    "successRate": "98.67%",
    "averageSchedulesPerLoan": "0.30"
  }
}
```

## 🔍 Post-Migration Verification

### **Check Migration Status**

```sql
-- Check migration status
SELECT 
  COUNT(*) as total_loans,
  COUNT(CASE WHEN migration_status = 'completed' THEN 1 END) as migrated,
  COUNT(CASE WHEN migration_status = 'pending' THEN 1 END) as pending
FROM loans;
```

### **Verify Harmonized Data**

```sql
-- Check outstanding balance consistency
SELECT 
  loan_number,
  outstanding_balance,
  calculated_outstanding_balance,
  ABS(outstanding_balance - calculated_outstanding_balance) as difference
FROM loans 
WHERE ABS(outstanding_balance - calculated_outstanding_balance) > 1;
```

### **Check Schedule Generation**

```sql
-- Check loans with schedules
SELECT 
  l.loan_number,
  COUNT(ls.id) as schedule_count,
  l.schedule_consistent
FROM loans l
LEFT JOIN loan_schedules ls ON l.id = ls.loan_id
GROUP BY l.id, l.loan_number, l.schedule_consistent
ORDER BY schedule_count DESC;
```

## 🛠️ Troubleshooting

### **Common Issues:**

1. **Missing Database Columns**
   ```
   ❌ Missing required columns: migration_status, calculated_outstanding_balance
   ```
   **Solution:** Run the database migration first

2. **No Loan Products Found**
   ```
   ⚠️ No loan product found for loan LOAN123
   ```
   **Solution:** Ensure all loans have associated loan products

3. **Permission Errors**
   ```
   ❌ Error: new row violates row-level security policy
   ```
   **Solution:** Check RLS policies for loans table

4. **Schedule Generation Failures**
   ```
   ❌ Error generating schedule for loan LOAN123
   ```
   **Solution:** Check loan product parameters and interest rates

### **Rollback Plan**

If you need to rollback the migration:

```sql
-- Reset migration status
UPDATE loans 
SET 
  migration_status = 'pending',
  migration_date = NULL,
  migration_notes = NULL,
  calculated_outstanding_balance = NULL,
  days_in_arrears = NULL,
  schedule_consistent = true,
  total_scheduled_amount = NULL,
  total_paid_amount = NULL,
  last_payment_date = NULL,
  next_payment_date = NULL,
  harmonized_at = NULL,
  loan_product_snapshot = NULL;

-- Remove generated schedules (optional)
DELETE FROM loan_schedules 
WHERE loan_id IN (
  SELECT id FROM loans 
  WHERE migration_status = 'completed'
);
```

## 🎯 Benefits After Migration

### **✅ Improved Data Accuracy**
- Harmonized outstanding balances
- Accurate days in arrears calculation
- Consistent payment tracking

### **✅ Enhanced Features**
- Mifos X-compliant calculations
- Automatic schedule generation
- Standardized loan statuses

### **✅ Better User Experience**
- More accurate loan details display
- Consistent loan management workflows
- Enhanced reporting capabilities

### **✅ System Reliability**
- Single source of truth for loan data
- Consistent business logic
- Reduced data inconsistencies

## 📞 Support

If you encounter any issues during migration:

1. **Check the migration report** for specific error details
2. **Review the troubleshooting section** above
3. **Verify database prerequisites** are met
4. **Contact support** with the migration report and error logs

## 🔄 Next Steps

After successful migration:

1. **Test the new loan features** in your application
2. **Verify loan calculations** are accurate
3. **Update any custom reports** to use new fields
4. **Train users** on enhanced loan management features
5. **Monitor system performance** with new features

---

**🎉 Congratulations!** Your loans are now using the unified loan management system with enhanced features and improved accuracy.
