-- Create missing system code categories for Umoja Magharibi tenant
INSERT INTO system_code_categories (tenant_id, name, code_name, description, is_active) VALUES
('1f819953-8f72-4696-88a3-e30aae532d07', 'Loan Purpose', 'LOAN_PURPOSE', 'Categories for loan purposes', true),
('1f819953-8f72-4696-88a3-e30aae532d07', 'Collateral Type', 'COLLATERAL_TYPE', 'Types of collateral accepted', true);

-- Add some default loan purpose values
INSERT INTO system_code_values (tenant_id, category_id, name, code_value, description, position, is_active) 
SELECT 
  '1f819953-8f72-4696-88a3-e30aae532d07',
  id,
  'Business Expansion',
  'BUSINESS_EXPANSION',
  'Loan for expanding existing business',
  1,
  true
FROM system_code_categories 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' AND code_name = 'LOAN_PURPOSE';

-- Add default collateral type values
INSERT INTO system_code_values (tenant_id, category_id, name, code_value, description, position, is_active) 
SELECT 
  '1f819953-8f72-4696-88a3-e30aae532d07',
  id,
  'Real Estate',
  'REAL_ESTATE',
  'Property or land as collateral',
  1,
  true
FROM system_code_categories 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' AND code_name = 'COLLATERAL_TYPE';