-- Remove dummy/test data for Umoja Magharibi tenant
-- Keep only legitimate offices and users

-- First, let's clean up any dummy office assignments
DELETE FROM office_staff 
WHERE office_id IN (
  SELECT id FROM offices 
  WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07'
);

-- Clean up any test clients
DELETE FROM clients 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07'
AND (first_name ILIKE '%test%' OR last_name ILIKE '%test%' OR first_name ILIKE '%dummy%');

-- Remove the dummy "John Manager" profile - keep only Justus Wanjala as legitimate user
DELETE FROM profiles 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND id = '550e8400-e29b-41d4-a716-446655440011';

-- Keep BUNGOMA branch office but remove head office (clients shouldn't be assigned to head office anyway)
-- Only keep the branch office for actual operations
DELETE FROM offices 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND office_type = 'head_office';

-- Update BUNGOMA office to ensure it's properly configured for branch operations
UPDATE offices 
SET 
  parent_office_id = NULL,
  is_active = true
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND office_code = 'BBR356';