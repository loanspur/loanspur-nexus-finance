-- Add currency field to tenants table
ALTER TABLE tenants 
ADD COLUMN currency_code TEXT DEFAULT 'USD';