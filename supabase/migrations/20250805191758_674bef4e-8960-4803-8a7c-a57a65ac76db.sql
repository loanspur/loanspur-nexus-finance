-- Revert Biashara loan product to original fixed amount configuration
UPDATE loan_products 
SET 
  min_principal = 2000,
  max_principal = 2000
WHERE name = 'Biashara loans' AND tenant_id IN (
  SELECT id FROM tenants WHERE name = 'Demo Microfinance'
);