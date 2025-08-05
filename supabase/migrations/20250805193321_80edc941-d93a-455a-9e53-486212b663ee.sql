-- Fix numeric field overflow for debt_to_income_ratio
-- The current constraint of NUMERIC(5,2) only allows values up to 999.99
-- But debt-to-income ratios can legitimately exceed this, especially in problematic cases
-- Changing to NUMERIC(8,2) allows values up to 999999.99

ALTER TABLE loan_applications 
ALTER COLUMN debt_to_income_ratio TYPE NUMERIC(8,2);

-- Also update loan_products max_debt_to_income_ratio for consistency
ALTER TABLE loan_products 
ALTER COLUMN max_debt_to_income_ratio TYPE NUMERIC(8,2);