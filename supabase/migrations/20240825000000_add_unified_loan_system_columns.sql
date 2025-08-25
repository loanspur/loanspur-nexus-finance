-- Migration: Add Unified Loan System Columns
-- This migration adds new columns to support the unified loan management system
-- with Mifos X-based interest calculations and harmonized data

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

-- Add periodic payment column to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS periodic_payment DECIMAL(15,2);

-- Add penalty amount column to loan_payments table (if not exists)
ALTER TABLE loan_payments 
ADD COLUMN IF NOT EXISTS penalty_amount DECIMAL(15,2) DEFAULT 0;

-- Add migration tracking columns to loan_schedules table
ALTER TABLE loan_schedules 
ADD COLUMN IF NOT EXISTS migration_version VARCHAR(20) DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50) DEFAULT 'mifos_x';

-- Create index for migration status
CREATE INDEX IF NOT EXISTS idx_loans_migration_status ON loans(migration_status);
CREATE INDEX IF NOT EXISTS idx_loans_harmonized_at ON loans(harmonized_at);

-- Create index for loan schedules by calculation method
CREATE INDEX IF NOT EXISTS idx_loan_schedules_calculation_method ON loan_schedules(calculation_method);

-- Add comments to document the new columns
COMMENT ON COLUMN loans.migration_status IS 'Status of migration to unified loan system: pending, in_progress, completed, failed';
COMMENT ON COLUMN loans.migration_date IS 'Date when loan was migrated to unified system';
COMMENT ON COLUMN loans.calculated_outstanding_balance IS 'Outstanding balance calculated from loan schedules';
COMMENT ON COLUMN loans.corrected_interest_rate IS 'Interest rate corrected for display consistency';
COMMENT ON COLUMN loans.days_in_arrears IS 'Number of days the loan is in arrears';
COMMENT ON COLUMN loans.schedule_consistent IS 'Whether loan schedules are consistent with loan data';
COMMENT ON COLUMN loans.total_scheduled_amount IS 'Total amount scheduled for all installments';
COMMENT ON COLUMN loans.total_paid_amount IS 'Total amount paid across all installments';
COMMENT ON COLUMN loans.last_payment_date IS 'Date of the last payment made';
COMMENT ON COLUMN loans.next_payment_date IS 'Date of the next payment due';
COMMENT ON COLUMN loans.harmonized_at IS 'Date when loan data was last harmonized';
COMMENT ON COLUMN loans.grace_period_days IS 'Number of grace period days';
COMMENT ON COLUMN loans.grace_period_type IS 'Type of grace period: none, principal_only, interest_only, principal_and_interest';
COMMENT ON COLUMN loans.periodic_payment IS 'Periodic payment amount for equal installments';

COMMENT ON COLUMN loan_products.days_in_year_type IS 'Days in year calculation method: 360, 365, actual';
COMMENT ON COLUMN loan_products.days_in_month_type IS 'Days in month calculation method: 30, actual';
COMMENT ON COLUMN loan_products.amortization_type IS 'Amortization method: equal_installments, equal_principal';
COMMENT ON COLUMN loan_products.grace_period_type IS 'Default grace period type for this product';

COMMENT ON COLUMN loan_payments.penalty_amount IS 'Amount allocated to penalties in this payment';

COMMENT ON COLUMN loan_schedules.migration_version IS 'Version of the migration system used';
COMMENT ON COLUMN loan_schedules.calculation_method IS 'Method used for schedule calculation: mifos_x, legacy';

-- Update existing loans to mark them as pending migration
UPDATE loans 
SET migration_status = 'pending', 
    migration_date = NULL,
    harmonized_at = NULL
WHERE migration_status IS NULL;

-- Update existing loan products with default values
UPDATE loan_products 
SET days_in_year_type = '365',
    days_in_month_type = 'actual',
    amortization_type = 'equal_installments',
    grace_period_type = 'none'
WHERE days_in_year_type IS NULL;

-- Update existing loan schedules to mark them as legacy
UPDATE loan_schedules 
SET migration_version = 'v1',
    calculation_method = 'legacy'
WHERE calculation_method IS NULL;
