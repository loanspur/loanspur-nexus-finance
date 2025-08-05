-- Update the existing accrual_periodic to accrual
UPDATE loan_products SET accounting_type = 'accrual' WHERE accounting_type = 'accrual_periodic';

-- Now add the constraint properly
ALTER TABLE loan_products DROP CONSTRAINT IF EXISTS loan_products_accounting_type_check;
ALTER TABLE loan_products ADD CONSTRAINT loan_products_accounting_type_check 
CHECK (accounting_type IN ('none', 'cash', 'accrual'));