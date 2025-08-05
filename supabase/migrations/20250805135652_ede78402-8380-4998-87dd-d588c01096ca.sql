-- Update existing invalid accounting types first
UPDATE loan_products SET accounting_type = 'accrual' WHERE accounting_type = 'accrual_periodic';

-- Now add the corrected constraint
ALTER TABLE loan_products DROP CONSTRAINT IF EXISTS loan_products_accounting_type_check;
ALTER TABLE loan_products ADD CONSTRAINT loan_products_accounting_type_check 
CHECK (accounting_type IN ('none', 'cash', 'accrual'));

-- Add payment_frequency field to loan_products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loan_products' AND column_name = 'payment_frequency') THEN
        ALTER TABLE loan_products ADD COLUMN payment_frequency TEXT DEFAULT 'monthly';
    END IF;
END $$;