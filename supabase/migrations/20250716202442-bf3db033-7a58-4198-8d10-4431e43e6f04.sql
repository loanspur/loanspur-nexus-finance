-- Update interest rate fields to allow for more reasonable values
-- Change from precision(5,4) to precision(7,4) to allow rates up to 999.9999%
ALTER TABLE loan_products 
ALTER COLUMN min_nominal_interest_rate TYPE numeric(7,4);

ALTER TABLE loan_products 
ALTER COLUMN max_nominal_interest_rate TYPE numeric(7,4);

ALTER TABLE loan_products 
ALTER COLUMN default_nominal_interest_rate TYPE numeric(7,4);