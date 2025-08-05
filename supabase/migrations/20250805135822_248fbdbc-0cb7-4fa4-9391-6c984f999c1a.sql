-- Fix the specific record that has invalid accounting type
UPDATE loan_products 
SET accounting_type = 'accrual' 
WHERE id = 'ab46e15a-d65e-4ec6-98a2-460956bc1d8b' AND accounting_type = 'accrual_periodic';

-- Verify all records have valid accounting types
UPDATE loan_products 
SET accounting_type = 'none' 
WHERE accounting_type IS NULL OR accounting_type NOT IN ('none', 'cash', 'accrual');

-- Now add the constraint
ALTER TABLE loan_products DROP CONSTRAINT IF EXISTS loan_products_accounting_type_check;
ALTER TABLE loan_products ADD CONSTRAINT loan_products_accounting_type_check 
CHECK (accounting_type IN ('none', 'cash', 'accrual'));