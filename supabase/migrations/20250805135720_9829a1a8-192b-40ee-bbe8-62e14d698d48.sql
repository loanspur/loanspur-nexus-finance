-- Add payment_frequency field to loan_products if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loan_products' AND column_name = 'payment_frequency') THEN
        ALTER TABLE loan_products ADD COLUMN payment_frequency TEXT DEFAULT 'monthly';
    END IF;
END $$;

-- Update schema to support the payment frequency field in loan product
UPDATE loan_products SET payment_frequency = 'monthly' WHERE payment_frequency IS NULL;