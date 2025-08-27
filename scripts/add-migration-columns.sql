-- Add Migration Columns for Unified Loan System
-- This script adds the required columns for the loan migration

-- Add migration status column
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'pending' 
CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed'));

-- Add calculated outstanding balance column
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS calculated_outstanding_balance DECIMAL(15,2) DEFAULT 0;

-- Add loan product snapshot column (JSONB for flexibility)
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS loan_product_snapshot JSONB;

-- Add days in arrears column
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS days_in_arrears INTEGER DEFAULT 0;

-- Add harmonized timestamp column
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS harmonized_at TIMESTAMP WITH TIME ZONE;

-- Add migration metadata columns
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS migration_notes TEXT;

ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS migration_errors JSONB;

-- Create index on migration status for performance
CREATE INDEX IF NOT EXISTS idx_loans_migration_status ON public.loans(migration_status);

-- Create index on harmonized_at for performance
CREATE INDEX IF NOT EXISTS idx_loans_harmonized_at ON public.loans(harmonized_at);

-- Grant permissions
GRANT ALL ON public.loans TO authenticated;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'loans' 
AND table_schema = 'public'
AND column_name IN (
  'migration_status',
  'calculated_outstanding_balance',
  'loan_product_snapshot',
  'days_in_arrears',
  'harmonized_at',
  'migration_notes',
  'migration_errors'
)
ORDER BY column_name;
